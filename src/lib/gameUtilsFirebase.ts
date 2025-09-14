// src/lib/gameUtilsFirebase.ts
import { db, auth } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { GameResult } from "@/types/game";

export async function saveGameResult(result: GameResult) {
  await addDoc(collection(db, "gameResults"), {
    ...result,
    createdAt: serverTimestamp()
  });
}
