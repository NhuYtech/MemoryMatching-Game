import { GameCard, GameLevel, CARD_EMOJIS } from '@/types/game';

export function createGameCards(level: GameLevel): GameCard[] {
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

  // Shuffle cards
  return shuffleArray(cards);
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
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
  // Lower moves and time = higher score
  const moveScore = Math.max(1000 - moves * 10, 100);
  const timeScore = Math.max(1000 - timeElapsed, 100);
  return Math.round((moveScore + timeScore) / 2);
}