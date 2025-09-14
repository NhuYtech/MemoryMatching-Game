"use client";

import { LeaderboardEntry } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Trophy } from "lucide-react";
import { Button } from "./ui/button";
import { saveScore } from "@/lib/gameUtilsFirebase";

interface LeaderboardProps {
  results: LeaderboardEntry[];
  onBack: () => void;
}

export function Leaderboard({ results, onBack }: LeaderboardProps) {
  const sortedResults = [...results].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-gradient-game p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6 bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-violet-600" />
              <CardTitle className="text-3xl font-bold text-violet-600">
                Bảng Xếp Hạng
              </CardTitle>
            </div>
            <Button onClick={onBack}>Quay lại</Button>
          </CardHeader>
        </Card>

        {results.length === 0 ? (
          <Card className="bg-card/80 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Chưa có kết quả nào</h3>
              <p>Hãy chơi một vài ván để xem bảng xếp hạng!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedResults.map((res, idx) => (
              <Card key={res.playerName + idx} className="bg-card/80">
                <CardContent className="flex justify-between items-center">
                  <span>
                    {idx + 1}. {res.playerName}
                  </span>
                  <span>Score: {res.score}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
