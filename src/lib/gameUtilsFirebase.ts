import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { LeaderboardEntry } from "@/types/game";

export async function saveScore(entry: LeaderboardEntry) {
  try {
    await addDoc(collection(db, "leaderboard"), {
      playerName: entry.playerName,
      score: entry.score,
      createdAt: serverTimestamp()
    });
    console.log("Score saved!");
  } catch (err) {
    console.error("Error saving score:", err);
  }
}
