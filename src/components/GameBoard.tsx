import { useState, useEffect, useCallback } from 'react';
import { GameCard } from './GameCard';
import { GameCard as GameCardType, GameLevel, GameResult } from '@/types/game';
import { createGameCards, formatTime } from '@/utils/gameUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, RotateCcw, Home, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GameBoardProps {
  playerName: string;
  level: GameLevel;
  onGameComplete: (result: GameResult) => void;
  onGoHome: () => void;
}

export function GameBoard({ playerName, level, onGameComplete, onGoHome }: GameBoardProps) {
  const [cards, setCards] = useState<GameCardType[]>([]);
  const [flippedCards, setFlippedCards] = useState<GameCardType[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const { toast } = useToast();

  // Initialize game
  useEffect(() => {
    resetGame();
  }, [level]);

  // Timer
  useEffect(() => {
    if (!isGameStarted || isGameFinished) return;

    const timer = setInterval(() => {
      setTimeElapsed(prev => {
        const newTime = prev + 1;
        
        // Check time limit
        if (level.timeLimit && newTime >= level.timeLimit) {
          handleGameOver('Hết thời gian! 🕐');
          return prev;
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGameStarted, isGameFinished, level.timeLimit]);

  // Check for game completion
  useEffect(() => {
    if (cards.length > 0 && cards.every(card => card.isMatched)) {
      handleGameComplete();
    }
  }, [cards]);

  const resetGame = () => {
    const newCards = createGameCards(level);
    setCards(newCards);
    setFlippedCards([]);
    setMoves(0);
    setTimeElapsed(0);
    setIsGameStarted(false);
    setIsGameFinished(false);
  };

  const handleCardClick = useCallback((clickedCard: GameCardType) => {
    if (!isGameStarted) setIsGameStarted(true);
    
    if (flippedCards.length === 2) {
      // If two cards are already flipped, flip them back and start new flip
      setCards(prev => prev.map(card => 
        flippedCards.some(fc => fc.id === card.id) && !card.isMatched
          ? { ...card, isFlipped: false }
          : card
      ));
      setFlippedCards([clickedCard]);
      setCards(prev => prev.map(card => 
        card.id === clickedCard.id ? { ...card, isFlipped: true } : card
      ));
    } else {
      setFlippedCards(prev => [...prev, clickedCard]);
      setCards(prev => prev.map(card => 
        card.id === clickedCard.id ? { ...card, isFlipped: true } : card
      ));
    }
    
    setMoves(prev => {
      const newMoves = prev + 1;
      
      // Check move limit
      if (level.moveLimit && newMoves >= level.moveLimit) {
        setTimeout(() => handleGameOver('Hết lượt chơi! 🎯'), 100);
      }
      
      return newMoves;
    });
  }, [flippedCards, isGameStarted, level.moveLimit]);

  // Check for matches
  useEffect(() => {
    if (flippedCards.length === 2) {
      const [first, second] = flippedCards;
      
      if (first.emoji === second.emoji) {
        // Match found
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === first.id || card.id === second.id
              ? { ...card, isMatched: true, isFlipped: true }
              : card
          ));
          setFlippedCards([]);
          
          toast({
            title: "Ghép thành công! 🎉",
            description: "Bạn đã tìm thấy một cặp!",
          });
        }, 500);
      } else {
        // No match
        setTimeout(() => {
          setCards(prev => prev.map(card => 
            card.id === first.id || card.id === second.id
              ? { ...card, isFlipped: false }
              : card
          ));
          setFlippedCards([]);
        }, 2000);
      }
    }
  }, [flippedCards, toast]);

  const handleGameComplete = () => {
    setIsGameFinished(true);
    const result: GameResult = {
      playerName,
      level: level.name,
      moves,
      duration: timeElapsed,
      createdAt: new Date(),
    };
    
    toast({
      title: "Chúc mừng! 🏆",
      description: `Bạn đã hoàn thành game trong ${moves} nước và ${formatTime(timeElapsed)}!`,
    });
    
    onGameComplete(result);
  };

  const handleGameOver = (message: string) => {
    setIsGameFinished(true);
    toast({
      title: "Game Over!",
      description: message,
      variant: "destructive",
    });
  };

  const timeRemaining = level.timeLimit ? level.timeLimit - timeElapsed : null;
  const movesRemaining = level.moveLimit ? level.moveLimit - moves : null;

  return (
    <div className="min-h-screen bg-gradient-game p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-primary">
                  {playerName} - Level {level.name}
                </CardTitle>
                <div className="flex gap-4 mt-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatTime(timeElapsed)}
                    {timeRemaining !== null && (
                      <span className="text-destructive ml-1">
                        / {formatTime(level.timeLimit!)}
                      </span>
                    )}
                  </Badge>
                  <Badge variant="outline">
                    Nước đi: {moves}
                    {movesRemaining !== null && (
                      <span className="text-destructive ml-1">
                        / {level.moveLimit}
                      </span>
                    )}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetGame}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Chơi lại
                </Button>
                <Button variant="outline" size="sm" onClick={onGoHome}>
                  <Home className="w-4 h-4 mr-2" />
                  Về trang chủ
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Game Grid */}
        <Card className="bg-card/80 backdrop-blur-sm">
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
                    isGameFinished ||
                    card.isFlipped ||
                    card.isMatched ||
                    flippedCards.length >= 2
                  }
                />
              ))}
            </div>
            
            {isGameFinished && (
              <div className="text-center mt-6 p-4 bg-gradient-primary rounded-lg text-primary-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-2" />
                <h3 className="text-xl font-bold mb-2">
                  {cards.every(card => card.isMatched) ? 'Chúc mừng!' : 'Game Over!'}
                </h3>
                <p className="opacity-90">
                  {cards.every(card => card.isMatched) 
                    ? `Bạn đã hoàn thành trong ${moves} nước và ${formatTime(timeElapsed)}!`
                    : 'Hãy thử lại lần nữa!'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}