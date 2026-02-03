// ============================================================================
// Reward System Types
// ============================================================================

/**
 * Tracks user's progress across all 3 difficulty levels
 * Only Solo mode completions count toward rewards
 */
export interface LevelProgress {
    easy: boolean;
    medium: boolean;
    hard: boolean;
    easyCompletedAt?: Date;
    mediumCompletedAt?: Date;
    hardCompletedAt?: Date;
}

/**
 * Represents a reward claim record
 */
export interface RewardClaim {
    walletAddress: string;
    season: number;
    claimedAt: Date;
    txHash?: string;
    signature?: string;
    nonce?: string;
}

/**
 * Server response for reward eligibility check
 */
export interface RewardEligibility {
    eligible: boolean;
    progress: LevelProgress;
    alreadyClaimed: boolean;
    reason?: string;
    canClaim: boolean; // Derived: eligible && !alreadyClaimed
}

/**
 * Claim signature payload (server-signed)
 */
export interface ClaimSignature {
    signature: string;
    message: string;
    nonce: string;
    expiresAt: number; // Unix timestamp
    season: number;
}

/**
 * Progress update request (internal server-side only)
 */
export interface ProgressUpdate {
    userId: string;
    level: 'Dễ' | 'Trung bình' | 'Khó';
    completedAt: Date;
    // Validation data
    moves: number;
    timeElapsed: number;
    mode: 'solo' | 'pvp'; // PvP excluded from rewards
}
