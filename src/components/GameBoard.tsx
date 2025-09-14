"use client";
import { useState, useEffect, useCallback } from "react";
import { GameCard } from "./GameCard";
import { GameCard as GameCardType, GameLevel, GameResult } from "@/types/game";
import { createGameCards, formatTime } from "@/utils/gameUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, RotateCcw, Home, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
interface GameBoardProps {
  playerName: string;
  level: GameLevel;
  onGameComplete: (result: GameResult) => void;
  onGoHome: () => void;
}

export default function GameBoard({
  playerName,
  level,
  onGameComplete,
  onGoHome,
}: GameBoardProps) {
  const [cards, setCards] = useState<GameCardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<GameCardType[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);
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
    score: undefined
  };

  toast({
    title: "Chúc mừng! 🏆",
    description: `Bạn đã hoàn thành game trong ${moves} nước và ${formatTime(timeElapsed)}!`,
  });


  onGameComplete(result);
}, [playerName, level.displayName, moves, timeElapsed, toast, onGameComplete]);


  const resetGame = useCallback(() => {
    const newCards = createGameCards(level);
    setCards(newCards);
    setFlippedCards([]);
    setMoves(0);
    setTimeElapsed(0);
    setIsGameStarted(false);
    setIsGameFinished(false);
  }, [level]);

  const handleCardClick = useCallback(
    (clickedCard: GameCardType) => {
      if (!isGameStarted) setIsGameStarted(true);

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
    [flippedCards, isGameStarted, level.moveLimit, handleGameOver]
  );

  // ==========================
  // Effects
  // ==========================
  useEffect(() => {
    resetGame();
  }, [resetGame]);

  useEffect(() => {
    if (!isGameStarted || isGameFinished) return;

    const timer = setInterval(() => {
      setTimeElapsed((prev) => {
        const newTime = prev + 1;
        if (level.timeLimit && newTime >= level.timeLimit) {
          handleGameOver("Hết thời gian! 🕐");
          return prev;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameStarted, isGameFinished, level.timeLimit, handleGameOver]);

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
        }, 2000);
      }
    }
  }, [flippedCards, toast]);

  // ==========================
  // Render
  // ==========================
  const timeRemaining = level.timeLimit ? level.timeLimit - timeElapsed : null;
  const movesRemaining = level.moveLimit ? level.moveLimit - moves : null;

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
    Người chơi: <span className="text-purple-600">{playerName}</span>
  </div>
  <div className="flex items-center gap-2">
    Mức độ: <span className="text-purple-600">{level.displayName}</span>
  </div>
</CardTitle>

               <div className="flex gap-4 mt-2">
  <Badge
    variant="secondary"
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
    variant="outline"
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
  variant="outline"
  size="sm"
  onClick={resetGame}
  className="bg-gray-100 text-gray-700 border-gray-300 hover:bg-sky-500 hover:text-white hover:border-sky-500"
>
  <RotateCcw className="w-4 h-4 mr-2" />
  Chơi lại
</Button>
<Button
  variant="outline"
  size="sm"
  onClick={onGoHome}
  className="bg-gray-100 text-gray-700 border-gray-300 hover:bg-sky-500 hover:text-white hover:border-sky-500"
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
                    isGameFinished || card.isMatched || flippedCards.length >= 2
                  }
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
