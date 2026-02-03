import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// ============================================================================
// Reward Claim Signature API
// Server signs claim message after validation
// ============================================================================

// CRITICAL: This should be stored in secure environment variable
// For development only - NEVER commit real private keys
const SERVER_PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY || '';

// Signature expiration time (15 minutes)
const SIGNATURE_EXPIRY_MS = 15 * 60 * 1000;

interface SignRequest {
    wallet: string;
    season: number;
}

/**
 * POST /api/reward/sign
 * 
 * Security flow:
 * 1. Re-validate eligibility (don't trust client)
 * 2. Generate unique nonce
 * 3. Create message with expiration
 * 4. Sign with server private key
 * 5. Store pending claim with nonce
 * 
 * Signature includes: wallet + season + nonce + expiration
 * This prevents replay attacks
 */
export async function POST(req: NextRequest) {
    try {
        const body: SignRequest = await req.json();
        const { wallet, season } = body;

        // Validate inputs
        if (!wallet || !season) {
            return NextResponse.json(
                { error: 'wallet and season required' },
                { status: 400 }
            );
        }

        if (!wallet.match(/^0x[a-fA-F0-9]{40}$/)) {
            return NextResponse.json(
                { error: 'Invalid wallet address' },
                { status: 400 }
            );
        }

        // Check server key is configured
        if (!SERVER_PRIVATE_KEY) {
            console.error('[Sign API] SERVER_PRIVATE_KEY not configured');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        // TODO: Re-validate eligibility from database
        // const eligibility = await checkEligibility(wallet, season);
        // if (!eligibility.eligible) {
        //   return NextResponse.json(
        //     { error: 'Not eligible for reward', reason: eligibility.reason },
        //     { status: 403 }
        //   );
        // }

        // Generate unique nonce (timestamp + random)
        const nonce = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

        // Calculate expiration
        const expiresAt = Date.now() + SIGNATURE_EXPIRY_MS;

        // Create claim message
        // Format: keccak256(abi.encodePacked(wallet, season, nonce, expiresAt))
        const message = ethers.solidityPackedKeccak256(
            ['address', 'uint256', 'string', 'uint256'],
            [wallet, season, nonce, expiresAt]
        );

        // Sign message with server private key
        const signer = new ethers.Wallet(SERVER_PRIVATE_KEY);
        const signature = await signer.signMessage(ethers.getBytes(message));

        // TODO: Store pending claim in database
        // await createPendingClaim({
        //   wallet,
        //   season,
        //   nonce,
        //   signature,
        //   expiresAt: new Date(expiresAt),
        // });

        console.log(`[Sign API] Signed claim for ${wallet}, season ${season}, nonce ${nonce}`);

        return NextResponse.json({
            signature,
            message,
            nonce,
            expiresAt,
            season,
            signerAddress: signer.address, // For verification
        });

    } catch (error) {
        console.error('[Sign API] Error:', error);
        return NextResponse.json(
            { error: 'Failed to sign claim' },
            { status: 500 }
        );
    }
}
