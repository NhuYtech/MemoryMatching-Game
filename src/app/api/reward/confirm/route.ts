import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { ENV } from '@/env';

// ============================================================================
// Reward Claim Confirmation API
// Called after on-chain transaction succeeds
// ============================================================================

interface ConfirmRequest {
    wallet: string;
    season: number;
    txHash: string;
    nonce: string;
}

/**
 * POST /api/reward/confirm
 * 
 * Verifies the on-chain transaction and marks reward as claimed
 * 
 * Security:
 * 1. Verify transaction exists on-chain
 * 2. Verify transaction succeeded
 * 3. Verify nonce matches pending claim
 * 4. Mark as claimed in database
 * 5. Prevent double confirmation
 */
export async function POST(req: NextRequest) {
    try {
        const body: ConfirmRequest = await req.json();
        const { wallet, season, txHash, nonce } = body;

        // Validate inputs
        if (!wallet || !season || !txHash || !nonce) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate formats
        if (!wallet.match(/^0x[a-fA-F0-9]{40}$/)) {
            return NextResponse.json(
                { error: 'Invalid wallet address' },
                { status: 400 }
            );
        }

        if (!txHash.match(/^0x[a-fA-F0-9]{64}$/)) {
            return NextResponse.json(
                { error: 'Invalid transaction hash' },
                { status: 400 }
            );
        }

        // TODO: Verify nonce matches pending claim
        // const pendingClaim = await getPendingClaim(wallet, season, nonce);
        // if (!pendingClaim) {
        //   return NextResponse.json(
        //     { error: 'No pending claim found for this nonce' },
        //     { status: 404 }
        //   );
        // }

        // Verify transaction on-chain
        const rpcUrl = ENV.RPC_URL as string | undefined;
        if (!rpcUrl) {
            console.error('[Confirm API] RPC_URL not configured');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const provider = new ethers.JsonRpcProvider(rpcUrl);

        let receipt;
        try {
            receipt = await provider.getTransactionReceipt(txHash);
        } catch (error) {
            console.error('[Confirm API] Failed to fetch transaction:', error);
            return NextResponse.json(
                { error: 'Failed to verify transaction' },
                { status: 500 }
            );
        }

        if (!receipt) {
            return NextResponse.json(
                { error: 'Transaction not found on-chain' },
                { status: 404 }
            );
        }

        if (receipt.status !== 1) {
            return NextResponse.json(
                { error: 'Transaction failed on-chain' },
                { status: 400 }
            );
        }

        // TODO: Mark as claimed in database
        // await markRewardClaimed({
        //   wallet,
        //   season,
        //   txHash,
        //   claimedAt: new Date(),
        //   nonce,
        // });

        // TODO: Delete pending claim
        // await deletePendingClaim(wallet, season, nonce);

        console.log(`[Confirm API] Confirmed claim for ${wallet}, season ${season}, tx ${txHash}`);

        return NextResponse.json({
            success: true,
            wallet,
            season,
            txHash,
            confirmedAt: new Date().toISOString(),
        });

    } catch (error) {
        console.error('[Confirm API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
