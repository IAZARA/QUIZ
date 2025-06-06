import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  hasError?: boolean;
  disabled?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({
  value,
  onChange,
  options,
  placeholder = "Seleccione una opción...",
  hasError = false,
  disabled = false
}) => {
  return (
    <div className="relative">
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-4 py-2 bg-bg-secondary border rounded-md shadow-sm focus:ring-accent focus:border-accent text-text-primary appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
          hasError ? 'border-red-500' : 'border-border-color'
        }`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
      
      {/* Icono de dropdown personalizado */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <ChevronDown className={`h-4 w-4 ${hasError ? 'text-red-500' : 'text-text-secondary'}`} />
      </div>
    </div>
  );
};

export default SelectField;