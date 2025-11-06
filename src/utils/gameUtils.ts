import { GameCard, GameLevel, CARD_EMOJIS } from '@/types/game';

export function createGameCards(level: GameLevel, seed?: number): GameCard[] {
  const { pairs } = level;
  const selectedEmojis = CARD_EMOJIS.slice(0, pairs);
  const cards: GameCard[] = [];

  // Create pairs of cards
  selectedEmojis.forEach((emoji, index) => {
    cards.push(
      {
        id: `${index}-1`,
        emoji,
        isFlipped: false,
        isMatched: false,
      },
      {
        id: `${index}-2`,
        emoji,
        isFlipped: false,
        isMatched: false,
      }
    );
  });

  // Shuffle cards (seeded if provided)
  return seed !== undefined ? shuffleArraySeeded(cards, seed) : shuffleArray(cards);
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Seeded RNG (mulberry32) and shuffle for deterministic layouts across clients
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleArraySeeded<T>(array: T[], seed: number): T[] {
  const shuffled = [...array];
  const rand = mulberry32(seed);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function calculateScore(moves: number, timeElapsed: number): number {
  // Normalized, competition-friendly score: 100000 / (time * sqrt(moves))
  const safeTime = Math.max(1, timeElapsed);
  const safeMoves = Math.max(1, moves);
  const normalized = 100000 / (safeTime * Math.sqrt(safeMoves));
  return Math.round(normalized);
}