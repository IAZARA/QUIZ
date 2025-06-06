import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Save, 
  Eye, 
  EyeOff, 
  Settings, 
  Trash2, 
  Play, 
  Square,
  Copy,
  Download
} from 'lucide-react';
import { useFormBuilderStore } from '../../store/formBuilderStore';
import { DynamicForm, FormField, FIELD_TYPES, FieldType } from '../../types/formTypes';
import FieldEditor from './FieldEditor';
import FormPreview from './FormPreview';

interface FormBuilderProps {
  eventId: string;
  onClose?: () => void;
}

const FormBuilder: React.FC<FormBuilderProps> = ({ eventId, onClose }) => {
  const { t } = useTranslation();
  const {
    currentForm,
    isPreviewMode,
    isLoading,
    error,
    setCurrentForm,
    setPreviewMode,
    createForm,
    updateForm,
    clearError
  } = useFormBuilderStore();

  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [draggedFieldType, setDraggedFieldType] = useState<FieldType | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // Inicializar formulario
  useEffect(() => {
    if (!currentForm.eventId) {
      setCurrentForm({
        title: '',
        description: '',
        fields: [],
        eventId,
        isActive: false,
        createdBy: 'admin' // TODO: obtener del contexto de autenticación
      });
    }
  }, [eventId, currentForm.eventId, setCurrentForm]);

  // Sincronizar estado local con store
  useEffect(() => {
    setFormTitle(currentForm.title || '');
    setFormDescription(currentForm.description || '');
  }, [currentForm]);

  // Agregar nuevo campo
  const addField = (fieldType: FieldType) => {
    const newField: FormField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: fieldType,
      label: FIELD_TYPES[fieldType].label,
      required: false,
      order: (currentForm.fields?.length || 0) + 1,
      ...FIELD_TYPES[fieldType].defaultConfig
    };

    setCurrentForm({
      ...currentForm,
      fields: [...(currentForm.fields || []), newField]
    });

    setSelectedField(newField);
  };

  // Actualizar campo
  const updateField = (updatedField: FormField) => {
    const updatedFields = (currentForm.fields || []).map(field =>
      field.id === updatedField.id ? updatedField : field
    );

    setCurrentForm({
      ...currentForm,
      fields: updatedFields
    });

    setSelectedField(updatedField);
  };

  // Eliminar campo
  const deleteField = (fieldId: string) => {
    const updatedFields = (currentForm.fields || []).filter(field => field.id !== fieldId);
    
    setCurrentForm({
      ...currentForm,
      fields: updatedFields
    });

    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  };

  // Reordenar campos
  const reorderFields = (fromIndex: number, toIndex: number) => {
    const fields = [...(currentForm.fields || [])];
    const [movedField] = fields.splice(fromIndex, 1);
    fields.splice(toIndex, 0, movedField);

    // Actualizar orden
    const reorderedFields = fields.map((field, index) => ({
      ...field,
      order: index + 1
    }));

    setCurrentForm({
      ...currentForm,
      fields: reorderedFields
    });
  };

  // Guardar formulario
  const handleSave = async () => {
    if (!formTitle.trim()) {
      alert('El título del formulario es obligatorio');
      return;
    }

    if (!currentForm.fields || currentForm.fields.length === 0) {
      alert('El formulario debe tener al menos un campo');
      return;
    }

    const formData = {
      ...currentForm,
      title: formTitle,
      description: formDescription,
      eventId
    };

    try {
      if (currentForm._id) {
        await updateForm(currentForm._id, formData);
      } else {
        await createForm(formData as Omit<DynamicForm, '_id' | 'createdAt' | 'updatedAt'>);
      }
      
      if (onClose) onClose();
    } catch (error) {
      console.error('Error saving form:', error);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (fieldType: FieldType) => {
    setDraggedFieldType(fieldType);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedFieldType) {
      addField(draggedFieldType);
      setDraggedFieldType(null);
    }
  };

  return (
    <div className="flex h-full bg-bg-primary">
      {/* Panel de herramientas */}
      <div className="w-80 bg-bg-secondary border-r border-border-color flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border-color">
          <h2 className="text-lg font-semibold text-text-primary mb-2">
            Constructor de Formularios
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setPreviewMode(!isPreviewMode)}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-accent text-button-text rounded-md hover:brightness-90"
            >
              {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {isPreviewMode ? 'Editar' : 'Vista Previa'}
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Guardar
            </button>
          </div>
        </div>

        {/* Configuración del formulario */}
        {!isPreviewMode && (
          <div className="p-4 border-b border-border-color">
            <h3 className="text-sm font-medium text-text-primary mb-3">Configuración</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Título del Formulario *
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-bg-primary border border-border-color rounded-md focus:ring-accent focus:border-accent text-text-primary"
                  placeholder="Ej: Evaluación del Evento"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-bg-primary border border-border-color rounded-md focus:ring-accent focus:border-accent text-text-primary"
                  placeholder="Descripción del formulario..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Tipos de campos */}
        {!isPreviewMode && (
          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-sm font-medium text-text-primary mb-3">Tipos de Campos</h3>
            <div className="space-y-2">
              {Object.entries(FIELD_TYPES).map(([type, config]) => (
                <div
                  key={type}
                  draggable
                  onDragStart={() => handleDragStart(type as FieldType)}
                  onClick={() => addField(type as FieldType)}
                  className="p-3 bg-bg-primary border border-border-color rounded-md cursor-pointer hover:border-accent transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-accent/10 rounded-md flex items-center justify-center">
                      <span className="text-accent text-sm">📝</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        {config.label}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {config.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Editor de campo seleccionado */}
        {!isPreviewMode && selectedField && (
          <div className="border-t border-border-color">
            <FieldEditor
              field={selectedField}
              onUpdate={updateField}
              onDelete={() => deleteField(selectedField.id)}
            />
          </div>
        )}
      </div>

      {/* Área principal */}
      <div className="flex-1 flex flex-col">
        {/* Header del área principal */}
        <div className="p-4 border-b border-border-color bg-bg-secondary">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                {isPreviewMode ? 'Vista Previa' : 'Constructor'}
              </h3>
              <p className="text-sm text-text-secondary">
                {isPreviewMode 
                  ? 'Así verá el formulario la audiencia'
                  : 'Arrastra campos aquí o haz clic en los tipos de campo'
                }
              </p>
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 px-3 py-2 rounded-md text-sm">
                {error}
                <button
                  onClick={clearError}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 p-6 overflow-y-auto">
          {isPreviewMode ? (
            <FormPreview
              form={{
                ...currentForm,
                title: formTitle,
                description: formDescription
              } as DynamicForm}
            />
          ) : (
            <div
              className="min-h-full border-2 border-dashed border-border-color rounded-lg p-6"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {currentForm.fields && currentForm.fields.length > 0 ? (
                <div className="space-y-4">
                  {currentForm.fields
                    .sort((a, b) => a.order - b.order)
                    .map((field, index) => (
                      <div
                        key={field.id}
                        onClick={() => setSelectedField(field)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedField?.id === field.id
                            ? 'border-accent bg-accent/5'
                            : 'border-border-color hover:border-accent/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">
                              {FIELD_TYPES[field.type].label}
                            </span>
                            {field.required && (
                              <span className="text-xs bg-red-500/10 text-red-600 px-2 py-1 rounded">
                                Obligatorio
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (index > 0) {
                                  reorderFields(index, index - 1);
                                }
                              }}
                              disabled={index === 0}
                              className="p-1 text-text-secondary hover:text-text-primary disabled:opacity-50"
                            >
                              ↑
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (index < (currentForm.fields?.length || 0) - 1) {
                                  reorderFields(index, index + 1);
                                }
                              }}
                              disabled={index === (currentForm.fields?.length || 0) - 1}
                              className="p-1 text-text-secondary hover:text-text-primary disabled:opacity-50"
                            >
                              ↓
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteField(field.id);
                              }}
                              className="p-1 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-text-primary">
                          {field.label}
                        </div>
                        {field.placeholder && (
                          <div className="text-xs text-text-secondary mt-1">
                            Placeholder: {field.placeholder}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-lg font-medium text-text-primary mb-2">
                    Formulario Vacío
                  </h3>
                  <p className="text-text-secondary mb-4">
                    Arrastra tipos de campo aquí o haz clic en ellos para comenzar
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;