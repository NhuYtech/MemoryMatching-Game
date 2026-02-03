import { GameCard as GameCardType } from '@/types/game';
import { cn } from '@/lib/utils';

interface GameCardProps {
  card: GameCardType;
  onClick: () => void;
  disabled?: boolean;
  ghostFlipped?: boolean;
}

export function GameCard({ card, onClick, disabled = false, ghostFlipped = false }: GameCardProps) {
  const { isFlipped, isMatched, emoji } = card;

  // Determine if card is truly disabled (prevents all interactions)
  const isDisabled = disabled || isMatched;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "aspect-square w-full relative rounded-lg transition-all duration-300",
        "transform hover:scale-105 active:scale-95",
        "shadow-lg hover:shadow-xl",
        "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
        {
          "bg-purple-100 border border-purple-300 text-purple-800": !isFlipped && !isMatched,
          "bg-green-100 text-green-800 border-green-300": isFlipped && !isMatched,
          "bg-emerald-600 border-2 border-emerald-700 shadow-lg": isMatched,
          // Enforce disabled state visually AND prevent pointer events
          "cursor-not-allowed opacity-50 pointer-events-none": isDisabled,
        }
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {isFlipped || isMatched ? (
          <span className={cn(
            "text-2xl sm:text-3xl md:text-4xl font-bold",
            // Only animate on initial flip, not on matched state
            isMatched ? "filter drop-shadow-lg brightness-110" : "animate-bounce-in"
          )}>
            {emoji}
          </span>
        ) : (
          <div className="w-8 h-8 bg-purple-200 rounded-full opacity-60" />
        )}
      </div>
      {/* PvP ghost indicator - shows opponent's flipped cards */}
      {ghostFlipped && !isFlipped && !isMatched && (
        <div className="absolute inset-0 rounded-lg border-2 border-pink-400 pointer-events-none animate-pulse" />
      )}
    </button>
  );
}