import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Send, AlertCircle } from 'lucide-react';
import { DynamicForm, FormField } from '../../types/formTypes';
import { validateForm, formatValidationErrors } from '../../utils/formValidation';

interface FormPreviewProps {
  form: DynamicForm;
  onSubmit?: (responses: Record<string, any>) => void;
  showSubmitButton?: boolean;
}

const FormPreview: React.FC<FormPreviewProps> = ({ 
  form, 
  onSubmit, 
  showSubmitButton = true 
}) => {
  const { t } = useTranslation();
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Actualizar respuesta de un campo
  const updateResponse = (fieldId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }));

    // Limpiar errores del campo cuando se actualiza
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  // Manejar envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.fields || form.fields.length === 0) {
      return;
    }

    // Validar formulario
    const validationErrors = validateForm(form.fields, responses);
    const formattedErrors = formatValidationErrors(validationErrors);

    if (Object.keys(formattedErrors).length > 0) {
      setErrors(formattedErrors);
      return;
    }

    // Enviar respuestas
    setIsSubmitting(true);
    if (onSubmit) {
      onSubmit(responses);
    }
    setIsSubmitting(false);
  };

  // Renderizar campo según su tipo
  const renderField = (field: FormField) => {
    const fieldError = errors[field.id];
    const hasError = fieldError && fieldError.length > 0;

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={responses[field.id] || ''}
            onChange={(e) => updateResponse(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`w-full px-4 py-2 bg-bg-secondary border rounded-md shadow-sm focus:ring-accent focus:border-accent text-text-primary placeholder-text-secondary/70 ${
              hasError ? 'border-red-500' : 'border-border-color'
            }`}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={responses[field.id] || ''}
            onChange={(e) => updateResponse(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className={`w-full px-4 py-2 bg-bg-secondary border rounded-md shadow-sm focus:ring-accent focus:border-accent text-text-primary placeholder-text-secondary/70 resize-vertical ${
              hasError ? 'border-red-500' : 'border-border-color'
            }`}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            value={responses[field.id] || ''}
            onChange={(e) => updateResponse(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`w-full px-4 py-2 bg-bg-secondary border rounded-md shadow-sm focus:ring-accent focus:border-accent text-text-primary placeholder-text-secondary/70 ${
              hasError ? 'border-red-500' : 'border-border-color'
            }`}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={responses[field.id] || ''}
            onChange={(e) => updateResponse(field.id, e.target.value ? Number(e.target.value) : '')}
            min={field.min}
            max={field.max}
            className={`w-full px-4 py-2 bg-bg-secondary border rounded-md shadow-sm focus:ring-accent focus:border-accent text-text-primary ${
              hasError ? 'border-red-500' : 'border-border-color'
            }`}
          />
        );

      case 'stars-5':
      case 'stars-10':
        const maxStars = field.type === 'stars-5' ? 5 : 10;
        const currentRating = responses[field.id] || 0;
        
        return (
          <div className="flex items-center gap-1">
            {Array.from({ length: maxStars }, (_, index) => {
              const starValue = index + 1;
              const isFilled = starValue <= currentRating;
              
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => updateResponse(field.id, starValue)}
                  className={`transition-colors hover:scale-110 ${
                    isFilled ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
                  }`}
                >
                  <Star 
                    className={`h-6 w-6 ${isFilled ? 'fill-current' : ''}`} 
                  />
                </button>
              );
            })}
            {currentRating > 0 && (
              <span className="ml-2 text-sm text-text-secondary">
                {currentRating} de {maxStars}
              </span>
            )}
          </div>
        );

      case 'select':
        return (
          <select
            value={responses[field.id] || ''}
            onChange={(e) => updateResponse(field.id, e.target.value)}
            className={`w-full px-4 py-2 bg-bg-secondary border rounded-md shadow-sm focus:ring-accent focus:border-accent text-text-primary ${
              hasError ? 'border-red-500' : 'border-border-color'
            }`}
          >
            <option value="">Seleccione una opción...</option>
            {(field.options || []).map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        const selectedOptions = responses[field.id] || [];
        
        return (
          <div className="space-y-2">
            {(field.options || []).map((option, index) => (
              <label key={index} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(option)}
                  onChange={(e) => {
                    const newSelected = e.target.checked
                      ? [...selectedOptions, option]
                      : selectedOptions.filter((item: string) => item !== option);
                    updateResponse(field.id, newSelected);
                  }}
                  className="h-4 w-4 text-accent border-border-color rounded focus:ring-accent"
                />
                <span className="text-sm text-text-primary">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={responses[field.id] || ''}
            onChange={(e) => updateResponse(field.id, e.target.value)}
            className={`w-full px-4 py-2 bg-bg-secondary border rounded-md shadow-sm focus:ring-accent focus:border-accent text-text-primary ${
              hasError ? 'border-red-500' : 'border-border-color'
            }`}
          />
        );

      default:
        return (
          <div className="text-text-secondary italic">
            Tipo de campo no soportado: {field.type}
          </div>
        );
    }
  };

  if (!form.fields || form.fields.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-text-secondary mx-auto mb-4" />
        <h3 className="text-lg font-medium text-text-primary mb-2">
          Formulario Vacío
        </h3>
        <p className="text-text-secondary">
          Agrega campos al formulario para ver la vista previa
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header del formulario */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          {form.title || 'Formulario Sin Título'}
        </h1>
        {form.description && (
          <p className="text-text-secondary">
            {form.description}
          </p>
        )}
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {form.fields
          .sort((a, b) => a.order - b.order)
          .map((field) => {
            const fieldError = errors[field.id];
            const hasError = fieldError && fieldError.length > 0;

            return (
              <div key={field.id} className="space-y-2">
                {/* Etiqueta del campo */}
                <label className="block text-sm font-medium text-text-primary">
                  {field.label}
                  {field.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>

                {/* Campo */}
                {renderField(field)}

                {/* Errores de validación */}
                {hasError && (
                  <div className="text-sm text-red-600">
                    {fieldError.map((error, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {error}
                      </div>
                    ))}
                  </div>
                )}

                {/* Información adicional del campo */}
                {field.type === 'number' && (field.min !== undefined || field.max !== undefined) && (
                  <div className="text-xs text-text-secondary">
                    {field.min !== undefined && field.max !== undefined
                      ? `Valor entre ${field.min} y ${field.max}`
                      : field.min !== undefined
                      ? `Valor mínimo: ${field.min}`
                      : `Valor máximo: ${field.max}`
                    }
                  </div>
                )}

                {['text', 'textarea'].includes(field.type) && (field.min !== undefined || field.max !== undefined) && (
                  <div className="text-xs text-text-secondary">
                    {field.min !== undefined && field.max !== undefined
                      ? `Entre ${field.min} y ${field.max} caracteres`
                      : field.min !== undefined
                      ? `Mínimo ${field.min} caracteres`
                      : `Máximo ${field.max} caracteres`
                    }
                  </div>
                )}
              </div>
            );
          })}

        {/* Botón de envío */}
        {showSubmitButton && (
          <div className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-button-text bg-accent hover:brightness-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent focus:ring-offset-bg-primary disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-150"
            >
              <Send className="h-5 w-5 mr-2" />
              {isSubmitting ? 'Enviando...' : 'Enviar Respuestas'}
            </button>
          </div>
        )}
      </form>

      {/* Información de debug (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
          <h4 className="text-sm font-medium text-text-primary mb-2">
            Debug - Respuestas Actuales:
          </h4>
          <pre className="text-xs text-text-secondary overflow-auto">
            {JSON.stringify(responses, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default FormPreview;