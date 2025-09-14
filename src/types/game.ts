import { ReactNode } from "react";

export interface GameCard {
  id: string;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface GameLevel {
  name: 'Dễ' | 'Trung bình' | 'Khó';
  displayName: string;
  gridSize: { rows: number; cols: number };
  pairs: number;
  timeLimit?: number; // seconds
  moveLimit?: number;
}

export interface GameState {
  cards: GameCard[];
  flippedCards: GameCard[];
  moves: number;
  timeElapsed: number;
  isGameStarted: boolean;
  isGameFinished: boolean;
  playerName: string;
  level: GameLevel;
}

export interface GameResult {
  score: any;
  playerName: string;
  level: string;
  moves: number;
  duration: number;
  createdAt: Date;
  id?: string;
}

export const GAME_LEVELS: GameLevel[] = [
  { name: 'Dễ', displayName: 'Dễ', gridSize: { rows: 4, cols: 5 }, pairs: 10 },
  { name: 'Trung bình', displayName: 'Trung bình', gridSize: { rows: 6, cols: 6 }, pairs: 18, timeLimit: 120, moveLimit: 50 },
  { name: 'Khó', displayName: 'Khó', gridSize: { rows: 8, cols: 8 }, pairs: 32, timeLimit: 180, moveLimit: 70 },
];

export const CARD_EMOJIS = [
  '🎯', '🎮', '🎲', '🎪', '🎨', '🎭', '🎬', '🎤', '🎧', '🎸',
  '🎺', '🎻', '🎹', '🥁', '🎵', '🎶', '🎼', '🎙️', '📻', '📺',
  '🎞️', '📷', '📸', '📹', '📼', '💎', '💍', '👑', '🏆', '🏅',
  '🎖️', '🥇', '🥈', '🥉', '⭐', '🌟', '✨', '💫', '🔥', '❄️',
  '⚡', '🌈', '🦄', '🐉', '🦋', '🌸', '🌺', '🌻', '🌹', '💐',
  '🍎', '🍊', '🍋', '🍌', '🍇', '🍓', '🍑', '🍒', '🥝', '🍍',
  '🥭', '🍉', '🫐', '🍈', '🥥', '🥕', '🌽', '🥒', '🥦', '🍄',
];


export interface GameResult {
  score: any;
  playerName: string;
  level: string;
  moves: number;
  duration: number;
  createdAt: Date;
  id?: string;
}
