import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingFieldProps {
  value: number;
  onChange: (value: number) => void;
  maxStars: number;
  hasError?: boolean;
  disabled?: boolean;
}

const StarRatingField: React.FC<StarRatingFieldProps> = ({
  value,
  onChange,
  maxStars,
  hasError = false,
  disabled = false
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {Array.from({ length: maxStars }, (_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= (value || 0);
          
          return (
            <button
              key={index}
              type="button"
              onClick={() => !disabled && onChange(starValue)}
              disabled={disabled}
              className={`transition-all duration-200 hover:scale-110 disabled:cursor-not-allowed ${
                isFilled 
                  ? 'text-yellow-400' 
                  : 'text-gray-300 hover:text-yellow-300'
              } ${hasError ? 'text-red-400' : ''}`}
            >
              <Star 
                className={`h-8 w-8 ${isFilled ? 'fill-current' : ''}`} 
              />
            </button>
          );
        })}
      </div>
      
      {value > 0 && (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span>
            {value} de {maxStars} estrella{maxStars !== 1 ? 's' : ''}
          </span>
          {value > 0 && (
            <button
              type="button"
              onClick={() => !disabled && onChange(0)}
              disabled={disabled}
              className="text-xs text-accent hover:text-accent/80 underline disabled:cursor-not-allowed"
            >
              Limpiar
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default StarRatingField;