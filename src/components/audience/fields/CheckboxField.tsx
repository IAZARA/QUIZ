import React from 'react';
import { Check } from 'lucide-react';

interface CheckboxFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: string[];
  hasError?: boolean;
  disabled?: boolean;
  maxSelections?: number;
}

const CheckboxField: React.FC<CheckboxFieldProps> = ({
  value,
  onChange,
  options,
  hasError = false,
  disabled = false,
  maxSelections
}) => {
  const handleOptionChange = (option: string, checked: boolean) => {
    if (disabled) return;

    let newValue: string[];
    
    if (checked) {
      // Verificar límite máximo de selecciones
      if (maxSelections && value.length >= maxSelections) {
        return;
      }
      newValue = [...value, option];
    } else {
      newValue = value.filter(item => item !== option);
    }
    
    onChange(newValue);
  };

  return (
    <div className="space-y-3">
      {options.map((option, index) => {
        const isChecked = value.includes(option);
        const isDisabledOption = disabled || (maxSelections !== undefined && !isChecked && value.length >= maxSelections);
        
        return (
          <label
            key={index}
            className={`flex items-center gap-3 cursor-pointer p-2 rounded-md transition-colors ${
              isDisabledOption 
                ? 'cursor-not-allowed opacity-50' 
                : 'hover:bg-bg-secondary'
            } ${hasError ? 'text-red-600' : 'text-text-primary'}`}
          >
            <div className="relative">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => handleOptionChange(option, e.target.checked)}
                disabled={isDisabledOption}
                className="sr-only"
              />
              
              {/* Checkbox personalizado */}
              <div
                className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-colors ${
                  isChecked
                    ? hasError
                      ? 'bg-red-500 border-red-500'
                      : 'bg-accent border-accent'
                    : hasError
                    ? 'border-red-500'
                    : 'border-border-color hover:border-accent'
                } ${isDisabledOption ? 'opacity-50' : ''}`}
              >
                {isChecked && (
                  <Check className="h-3 w-3 text-white" />
                )}
              </div>
            </div>
            
            <span className="text-sm font-medium select-none">
              {option}
            </span>
          </label>
        );
      })}
      
      {/* Información de selecciones */}
      <div className="text-xs text-text-secondary">
        {maxSelections && (
          <div className="flex justify-between items-center">
            <span>
              {value.length} de {maxSelections} seleccionado{maxSelections !== 1 ? 's' : ''}
            </span>
            {value.length > 0 && (
              <button
                type="button"
                onClick={() => !disabled && onChange([])}
                disabled={disabled}
                className="text-accent hover:text-accent/80 underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                Limpiar todo
              </button>
            )}
          </div>
        )}
        
        {!maxSelections && value.length > 0 && (
          <div className="flex justify-between items-center">
            <span>
              {value.length} opción{value.length !== 1 ? 'es' : ''} seleccionada{value.length !== 1 ? 's' : ''}
            </span>
            <button
              type="button"
              onClick={() => !disabled && onChange([])}
              disabled={disabled}
              className="text-accent hover:text-accent/80 underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              Limpiar todo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckboxField;