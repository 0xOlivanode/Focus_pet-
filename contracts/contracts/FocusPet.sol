// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./IEngagementRewards.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract FocusPet is ERC721, Ownable {
    struct Pet {
        uint256 xp;
        uint256 health;
        uint256 lastInteraction;
        uint256 birthTime;
    }

    uint256 private _nextTokenId;
    mapping(uint256 => Pet) public pets;
    
    IEngagementRewards public immutable engagementRewards;
    IERC20 public immutable goodDollar;

    // Constants
    uint256 public constant MAX_HEALTH = 100;
    uint256 public constant DECAY_RATE_PER_DAY = 10;
    
    // G$ Prices (Assuming 18 decimals, so 1 G$ = 1e18? Actually G$ is 2 decimals on Mainnet, 18 on Fuse? 
    // On Celo Alfajores, G$ is 18 decimals.
    uint256 public constant PRICE_FOOD = 10 ether; // 10 G$
    uint256 public constant PRICE_REVIVE = 50 ether; // 50 G$

    event PetMinted(address indexed owner, uint256 tokenId);
    event PetFed(uint256 indexed tokenId, uint256 newHealth, uint256 newXp);
    event ItemPurchased(address indexed buyer, uint256 tokenId, string item);

    constructor(address _engagementRewards, address _goodDollar) ERC721("FocusPet", "FOCUS") Ownable(msg.sender) {
        engagementRewards = IEngagementRewards(_engagementRewards);
        goodDollar = IERC20(_goodDollar);
    }

    function mint() public {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);

        pets[tokenId] = Pet({
            xp: 0,
            health: MAX_HEALTH,
            lastInteraction: block.timestamp,
            birthTime: block.timestamp
        });

        emit PetMinted(msg.sender, tokenId);
    }

    // Buy Food: +20 Health, Costs 10 G$
    function buyFood(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        Pet storage pet = pets[tokenId];
        require(pet.health > 0, "Pet is dead. Revive first.");

        // Transfer G$ from user to contract (burn/treasury)
        bool success = goodDollar.transferFrom(msg.sender, address(this), PRICE_FOOD);
        require(success, "G$ Transfer failed");

        pet.health = min(MAX_HEALTH, pet.health + 20);
        emit PetFed(tokenId, pet.health, pet.xp);
        emit ItemPurchased(msg.sender, tokenId, "FOOD");
    }

    // Revive Pet: Sets Health to 50, Costs 50 G$
    function revivePet(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        Pet storage pet = pets[tokenId];
        require(pet.health == 0, "Pet is alive");

        bool success = goodDollar.transferFrom(msg.sender, address(this), PRICE_REVIVE);
        require(success, "G$ Transfer failed");

        pet.health = 50;
        pet.lastInteraction = block.timestamp; // Reset interaction timer
        emit PetFed(tokenId, pet.health, pet.xp);
        emit ItemPurchased(msg.sender, tokenId, "REVIVE");
    }

    function focusSession(
        uint256 tokenId, 
        uint256 sessionDurationMinutes, 
        address inviter, 
        uint256 validUntilBlock, 
        bytes memory signature
    ) public {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        
        Pet storage pet = pets[tokenId];
        
        // Calculate Decay since last interaction
        uint256 timeDiff = block.timestamp - pet.lastInteraction;
        uint256 daysPassed = timeDiff / 1 days;
        uint256 healthLoss = daysPassed * DECAY_RATE_PER_DAY;

        if (healthLoss > pet.health) {
             pet.health = 0; // Dormant
        } else {
             pet.health -= healthLoss;
        }

        // Reward (if not redundant logic)
        // Simple Logic: +1 XP per minute, +5 Health per session
        pet.xp += sessionDurationMinutes;
        pet.health = min(MAX_HEALTH, pet.health + 5);
        pet.lastInteraction = block.timestamp;

        // Claim GoodDollar Reward
        // We wrap in try/catch to ensure game logic proceeds even if reward fails (e.g. limit reached)
        try engagementRewards.appClaim(
            msg.sender,
            inviter,
            validUntilBlock,
            signature
        ) returns (bool success) {
            // Reward claimed successfully
        } catch {
            // Reward claim failed, but we continue
        }

        emit PetFed(tokenId, pet.health, pet.xp);
    }

    function getPet(uint256 tokenId) public view returns (Pet memory) {
        return pets[tokenId];
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
