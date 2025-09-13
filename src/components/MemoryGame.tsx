import { useState } from 'react';
import { GameHome } from './GameHome';
import GameBoard from './GameBoard';
import { Leaderboard } from './Leaderboard';
import { GameLevel, GameResult } from '@/types/game';

type GameScreen = 'home' | 'game' | 'leaderboard';

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

  const handleViewLeaderboard = () => {
    setCurrentScreen('leaderboard');
  };

  const handleBackFromLeaderboard = () => {
    setCurrentScreen('home');
  };

  switch (currentScreen) {
    case 'home':
      return (
        <GameHome
          onStartGame={handleStartGame}
          onViewLeaderboard={handleViewLeaderboard}
        />
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
    
    case 'leaderboard':
      return (
        <Leaderboard
          results={gameResults}
          onBack={handleBackFromLeaderboard}
        />
      );
    
    default:
      return null;
  }
}