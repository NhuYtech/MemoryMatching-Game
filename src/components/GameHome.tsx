"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { GameLevel, GAME_LEVELS } from '@/types/game';
import { Play, Trophy, Clock, Target, Zap } from 'lucide-react';


interface GameHomeProps {
  onStartGame: (playerName: string, level: GameLevel) => void;
  onViewLeaderboard: () => void;
}

export function GameHome({ onStartGame, onViewLeaderboard }: GameHomeProps) {
  const [playerName, setPlayerName] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<GameLevel>(GAME_LEVELS[0]);

  const handleStartGame = () => {
    if (playerName.trim()) {
      onStartGame(playerName.trim(), selectedLevel);
    }
  };

  const getLevelColor = (levelName: string) => {
    switch (levelName) {
      case 'Easy': return 'bg-green-100 text-green-800 border-green-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Hard': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getLevelIcon = (levelName: string) => {
    switch (levelName) {
      case 'Easy': return <Zap className="w-4 h-4" />;
      case 'Medium': return <Target className="w-4 h-4" />;
      case 'Hard': return <Trophy className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-game flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Game Title */}
        <div className="text-center animate-fade-in">
          <h1 className="text-4xl font-bold text-primary mb-2">
            🧠 Memory Matching Game
          </h1>
          <p className="text-muted-foreground">
            Thử thách trí nhớ của bạn!
          </p>
        </div>

        {/* Player Setup */}
        <Card className="bg-card/80 backdrop-blur-sm animate-bounce-in">
          <CardHeader>
            <CardTitle className="text-center text-primary">
              Bắt đầu chơi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Player Name Input */}
            <div className="space-y-2">
              <Label htmlFor="playerName">Tên của bạn</Label>
              <Input
                id="playerName"
                type="text"
                placeholder="Nhập tên của bạn..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleStartGame()}
                className="text-center"
              />
            </div>

            {/* Level Selection */}
            <div className="space-y-3">
              <Label>Chọn độ khó</Label>
              <div className="space-y-2">
                {GAME_LEVELS.map((level) => (
                  <button
                    key={level.name}
                    onClick={() => setSelectedLevel(level)}
                    className={`
                      w-full p-3 rounded-lg border-2 transition-all duration-200
                      ${selectedLevel.name === level.name 
                        ? 'border-primary bg-primary/10 shadow-lg' 
                        : 'border-border bg-card hover:bg-muted'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getLevelIcon(level.name)}
                        <span className="font-medium">{level.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Badge 
                          variant="outline" 
                          className={getLevelColor(level.name)}
                        >
                          {level.gridSize.rows}×{level.gridSize.cols}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{level.pairs} cặp</span>
                      {level.timeLimit && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {level.timeLimit}s
                        </div>
                      )}
                      {level.moveLimit && (
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {level.moveLimit} lượt
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <Button 
              onClick={handleStartGame}
              disabled={!playerName.trim()}
              className="w-full bg-gradient-primary hover:opacity-90 text-lg py-6"
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Bắt đầu chơi
            </Button>

            {/* Leaderboard Button */}
            <Button 
              onClick={onViewLeaderboard}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Trophy className="w-5 h-5 mr-2" />
              Bảng xếp hạng
            </Button>
          </CardContent>
        </Card>

        {/* Game Rules */}
        <Card className="bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2 text-primary">Cách chơi:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Lật tối đa 2 thẻ mỗi lượt</li>
              <li>• Tìm các cặp hình giống nhau</li>
              <li>• Hoàn thành tất cả cặp để thắng</li>
              <li>• Chú ý giới hạn thời gian và số lượt!</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}