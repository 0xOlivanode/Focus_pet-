// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FocusPet is Ownable {
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
    }

    mapping(address => Pet) public pets;
    
    IERC20 public immutable goodDollar;

    // Constants
    uint256 public constant MAX_HEALTH = 100;
    uint256 public constant DECAY_RATE_PER_DAY = 10;
    
    address public ubiPool;
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

    constructor(address _goodDollar, address _ubiPool) Ownable(msg.sender) {
        goodDollar = IERC20(_goodDollar);
        ubiPool = _ubiPool;
    }

    function setUbiPool(address _newPool) public onlyOwner {
        ubiPool = _newPool;
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
            totalDonated: 0
        });
        emit PetBorn(owner);
    }

    // Helper for splitting payments
    function _splitPayment(uint256 amount) internal {
        uint256 ubiFee = (amount * FEE_PERCENTAGE) / 100;
        uint256 treasuryAmount = amount - ubiFee;

        require(goodDollar.transferFrom(msg.sender, address(this), treasuryAmount), "Treasury transfer failed");
        require(goodDollar.transferFrom(msg.sender, ubiPool, ubiFee), "UBI Pool transfer failed");
        
        pets[msg.sender].totalDonated += ubiFee;
        emit DonationSent(ubiPool, ubiFee);
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

    // Buy Cosmetic & Add to Inventory
    function buyCosmetic(string memory cosmeticId, uint256 price) public {
        if (pets[msg.sender].birthTime == 0) _initPet(msg.sender);
        Pet storage pet = pets[msg.sender];

        _splitPayment(price * 1 ether);

        ownedCosmetics[msg.sender][cosmeticId] = true;
        pet.activeCosmetic = cosmeticId;
        emit ItemPurchased(msg.sender, cosmeticId);
    }

    // Toggle Owned Cosmetic (Aesthetic Wardrobe)
    function toggleCosmetic(string memory cosmeticId) public hasPet {
        require(ownedCosmetics[msg.sender][cosmeticId], "Item not owned");
        Pet storage pet = pets[msg.sender];
        
        if (keccak256(bytes(pet.activeCosmetic)) == keccak256(bytes(cosmeticId))) {
            pet.activeCosmetic = ""; // Toggle off
        } else {
            pet.activeCosmetic = cosmeticId; // Toggle on
        }
        emit ItemPurchased(msg.sender, pet.activeCosmetic);
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

    function focusSession(
        uint256 sessionDurationMinutes
    ) public {
        if (pets[msg.sender].birthTime == 0) _initPet(msg.sender);
        Pet storage pet = pets[msg.sender];
        
        // Calculate Decay
        uint256 timeDiff = block.timestamp - pet.lastInteraction;
        uint256 healthLoss = (timeDiff / 1 days) * DECAY_RATE_PER_DAY;

        if (healthLoss > pet.health) {
             pet.health = 0;
        } else {
             pet.health -= healthLoss;
        }

        // Streak logic with SHIELD
        uint256 lastSessionDay = pet.lastDailySession / 1 days;
        uint256 currentDay = block.timestamp / 1 days;

        if (currentDay > lastSessionDay) {
            if (currentDay == lastSessionDay + 1) {
                pet.streak += 1;
            } else if (pet.shieldCount > 0) {
                pet.shieldCount -= 1; // Shield used! Streak preserved.
                emit ShieldAdded(msg.sender, pet.shieldCount);
            } else {
                pet.streak = 1;
            }
            pet.lastDailySession = block.timestamp;
        }

        // Reward logic with streak bonus & XP BOOST
        uint256 bonus = (pet.streak > 1) ? min(20, (pet.streak - 1) * 5) : 0;
        uint256 baseXP = sessionDurationMinutes + (sessionDurationMinutes * bonus / 100);
        
        if (block.timestamp < pet.boostEndTime) {
            pet.xp += (baseXP * 2); // 2x XP Boost Active!
        } else {
            pet.xp += baseXP;
        }

        pet.health = min(MAX_HEALTH, pet.health + 5);
        pet.lastInteraction = block.timestamp;

        emit PetFed(msg.sender, pet.health, pet.xp);
    }

    function setNames(string memory _username, string memory _petName) public hasPet {
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
