import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface NumberScaleFieldProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  hasError?: boolean;
  disabled?: boolean;
  step?: number;
}

const NumberScaleField: React.FC<NumberScaleFieldProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  hasError = false,
  disabled = false,
  step = 1
}) => {
  const handleIncrement = () => {
    const newValue = (value || 0) + step;
    if (newValue <= max) {
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = (value || 0) - step;
    if (newValue >= min) {
      onChange(newValue);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      {/* Controles de incremento/decremento */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || (value || 0) <= min}
          className="p-2 bg-bg-secondary border border-border-color rounded-md hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="h-4 w-4 text-text-primary" />
        </button>
        
        <div className="flex-1 text-center">
          <input
            type="number"
            value={value || ''}
            onChange={handleInputChange}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className={`w-20 px-3 py-2 text-center text-lg font-semibold bg-bg-secondary border rounded-md focus:ring-accent focus:border-accent text-text-primary disabled:cursor-not-allowed ${
              hasError ? 'border-red-500' : 'border-border-color'
            }`}
          />
        </div>
        
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || (value || 0) >= max}
          className="p-2 bg-bg-secondary border border-border-color rounded-md hover:bg-accent/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="h-4 w-4 text-text-primary" />
        </button>
      </div>

      {/* Slider */}
      <div className="px-2">
        <input
          type="range"
          value={value || min}
          onChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={`w-full h-2 bg-bg-secondary rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed ${
            hasError ? 'accent-red-500' : 'accent-accent'
          }`}
          style={{
            background: `linear-gradient(to right, ${hasError ? '#ef4444' : 'var(--accent-color, #3b82f6)'} 0%, ${hasError ? '#ef4444' : 'var(--accent-color, #3b82f6)'} ${((value || min) - min) / (max - min) * 100}%, #e5e7eb ${((value || min) - min) / (max - min) * 100}%, #e5e7eb 100%)`
          }}
        />
        
        {/* Etiquetas de rango */}
        <div className="flex justify-between text-xs text-text-secondary mt-1">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>

      {/* Información del valor actual */}
      {(value !== undefined && value !== null) && (
        <div className="text-center">
          <span className="text-sm text-text-secondary">
            Valor seleccionado: <span className="font-medium text-text-primary">{value}</span>
          </span>
        </div>
      )}
    </div>
  );
};

export default NumberScaleField;