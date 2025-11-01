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
          "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
          {
            "bg-purple-100 border border-purple-300 text-purple-800": !isFlipped && !isMatched,
            "bg-green-100 text-green-800 border-green-300": isFlipped && !isMatched,
            "bg-emerald-600 border-2 border-emerald-700 shadow-lg": isMatched,
            "cursor-not-allowed opacity-50": disabled,
          }
        )}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {isFlipped || isMatched ? (
            <span className={cn(
              "text-2xl sm:text-3xl md:text-4xl font-bold",
              isMatched ? "filter drop-shadow-lg brightness-110" : "animate-bounce-in"
            )}>
              {emoji}
            </span>
          ) : (
            <div className="w-8 h-8 bg-purple-200 rounded-full opacity-60" />
          )}
        </div>
      </button>
    );
  }