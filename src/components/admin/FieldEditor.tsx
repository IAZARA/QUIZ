import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Settings, 
  Trash2, 
  Plus, 
  Minus, 
  Type, 
  Hash, 
  Star, 
  Mail, 
  Calendar,
  ChevronDown,
  CheckSquare,
  AlignLeft
} from 'lucide-react';
import { FormField, FieldType, FIELD_TYPES } from '../../types/formTypes';

interface FieldEditorProps {
  field: FormField;
  onUpdate: (field: FormField) => void;
  onDelete: () => void;
}

const FieldEditor: React.FC<FieldEditorProps> = ({ field, onUpdate, onDelete }) => {
  const { t } = useTranslation();
  const [localField, setLocalField] = useState<FormField>(field);

  // Sincronizar con prop field cuando cambie
  useEffect(() => {
    setLocalField(field);
  }, [field]);

  // Actualizar campo cuando cambie el estado local
  const updateField = (updates: Partial<FormField>) => {
    const updatedField = { ...localField, ...updates };
    setLocalField(updatedField);
    onUpdate(updatedField);
  };

  // Agregar opción para select/checkbox
  const addOption = () => {
    const newOptions = [...(localField.options || []), `Opción ${(localField.options?.length || 0) + 1}`];
    updateField({ options: newOptions });
  };

  // Eliminar opción
  const removeOption = (index: number) => {
    const newOptions = localField.options?.filter((_, i) => i !== index) || [];
    updateField({ options: newOptions });
  };

  // Actualizar opción
  const updateOption = (index: number, value: string) => {
    const newOptions = [...(localField.options || [])];
    newOptions[index] = value;
    updateField({ options: newOptions });
  };

  // Obtener icono del tipo de campo
  const getFieldIcon = (type: FieldType) => {
    const iconMap = {
      text: Type,
      textarea: AlignLeft,
      'stars-5': Star,
      'stars-10': Star,
      number: Hash,
      select: ChevronDown,
      checkbox: CheckSquare,
      email: Mail,
      date: Calendar
    };
    const IconComponent = iconMap[type];
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <div className="p-4 bg-bg-secondary border-t border-border-color max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getFieldIcon(localField.type)}
          <h4 className="text-sm font-medium text-text-primary">
            Configurar Campo
          </h4>
        </div>
        <button
          onClick={onDelete}
          className="p-1 text-red-500 hover:text-red-700 transition-colors"
          title="Eliminar campo"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Etiqueta del campo */}
        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Etiqueta del Campo *
          </label>
          <input
            type="text"
            value={localField.label}
            onChange={(e) => updateField({ label: e.target.value })}
            className="w-full px-3 py-2 text-sm bg-bg-primary border border-border-color rounded-md focus:ring-accent focus:border-accent text-text-primary"
            placeholder="Ej: ¿Cómo calificarías el evento?"
          />
        </div>

        {/* Placeholder (para campos de texto) */}
        {['text', 'textarea', 'email'].includes(localField.type) && (
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              Texto de Ayuda (Placeholder)
            </label>
            <input
              type="text"
              value={localField.placeholder || ''}
              onChange={(e) => updateField({ placeholder: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-bg-primary border border-border-color rounded-md focus:ring-accent focus:border-accent text-text-primary"
              placeholder="Texto que aparece cuando el campo está vacío"
            />
          </div>
        )}

        {/* Campo requerido */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`required-${localField.id}`}
            checked={localField.required}
            onChange={(e) => updateField({ required: e.target.checked })}
            className="h-4 w-4 text-accent border-border-color rounded focus:ring-accent"
          />
          <label htmlFor={`required-${localField.id}`} className="text-sm text-text-primary">
            Campo obligatorio
          </label>
        </div>

        {/* Configuraciones específicas por tipo */}
        
        {/* Rangos para campos numéricos */}
        {['number', 'stars-5', 'stars-10'].includes(localField.type) && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Valor Mínimo
                </label>
                <input
                  type="number"
                  value={localField.min || ''}
                  onChange={(e) => updateField({ min: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 text-sm bg-bg-primary border border-border-color rounded-md focus:ring-accent focus:border-accent text-text-primary"
                  placeholder={localField.type === 'stars-5' ? '1' : localField.type === 'stars-10' ? '1' : '0'}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Valor Máximo
                </label>
                <input
                  type="number"
                  value={localField.max || ''}
                  onChange={(e) => updateField({ max: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 text-sm bg-bg-primary border border-border-color rounded-md focus:ring-accent focus:border-accent text-text-primary"
                  placeholder={localField.type === 'stars-5' ? '5' : localField.type === 'stars-10' ? '10' : '100'}
                />
              </div>
            </div>
            
            {/* Información para campos de estrellas */}
            {localField.type.startsWith('stars-') && (
              <div className="text-xs text-text-secondary bg-accent/5 p-2 rounded">
                💡 Los campos de estrellas tienen rangos predefinidos. 
                {localField.type === 'stars-5' ? ' Rango: 1-5 estrellas' : ' Rango: 1-10 estrellas'}
              </div>
            )}
          </div>
        )}

        {/* Opciones para select y checkbox */}
        {['select', 'checkbox'].includes(localField.type) && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-text-secondary">
                Opciones {localField.type === 'select' ? '(Desplegable)' : '(Múltiple selección)'}
              </label>
              <button
                onClick={addOption}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-accent text-button-text rounded hover:brightness-90"
              >
                <Plus className="h-3 w-3" />
                Agregar
              </button>
            </div>
            
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {(localField.options || []).map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    className="flex-1 px-2 py-1 text-sm bg-bg-primary border border-border-color rounded focus:ring-accent focus:border-accent text-text-primary"
                    placeholder={`Opción ${index + 1}`}
                  />
                  <button
                    onClick={() => removeOption(index)}
                    className="p-1 text-red-500 hover:text-red-700"
                    disabled={(localField.options?.length || 0) <= 1}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            
            {(!localField.options || localField.options.length === 0) && (
              <div className="text-xs text-text-secondary bg-yellow-500/10 p-2 rounded">
                ⚠️ Este campo necesita al menos una opción para funcionar correctamente.
              </div>
            )}
          </div>
        )}

        {/* Límites de caracteres para texto */}
        {['text', 'textarea'].includes(localField.type) && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Mín. Caracteres
                </label>
                <input
                  type="number"
                  value={localField.min || ''}
                  onChange={(e) => updateField({ min: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 text-sm bg-bg-primary border border-border-color rounded-md focus:ring-accent focus:border-accent text-text-primary"
                  placeholder="0"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Máx. Caracteres
                </label>
                <input
                  type="number"
                  value={localField.max || ''}
                  onChange={(e) => updateField({ max: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-3 py-2 text-sm bg-bg-primary border border-border-color rounded-md focus:ring-accent focus:border-accent text-text-primary"
                  placeholder={localField.type === 'textarea' ? '1000' : '255'}
                  min="1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Información del tipo de campo */}
        <div className="text-xs text-text-secondary bg-accent/5 p-2 rounded">
          <div className="font-medium mb-1">Tipo: {FIELD_TYPES[localField.type].label}</div>
          <div>{FIELD_TYPES[localField.type].description}</div>
        </div>

        {/* Vista previa del campo */}
        <div className="border-t border-border-color pt-3">
          <label className="block text-xs font-medium text-text-secondary mb-2">
            Vista Previa
          </label>
          <div className="p-3 bg-bg-primary border border-border-color rounded-md">
            <div className="text-sm font-medium text-text-primary mb-1">
              {localField.label}
              {localField.required && <span className="text-red-500 ml-1">*</span>}
            </div>
            
            {/* Renderizar preview según el tipo */}
            {localField.type === 'text' && (
              <input
                type="text"
                placeholder={localField.placeholder}
                disabled
                className="w-full px-3 py-2 text-sm bg-bg-secondary border border-border-color rounded-md text-text-secondary"
              />
            )}
            
            {localField.type === 'textarea' && (
              <textarea
                placeholder={localField.placeholder}
                disabled
                rows={3}
                className="w-full px-3 py-2 text-sm bg-bg-secondary border border-border-color rounded-md text-text-secondary"
              />
            )}
            
            {localField.type === 'email' && (
              <input
                type="email"
                placeholder={localField.placeholder}
                disabled
                className="w-full px-3 py-2 text-sm bg-bg-secondary border border-border-color rounded-md text-text-secondary"
              />
            )}
            
            {localField.type.startsWith('stars-') && (
              <div className="flex items-center gap-1">
                {Array.from({ length: localField.type === 'stars-5' ? 5 : 10 }, (_, i) => (
                  <Star key={i} className="h-5 w-5 text-gray-300" />
                ))}
              </div>
            )}
            
            {localField.type === 'number' && (
              <input
                type="number"
                min={localField.min}
                max={localField.max}
                disabled
                className="w-full px-3 py-2 text-sm bg-bg-secondary border border-border-color rounded-md text-text-secondary"
              />
            )}
            
            {localField.type === 'select' && (
              <select disabled className="w-full px-3 py-2 text-sm bg-bg-secondary border border-border-color rounded-md text-text-secondary">
                <option>Seleccione una opción...</option>
                {(localField.options || []).map((option, index) => (
                  <option key={index}>{option}</option>
                ))}
              </select>
            )}
            
            {localField.type === 'checkbox' && (
              <div className="space-y-2">
                {(localField.options || []).map((option, index) => (
                  <label key={index} className="flex items-center gap-2">
                    <input type="checkbox" disabled className="h-4 w-4" />
                    <span className="text-sm text-text-secondary">{option}</span>
                  </label>
                ))}
              </div>
            )}
            
            {localField.type === 'date' && (
              <input
                type="date"
                disabled
                className="w-full px-3 py-2 text-sm bg-bg-secondary border border-border-color rounded-md text-text-secondary"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldEditor;