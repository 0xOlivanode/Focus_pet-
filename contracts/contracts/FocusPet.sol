// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ICFAv1Forwarder {
    function getFlowInfo(address token, address sender, address receiver) external view returns (uint256 lastUpdated, int96 flowrate, uint256 deposit, uint256 owedDeposit);
}

contract FocusPet is Initializable, OwnableUpgradeable, UUPSUpgradeable {
    struct Pet {
        uint256 xp;
        uint256 health;
        uint256 lastInteraction;
        uint256 birthTime;
        string username;
        string petName;
        uint256 streak;
        uint256 lastDailySession;
        uint256 boostEndTime;   // 2x XP Boost expiration
        uint256 shieldCount;    // Streak protection shields
        string activeCosmetic; // Currently equipped cosmetic
        uint256 totalDonated;  // Total G$ contributed to UBI pool
        uint256 totalFocusTime; // Total raw seconds focused (no multipliers)
    }

    mapping(address => Pet) public pets;
    
    IERC20 public goodDollar;
    address public ubiPool;


    // Constants
    uint256 public constant MAX_HEALTH = 100;
    uint256 public constant DECAY_RATE_PER_DAY = 10;
    
    uint256 public constant FEE_PERCENTAGE = 10; // 10% redirected to UBI pool

    // G$ Prices
    uint256 public constant PRICE_FOOD = 10 ether;
    uint256 public constant PRICE_SUPER_FOOD = 30 ether;
    uint256 public constant PRICE_ENERGY_DRINK = 25 ether;
    uint256 public constant PRICE_SHIELD = 100 ether;
    uint256 public constant PRICE_REVIVE = 50 ether;

    event PetFed(address indexed owner, uint256 newHealth, uint256 newXp);
    event ItemPurchased(address indexed buyer, string item);
    event PetBorn(address indexed owner);
    event NamesUpdated(address indexed owner, string username, string petName);
    event BoostActivated(address indexed owner, uint256 endTime);
    event ShieldAdded(address indexed owner, uint256 newCount);
    event DonationSent(address indexed to, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _goodDollar, address _ubiPool, address _cfaForwarder) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        
        goodDollar = IERC20(_goodDollar);
        ubiPool = _ubiPool;
        cfaForwarder = _cfaForwarder;
        treasury = 0xB2914810724FE2Fb871960eB200Dea427854b1C7;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function setUbiPool(address _newPool) public onlyOwner {
        ubiPool = _newPool;
    }

    function setCfaForwarder(address _newForwarder) public onlyOwner {
        cfaForwarder = _newForwarder;
    }

    function setTreasury(address _newTreasury) public onlyOwner {
        treasury = _newTreasury;
    }

    modifier hasPet() {
        require(pets[msg.sender].birthTime > 0, "No pet found");
        _;
    }

    function _initPet(address owner) internal {
        pets[owner] = Pet({
            xp: 0,
            health: MAX_HEALTH,
            lastInteraction: block.timestamp,
            birthTime: block.timestamp,
            username: "",
            petName: "Unnamed Egg",
            streak: 1,
            lastDailySession: block.timestamp,
            boostEndTime: 0,
            shieldCount: 0,
            activeCosmetic: "",
            totalDonated: 0,
            totalFocusTime: 0
        });
        totalUsers += 1;
        emit PetBorn(owner);
    }

    // --- Decoupled Helpers (Resolves Stack Too Deep) ---

    function _getFlowRate(address user) internal view returns (uint256) {
        if (cfaForwarder == address(0)) return 0;
        (, int96 flowRate, , ) = ICFAv1Forwarder(cfaForwarder).getFlowInfo(address(goodDollar), user, ubiPool);
        return uint256(int256(flowRate));
    }

    function _handleStreamedImpact(Pet storage pet, uint256 flowRateAmount, uint256 timeDiff) internal {
        pet.health = MAX_HEALTH; 
        uint256 amountStreamed = flowRateAmount * timeDiff;
        pet.totalDonated += amountStreamed;
        totalCommunityImpact += amountStreamed;
        totalVolumeG$ += amountStreamed;
    }

    function _handleHealthDecay(Pet storage pet, uint256 timeDiff) internal {
        uint256 healthLoss = (timeDiff / 1 days) * DECAY_RATE_PER_DAY;
        pet.health = (healthLoss > pet.health) ? 0 : pet.health - healthLoss;
    }

    function _settlePet(Pet storage pet, uint256 flowRateAmount) internal {
        uint256 timeDiff = block.timestamp - pet.lastInteraction;
        if (flowRateAmount > 0) {
            _handleStreamedImpact(pet, flowRateAmount, timeDiff);
        } else {
            _handleHealthDecay(pet, timeDiff);
        }
        pet.lastInteraction = block.timestamp;
    }

    function _updateStreak(Pet storage pet) internal {
        uint256 lastSessionDay = pet.lastDailySession / 1 days;
        uint256 currentDay = block.timestamp / 1 days;
        if (currentDay > lastSessionDay) {
            if (currentDay == lastSessionDay + 1) {
                pet.streak += 1;
            } else if (pet.shieldCount > 0) {
                pet.shieldCount -= 1;
                emit ShieldAdded(msg.sender, pet.shieldCount);
            } else {
                pet.streak = 1;
            }
            pet.lastDailySession = block.timestamp;
        }
    }

    function _getStreamMultiplier(uint256 flowRateAmount) internal pure returns (uint256) {
        if (flowRateAmount >= 38000 * 1e9) return 170; // 100 G$/mo
        if (flowRateAmount >= 19000 * 1e9) return 140; // 50 G$/mo
        if (flowRateAmount >= 3800 * 1e9) return 120;  // 10 G$/mo
        return 100;
    }

    function _awardRewards(Pet storage pet, uint256 duration, uint256 flowRateAmount) internal {
        uint256 bonus = (pet.streak > 1) ? min(20, (pet.streak - 1) * 5) : 0;
        uint256 baseXP = duration + (duration * bonus / 100);
        uint256 finalXP = (baseXP * _getStreamMultiplier(flowRateAmount)) / 100;
        
        if (block.timestamp < pet.boostEndTime) {
            pet.xp += (finalXP * 2);
        } else {
            pet.xp += finalXP;
        }

        pet.health = min(MAX_HEALTH, pet.health + 5);
        pet.totalFocusTime += duration;
        totalGlobalFocusTime += duration;
    }

    function _settleStream(address user) internal {
        if (pets[user].birthTime == 0) return;
        _settlePet(pets[user], _getFlowRate(user));
    }

    // Buy Food: +20 Health, Costs 10 G$
    function buyFood() public {
        if (pets[msg.sender].birthTime == 0) _initPet(msg.sender);
        Pet storage pet = pets[msg.sender];
        require(pet.health > 0, "Pet is dead");

        _splitPayment(PRICE_FOOD);

        pet.health = min(MAX_HEALTH, pet.health + 20);
        emit PetFed(msg.sender, pet.health, pet.xp);
        emit ItemPurchased(msg.sender, "FOOD");
    }

    // Buy Super Food: 100 Health, Costs 30 G$
    function buySuperFood() public {
        if (pets[msg.sender].birthTime == 0) _initPet(msg.sender);
        Pet storage pet = pets[msg.sender];
        require(pet.health > 0, "Pet is dead");

        _splitPayment(PRICE_SUPER_FOOD);

        pet.health = MAX_HEALTH;
        emit PetFed(msg.sender, pet.health, pet.xp);
        emit ItemPurchased(msg.sender, "SUPER_FOOD");
    }

    // Buy Energy Drink: +24h 2x XP boost, Costs 25 G$
    function buyEnergyDrink() public {
        if (pets[msg.sender].birthTime == 0) _initPet(msg.sender);
        Pet storage pet = pets[msg.sender];
        
        _splitPayment(PRICE_ENERGY_DRINK);

        if (pet.boostEndTime < block.timestamp) {
            pet.boostEndTime = block.timestamp + 24 hours;
        } else {
            pet.boostEndTime += 24 hours;
        }
        
        emit BoostActivated(msg.sender, pet.boostEndTime);
        emit ItemPurchased(msg.sender, "ENERGY_DRINK");
    }

    // Buy Shield: +1 Streak Shield, Costs 100 G$
    function buyShield() public {
        if (pets[msg.sender].birthTime == 0) _initPet(msg.sender);
        Pet storage pet = pets[msg.sender];
        
        _splitPayment(PRICE_SHIELD);

        pet.shieldCount += 1;
        emit ShieldAdded(msg.sender, pet.shieldCount);
        emit ItemPurchased(msg.sender, "SHIELD");
    }

    mapping(address => mapping(string => bool)) public ownedCosmetics;

    address public cfaForwarder;
    uint256 public totalCommunityImpact; // Total G$ sent to UBI by the FocusPet community
    mapping(address => mapping(string => bool)) public isCosmeticEquipped;

    // --- Metrics Tracking (Appended to fix storage layout) ---
    uint256 public totalUsers;
    uint256 public totalFocusSessions;
    uint256 public totalGlobalFocusTime;
    uint256 public totalVolumeG$;
    address public treasury;

    // Buy Cosmetic & Add to Inventory
    function buyCosmetic(string memory cosmeticId, uint256 price) public {
        if (pets[msg.sender].birthTime == 0) _initPet(msg.sender);
        
        _splitPayment(price * 1 ether);

        ownedCosmetics[msg.sender][cosmeticId] = true;
        isCosmeticEquipped[msg.sender][cosmeticId] = true;
        emit ItemPurchased(msg.sender, cosmeticId);
    }

    // Toggle Owned Cosmetic (Aesthetic Wardrobe)
    function toggleCosmetic(string memory cosmeticId) public hasPet {
        _settleStream(msg.sender);
        require(ownedCosmetics[msg.sender][cosmeticId], "Item not owned");
        
        isCosmeticEquipped[msg.sender][cosmeticId] = !isCosmeticEquipped[msg.sender][cosmeticId];
        
        emit ItemPurchased(msg.sender, cosmeticId);
    }

    // Revive Pet: Sets Health to 50, Costs 50 G$
    function revivePet() public {
        if (pets[msg.sender].birthTime == 0) _initPet(msg.sender);
        Pet storage pet = pets[msg.sender];
        require(pet.health == 0, "Pet is alive");

        _splitPayment(PRICE_REVIVE);

        pet.health = 50;
        pet.lastInteraction = block.timestamp;
        emit PetFed(msg.sender, pet.health, pet.xp);
        emit ItemPurchased(msg.sender, "REVIVE");
    }

    function focusSession(uint256 sessionDurationSeconds) public {
        Pet storage pet = pets[msg.sender];
        if (pet.birthTime == 0) _initPet(msg.sender);
        
        uint256 flowRate = _getFlowRate(msg.sender);
        _settlePet(pet, flowRate);
        _updateStreak(pet);
        _awardRewards(pet, sessionDurationSeconds, flowRate);

        totalFocusSessions += 1;

        emit PetFed(msg.sender, pet.health, pet.xp);
    }

    function _splitPayment(uint256 amount) internal {
        _settleStream(msg.sender); // Settle stream before new transaction
        uint256 ubiFee = (amount * FEE_PERCENTAGE) / 100;
        uint256 treasuryAmount = amount - ubiFee;

        address treasuryTarget = treasury != address(0) ? treasury : address(this);
        require(goodDollar.transferFrom(msg.sender, treasuryTarget, treasuryAmount), "Treasury transfer failed");
        require(goodDollar.transferFrom(msg.sender, ubiPool, ubiFee), "UBI Pool transfer failed");
        
        pets[msg.sender].totalDonated += ubiFee;
        totalCommunityImpact += ubiFee;
        totalVolumeG$ += amount;
        emit DonationSent(ubiPool, ubiFee);
    }

    function setNames(string memory _username, string memory _petName) public hasPet {
        _settleStream(msg.sender);
        Pet storage pet = pets[msg.sender];
        pet.username = _username;
        pet.petName = _petName;
        emit NamesUpdated(msg.sender, _username, _petName);
    }

    function getPet(address owner) public view returns (Pet memory) {
        return pets[owner];
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
