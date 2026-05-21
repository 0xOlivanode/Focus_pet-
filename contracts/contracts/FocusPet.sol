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
        uint256 boostEndTime;
        uint256 shieldCount;
        string activeCosmetic;
        uint256 totalDonated;
        uint256 totalFocusTime;
    }

    mapping(address => Pet) public pets;

    IERC20 public goodDollar;
    address public ubiPool;

    uint256 public constant MAX_HEALTH = 100;
    uint256 public constant DECAY_RATE_PER_DAY = 10;
    uint256 public constant FEE_PERCENTAGE = 10;

    // G$ prices (18 decimals)
    uint256 public constant PRICE_FOOD = 10 ether;
    uint256 public constant PRICE_SUPER_FOOD = 30 ether;
    uint256 public constant PRICE_ENERGY_DRINK = 25 ether;
    uint256 public constant PRICE_SHIELD = 100 ether;
    uint256 public constant PRICE_REVIVE = 50 ether;

    // USDT prices (6 decimals) — set to match approximate USD value of G$ prices
    uint256 public constant PRICE_FOOD_USDT         = 100_000;   // $0.10
    uint256 public constant PRICE_SUPER_FOOD_USDT   = 250_000;   // $0.25
    uint256 public constant PRICE_ENERGY_DRINK_USDT = 200_000;   // $0.20
    uint256 public constant PRICE_SHIELD_USDT        = 500_000;   // $0.50
    uint256 public constant PRICE_REVIVE_USDT        = 250_000;   // $0.25

    event PetFed(address indexed owner, uint256 newHealth, uint256 newXp);
    event ItemPurchased(address indexed buyer, string item);
    event ItemPurchasedWithUSDT(address indexed buyer, string item, uint256 usdtAmount);
    event PetBorn(address indexed owner);
    event NamesUpdated(address indexed owner, string username, string petName);
    event BoostActivated(address indexed owner, uint256 endTime);
    event ShieldAdded(address indexed owner, uint256 newCount);
    event DonationSent(address indexed to, uint256 amount);
    event UserDeleted(address indexed owner);
    event PetMigrated(address indexed from, address indexed to);
    event FocusSessionRecorded(
        address indexed owner,
        uint256 duration,
        uint256 xpEarned,
        uint256 newTotalFocusTime,
        uint256 streak,
        uint256 newHealth
    );

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

    // ── Admin setters ─────────────────────────────────────────────────────────

    function setUbiPool(address _newPool) public onlyOwner {
        ubiPool = _newPool;
    }

    function setCfaForwarder(address _newForwarder) public onlyOwner {
        cfaForwarder = _newForwarder;
    }

    function setTreasury(address _newTreasury) public onlyOwner {
        treasury = _newTreasury;
    }

    // Call this once after upgrading to set the USDT token address.
    // Celo Mainnet USDT: 0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e
    function setUsdt(address _usdt) public onlyOwner {
        usdt = IERC20(_usdt);
    }

    // ── Modifiers ─────────────────────────────────────────────────────────────

    modifier hasPet() {
        require(pets[msg.sender].birthTime > 0, "No pet found");
        _;
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

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
        if (flowRateAmount >= 38000 * 1e9) return 170;
        if (flowRateAmount >= 19000 * 1e9) return 140;
        if (flowRateAmount >= 3800 * 1e9) return 120;
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

    // Splits a G$ payment: 90% treasury, 10% UBI pool.
    function _splitPayment(uint256 amount) internal {
        _settleStream(msg.sender);
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

    // Pulls USDT from the caller to treasury. Full amount goes to treasury
    // since the UBI pool is a GoodDollar-native contract and cannot receive USDT.
    function _splitPaymentUSDT(uint256 amount) internal {
        require(address(usdt) != address(0), "USDT not configured");
        _settleStream(msg.sender);
        address target = treasury != address(0) ? treasury : address(this);
        require(usdt.transferFrom(msg.sender, target, amount), "USDT transfer failed");
        totalVolumeUSDT += amount;
    }

    // ── G$ buy functions (unchanged) ──────────────────────────────────────────

    function buyFood() public {
        if (pets[msg.sender].birthTime == 0) _initPet(msg.sender);
        Pet storage pet = pets[msg.sender];
        require(pet.health > 0, "Pet is dead");
        _splitPayment(PRICE_FOOD);
        pet.health = min(MAX_HEALTH, pet.health + 20);
        emit PetFed(msg.sender, pet.health, pet.xp);
        emit ItemPurchased(msg.sender, "FOOD");
    }

    function buySuperFood() public {
        if (pets[msg.sender].birthTime == 0) _initPet(msg.sender);
        Pet storage pet = pets[msg.sender];
        require(pet.health > 0, "Pet is dead");
        _splitPayment(PRICE_SUPER_FOOD);
        pet.health = MAX_HEALTH;
        emit PetFed(msg.sender, pet.health, pet.xp);
        emit ItemPurchased(msg.sender, "SUPER_FOOD");
    }

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

    function buyShield() public {
        if (pets[msg.sender].birthTime == 0) _initPet(msg.sender);
        Pet storage pet = pets[msg.sender];
        _splitPayment(PRICE_SHIELD);
        pet.shieldCount += 1;
        emit ShieldAdded(msg.sender, pet.shieldCount);
        emit ItemPurchased(msg.sender, "SHIELD");
    }

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

    function buyCosmetic(string memory cosmeticId, uint256 price) public {
        if (pets[msg.sender].birthTime == 0) _initPet(msg.sender);
        _splitPayment(price * 1 ether);
        ownedCosmetics[msg.sender][cosmeticId] = true;
        isCosmeticEquipped[msg.sender][cosmeticId] = true;
        emit ItemPurchased(msg.sender, cosmeticId);
    }

    // ── USDT buy functions ────────────────────────────────────────────────────

    // +20 Health — costs $0.10 USDT
    function buyFoodWithUSDT() public {
        if (pets[msg.sender].birthTime == 0) _initPet(msg.sender);
        Pet storage pet = pets[msg.sender];
        require(pet.health > 0, "Pet is dead");
        _splitPaymentUSDT(PRICE_FOOD_USDT);
        pet.health = min(MAX_HEALTH, pet.health + 20);
        emit PetFed(msg.sender, pet.health, pet.xp);
        emit ItemPurchasedWithUSDT(msg.sender, "FOOD", PRICE_FOOD_USDT);
    }

    // Full Health — costs $0.25 USDT
    function buySuperFoodWithUSDT() public {
        if (pets[msg.sender].birthTime == 0) _initPet(msg.sender);
        Pet storage pet = pets[msg.sender];
        require(pet.health > 0, "Pet is dead");
        _splitPaymentUSDT(PRICE_SUPER_FOOD_USDT);
        pet.health = MAX_HEALTH;
        emit PetFed(msg.sender, pet.health, pet.xp);
        emit ItemPurchasedWithUSDT(msg.sender, "SUPER_FOOD", PRICE_SUPER_FOOD_USDT);
    }

    // 2x XP for 24h — costs $0.20 USDT
    function buyEnergyDrinkWithUSDT() public {
        if (pets[msg.sender].birthTime == 0) _initPet(msg.sender);
        Pet storage pet = pets[msg.sender];
        _splitPaymentUSDT(PRICE_ENERGY_DRINK_USDT);
        if (pet.boostEndTime < block.timestamp) {
            pet.boostEndTime = block.timestamp + 24 hours;
        } else {
            pet.boostEndTime += 24 hours;
        }
        emit BoostActivated(msg.sender, pet.boostEndTime);
        emit ItemPurchasedWithUSDT(msg.sender, "ENERGY_DRINK", PRICE_ENERGY_DRINK_USDT);
    }

    // +1 Streak Shield — costs $0.50 USDT
    function buyShieldWithUSDT() public {
        if (pets[msg.sender].birthTime == 0) _initPet(msg.sender);
        Pet storage pet = pets[msg.sender];
        _splitPaymentUSDT(PRICE_SHIELD_USDT);
        pet.shieldCount += 1;
        emit ShieldAdded(msg.sender, pet.shieldCount);
        emit ItemPurchasedWithUSDT(msg.sender, "SHIELD", PRICE_SHIELD_USDT);
    }

    // Revive dead pet — costs $0.25 USDT
    function revivePetWithUSDT() public {
        if (pets[msg.sender].birthTime == 0) _initPet(msg.sender);
        Pet storage pet = pets[msg.sender];
        require(pet.health == 0, "Pet is alive");
        _splitPaymentUSDT(PRICE_REVIVE_USDT);
        pet.health = 50;
        pet.lastInteraction = block.timestamp;
        emit PetFed(msg.sender, pet.health, pet.xp);
        emit ItemPurchasedWithUSDT(msg.sender, "REVIVE", PRICE_REVIVE_USDT);
    }

    // Buy cosmetic with USDT. usdtPrice must be in USDT units (6 decimals).
    // Frontend is responsible for passing the correct price matching the item.
    function buyCosmeticWithUSDT(string memory cosmeticId, uint256 usdtPrice) public {
        require(usdtPrice > 0, "Invalid price");
        if (pets[msg.sender].birthTime == 0) _initPet(msg.sender);
        _splitPaymentUSDT(usdtPrice);
        ownedCosmetics[msg.sender][cosmeticId] = true;
        isCosmeticEquipped[msg.sender][cosmeticId] = true;
        emit ItemPurchasedWithUSDT(msg.sender, cosmeticId, usdtPrice);
    }

    // ── Cosmetic toggle (unchanged) ───────────────────────────────────────────

    function toggleCosmetic(string memory cosmeticId) public hasPet {
        _settleStream(msg.sender);
        require(ownedCosmetics[msg.sender][cosmeticId], "Item not owned");
        isCosmeticEquipped[msg.sender][cosmeticId] = !isCosmeticEquipped[msg.sender][cosmeticId];
        emit ItemPurchased(msg.sender, cosmeticId);
    }

    // ── Focus session (unchanged) ─────────────────────────────────────────────

    function focusSession(uint256 sessionDurationSeconds) public {
        Pet storage pet = pets[msg.sender];
        if (pet.birthTime == 0) _initPet(msg.sender);

        uint256 xpBefore = pet.xp;
        uint256 flowRate = _getFlowRate(msg.sender);
        _settlePet(pet, flowRate);
        _updateStreak(pet);
        _awardRewards(pet, sessionDurationSeconds, flowRate);

        totalFocusSessions += 1;

        emit FocusSessionRecorded(
            msg.sender,
            sessionDurationSeconds,
            pet.xp - xpBefore,
            pet.totalFocusTime,
            pet.streak,
            pet.health
        );
        emit PetFed(msg.sender, pet.health, pet.xp);
    }

    // ── Names / user management (unchanged) ──────────────────────────────────

    function setNames(string memory _username, string memory _petName) public hasPet {
        if (bytes(_username).length > 0) {
            address existing = usernameToAddress[_username];
            require(existing == address(0) || existing == msg.sender, "Username taken");

            string memory oldUsername = pets[msg.sender].username;
            if (bytes(oldUsername).length > 0 && keccak256(bytes(oldUsername)) != keccak256(bytes(_username))) {
                delete usernameToAddress[oldUsername];
            }

            usernameToAddress[_username] = msg.sender;
        }

        pets[msg.sender].username = _username;
        pets[msg.sender].petName = _petName;
        emit NamesUpdated(msg.sender, _username, _petName);
    }

    function deleteUser() public {
        _clearUserData(msg.sender);
    }

    function adminDeleteUser(address _user) public onlyOwner {
        _clearUserData(_user);
    }

    function _clearUserData(address _user) internal {
        string memory username = pets[_user].username;
        if (bytes(username).length > 0) {
            delete usernameToAddress[username];
        }

        ownedCosmetics[_user]["sunglasses"] = false;
        ownedCosmetics[_user]["crown"] = false;
        isCosmeticEquipped[_user]["sunglasses"] = false;
        isCosmeticEquipped[_user]["crown"] = false;

        delete pets[_user];

        if (totalUsers > 0) {
            totalUsers -= 1;
        }

        emit UserDeleted(_user);
    }

    // ── Pet migration ─────────────────────────────────────────────────────────
    // Moves all pet data (XP, health, streak, cosmetics, username) from the
    // caller's address to newAddress. newAddress must be empty — we will never
    // silently overwrite an existing player's data.
    //
    // What is NOT migrated:
    //   • ERC-20 balances (G$ / USDT) — user must transfer tokens themselves
    //   • ERC-20 allowances       — newAddress must re-approve the contract
    //   • Superfluid streams      — user must stop on old address, restart on new
    //   • GoodDollar verification — tied to old address in GoodDollar's registry
    //
    // totalUsers is intentionally unchanged — we are moving one pet, not
    // creating or deleting one. We do NOT call _clearUserData() because that
    // function decrements totalUsers and emits UserDeleted.
    function migratePet(address newAddress) external hasPet {
        require(newAddress != address(0), "Invalid address");
        require(newAddress != msg.sender, "Cannot migrate to same address");
        require(pets[newAddress].birthTime == 0, "Target already has a pet");

        _executeMigration(msg.sender, newAddress);
    }

    // Owner-callable version for users whose Privy/Web3Auth wallets have no
    // CELO to pay gas. User contacts support, proves ownership of both
    // addresses off-chain, and the owner executes on their behalf.
    function adminMigratePet(address from, address to) external onlyOwner {
        require(from != address(0) && to != address(0), "Invalid address");
        require(from != to, "Addresses must differ");
        require(pets[from].birthTime > 0, "Source has no pet");
        require(pets[to].birthTime == 0, "Target already has a pet");

        _executeMigration(from, to);
    }

    function _executeMigration(address from, address to) internal {
        // Transfer username → address mapping.
        string memory uname = pets[from].username;
        if (bytes(uname).length > 0) {
            usernameToAddress[uname] = to;
        }

        // Copy full Pet struct.
        pets[to] = pets[from];

        // Copy cosmetics.
        if (ownedCosmetics[from]["sunglasses"]) ownedCosmetics[to]["sunglasses"] = true;
        if (ownedCosmetics[from]["crown"])       ownedCosmetics[to]["crown"]       = true;
        if (isCosmeticEquipped[from]["sunglasses"]) isCosmeticEquipped[to]["sunglasses"] = true;
        if (isCosmeticEquipped[from]["crown"])       isCosmeticEquipped[to]["crown"]       = true;

        // Wipe source without touching totalUsers.
        delete pets[from];
        ownedCosmetics[from]["sunglasses"] = false;
        ownedCosmetics[from]["crown"]      = false;
        isCosmeticEquipped[from]["sunglasses"] = false;
        isCosmeticEquipped[from]["crown"]      = false;

        emit PetMigrated(from, to);
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    function getPet(address owner) public view returns (Pet memory) {
        return pets[owner];
    }

    // ── Storage variables appended to preserve upgrade layout ─────────────────
    // WARNING: never reorder or remove any of these.

    mapping(address => mapping(string => bool)) public ownedCosmetics;
    address public cfaForwarder;
    uint256 public totalCommunityImpact;
    mapping(address => mapping(string => bool)) public isCosmeticEquipped;
    uint256 public totalUsers;
    uint256 public totalFocusSessions;
    uint256 public totalGlobalFocusTime;
    uint256 public totalVolumeG$;
    address public treasury;
    mapping(string => address) public usernameToAddress;

    // V2 additions — appended after all V1 storage
    IERC20 public usdt;
    uint256 public totalVolumeUSDT;

    // ── Utilities ─────────────────────────────────────────────────────────────

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
