import { GameCard as GameCardType } from '@/types/game';
import { cn } from '@/lib/utils';

interface GameCardProps {
  card: GameCardType;
  onClick: () => void;
  disabled?: boolean;
}

export function GameCard({ card, onClick, disabled = false }: GameCardProps) {
  const { isFlipped, isMatched, emoji } = card;

  return (
    <button
      onClick={onClick}
      disabled={disabled || isMatched}
      className={cn(
        "aspect-square w-full relative rounded-lg transition-all duration-300",
        "transform hover:scale-105 active:scale-95",
        "shadow-lg hover:shadow-xl",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        {
          "bg-gradient-card border border-game-card-shadow": !isFlipped && !isMatched,
          "bg-gradient-primary text-primary-foreground": isFlipped && !isMatched,
          "bg-game-card-matched text-foreground animate-match-pulse": isMatched,
          "cursor-not-allowed opacity-50": disabled,
        }
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        {isFlipped || isMatched ? (
          <span className={cn(
            "text-2xl sm:text-3xl md:text-4xl font-bold",
            "animate-bounce-in"
          )}>
            {emoji}
          </span>
        ) : (
          <div className="w-8 h-8 bg-game-card-back rounded-full opacity-60" />
        )}
      </div>
    </button>
  );
}