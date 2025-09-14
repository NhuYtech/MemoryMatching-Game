// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC__TutgWaNGThrPUEdQQhAXd7kM4HuW8c",
  authDomain: "memorymatchinggame-0909.firebaseapp.com",
  projectId: "memorymatchinggame-0909",
  storageBucket: "memorymatchinggame-0909.firebasestorage.app",
  messagingSenderId: "46244036315",
  appId: "1:46244036315:web:9f12bc777b2a523e4c16fe",
  measurementId: "G-36ZGMM201B"
};

// Tránh khởi tạo nhiều lần
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Chỉ init analytics trên client
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

// Firestore và Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

export { app, analytics };
