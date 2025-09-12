import { GameResult } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trophy, Clock, Target } from 'lucide-react';
import { formatTime } from '@/utils/gameUtils';

interface LeaderboardProps {
  results: GameResult[];
  onBack: () => void;
}

export function Leaderboard({ results, onBack }: LeaderboardProps) {
  const sortedResults = results.sort((a, b) => {
    // First by level (Easy -> Medium -> Hard)
    const levelOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
    if (levelOrder[a.level as keyof typeof levelOrder] !== levelOrder[b.level as keyof typeof levelOrder]) {
      return levelOrder[a.level as keyof typeof levelOrder] - levelOrder[b.level as keyof typeof levelOrder];
    }
    
    // Then by duration (faster is better)
    if (a.duration !== b.duration) {
      return a.duration - b.duration;
    }
    
    // Finally by moves (fewer is better)
    return a.moves - b.moves;
  });

  const getTopResults = (level: string) => {
    return sortedResults
      .filter(result => result.level === level)
      .slice(0, 5);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Easy': return 'bg-green-100 text-green-800 border-green-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Hard': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${index + 1}`;
    }
  };

  const levels = ['Easy', 'Medium', 'Hard'];

  return (
    <div className="min-h-screen bg-gradient-game p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="mb-6 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-primary" />
                <CardTitle className="text-3xl font-bold text-primary">
                  Bảng Xếp Hạng
                </CardTitle>
              </div>
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
            </div>
          </CardHeader>
        </Card>

        {results.length === 0 ? (
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Chưa có kết quả nào</h3>
              <p className="text-muted-foreground">
                Hãy chơi một vài ván để xem bảng xếp hạng!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {levels.map((level) => {
              const levelResults = getTopResults(level);
              
              if (levelResults.length === 0) return null;

              return (
                <Card key={level} className="bg-card/80 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <Badge className={getLevelColor(level)}>
                        {level}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Top {levelResults.length} người chơi
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {levelResults.map((result, index) => (
                        <div
                          key={`${result.playerName}-${result.createdAt.getTime()}`}
                          className={`
                            flex items-center justify-between p-3 rounded-lg border
                            ${index === 0 ? 'bg-gradient-primary/10 border-primary/20' : 'bg-muted/50'}
                            transition-colors hover:bg-muted
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                              {getRankIcon(index)}
                            </div>
                            <div>
                              <div className="font-semibold">{result.playerName}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(result.createdAt).toLocaleDateString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {formatTime(result.duration)}
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Target className="w-3 h-3" />
                              {result.moves} lượt
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}