// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IEngagementRewards.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FocusPet is Ownable {
    struct Pet {
        uint256 xp;
        uint256 health;
        uint256 lastInteraction;
        uint256 birthTime;
    }

    mapping(address => Pet) public pets;
    
    IEngagementRewards public immutable engagementRewards;
    IERC20 public immutable goodDollar;

    // Constants
    uint256 public constant MAX_HEALTH = 100;
    uint256 public constant DECAY_RATE_PER_DAY = 10;
    
    // G$ Prices
    uint256 public constant PRICE_FOOD = 10 ether; // 10 G$
    uint256 public constant PRICE_REVIVE = 50 ether; // 50 G$

    event PetFed(address indexed owner, uint256 newHealth, uint256 newXp);
    event ItemPurchased(address indexed buyer, string item);
    event PetBorn(address indexed owner);

    constructor(address _engagementRewards, address _goodDollar) Ownable(msg.sender) {
        engagementRewards = IEngagementRewards(_engagementRewards);
        goodDollar = IERC20(_goodDollar);
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
            birthTime: block.timestamp
        });
        emit PetBorn(owner);
    }

    // Buy Food: +20 Health, Costs 10 G$
    function buyFood() public {
        if (pets[msg.sender].birthTime == 0) {
            _initPet(msg.sender);
        }

        Pet storage pet = pets[msg.sender];
        require(pet.health > 0, "Pet is dead. Revive first.");

        // Transfer G$ from user to contract (burn/treasury)
        bool success = goodDollar.transferFrom(msg.sender, address(this), PRICE_FOOD);
        require(success, "G$ Transfer failed");

        pet.health = min(MAX_HEALTH, pet.health + 20);
        emit PetFed(msg.sender, pet.health, pet.xp);
        emit ItemPurchased(msg.sender, "FOOD");
    }

    // Revive Pet: Sets Health to 50, Costs 50 G$
    function revivePet() public {
        if (pets[msg.sender].birthTime == 0) {
            _initPet(msg.sender);
        }

        Pet storage pet = pets[msg.sender];
        require(pet.health == 0, "Pet is alive");

        bool success = goodDollar.transferFrom(msg.sender, address(this), PRICE_REVIVE);
        require(success, "G$ Transfer failed");

        pet.health = 50;
        pet.lastInteraction = block.timestamp; // Reset interaction timer
        emit PetFed(msg.sender, pet.health, pet.xp);
        emit ItemPurchased(msg.sender, "REVIVE");
    }

    function focusSession(
        uint256 sessionDurationMinutes, 
        address inviter, 
        uint256 validUntilBlock, 
        bytes memory signature
    ) public {
        if (pets[msg.sender].birthTime == 0) {
            _initPet(msg.sender);
        }
        
        Pet storage pet = pets[msg.sender];
        
        // Calculate Decay since last interaction
        uint256 timeDiff = block.timestamp - pet.lastInteraction;
        uint256 daysPassed = timeDiff / 1 days;
        uint256 healthLoss = daysPassed * DECAY_RATE_PER_DAY;

        if (healthLoss > pet.health) {
             pet.health = 0; // Dormant
        } else {
             pet.health -= healthLoss;
        }

        // Reward logic
        pet.xp += sessionDurationMinutes;
        pet.health = min(MAX_HEALTH, pet.health + 5);
        pet.lastInteraction = block.timestamp;

        // Claim GoodDollar Reward
        if (address(engagementRewards).code.length > 0) {
            try engagementRewards.appClaim(
                msg.sender,
                inviter,
                validUntilBlock,
                signature
            ) returns (bool) {
                // Reward claimed successfully
            } catch {
                // Reward claim failed, but we continue
            }
        }

        emit PetFed(msg.sender, pet.health, pet.xp);
    }

    function getPet(address owner) public view returns (Pet memory) {
        return pets[owner];
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
