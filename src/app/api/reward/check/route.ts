import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// Reward Eligibility Check API
// Verifies if a wallet can claim reward
// ============================================================================

/**
 * GET /api/reward/check?wallet=0x...&season=1
 * 
 * Checks:
 * 1. Has wallet already claimed for this season?
 * 2. Has user completed all 3 levels (Easy → Medium → Hard)?
 * 3. Are all completions from Solo mode?
 * 
 * Returns eligibility status and progress breakdown
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const wallet = searchParams.get('wallet');
        const seasonParam = searchParams.get('season');
        const season = seasonParam ? parseInt(seasonParam) : 1;

        // Validate inputs
        if (!wallet) {
            return NextResponse.json(
                { error: 'wallet address required' },
                { status: 400 }
            );
        }

        // Validate wallet format (basic check)
        if (!wallet.match(/^0x[a-fA-F0-9]{40}$/)) {
            return NextResponse.json(
                { error: 'Invalid wallet address format' },
                { status: 400 }
            );
        }

        // TODO: Check if already claimed from database
        // const claimed = await isRewardClaimed(wallet, season);
        const claimed = false; // Mock for now

        // TODO: Get userId from wallet mapping
        // const userId = await getUserIdByWallet(wallet);
        const userId = wallet; // Mock: use wallet as userId for now

        // TODO: Fetch progress from database
        // const progress = await getUserProgress(userId, season);
        const progress = {
            easy: false,
            medium: false,
            hard: false,
        };

        // Determine eligibility
        const allComplete = progress.easy && progress.medium && progress.hard;
        const eligible = allComplete && !claimed;

        let reason = '';
        if (claimed) {
            reason = 'Reward already claimed for this season';
        } else if (!allComplete) {
            const missing = [];
            if (!progress.easy) missing.push('Easy');
            if (!progress.medium) missing.push('Medium');
            if (!progress.hard) missing.push('Hard');
            reason = `Incomplete levels: ${missing.join(', ')}`;
        }

        return NextResponse.json({
            eligible,
            progress,
            alreadyClaimed: claimed,
            canClaim: eligible,
            reason: reason || undefined,
            season,
        });

    } catch (error) {
        console.error('[Reward Check API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
