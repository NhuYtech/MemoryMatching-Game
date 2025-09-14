"use client";

import { useEffect, useState } from "react";
import { Leaderboard } from "../../components/Leaderboard";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { GameResult } from "@/types/game";
import { useRouter } from "next/navigation";

export default function LeaderboardPage() {
  const [results, setResults] = useState<GameResult[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function loadResults() {
      const q = query(collection(db, "gameResults"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data: GameResult[] = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      })) as GameResult[];
      setResults(data);
    }
    loadResults();
  }, []);

  return <Leaderboard results={results} onBack={() => router.push("/")} />;
}
