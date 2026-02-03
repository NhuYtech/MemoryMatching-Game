"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PvPMatch from "@/components/PvPMatch";
import { GAME_LEVELS } from "@/types/game";

function PvPContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const playerName = searchParams?.get("player") || "Player";
  const levelName = searchParams?.get("level") || "Trung bình";
  const level = GAME_LEVELS.find(l => l.name === levelName) || GAME_LEVELS[1];
  const playerId = searchParams?.get("pid") || Math.random().toString(36).slice(2, 10);

  return (
    <PvPMatch playerId={playerId} playerName={playerName} level={level} />
  );
}

export default function PvPPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading PvP...</div>}>
      <PvPContent />
    </Suspense>
  );
}


