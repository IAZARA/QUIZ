import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, AlertCircle, CheckCircle, User, Mail } from 'lucide-react';
import { DynamicForm, FormField } from '../../types/formTypes';
import { validateForm, formatValidationErrors } from '../../utils/formValidation';
import { useFormBuilderStore } from '../../store/formBuilderStore';
import StarRatingField from './fields/StarRatingField';
import NumberScaleField from './fields/NumberScaleField';
import SelectField from './fields/SelectField';
import CheckboxField from './fields/CheckboxField';

interface DynamicFormRendererProps {
  eventId: string;
  onSubmitSuccess?: () => void;
}

const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({ 
  eventId, 
  onSubmitSuccess 
}) => {
  const { t } = useTranslation();
  const {
    activeForm,
    isLoading,
    error,
    fetchActiveForm,
    submitResponse,
    initializeSocket
  } = useFormBuilderStore();

  const [responses, setResponses] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [participantInfo, setParticipantInfo] = useState({
    name: '',
    email: ''
  });

  // Inicializar
  useEffect(() => {
    fetchActiveForm(eventId);
    initializeSocket();
  }, [eventId, fetchActiveForm, initializeSocket]);

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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeForm || !activeForm.fields || activeForm.fields.length === 0) {
      return;
    }

    // Validar formulario
    const validationErrors = validateForm(activeForm.fields, responses);
    const formattedErrors = formatValidationErrors(validationErrors);

    if (Object.keys(formattedErrors).length > 0) {
      setErrors(formattedErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await submitResponse(activeForm._id!, responses, participantInfo);
      setIsSubmitted(true);
      if (onSubmitSuccess) {
        setTimeout(onSubmitSuccess, 2000);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderizar campo según su tipo
  const renderField = (field: FormField) => {
    const fieldError = errors[field.id];
    const hasError = fieldError && fieldError.length > 0;
    const value = responses[field.id];

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
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
            value={value || ''}
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
            value={value || ''}
            onChange={(e) => updateResponse(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`w-full px-4 py-2 bg-bg-secondary border rounded-md shadow-sm focus:ring-accent focus:border-accent text-text-primary placeholder-text-secondary/70 ${
              hasError ? 'border-red-500' : 'border-border-color'
            }`}
          />
        );

      case 'number':
        return (
          <NumberScaleField
            value={value}
            onChange={(newValue: number) => updateResponse(field.id, newValue)}
            min={field.min}
            max={field.max}
            hasError={hasError}
          />
        );

      case 'stars-5':
      case 'stars-10':
        return (
          <StarRatingField
            value={value}
            onChange={(newValue: number) => updateResponse(field.id, newValue)}
            maxStars={field.type === 'stars-5' ? 5 : 10}
            hasError={hasError}
          />
        );

      case 'select':
        return (
          <SelectField
            value={value}
            onChange={(newValue: string) => updateResponse(field.id, newValue)}
            options={field.options || []}
            placeholder="Seleccione una opción..."
            hasError={hasError}
          />
        );

      case 'checkbox':
        return (
          <CheckboxField
            value={value || []}
            onChange={(newValue: string[]) => updateResponse(field.id, newValue)}
            options={field.options || []}
            hasError={hasError}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
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

  // Estados de carga y error
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        <span className="ml-3 text-text-secondary">Cargando formulario...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-text-primary mb-2">Error</h3>
        <p className="text-text-secondary">{error}</p>
      </div>
    );
  }

  if (!activeForm) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-lg font-medium text-text-primary mb-2">
          No hay formulario activo
        </h3>
        <p className="text-text-secondary">
          El presentador no ha activado ningún formulario en este momento.
        </p>
      </div>
    );
  }

  // Formulario enviado exitosamente
  if (isSubmitted) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          ¡Respuestas Enviadas!
        </h3>
        <p className="text-text-secondary">
          Gracias por completar el formulario. Tus respuestas han sido registradas.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-bg-primary shadow-xl rounded-lg border border-border-color max-w-2xl mx-auto my-8">
      {/* Header del formulario */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-text-primary mb-2">
          {activeForm.title}
        </h2>
        {activeForm.description && (
          <p className="text-text-secondary">
            {activeForm.description}
          </p>
        )}
      </div>

      {/* Información del participante (opcional) */}
      <div className="mb-6 p-4 bg-bg-secondary rounded-lg border border-border-color">
        <h3 className="text-sm font-medium text-text-primary mb-3 flex items-center">
          <User className="h-4 w-4 mr-2 text-accent" />
          Información del Participante (Opcional)
        </h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <input
              type="text"
              value={participantInfo.name}
              onChange={(e) => setParticipantInfo(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Tu nombre"
              className="w-full px-3 py-2 text-sm bg-bg-primary border border-border-color rounded-md focus:ring-accent focus:border-accent text-text-primary placeholder-text-secondary/70"
            />
          </div>
          <div>
            <input
              type="email"
              value={participantInfo.email}
              onChange={(e) => setParticipantInfo(prev => ({ ...prev, email: e.target.value }))}
              placeholder="tu@email.com"
              className="w-full px-3 py-2 text-sm bg-bg-primary border border-border-color rounded-md focus:ring-accent focus:border-accent text-text-primary placeholder-text-secondary/70"
            />
          </div>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {activeForm.fields
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
              </div>
            );
          })}

        {/* Botón de envío */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-button-text bg-accent hover:brightness-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent focus:ring-offset-bg-primary disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-150"
          >
            <Send className="h-5 w-5 mr-2" />
            {isSubmitting ? 'Enviando...' : 'Enviar Respuestas'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DynamicFormRenderer;