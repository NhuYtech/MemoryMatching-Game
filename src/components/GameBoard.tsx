"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { GameCard } from "./GameCard";
import { GameCard as GameCardType, GameLevel, GameResult, GameStatus, GameEndReason } from "@/types/game";
import {
  createGameCards,
  formatTime,
  calculateScore,
  canFlipCard,
  areAllCardsMatched,
  validateGameState
} from "@/utils/gameUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, RotateCcw, Home, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { submitSeasonScore, claimMasterNft } from "@/lib/onchain";
import { useProgress } from "@/hooks/useProgress";

interface GameBoardProps {
  playerName: string;
  level: GameLevel;
  onGameComplete: (result: GameResult) => void;
  onGoHome: () => void;
  // PvP extensions (optional)
  seed?: number;
  startSignal?: number; // changes trigger external start
  onCardEvent?: (evt: { cardId: string; atMs: number }) => void;
  ghostFlippedIds?: Set<string>;
}

export default function GameBoard({
  playerName,
  level,
  onGameComplete,
  onGoHome,
  seed,
  startSignal,
  onCardEvent,
  ghostFlippedIds,
}: GameBoardProps) {
  // ============================================================================
  // State Machine - Single Source of Truth
  // ============================================================================
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [cards, setCards] = useState<GameCardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<GameCardType[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  // ============================================================================
  // Processing Flags - Prevent Race Conditions
  // ============================================================================
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPeeking, setIsPeeking] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);

  // ============================================================================
  // Power-up State
  // ============================================================================
  const [freezeUses, setFreezeUses] = useState(1);
  const [peekUses, setPeekUses] = useState(1);

  // ============================================================================
  // Web3 State
  // ============================================================================
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================================================================
  // Refs - Prevent Duplicate Callbacks
  // ============================================================================
  const gameEndFiredRef = useRef(false);
  const lastClickTimeRef = useRef(0);
  const hasSubmittedScoreRef = useRef(false);

  // ============================================================================
  // Constants
  // ============================================================================
  const suddenDeathLimit = 3;
  const CLICK_DEBOUNCE_MS = 300; // Increased from 100ms for safety
  const { toast } = useToast();

  // Progress tracking for rewards (only in Solo mode)
  const { recordCompletion, isAllComplete } = useProgress(playerName);

  // ============================================================================
  // Game End Detection - Single Authoritative Function
  // ============================================================================
  const checkAndHandleGameEnd = useCallback(() => {
    // Guard: Only check if game is playing
    if (gameStatus !== 'playing') return;

    // Guard: Prevent duplicate game end triggers
    if (gameEndFiredRef.current) return;

    let endReason: GameEndReason | null = null;
    let message = '';

    // Check win condition
    if (areAllCardsMatched(cards)) {
      endReason = 'win';
      message = `Chúc mừng! Bạn đã hoàn thành trong ${moves} nước và ${formatTime(timeElapsed)}!`;
    }
    // Check time limit
    else if (!isFrozen && level.timeLimit && timeElapsed >= level.timeLimit) {
      endReason = 'time_limit';
      message = 'Hết thời gian! 🕐';
    }
    // Check move limit
    else if (level.moveLimit && moves >= level.moveLimit) {
      endReason = 'move_limit';
      message = 'Hết lượt chơi! 🎯';
    }
    // Check mistake limit (sudden death)
    else if (mistakes >= suddenDeathLimit) {
      endReason = 'mistake_limit';
      message = 'Quá số lần sai! ☠️';
    }

    // If no end condition met, return
    if (!endReason) return;

    // Mark game as ended
    gameEndFiredRef.current = true;
    setGameStatus('ended');

    // Calculate final score
    const finalScore = calculateScore(moves, timeElapsed) + score;

    const result: GameResult = {
      playerName,
      level: level.displayName,
      moves,
      duration: timeElapsed,
      createdAt: new Date(),
      score: finalScore,
      endReason,
      mode: seed !== undefined ? 'pvp' : 'solo', // Determine mode
    };

    // Show appropriate toast
    if (endReason === 'win') {
      toast({
        title: "Chúc mừng! 🏆",
        description: message,
      });

      // Record completion for reward tracking (async, non-blocking)
      // Only for Solo mode (seed === undefined means not PvP)
      if (seed === undefined) {
        recordCompletion(level.name, {
          moves,
          duration: timeElapsed,
          endReason,
          mode: 'solo',
        }).then((response) => {
          if (response?.success && response?.recorded) {
            // Check if all levels complete
            if (isAllComplete) {
              toast({
                title: "All levels complete! 🎉",
                description: "Connect wallet to claim your reward!",
              });
            }
          }
        }).catch((error) => {
          console.error('[GameBoard] Failed to record completion:', error);
        });
      }
    } else {
      toast({
        title: "Game Over!",
        description: message,
        variant: "destructive",
      });
    }

    // Notify parent component
    onGameComplete(result);
  }, [gameStatus, cards, moves, timeElapsed, isFrozen, level, mistakes, score, playerName, toast, onGameComplete, seed, recordCompletion, isAllComplete]);

  // ============================================================================
  // Card Click Handler - With Race Condition Prevention
  // ============================================================================
  const handleCardClick = useCallback(
    (clickedCard: GameCardType) => {
      const now = Date.now();

      // Rate limiting - prevent spam clicks
      if (now - lastClickTimeRef.current < CLICK_DEBOUNCE_MS) {
        return;
      }
      lastClickTimeRef.current = now;

      // Start game on first click
      if (gameStatus === 'idle') {
        setGameStatus('playing');
      }

      // Guard: Use centralized validation
      if (!canFlipCard(clickedCard, gameStatus, isProcessing, isPeeking, flippedCards.length)) {
        return;
      }

      // Notify PvP if applicable
      if (onCardEvent) {
        onCardEvent({ cardId: clickedCard.id, atMs: timeElapsed * 1000 });
      }

      // Set processing flag to prevent rapid clicks
      setIsProcessing(true);

      // Handle flip logic
      if (flippedCards.length === 2) {
        // Reset previously flipped cards
        setCards((prev) =>
          prev.map((card) =>
            flippedCards.some((fc) => fc.id === card.id) && !card.isMatched
              ? { ...card, isFlipped: false }
              : card
          )
        );
        setFlippedCards([clickedCard]);
        setCards((prev) =>
          prev.map((card) =>
            card.id === clickedCard.id ? { ...card, isFlipped: true } : card
          )
        );
      } else {
        // Flip the clicked card
        setFlippedCards((prev) => [...prev, clickedCard]);
        setCards((prev) =>
          prev.map((card) =>
            card.id === clickedCard.id ? { ...card, isFlipped: true } : card
          )
        );
      }

      // Increment moves
      setMoves((prev) => prev + 1);

      // Release processing flag after state updates
      setTimeout(() => setIsProcessing(false), 100);
    },
    [gameStatus, flippedCards, isProcessing, isPeeking, onCardEvent, timeElapsed]
  );

  // ============================================================================
  // Match Detection Effect
  // ============================================================================
  useEffect(() => {
    if (gameStatus !== 'playing') return;
    if (flippedCards.length !== 2) return;

    const [first, second] = flippedCards;

    if (first.emoji === second.emoji) {
      // Match found
      const matchTimeout = setTimeout(() => {
        setCards((prev) =>
          prev.map((card) =>
            card.id === first.id || card.id === second.id
              ? { ...card, isMatched: true, isFlipped: true }
              : card
          )
        );
        setFlippedCards([]);
        setCombo((prev) => {
          const nextCombo = prev + 1;
          setMaxCombo((max) => Math.max(max, nextCombo));
          // Multiplier grows with combo (20% per step), capped at 3x
          const multiplier = Math.min(1 + nextCombo * 0.2, 3);
          setScore((s) => s + Math.round(1000 * multiplier));
          return nextCombo;
        });
      }, 500);

      return () => clearTimeout(matchTimeout);
    } else {
      // No match
      const noMatchTimeout = setTimeout(() => {
        setCards((prev) =>
          prev.map((card) =>
            card.id === first.id || card.id === second.id
              ? { ...card, isFlipped: false }
              : card
          )
        );
        setFlippedCards([]);
        setCombo(0);
        setMistakes((m) => m + 1);
      }, 2000);

      return () => clearTimeout(noMatchTimeout);
    }
  }, [flippedCards, gameStatus]);

  // ============================================================================
  // Game Timer Effect
  // ============================================================================
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const timer = setInterval(() => {
      setTimeElapsed((prev) => (isFrozen ? prev : prev + 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus, isFrozen]);

  // ============================================================================
  // Game End Detection Effect
  // ============================================================================
  useEffect(() => {
    checkAndHandleGameEnd();
  }, [checkAndHandleGameEnd, cards, moves, timeElapsed, mistakes]);

  // ============================================================================
  // External Start Signal (PvP)
  // ============================================================================
  useEffect(() => {
    if (startSignal && gameStatus === 'idle') {
      setGameStatus('playing');
    }
  }, [startSignal, gameStatus]);

  // ============================================================================
  // Reset Game Function
  // ============================================================================
  const resetGame = useCallback(() => {
    const newCards = createGameCards(level, seed);
    setCards(newCards);
    setFlippedCards([]);
    setMoves(0);
    setTimeElapsed(0);
    setGameStatus('idle');
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setMistakes(0);
    setIsFrozen(false);
    setPeekUses(1);
    setFreezeUses(1);
    setIsPeeking(false);
    setIsProcessing(false);
    gameEndFiredRef.current = false;
    hasSubmittedScoreRef.current = false;
  }, [level, seed]);

  // ============================================================================
  // Initialize Game
  // ============================================================================
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // ============================================================================
  // Power-ups
  // ============================================================================
  const activatePeek = useCallback(() => {
    if (gameStatus !== 'playing' || peekUses <= 0 || isPeeking) return;

    setPeekUses((u) => u - 1);
    setIsPeeking(true);

    // Reveal all non-matched cards
    setCards((prev) => prev.map((c) => (c.isMatched ? c : { ...c, isFlipped: true })));

    const revealDurationMs = 1500;
    const peekTimeout = setTimeout(() => {
      setCards((prev) =>
        prev.map((c) => (c.isMatched ? c : { ...c, isFlipped: false }))
      );
      setIsPeeking(false);
    }, revealDurationMs);

    return () => clearTimeout(peekTimeout);
  }, [gameStatus, peekUses, isPeeking]);

  const activateFreeze = useCallback(() => {
    if (gameStatus !== 'playing' || freezeUses <= 0 || isFrozen) return;

    setFreezeUses((u) => u - 1);
    setIsFrozen(true);

    const freezeMs = 5000;
    const freezeTimeout = setTimeout(() => setIsFrozen(false), freezeMs);

    return () => clearTimeout(freezeTimeout);
  }, [gameStatus, freezeUses, isFrozen]);

  // ============================================================================
  // Web3 Handlers
  // ============================================================================
  const handleSubmitScore = async () => {
    if (hasSubmittedScoreRef.current || isSubmitting) return;

    hasSubmittedScoreRef.current = true;
    setIsSubmitting(true);

    try {
      const finalScore = calculateScore(moves, timeElapsed) + score;
      await submitSeasonScore(finalScore);
      toast({
        title: "Đã submit điểm on-chain",
        description: `Score: ${finalScore}`
      });
    } catch (e: unknown) {
      const error = e as Error;
      toast({
        title: "Submit thất bại",
        description: error?.message ?? String(e),
        variant: "destructive"
      });
      // Allow retry on failure
      hasSubmittedScoreRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimNFT = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await claimMasterNft();
      toast({ title: "Mint NFT yêu cầu gửi!" });
    } catch (e: unknown) {
      const error = e as Error;
      toast({
        title: "Mint thất bại",
        description: error?.message ?? String(e),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Render Helpers
  // ============================================================================
  const timeRemaining = level.timeLimit ? level.timeLimit - timeElapsed : null;
  const movesRemaining = level.moveLimit ? level.moveLimit - moves : null;
  const suddenDeathRemaining = suddenDeathLimit - mistakes;
  const isGameWon = gameStatus === 'ended' && areAllCardsMatched(cards);

  // ============================================================================
  // Render
  // ============================================================================
  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto rounded-lg shadow-xl p-4 bg-white">
        {/* Header */}
        <Card className="mb-6 game-card-bg-header border-none shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-gray-800">
                  <div>
                    Tên người chơi:{" "}
                    <span className="text-purple-600">{playerName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    Mức độ:{" "}
                    <span className="text-purple-600">{level.displayName}</span>
                  </div>
                </CardTitle>

                <div className="flex gap-4 mt-2">
                  <Badge
                    className="flex items-center gap-1 bg-green-100 text-green-800 border-green-300"
                  >
                    <Clock className="w-4 h-4 text-green-600" />
                    {formatTime(timeElapsed)}
                    {timeRemaining !== null && (
                      <span className="text-green-500 ml-1">
                        / {formatTime(level.timeLimit!)}
                      </span>
                    )}
                  </Badge>

                  <Badge
                    className="bg-yellow-100 text-yellow-800 border-yellow-300"
                  >
                    Nước đi: {moves}
                    {movesRemaining !== null && (
                      <span className="text-yellow-500 ml-1">/ {level.moveLimit}</span>
                    )}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={resetGame}
                  className="h-9 px-3 bg-gray-100 text-gray-700 border border-gray-300 hover:bg-sky-500 hover:text-white hover:border-sky-500"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Chơi lại
                </Button>
                <Button
                  onClick={activatePeek}
                  disabled={peekUses <= 0 || isPeeking || gameStatus !== 'playing'}
                  className="h-9 px-3 bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-500 hover:text-white hover:border-purple-500 disabled:opacity-50"
                >
                  Peek ({peekUses})
                </Button>
                <Button
                  onClick={activateFreeze}
                  disabled={freezeUses <= 0 || isFrozen || gameStatus !== 'playing'}
                  className="h-9 px-3 bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-500 hover:text-white hover:border-blue-500 disabled:opacity-50"
                >
                  Freeze {isFrozen ? '(On)' : `(${freezeUses})`}
                </Button>
                <Button
                  onClick={onGoHome}
                  className="h-9 px-3 bg-gray-100 text-gray-700 border border-gray-300 hover:bg-sky-500 hover:text-white hover:border-sky-500"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Về trang chủ
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Game Grid */}
        <Card className="game-card-bg-grid border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300">
                Điểm: {score}
              </Badge>
              <Badge className="bg-pink-100 text-pink-800 border-pink-300">
                Combo: {combo}{maxCombo > 0 ? ` / Max ${maxCombo}` : ''}
              </Badge>
              <Badge className="bg-red-100 text-red-800 border-red-300">
                Sai: {mistakes} / {suddenDeathLimit}
              </Badge>
              {isFrozen && (
                <Badge className="bg-blue-200 text-blue-800 border-blue-300">Đang đóng băng thời gian</Badge>
              )}
              {isPeeking && (
                <Badge className="bg-purple-200 text-purple-800 border-purple-300">Đang xem trước</Badge>
              )}
            </div>
            <div
              className="grid gap-3 mx-auto"
              style={{
                gridTemplateColumns: `repeat(${level.gridSize.cols}, 1fr)`,
                maxWidth: `${level.gridSize.cols * 80}px`,
              }}
            >
              {cards.map((card) => (
                <GameCard
                  key={card.id}
                  card={card}
                  onClick={() => handleCardClick(card)}
                  disabled={
                    gameStatus === 'ended' || isPeeking || card.isMatched || flippedCards.length >= 2
                  }
                  ghostFlipped={ghostFlippedIds?.has(card.id)}
                />
              ))}
            </div>

            {gameStatus === 'ended' && (
              <div className="text-center mt-6 p-4 game-result-gradient rounded-lg text-white">
                <Trophy className="w-12 h-12 mx-auto mb-2" />
                <h3 className="text-xl font-bold mb-2">
                  {isGameWon ? "Chúc mừng!" : "Game Over!"}
                </h3>
                <p className="opacity-90">
                  {isGameWon
                    ? `Bạn đã hoàn thành trong ${moves} nước và ${formatTime(timeElapsed)}!`
                    : "Hãy thử lại lần nữa!"}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                  <Button
                    onClick={handleSubmitScore}
                    disabled={isSubmitting || hasSubmittedScoreRef.current}
                    className="h-9 px-3"
                  >
                    {isSubmitting ? 'Đang gửi...' : 'Submit on-chain'}
                  </Button>
                  <Button
                    onClick={handleClaimNFT}
                    disabled={isSubmitting}
                    className="h-9 px-3"
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Claim NFT'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}