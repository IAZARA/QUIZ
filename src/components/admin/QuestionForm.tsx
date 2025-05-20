import React, { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { uploadImage } from '../../lib/api';

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
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="case" className="block text-sm font-medium text-gray-700">
          Caso (opcional)
        </label>
        <textarea
          id="case"
          name="case"
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Describe el caso o contexto para la pregunta..."
          value={initialQuestion.case}
          onChange={onChange}
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
          Pregunta
        </label>
        <textarea
          id="content"
          name="content"
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Escribe la pregunta..."
          value={initialQuestion.content}
          onChange={onChange}
          required
        />
      </div>

      <div>
        <label htmlFor="option_a" className="block text-sm font-medium text-gray-700">
          Opción A
        </label>
        <input
          type="text"
          id="option_a"
          name="option_a"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Opción A"
          value={initialQuestion.option_a}
          onChange={onChange}
          required
        />
      </div>

      <div>
        <label htmlFor="option_b" className="block text-sm font-medium text-gray-700">
          Opción B
        </label>
        <input
          type="text"
          id="option_b"
          name="option_b"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Opción B"
          value={initialQuestion.option_b}
          onChange={onChange}
          required
        />
      </div>

      <div>
        <label htmlFor="option_c" className="block text-sm font-medium text-gray-700">
          Opción C
        </label>
        <input
          type="text"
          id="option_c"
          name="option_c"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Opción C"
          value={initialQuestion.option_c}
          onChange={onChange}
          required
        />
      </div>

      <div>
        <label htmlFor="correct_answer" className="block text-sm font-medium text-gray-700">
          Respuesta Correcta
        </label>
        <select
          id="correct_answer"
          name="correct_answer"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          value={initialQuestion.correct_answer}
          onChange={onChange}
          required
        >
          <option value="">Seleccionar respuesta correcta</option>
          <option value="a">Opción A</option>
          <option value="b">Opción B</option>
          <option value="c">Opción C</option>
        </select>
      </div>

      <div>
        <label htmlFor="explanation" className="block text-sm font-medium text-gray-700">
          Explicación de la Respuesta
        </label>
        <textarea
          id="explanation"
          name="explanation"
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Explica por qué esta es la respuesta correcta..."
          value={initialQuestion.explanation}
          onChange={onChange}
        />
      </div>

      <div>
        <label htmlFor="explanation_image" className="block text-sm font-medium text-gray-700">
          Imagen para la Explicación (opcional)
        </label>
        <div className="mt-1 flex items-center">
          <input
            type="text"
            id="explanation_image"
            name="explanation_image"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="URL de la imagen o sube un archivo"
            value={initialQuestion.explanation_image}
            onChange={onChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="ml-2 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
          <p className="mt-2 text-sm text-red-600">{uploadError}</p>
        )}
        {initialQuestion.explanation_image && (
          <div className="mt-2">
            <img
              src={initialQuestion.explanation_image}
              alt="Vista previa"
              className="h-32 w-auto object-cover rounded-md"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {isEditing ? 'Guardar Cambios' : 'Crear Pregunta'}
        </button>
      </div>
    </form>
  );
};

export default QuestionForm;
