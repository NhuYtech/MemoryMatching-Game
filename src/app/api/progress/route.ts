import { NextRequest, NextResponse } from 'next/server';

// ============================================================================
// Progress Tracking API
// Records level completion for reward eligibility
// ============================================================================

interface ProgressRequest {
    userId: string;
    level: 'Dễ' | 'Trung bình' | 'Khó';
    result: {
        moves: number;
        duration: number;
        endReason: string;
        mode?: string;
    };
}

// Validation rules from game design
const LEVEL_LIMITS = {
    'Trung bình': { timeLimit: 120, moveLimit: 50 },
    'Khó': { timeLimit: 180, moveLimit: 70 },
};

/**
 * POST /api/progress
 * Records level completion after server-side validation
 * 
 * Security:
 * - UserId should be derived from session (not client input in production)
 * - PvP mode is excluded from reward tracking
 * - Time/move limits validated server-side
 */
export async function POST(req: NextRequest) {
    try {
        const body: ProgressRequest = await req.json();
        const { userId, level, result } = body;

        // Validate required fields
        if (!userId || !level || !result) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // CRITICAL: Exclude PvP mode from rewards
        if (result.mode === 'pvp') {
            return NextResponse.json(
                {
                    success: false,
                    message: 'PvP mode does not count toward rewards',
                    recorded: false
                },
                { status: 200 }
            );
        }

        // Validate win condition
        if (result.endReason !== 'win') {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Only wins count toward progress',
                    recorded: false
                },
                { status: 200 }
            );
        }

        // Level-specific validation
        let isValid = true;
        let reason = '';

        if (level === 'Dễ') {
            // Easy: no limits, just mark as complete
            isValid = true;
        } else if (level === 'Trung bình') {
            const limits = LEVEL_LIMITS['Trung bình'];
            if (result.duration > limits.timeLimit) {
                isValid = false;
                reason = 'Time limit exceeded';
            } else if (result.moves > limits.moveLimit) {
                isValid = false;
                reason = 'Move limit exceeded';
            }
        } else if (level === 'Khó') {
            const limits = LEVEL_LIMITS['Khó'];
            if (result.duration > limits.timeLimit) {
                isValid = false;
                reason = 'Time limit exceeded';
            } else if (result.moves > limits.moveLimit) {
                isValid = false;
                reason = 'Move limit exceeded';
            }
        }

        if (!isValid) {
            return NextResponse.json(
                { success: false, message: reason, recorded: false },
                { status: 200 }
            );
        }

        // TODO: Store in database
        // await updateUserProgress(userId, level, new Date());

        // For now, return success (database integration pending)
        console.log(`[Progress] User ${userId} completed ${level}`);

        return NextResponse.json({
            success: true,
            message: `${level} level completed`,
            recorded: true,
            level,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error('[Progress API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/progress?userId=xxx
 * Returns current progress for a user
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'userId required' },
                { status: 400 }
            );
        }

        // TODO: Fetch from database
        // const progress = await getUserProgress(userId);

        // Mock response for now
        const progress = {
            easy: false,
            medium: false,
            hard: false,
        };

        return NextResponse.json(progress);

    } catch (error) {
        console.error('[Progress API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
