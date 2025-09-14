"use client";

import { useEffect, useState } from "react";
import { Leaderboard } from "@/components/Leaderboard";
import { LeaderboardEntry } from "@/types/game"; // ✅ import từ đây
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function LeaderboardPage() {
  const [results, setResults] = useState<LeaderboardEntry[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function loadResults() {
      try {
        const q = query(collection(db, "leaderboard"), orderBy("score", "desc"));
        const snapshot = await getDocs(q);
        const data: LeaderboardEntry[] = snapshot.docs.map(doc => doc.data() as LeaderboardEntry);
        setResults(data);
      } catch (err) {
        console.error("Load leaderboard error:", err);
      }
    }
    loadResults();
  }, []);

  return <Leaderboard results={results} onBack={() => router.push("/")} />;
}
