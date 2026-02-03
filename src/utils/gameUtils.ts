import { GameCard, GameLevel, CARD_EMOJIS, GameStatus } from '@/types/game';

/**
 * Creates game cards with optional seeded shuffle for deterministic PvP
 * @param level - Game difficulty level
 * @param seed - Optional seed for deterministic shuffle (required for PvP)
 */
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

/**
 * Calculate normalized score for competition fairness
 * Formula: 100000 / (time * sqrt(moves))
 * Prevents negative/infinite scores
 */
export function calculateScore(moves: number, timeElapsed: number): number {
  const safeTime = Math.max(1, timeElapsed);
  const safeMoves = Math.max(1, moves);
  const normalized = 100000 / (safeTime * Math.sqrt(safeMoves));
  const score = Math.round(normalized);

  // Validate score is finite and positive
  if (!isFinite(score) || score < 0) {
    console.warn('Invalid score calculated, returning 0', { moves, timeElapsed, score });
    return 0;
  }

  return score;
}

// ============================================================================
// Validation & Guard Functions
// ============================================================================

/**
 * Validates if a card can be flipped based on current game state
 * Prevents race conditions and invalid flips
 */
export function canFlipCard(
  card: GameCard,
  gameStatus: GameStatus,
  isProcessing: boolean,
  isPeeking: boolean,
  flippedCardsCount: number
): boolean {
  // Game must be in playing state
  if (gameStatus !== 'playing') return false;

  // Cannot flip during processing or peeking
  if (isProcessing || isPeeking) return false;

  // Cannot flip already matched cards
  if (card.isMatched) return false;

  // Cannot flip already flipped cards
  if (card.isFlipped) return false;

  // Cannot flip more than 2 cards at once
  if (flippedCardsCount >= 2) return false;

  return true;
}

/**
 * Validates if all cards are matched (win condition)
 */
export function areAllCardsMatched(cards: GameCard[]): boolean {
  if (cards.length === 0) return false;
  return cards.every(card => card.isMatched);
}

/**
 * Validates game state consistency
 * Used for debugging and preventing invalid states
 */
export function validateGameState(
  cards: GameCard[],
  flippedCards: GameCard[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check flipped cards are in cards array
  flippedCards.forEach(fc => {
    if (!cards.find(c => c.id === fc.id)) {
      errors.push(`Flipped card ${fc.id} not found in cards array`);
    }
  });

  // Check no more than 2 flipped cards
  if (flippedCards.length > 2) {
    errors.push(`Too many flipped cards: ${flippedCards.length}`);
  }

  // Check matched cards are also flipped
  cards.forEach(card => {
    if (card.isMatched && !card.isFlipped) {
      errors.push(`Matched card ${card.id} is not flipped`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}