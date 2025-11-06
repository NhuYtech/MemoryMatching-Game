"use client";
import { useEffect, useState } from 'react';
import { fetchRecentSeasonScores } from '@/lib/onchain';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Array<{player:string; score:number; season:number}>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const logs = await fetchRecentSeasonScores();
        const aggregated = new Map<string, number>();
        logs.forEach((l: { player: string; score: number; }) => {
          const prev = aggregated.get(l.player) ?? 0;
          if (l.score > prev) aggregated.set(l.player, l.score);
        });
        const list = Array.from(aggregated.entries()).map(([player, score]) => ({player, score, season: 0}))
          .sort((a,b)=> b.score - a.score).slice(0, 50);
        setRows(list);
      } catch (e:any) {
        setError(e?.message ?? String(e));
      }
    })();
  }, []);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Season Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            <div className="space-y-2">
              {rows.map((r, idx) => (
                <div key={r.player} className="flex items-center justify-between border-b py-2">
                  <div className="flex items-center gap-3">
                    <Badge color="secondary">#{idx+1}</Badge>
                    <span className="font-mono">{r.player.slice(0,6)}...{r.player.slice(-4)}</span>
                  </div>
                  <div className="font-semibold">{r.score}</div>
                </div>
              ))}
              {rows.length === 0 && <div className="text-muted-foreground">No scores yet.</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


