import React, { useState } from 'react';
import { ContactMethod, ContactMethodType } from '../../types';
import { getContactTypeConfig, validateContactValue } from '../../config/contactTypes';
import { Save, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface ContactMethodFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (method: Omit<ContactMethod, '_id'>) => void;
  contactType: ContactMethodType;
  initialData?: ContactMethod;
  isEditing?: boolean;
}

const ContactMethodForm: React.FC<ContactMethodFormProps> = ({
  isOpen,
  onClose,
  onSave,
  contactType,
  initialData,
  isEditing = false
}) => {
  const [value, setValue] = useState(initialData?.value || '');
  const [label, setLabel] = useState(initialData?.label || '');
  const [error, setError] = useState('');

  const typeConfig = getContactTypeConfig(contactType);

  if (!isOpen || !typeConfig) return null;

  const getIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!value.trim()) {
      setError('Este campo es obligatorio');
      return;
    }

    if (!validateContactValue(contactType, value)) {
      setError(`Formato inválido. Ejemplo: ${typeConfig.placeholder}`);
      return;
    }

    onSave({
      type: contactType,
      value: value.trim(),
      label: label.trim() || undefined
    });

    // Reset form
    setValue('');
    setLabel('');
    setError('');
    onClose();
  };

  const handleClose = () => {
    setValue(initialData?.value || '');
    setLabel(initialData?.label || '');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-bg-primary rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-color">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10">
              <div className="text-accent">
                {getIcon(typeConfig.icon)}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                {isEditing ? 'Editar' : 'Agregar'} {typeConfig.label}
              </h3>
              <p className="text-sm text-text-secondary">
                Ingresa la información de contacto
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Campo principal */}
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-text-secondary mb-2">
                {typeConfig.label}
              </label>
              <input
                type="text"
                id="value"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError('');
                }}
                placeholder={typeConfig.placeholder}
                className={`w-full px-3 py-2 border rounded-md bg-bg-primary text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent ${
                  error ? 'border-red-500' : 'border-border-color'
                }`}
                autoFocus
              />
              {error && (
                <p className="mt-1 text-sm text-red-500">{error}</p>
              )}
            </div>

            {/* Campo de etiqueta opcional */}
            <div>
              <label htmlFor="label" className="block text-sm font-medium text-text-secondary mb-2">
                Etiqueta personalizada (opcional)
              </label>
              <input
                type="text"
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={`Ej: ${typeConfig.label} personal`}
                className="w-full px-3 py-2 border border-border-color rounded-md bg-bg-primary text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
              />
              <p className="mt-1 text-xs text-text-muted">
                Si no especificas una etiqueta, se usará "{typeConfig.label}"
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-text-secondary hover:text-text-primary border border-border-color rounded-md hover:bg-bg-secondary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 bg-accent hover:brightness-95 text-button-text rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
            >
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactMethodForm;