import { useState } from 'react';
import { GameHome } from './GameHome';
import GameBoard from './GameBoard';
import { GameLevel, GameResult } from '@/types/game';

type GameScreen = 'home' | 'game';

export function MemoryGame() {
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('home');
  const [playerName, setPlayerName] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<GameLevel | null>(null);
  const [gameResults, setGameResults] = useState<GameResult[]>([]);

  const handleStartGame = (name: string, level: GameLevel) => {
    setPlayerName(name);
    setSelectedLevel(level);
    setCurrentScreen('game');
  };

  const handleGameComplete = (result: GameResult) => {
    setGameResults(prev => [...prev, result]);
    // Stay on game screen to show completion message
  };

  const handleGoHome = () => {
    setCurrentScreen('home');
    setPlayerName('');
    setSelectedLevel(null);
  };

  switch (currentScreen) {
    case 'home':
      return (
        <GameHome onStartGame={handleStartGame} />
      );

    case 'game':
      return selectedLevel ? (
        <GameBoard
          playerName={playerName}
          level={selectedLevel}
          onGameComplete={handleGameComplete}
          onGoHome={handleGoHome}
        />
      ) : null;
    
    default:
      return null;
  }
}
