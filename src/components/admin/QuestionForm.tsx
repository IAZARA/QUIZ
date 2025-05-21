import React, { useState, useRef, useEffect } from 'react';
import { Upload, HelpCircle, AlertCircle, Check, PlusCircle, Trash2 } from 'lucide-react';
import { uploadImage } from '../../lib/api';

interface Option {
  id: string;
  label: string;
  value: string;
}

interface QuestionFormProps {
  initialQuestion: {
    content: string;
    case: string;
    option_a: string;
    option_b: string;
    option_c: string;
    correct_answer: string;
    explanation: string;
    explanation_image: string;
    [key: string]: string; // Para opciones adicionales
  };
  isEditing: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const QuestionForm: React.FC<QuestionFormProps> = ({ 
  initialQuestion, 
  isEditing, 
  onSubmit, 
  onCancel, 
  onChange 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSection, setActiveSection] = useState<'info' | 'opciones' | 'explicacion'>('info');
  
  // Estado para manejar opciones dinámicas
  const [options, setOptions] = useState<Option[]>([]);
  
  // Inicializar opciones al cargar el componente
  useEffect(() => {
    // Inicializar con las tres opciones por defecto
    const initialOptions = [
      { id: 'option_a', label: 'A', value: initialQuestion.option_a },
      { id: 'option_b', label: 'B', value: initialQuestion.option_b },
      { id: 'option_c', label: 'C', value: initialQuestion.option_c }
    ];
    
    // Buscar opciones adicionales en initialQuestion (si las hay)
    const additionalOptions = Object.keys(initialQuestion)
      .filter(key => key.match(/^option_[d-z]$/))
      .map(key => {
        const letter = key.split('_')[1].toUpperCase();
        return { 
          id: key, 
          label: letter, 
          value: initialQuestion[key] 
        };
      });
    
    setOptions([...initialOptions, ...additionalOptions]);
  }, [initialQuestion]);

  // Funciones para manejar opciones dinámicas
  const handleAddOption = () => {
    if (options.length >= 26) {
      // Limitar a 26 opciones (a-z)
      return;
    }
    
    // Obtener la siguiente letra del alfabeto
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const nextIndex = options.length;
    const nextLetter = letters[nextIndex];
    const optionId = `option_${nextLetter}`;
    
    // Agregar la nueva opción
    const newOption = { id: optionId, label: nextLetter.toUpperCase(), value: '' };
    setOptions([...options, newOption]);
    
    // Actualizar el estado del padre
    onChange({
      target: {
        name: optionId,
        value: ''
      }
    } as React.ChangeEvent<HTMLInputElement>);
  };
  
  const handleRemoveOption = (optionId: string) => {
    // Verificar que queden al menos 2 opciones
    if (options.length <= 2) {
      return;
    }
    
    // Eliminar la opción
    setOptions(options.filter(opt => opt.id !== optionId));
    
    // Actualizar el estado del padre - establecer un valor vacío para esa opción
    onChange({
      target: {
        name: optionId,
        value: ''
      }
    } as React.ChangeEvent<HTMLInputElement>);
    
    // Si la opción eliminada era la correcta, resetear la respuesta correcta
    if (initialQuestion.correct_answer === optionId.split('_')[1]) {
      onChange({
        target: {
          name: 'correct_answer',
          value: ''
        }
      } as React.ChangeEvent<HTMLSelectElement>);
    }
  };
  
  const handleOptionChange = (optionId: string, value: string) => {
    // Actualizar el valor de la opción localmente
    setOptions(options.map(opt => 
      opt.id === optionId ? { ...opt, value } : opt
    ));
    
    // Actualizar el estado del padre
    onChange({
      target: {
        name: optionId,
        value
      }
    } as React.ChangeEvent<HTMLInputElement>);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setIsUploading(true);
    setUploadError('');
    
    try {
      const imageUrl = await uploadImage(file);
      onChange({
        target: {
          name: 'explanation_image',
          value: imageUrl
        }
      } as React.ChangeEvent<HTMLInputElement>);
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      setUploadError('Error al subir la imagen. Inténtalo de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Pestañas de navegación */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveSection('info')}
          className={`flex-1 py-4 px-4 text-center font-medium ${activeSection === 'info' 
            ? 'text-blue-600 border-b-2 border-blue-500' 
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full mr-2 font-bold text-sm">1</span>
          Información
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('opciones')}
          className={`flex-1 py-4 px-4 text-center font-medium ${activeSection === 'opciones' 
            ? 'text-blue-600 border-b-2 border-blue-500' 
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          <span className="inline-flex items-center justify-center w-6 h-6 bg-indigo-100 text-indigo-800 rounded-full mr-2 font-bold text-sm">2</span>
          Opciones
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('explicacion')}
          className={`flex-1 py-4 px-4 text-center font-medium ${activeSection === 'explicacion' 
            ? 'text-blue-600 border-b-2 border-blue-500' 
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-800 rounded-full mr-2 font-bold text-sm">3</span>
          Explicación
        </button>
      </div>

      <form onSubmit={onSubmit} className="p-6">
        {activeSection === 'info' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-100">
              <div className="flex items-start">
                <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
                <p className="text-sm text-blue-700">
                  Completa la información básica de la pregunta.
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <label htmlFor="case" className="block text-sm font-medium text-gray-700 mb-2">
                Caso (opcional)
              </label>
              <textarea
                id="case"
                name="case"
                rows={3}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all text-base"
                placeholder="Describe el caso o contexto para la pregunta..."
                value={initialQuestion.case}
                onChange={onChange}
              />
              <p className="mt-1 text-sm text-gray-500">Proporciona contexto adicional para la pregunta si es necesario.</p>
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Pregunta <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                name="content"
                rows={3}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all text-base"
                placeholder="Escribe la pregunta..."
                value={initialQuestion.content}
                onChange={onChange}
                required
              />
            </div>

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('opciones')}
                className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Siguiente: Opciones
              </button>
            </div>
          </div>
        )}

        {activeSection === 'opciones' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-indigo-50 rounded-lg p-4 mb-6 border border-indigo-100">
              <div className="flex items-start">
                <HelpCircle className="h-5 w-5 text-indigo-500 mt-0.5 mr-2" />
                <p className="text-sm text-indigo-700">
                  Define las opciones de respuesta y selecciona la correcta.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {options.map((option, index) => {
                // Colores para cada opción
                const borderColors = [
                  'border-green-100',
                  'border-blue-100',
                  'border-purple-100',
                  'border-orange-100',
                  'border-pink-100',
                  'border-teal-100'
                ];
                const borderColor = borderColors[index % borderColors.length];
                
                return (
                  <div key={option.id} className={`bg-white p-5 rounded-lg border-2 ${borderColor} shadow-sm hover:shadow-md transition-all relative group`}>
                    <div className="flex justify-between items-center mb-2">
                      <label htmlFor={option.id} className="block text-sm font-semibold text-gray-700">
                        Opción {option.label} <span className="text-red-500">*</span>
                      </label>
                      
                      {/* Botón para eliminar opción (solo si hay más de 2) */}
                      {options.length > 2 && (
                        <button 
                          type="button"
                          onClick={() => handleRemoveOption(option.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Eliminar opción"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    <input
                      type="text"
                      id={option.id}
                      name={option.id}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all"
                      placeholder={`Opción ${option.label}`}
                      value={initialQuestion[option.id] || ''}
                      onChange={onChange}
                      required={index < 2} // Al menos las dos primeras opciones son requeridas
                    />
                  </div>
                );
              })}
              
              {/* Botón para agregar más opciones */}
              <button
                type="button"
                onClick={handleAddOption}
                className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-blue-500 hover:border-blue-300 transition-all"
                disabled={options.length >= 26}
                title={options.length >= 26 ? 'Máximo de opciones alcanzado' : 'Agregar opción'}
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Agregar opción
              </button>
            </div>

            <div className="bg-yellow-50 p-5 rounded-lg border border-yellow-200 mt-6">
              <label htmlFor="correct_answer" className="block text-sm font-semibold text-gray-700 mb-2">
                Respuesta Correcta <span className="text-red-500">*</span>
              </label>
              <select
                id="correct_answer"
                name="correct_answer"
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 py-2.5"
                value={initialQuestion.correct_answer}
                onChange={onChange}
                required
              >
                <option value="">Seleccionar respuesta correcta</option>
                {options.map((option) => (
                  <option key={option.id} value={option.id.split('_')[1]}>
                    Opción {option.label}
                  </option>
                ))}
              </select>
              {!initialQuestion.correct_answer && (
                <p className="mt-2 text-sm text-yellow-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  No olvides seleccionar la respuesta correcta
                </p>
              )}
              {initialQuestion.correct_answer && (
                <p className="mt-2 text-sm text-green-600 flex items-center">
                  <Check className="h-4 w-4 mr-1" />
                  Respuesta correcta seleccionada
                </p>
              )}
            </div>

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={() => setActiveSection('info')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('explicacion')}
                className="inline-flex items-center px-5 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Siguiente: Explicación
              </button>
            </div>
          </div>
        )}

        {activeSection === 'explicacion' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-green-50 rounded-lg p-4 mb-6 border border-green-100">
              <div className="flex items-start">
                <HelpCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                <p className="text-sm text-green-700">
                  Añade una explicación para la respuesta correcta (opcional).
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="explanation" className="block text-sm font-medium text-gray-700 mb-2">
                Explicación de la Respuesta
              </label>
              <textarea
                id="explanation"
                name="explanation"
                rows={4}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all"
                placeholder="Explica por qué esta es la respuesta correcta..."
                value={initialQuestion.explanation}
                onChange={onChange}
              />
            </div>

            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mt-4">
              <label htmlFor="explanation_image" className="block text-sm font-medium text-gray-700 mb-3">
                Imagen para la Explicación (opcional)
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="relative flex-grow w-full">
                  <input
                    type="text"
                    id="explanation_image"
                    name="explanation_image"
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-3 pr-3 py-2"
                    placeholder="URL de la imagen o sube un archivo"
                    value={initialQuestion.explanation_image}
                    onChange={onChange}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-w-[100px] justify-center transition-all"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Subiendo...
                    </span>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Subir
                    </>
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
              {uploadError && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {uploadError}
                </p>
              )}
              {initialQuestion.explanation_image && (
                <div className="mt-4 bg-white p-3 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Vista previa:</p>
                  <img
                    src={initialQuestion.explanation_image}
                    alt="Vista previa"
                    className="h-40 w-auto object-contain rounded-md mx-auto"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between mt-8">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setActiveSection('opciones')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
              <button
                type="submit"
                className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 shadow-sm hover:shadow transition-all"
              >
                {isEditing ? 'Guardar Cambios' : 'Crear Pregunta'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default QuestionForm;
