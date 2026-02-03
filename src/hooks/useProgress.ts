import { useState, useEffect, useCallback } from 'react';
import { LevelProgress } from '@/types/reward';

/**
 * Hook for tracking user's level completion progress
 * 
 * Usage:
 * const { progress, recordCompletion, loading } = useProgress(userId);
 */
export function useProgress(userId: string) {
    const [progress, setProgress] = useState<LevelProgress>({
        easy: false,
        medium: false,
        hard: false,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch current progress
    const fetchProgress = useCallback(async () => {
        if (!userId) return;

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/progress?userId=${encodeURIComponent(userId)}`);

            if (!response.ok) {
                throw new Error('Failed to fetch progress');
            }

            const data = await response.json();
            setProgress(data);
        } catch (err) {
            console.error('[useProgress] Error fetching progress:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    // Load progress on mount and userId change
    useEffect(() => {
        fetchProgress();
    }, [fetchProgress]);

    /**
     * Record level completion
     * Called after winning a game
     */
    const recordCompletion = useCallback(async (
        level: 'Dễ' | 'Trung bình' | 'Khó',
        result: {
            moves: number;
            duration: number;
            endReason: string;
            mode?: string;
        }
    ) => {
        if (!userId) {
            console.warn('[useProgress] No userId provided');
            return { success: false, message: 'No user ID' };
        }

        try {
            const response = await fetch('/api/progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    level,
                    result,
                }),
            });

            const data = await response.json();

            if (data.success && data.recorded) {
                // Refresh progress after successful recording
                await fetchProgress();
            }

            return data;
        } catch (err) {
            console.error('[useProgress] Error recording completion:', err);
            return {
                success: false,
                message: err instanceof Error ? err.message : 'Unknown error',
            };
        }
    }, [userId, fetchProgress]);

    /**
     * Check if all levels are complete
     */
    const isAllComplete = progress.easy && progress.medium && progress.hard;

    /**
     * Get completion percentage
     */
    const completionPercentage = Math.round(
        ((progress.easy ? 1 : 0) + (progress.medium ? 1 : 0) + (progress.hard ? 1 : 0)) / 3 * 100
    );

    return {
        progress,
        loading,
        error,
        recordCompletion,
        fetchProgress,
        isAllComplete,
        completionPercentage,
    };
}
