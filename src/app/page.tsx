
"use client";
import React from "react";
import { GameHome } from "@/components/GameHome";
import { GameLevel } from "@/types/game";

export default function Home() {
  return (
    <main>
      <GameHome onStartGame={function (playerName: string, level: GameLevel): void {
        throw new Error("Function not implemented.");
      } } onViewLeaderboard={function (): void {
        throw new Error("Function not implemented.");
      } }/>
    </main>
  );
}
