// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RewardClaim
 * @notice Manages achievement-based rewards for Memory Matching Game
 * 
 * Security features:
 * - Server signature verification (prevents unauthorized claims)
 * - One claim per wallet per season (prevents double-claiming)
 * - Nonce + expiration in signature (prevents replay attacks)
 * - ReentrancyGuard (prevents reentrancy)
 * - Event logging (audit trail)
 * 
 * Flow:
 * 1. Player completes Easy → Medium → Hard in Solo mode
 * 2. Server validates completion and signs claim message
 * 3. Player calls claimReward() with signature
 * 4. Contract verifies signature and transfers reward
 */
contract RewardClaim is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    
    // ========================================================================
    // State Variables
    // ========================================================================
    
    /// @notice Server signer address (validates claim eligibility)
    address public serverSigner;
    
    /// @notice Reward token contract
    IERC20 public rewardToken;
    
    /// @notice Reward amount per claim
    uint256 public rewardAmount;
    
    /// @notice Track claims: wallet => season => claimed
    mapping(address => mapping(uint256 => bool)) public hasClaimed;
    
    /// @notice Track used nonces to prevent replay
    mapping(string => bool) public usedNonces;
    
    // ========================================================================
    // Events
    // ========================================================================
    
    event RewardClaimed(
        address indexed wallet,
        uint256 indexed season,
        uint256 amount,
        string nonce,
        uint256 timestamp
    );
    
    event ServerSignerUpdated(
        address indexed oldSigner,
        address indexed newSigner
    );
    
    event RewardAmountUpdated(
        uint256 oldAmount,
        uint256 newAmount
    );
    
    // ========================================================================
    // Errors
    // ========================================================================
    
    error AlreadyClaimed(address wallet, uint256 season);
    error InvalidSignature();
    error SignatureExpired(uint256 expiresAt, uint256 currentTime);
    error NonceAlreadyUsed(string nonce);
    error TransferFailed();
    error ZeroAddress();
    
    // ========================================================================
    // Constructor
    // ========================================================================
    
    constructor(
        address _serverSigner,
        address _rewardToken,
        uint256 _rewardAmount
    ) Ownable(msg.sender) {
        if (_serverSigner == address(0)) revert ZeroAddress();
        if (_rewardToken == address(0)) revert ZeroAddress();
        
        serverSigner = _serverSigner;
        rewardToken = IERC20(_rewardToken);
        rewardAmount = _rewardAmount;
    }
    
    // ========================================================================
    // Core Functions
    // ========================================================================
    
    /**
     * @notice Claim reward after completing all 3 levels
     * @param season Season number
     * @param nonce Unique nonce from server (prevents replay)
     * @param expiresAt Expiration timestamp (prevents old signatures)
     * @param signature Server signature proving eligibility
     * 
     * Signature message format:
     * keccak256(abi.encodePacked(wallet, season, nonce, expiresAt))
     */
    function claimReward(
        uint256 season,
        string calldata nonce,
        uint256 expiresAt,
        bytes calldata signature
    ) external nonReentrant {
        address wallet = msg.sender;
        
        // Check not already claimed
        if (hasClaimed[wallet][season]) {
            revert AlreadyClaimed(wallet, season);
        }
        
        // Check signature not expired
        if (block.timestamp > expiresAt) {
            revert SignatureExpired(expiresAt, block.timestamp);
        }
        
        // Check nonce not already used
        if (usedNonces[nonce]) {
            revert NonceAlreadyUsed(nonce);
        }
        
        // Verify server signature
        bytes32 message = keccak256(
            abi.encodePacked(wallet, season, nonce, expiresAt)
        );
        bytes32 ethSignedMessage = message.toEthSignedMessageHash();
        address signer = ethSignedMessage.recover(signature);
        
        if (signer != serverSigner) {
            revert InvalidSignature();
        }
        
        // Mark as claimed and nonce as used
        hasClaimed[wallet][season] = true;
        usedNonces[nonce] = true;
        
        // Transfer reward
        bool success = rewardToken.transfer(wallet, rewardAmount);
        if (!success) {
            revert TransferFailed();
        }
        
        emit RewardClaimed(wallet, season, rewardAmount, nonce, block.timestamp);
    }
    
    /**
     * @notice Check if wallet has claimed for a season
     */
    function hasClaimedReward(address wallet, uint256 season) 
        external 
        view 
        returns (bool) 
    {
        return hasClaimed[wallet][season];
    }
    
    // ========================================================================
    // Admin Functions
    // ========================================================================
    
    /**
     * @notice Update server signer address
     * @dev Only owner can call
     */
    function setServerSigner(address _signer) external onlyOwner {
        if (_signer == address(0)) revert ZeroAddress();
        
        address oldSigner = serverSigner;
        serverSigner = _signer;
        
        emit ServerSignerUpdated(oldSigner, _signer);
    }
    
    /**
     * @notice Update reward amount
     * @dev Only owner can call
     */
    function setRewardAmount(uint256 _amount) external onlyOwner {
        uint256 oldAmount = rewardAmount;
        rewardAmount = _amount;
        
        emit RewardAmountUpdated(oldAmount, _amount);
    }
    
    /**
     * @notice Withdraw tokens from contract
     * @dev Only owner can call (for emergency or migration)
     */
    function withdrawTokens(uint256 amount) external onlyOwner {
        bool success = rewardToken.transfer(owner(), amount);
        if (!success) {
            revert TransferFailed();
        }
    }
    
    /**
     * @notice Get contract token balance
     */
    function getBalance() external view returns (uint256) {
        return rewardToken.balanceOf(address(this));
    }
}
