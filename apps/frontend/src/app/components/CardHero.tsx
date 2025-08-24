import { ReactNode } from 'react';

interface CardHeroProps {
  icon: ReactNode;
  title: string;
  description?: string;
  price?: {
    original?: string;
    current: string;
  };
  badge?: {
    text: string;
    variant: 'free' | 'premium';
  };
  button: {
    text: string;
    variant: 'primary' | 'secondary';
    onClick: () => void;
  };
  highlight?: boolean;
}

export default function CardHero({
  icon,
  title,
  description,
  price,
  badge,
  button,
  highlight = false
}: CardHeroProps) {
  return (
    <div className={`
      rounded-xl p-4 sm:p-5 border-2 transition-all duration-200 hover:shadow-md h-24 sm:h-28 flex flex-col justify-between
      ${highlight 
        ? 'border-teal-300 bg-teal-50 shadow-sm' 
        : 'border-gray-200 bg-white'
      }
    `}>
      {/* Header with Icon and Title */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="text-lg sm:text-xl flex-shrink-0 text-gray-600">{icon}</div>
        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 leading-tight flex-1 truncate">
          {title}
        </h3>
      </div>

      {/* Price and Button in same line */}
      <div className="flex items-center justify-between mt-auto">
        {/* Price or Badge */}
        <div>
          {badge ? (
            <span className={`
              px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wide
              ${badge.variant === 'free' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-blue-100 text-blue-700'
              }
            `}>
              {badge.text}
            </span>
          ) : price && (
            <>
              {price.original && (
                <span className="text-xs text-red-500 line-through mr-2">
                  {price.original}
                </span>
              )}
              <span className="text-sm font-bold text-gray-900">
                {price.current}
              </span>
            </>
          )}
        </div>

        {/* Button */}
        <button
          onClick={button.onClick}
          className={`
            py-1.5 sm:py-2 px-3 sm:px-5 rounded-full font-medium text-xs transition-colors duration-200 whitespace-nowrap min-w-[110px] sm:min-w-[130px] shadow-sm
            ${button.variant === 'primary'
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
            }
          `}
        >
          {button.text}
        </button>
      </div>
    </div>
  );
}