"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { GameHome } from "@/components/GameHome";
import { GameLevel } from "@/types/game";

export default function Home() {
  const router = useRouter();

  const handleStartGame = (playerName: string, level: GameLevel) => {
    router.push(
      `/game?player=${encodeURIComponent(playerName)}&level=${level.name}`
    );
  };

  return (
    <main>
      <GameHome
        onStartGame={handleStartGame} // chỉ còn prop này thôi
      />
    </main>
  );
}
