"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GameBoard from "@/components/GameBoard";
import { GAME_LEVELS, type GameResult } from "@/types/game";

function GameContent() {
  const searchParams = useSearchParams();

  const playerName = searchParams?.get("player") || "Player1";
  const levelName = searchParams?.get("level") || "Easy";

  const level = GAME_LEVELS.find(l => l.name === levelName) || GAME_LEVELS[0];

  const handleGameComplete = (result: GameResult) => {
    console.log("Game complete:", result);
    // No redirection, just log the result
  };

  const handleGoHome = () => {
    // No redirection, keep the user on the same page
  };

  return (
    <GameBoard
      playerName={playerName}
      level={level}
      onGameComplete={handleGameComplete}
      onGoHome={handleGoHome}
    />
  );
}

export default function GamePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading game...</div>}>
      <GameContent />
    </Suspense>
  );
}