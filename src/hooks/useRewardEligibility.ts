import { useState, useEffect, useCallback } from 'react';
import { RewardEligibility } from '@/types/reward';

/**
 * Hook for checking reward eligibility
 * 
 * Usage:
 * const { eligibility, checkEligibility, loading } = useRewardEligibility(wallet, season);
 */
export function useRewardEligibility(wallet: string | null, season: number = 1) {
    const [eligibility, setEligibility] = useState<RewardEligibility | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkEligibility = useCallback(async () => {
        if (!wallet) {
            setEligibility(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `/api/reward/check?wallet=${encodeURIComponent(wallet)}&season=${season}`
            );

            if (!response.ok) {
                throw new Error('Failed to check eligibility');
            }

            const data: RewardEligibility = await response.json();
            setEligibility(data);
        } catch (err) {
            console.error('[useRewardEligibility] Error:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
            setEligibility(null);
        } finally {
            setLoading(false);
        }
    }, [wallet, season]);

    // Check eligibility when wallet or season changes
    useEffect(() => {
        checkEligibility();
    }, [checkEligibility]);

    return {
        eligibility,
        loading,
        error,
        checkEligibility,
        canClaim: eligibility?.canClaim ?? false,
        alreadyClaimed: eligibility?.alreadyClaimed ?? false,
    };
}
