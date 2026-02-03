"use client";
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRewardEligibility } from '@/hooks/useRewardEligibility';
import { claimReward } from '@/lib/onchain';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { LevelProgress } from '@/types/reward';

interface RewardClaimProps {
    wallet: string | null;
    season?: number;
}

/**
 * Progress Indicator Component
 * Shows completion status for all 3 levels
 */
function ProgressIndicator({ progress }: { progress: LevelProgress }) {
    return (
        <div className="flex gap-3 justify-center mb-6">
            <Badge
                variant={progress.easy ? 'default' : 'outline'}
                className="flex items-center gap-2"
            >
                {progress.easy ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4 opacity-50" />}
                Easy
            </Badge>
            <Badge
                variant={progress.medium ? 'default' : 'outline'}
                className="flex items-center gap-2"
            >
                {progress.medium ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4 opacity-50" />}
                Medium
            </Badge>
            <Badge
                variant={progress.hard ? 'default' : 'outline'}
                className="flex items-center gap-2"
            >
                {progress.hard ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4 opacity-50" />}
                Hard
            </Badge>
        </div>
    );
}

/**
 * Reward Claim Component
 * Handles the full reward claim flow:
 * 1. Check eligibility
 * 2. Get server signature
 * 3. Call smart contract
 * 4. Confirm on server
 */
export function RewardClaim({ wallet, season = 1 }: RewardClaimProps) {
    const { eligibility, loading: checkingEligibility, checkEligibility } = useRewardEligibility(wallet, season);
    const [claiming, setClaiming] = useState(false);
    const { toast } = useToast();

    const handleClaim = async () => {
        if (!wallet) {
            toast({
                title: 'Wallet not connected',
                description: 'Please connect your wallet first',
                variant: 'destructive',
            });
            return;
        }

        setClaiming(true);

        try {
            // Step 1: Get signature from server
            toast({
                title: 'Requesting claim signature...',
                description: 'Validating your eligibility',
            });

            const signResponse = await fetch('/api/reward/sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet, season }),
            });

            if (!signResponse.ok) {
                const error = await signResponse.json();
                throw new Error(error.error || 'Failed to get claim signature');
            }

            const { signature, nonce, expiresAt } = await signResponse.json();

            // Step 2: Call smart contract
            toast({
                title: 'Claiming reward...',
                description: 'Please confirm the transaction in your wallet',
            });

            const tx = await claimReward(season, nonce, expiresAt, signature);

            toast({
                title: 'Transaction submitted',
                description: 'Waiting for confirmation...',
            });

            // Wait for transaction confirmation
            await tx;

            // Step 3: Confirm on server
            const txHash = (tx as { hash?: string }).hash;
            if (txHash) {
                await fetch('/api/reward/confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ wallet, season, txHash, nonce }),
                });
            }

            // Success!
            toast({
                title: 'Reward claimed! 🎉',
                description: 'Your reward has been transferred to your wallet',
            });

            // Refresh eligibility status
            await checkEligibility();

        } catch (error) {
            console.error('[RewardClaim] Error:', error);

            const message = error instanceof Error ? error.message : 'Unknown error occurred';

            toast({
                title: 'Claim failed',
                description: message,
                variant: 'destructive',
            });
        } finally {
            setClaiming(false);
        }
    };

    // Loading state
    if (checkingEligibility) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    // No wallet connected
    if (!wallet) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        Achievement Reward
                    </CardTitle>
                    <CardDescription>
                        Complete all 3 levels to unlock your reward
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Connect your wallet to check eligibility and claim rewards
                    </p>
                    <Button disabled className="w-full">
                        Connect Wallet First
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // No eligibility data
    if (!eligibility) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <p className="text-sm text-muted-foreground">Failed to load eligibility</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Achievement Reward
                </CardTitle>
                <CardDescription>
                    Complete Easy → Medium → Hard to claim your reward
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Progress Indicator */}
                <ProgressIndicator progress={eligibility.progress} />

                {/* Already Claimed */}
                {eligibility.alreadyClaimed && (
                    <div className="text-center py-4">
                        <Badge variant="secondary" className="text-lg px-4 py-2">
                            <CheckCircle2 className="h-5 w-5 mr-2" />
                            Reward Claimed ✅
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-4">
                            You have already claimed your reward for Season {season}
                        </p>
                    </div>
                )}

                {/* Eligible to Claim */}
                {eligibility.canClaim && !claiming && (
                    <div className="space-y-4">
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                            <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                🎉 Congratulations! You&apos;re eligible to claim your reward!
                            </p>
                        </div>
                        <Button
                            onClick={handleClaim}
                            className="w-full"
                            size="lg"
                        >
                            <Trophy className="h-5 w-5 mr-2" />
                            Claim Reward
                        </Button>
                    </div>
                )}

                {/* Claiming in Progress */}
                {claiming && (
                    <div className="text-center py-4">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">
                            Processing your claim...
                        </p>
                    </div>
                )}

                {/* Not Eligible */}
                {!eligibility.eligible && !eligibility.alreadyClaimed && (
                    <div className="space-y-4">
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                {eligibility.reason || 'Complete all 3 levels to unlock reward'}
                            </p>
                        </div>
                        <p className="text-xs text-center text-muted-foreground">
                            Only Solo mode completions count toward rewards
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
