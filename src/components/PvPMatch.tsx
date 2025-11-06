"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GameBoard from "./GameBoard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createRealtimeClient } from "@/lib/realtime";
import { GameLevel, PvPFinishEvent, PvPMoveEvent, PvPStartEvent, PvPWinnerEvent } from "@/types/game";
import { GAME_LEVELS } from "@/types/game";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { commitAction, verifyCommit } from "@/lib/crypto";

interface PvPMatchProps {
  playerId: string;
  playerName: string;
  level?: GameLevel;
}

export default function PvPMatch({ playerId, playerName, level = GAME_LEVELS[1] }: PvPMatchProps) {
  const { toast } = useToast();
  const [roomId, setRoomId] = useState<string>("");
  const [joined, setJoined] = useState(false);
  const [round, setRound] = useState(1);
  const [bestOf] = useState(3);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [startSignal, setStartSignal] = useState<number | undefined>(undefined);
  const [ghostFlippedIds, setGhostFlippedIds] = useState<Set<string>>(new Set());
  const ghostTimerRef = useRef<number | null>(null);
  const [totals, setTotals] = useState<Record<string, number>>({});
  const realtime = useMemo(() => createRealtimeClient(), []);
  const [nonce, setNonce] = useState<string>("1");
  const [lastCommit, setLastCommit] = useState<string>("");

  // Subscribe room
  const subscribeRoom = useCallback((id: string) => {
    if (!realtime) {
      toast({ title: "Realtime chưa cấu hình", description: "Thiếu VITE_PUSHER_KEY/CLUSTER" });
      return;
    }
    const channel = realtime.subscribe(`room-${id}`, {
      start: (data: PvPStartEvent) => {
        setSeed(data.seed);
        setRound(data.round);
        setStartSignal(data.startedAt);
        toast({ title: `Bắt đầu Round ${data.round}`, description: `Seed ${data.seed}` });
      },
      move: (data: PvPMoveEvent) => {
        // Ghost flip highlight
        setGhostFlippedIds((prev) => new Set(prev).add(data.cardId));
        if (ghostTimerRef.current) window.clearTimeout(ghostTimerRef.current);
        ghostTimerRef.current = window.setTimeout(() => setGhostFlippedIds(new Set()), 800);
      },
      finish: (data: PvPFinishEvent) => {
        setTotals((t) => ({ ...t, [data.playerId]: (t[data.playerId] ?? 0) + data.durationMs }));
      },
      winner: (data: PvPWinnerEvent) => {
        toast({ title: `Winner: ${data.winnerId}`, description: `Tổng thời gian: ${JSON.stringify(data.totals)}` });
      },
    } as any);
    setJoined(true);
    return channel;
  }, [realtime, toast]);

  const sendStart = async () => {
    // Request deterministic seed from server API: keccak(roomId:nonce)
    try {
      const res = await fetch('/api/seed', { method: 'POST', body: JSON.stringify({ roomId, nonce }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Seed error');
      const newSeed = data.seed as number;
      setSeed(newSeed);
      setStartSignal(Date.now());
      toast({ title: `Bắt đầu Round ${round}`, description: `Seed ${newSeed}` });
    } catch (e:any) {
      toast({ title: 'Seed failed', description: e?.message ?? String(e), variant: 'destructive' });
    }
  };

  const handleCardEvent = (evt: { cardId: string; atMs: number }) => {
    // Commit–reveal (scaffold): commit locally, reveal immediately and verify
    const salt = playerId;
    const payload = `${evt.cardId}:${evt.atMs}`;
    const commit = commitAction(payload, salt);
    setLastCommit(commit);
    // Reveal instantly for demo
    const ok = verifyCommit(commit, payload, salt);
    if (!ok) {
      toast({ title: 'Commit mismatch', variant: 'destructive' });
    }
  };

  const handleLocalFinish = (durationSec: number) => {
    setTotals((t) => ({ ...t, [playerId]: (t[playerId] ?? 0) + durationSec * 1000 }));
    if (round < bestOf) {
      setRound((r) => r + 1);
      // auto start next for now
      const newSeed = Math.floor(Math.random() * 1_000_000);
      setSeed(newSeed);
      setStartSignal(Date.now());
      setGhostFlippedIds(new Set());
    } else {
      // Decide winner locally
      const entries = Object.entries({ ...totals, [playerId]: (totals[playerId] ?? 0) + durationSec * 1000 });
      if (entries.length >= 1) {
        const winner = entries.reduce((a, b) => (a[1] <= b[1] ? a : b))[0];
        toast({ title: `Winner (local): ${winner}` });
      }
    }
  };

  useEffect(() => {
    return () => {
      if (ghostTimerRef.current) window.clearTimeout(ghostTimerRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-5xl mx-auto">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>1v1 Race (BO3)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Input placeholder="Room ID" value={roomId} onChange={(e) => setRoomId(e.target.value)} className="w-40" />
            <Input placeholder="Nonce" value={nonce} onChange={(e) => setNonce(e.target.value)} className="w-28" />
            <Button onClick={() => subscribeRoom(roomId)} disabled={!roomId || joined}>Join</Button>
            <Button onClick={sendStart} disabled={!joined}>Start Round {round}</Button>
            <Badge className="bg-secondary text-secondary-foreground">Seed: {seed ?? '-'}</Badge>
            <Badge className="bg-secondary text-secondary-foreground">Round: {round}/{bestOf}</Badge>
            <Badge className="bg-secondary text-secondary-foreground">Player: {playerName}</Badge>
            {lastCommit && <Badge className="border">Last commit: {lastCommit.slice(0,10)}…</Badge>}
          </CardContent>
        </Card>

        <GameBoard
          playerName={playerName}
          level={level}
          onGameComplete={(result) => handleLocalFinish(result.duration)}
          onGoHome={() => {}}
          seed={seed}
          startSignal={startSignal}
          onCardEvent={handleCardEvent}
          ghostFlippedIds={ghostFlippedIds}
        />
      </div>
    </div>
  );
}


