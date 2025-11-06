"use client";
import { useState, useEffect, useCallback } from "react";
import { GameCard } from "./GameCard";
import { GameCard as GameCardType, GameLevel, GameResult } from "@/types/game";
import { createGameCards, formatTime, calculateScore } from "@/utils/gameUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, RotateCcw, Home, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { submitSeasonScore, claimMasterNft } from "@/lib/onchain";
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
  const [cards, setCards] = useState<GameCardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<GameCardType[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [lastClickAt, setLastClickAt] = useState<number>(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [isFrozen, setIsFrozen] = useState(false);
  const [freezeUses, setFreezeUses] = useState(1);
  const [peekUses, setPeekUses] = useState(1);
  const [isPeeking, setIsPeeking] = useState(false);
  const suddenDeathLimit = 3;
  const { toast } = useToast();

  // ==========================
  // Callbacks
  // ==========================
  const handleGameOver = useCallback(
    (message: string) => {
      setIsGameFinished(true);
      toast({
        title: "Game Over!",
        description: message,
        variant: "destructive",
      });
    },
    [toast]
  );

  const handleGameComplete = useCallback(() => {
    setIsGameFinished(true);

    const result: GameResult = {
      playerName,
      level: level.displayName,
      moves,
      duration: timeElapsed,
      createdAt: new Date(),
      score: calculateScore(moves, timeElapsed) + score,
    };

    toast({
      title: "Chúc mừng! 🏆",
      description: `Bạn đã hoàn thành game trong ${moves} nước và ${formatTime(
        timeElapsed
      )}!`,
    });

    onGameComplete(result);
  }, [playerName, level.displayName, moves, timeElapsed, toast, onGameComplete]);

  const resetGame = useCallback(() => {
    const newCards = createGameCards(level, seed);
    setCards(newCards);
    setFlippedCards([]);
    setMoves(0);
    setTimeElapsed(0);
    setIsGameStarted(false);
    setIsGameFinished(false);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setMistakes(0);
    setIsFrozen(false);
    setPeekUses(1);
    setFreezeUses(1);
    setIsPeeking(false);
  }, [level, seed]);

  const handleCardClick = useCallback(
    (clickedCard: GameCardType) => {
      const now = Date.now();
      if (now - lastClickAt < 100) return; // Rate-limit to >= 100ms
      setLastClickAt(now);
      if (!isGameStarted) setIsGameStarted(true);
      if (isPeeking || isGameFinished) return;

      if (onCardEvent) {
        onCardEvent({ cardId: clickedCard.id, atMs: timeElapsed * 1000 });
      }

      if (flippedCards.length === 2) {
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
        setFlippedCards((prev) => [...prev, clickedCard]);
        setCards((prev) =>
          prev.map((card) =>
            card.id === clickedCard.id ? { ...card, isFlipped: true } : card
          )
        );
      }

      setMoves((prev) => {
        const newMoves = prev + 1;
        if (level.moveLimit && newMoves >= level.moveLimit) {
          setTimeout(() => handleGameOver("Hết lượt chơi! 🎯"), 100);
        }
        return newMoves;
      });
    },
    [flippedCards, isGameStarted, isPeeking, isGameFinished, level.moveLimit, handleGameOver, onCardEvent, timeElapsed, lastClickAt]
  );

  // ==========================
  // Effects
  // ==========================
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  // External start signal support
  useEffect(() => {
    if (startSignal && !isGameStarted && !isGameFinished) {
      setIsGameStarted(true);
    }
  }, [startSignal, isGameStarted, isGameFinished]);

  useEffect(() => {
    if (!isGameStarted || isGameFinished) return;

    const timer = setInterval(() => {
      setTimeElapsed((prev) => {
        const newTime = prev + 1;
        if (!isFrozen && level.timeLimit && newTime >= level.timeLimit) {
          handleGameOver("Hết thời gian! 🕐");
          return prev;
        }
        return isFrozen ? prev : newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameStarted, isGameFinished, isFrozen, level.timeLimit, handleGameOver]);

  useEffect(() => {
    if (cards.length > 0 && cards.every((card) => card.isMatched)) {
      handleGameComplete();
    }
  }, [cards, handleGameComplete]);

  useEffect(() => {
    if (flippedCards.length === 2) {
      const [first, second] = flippedCards;
      if (first.emoji === second.emoji) {
        // Match found
        setTimeout(() => {
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
          toast({
            title: "Ghép thành công! 🎉",
            description: "Bạn đã tìm thấy một cặp!",
          });
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card) =>
              card.id === first.id || card.id === second.id
                ? { ...card, isFlipped: false }
                : card
            )
          );
          setFlippedCards([]);
          setCombo(0);
          setMistakes((m) => {
            const next = m + 1;
            if (next > suddenDeathLimit) {
              handleGameOver("Quá số lần sai! ☠️");
            }
            return next;
          });
        }, 2000);
      }
    }
  }, [flippedCards, toast, handleGameOver]);

  // ==========================
  // Power-ups
  // ==========================
  const activatePeek = useCallback(() => {
    if (isGameFinished || peekUses <= 0 || isPeeking) return;
    setPeekUses((u) => u - 1);
    setIsPeeking(true);
    // Reveal all non-matched cards
    setCards((prev) => prev.map((c) => (c.isMatched ? c : { ...c, isFlipped: true })));
    const revealDurationMs = 1500;
    setTimeout(() => {
      setCards((prev) =>
        prev.map((c) => (c.isMatched ? c : { ...c, isFlipped: false }))
      );
      setIsPeeking(false);
    }, revealDurationMs);
  }, [isGameFinished, peekUses, isPeeking]);

  const activateFreeze = useCallback(() => {
    if (isGameFinished || freezeUses <= 0 || isFrozen) return;
    setFreezeUses((u) => u - 1);
    setIsFrozen(true);
    const freezeMs = 5000;
    setTimeout(() => setIsFrozen(false), freezeMs);
  }, [isGameFinished, freezeUses, isFrozen]);

  // ==========================
  // Render
  // ==========================
  const timeRemaining = level.timeLimit ? level.timeLimit - timeElapsed : null;
  const movesRemaining = level.moveLimit ? level.moveLimit - moves : null;
  const suddenDeathRemaining = suddenDeathLimit - mistakes;

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
                  disabled={peekUses <= 0 || isPeeking || isGameFinished}
                  className="h-9 px-3 bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-500 hover:text-white hover:border-purple-500 disabled:opacity-50"
                >
                  Peek ({peekUses})
                </Button>
                <Button
                  
                  onClick={activateFreeze}
                  disabled={freezeUses <= 0 || isFrozen || isGameFinished}
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
                    isGameFinished || isPeeking || card.isMatched || flippedCards.length >= 2
                  }
                  ghostFlipped={ghostFlippedIds?.has(card.id)}
                />
              ))}
            </div>

            {isGameFinished && (
              <div className="text-center mt-6 p-4 game-result-gradient rounded-lg text-white">
                <Trophy className="w-12 h-12 mx-auto mb-2" />
                <h3 className="text-xl font-bold mb-2">
                  {cards.every((card) => card.isMatched) ? "Chúc mừng!" : "Game Over!"}
                </h3>
                <p className="opacity-90">
                  {cards.every((card) => card.isMatched)
                    ? `Bạn đã hoàn thành trong ${moves} nước và ${formatTime(timeElapsed)}!`
                    : "Hãy thử lại lần nữa!"}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                  <Button
                    onClick={async () => {
                      try {
                        const finalScore = calculateScore(moves, timeElapsed) + score;
                        await submitSeasonScore(finalScore);
                        toast({ title: "Đã submit điểm on-chain", description: `Score: ${finalScore}` });
                      } catch (e: any) {
                        toast({ title: "Submit thất bại", description: e?.message ?? String(e), variant: "destructive" });
                      }
                    }}
                    className="h-9 px-3"
                  >
                    Submit on-chain
                  </Button>
                  <Button
                    
                    onClick={async () => {
                      try {
                        await claimMasterNft();
                        toast({ title: "Mint NFT yêu cầu gửi!" });
                      } catch (e: any) {
                        toast({ title: "Mint thất bại", description: e?.message ?? String(e), variant: "destructive" });
                      }
                    }}
                    className="h-9 px-3"
                  >
                    Claim NFT
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