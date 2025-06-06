import React, { useRef, useState } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import { IconOption } from '../../store/iconStore';

interface IconUploaderProps {
  onUpload: (icon: IconOption) => void;
}

const IconUploader: React.FC<IconUploaderProps> = ({ onUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      // Validar tipo de archivo
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de archivo no válido. Solo se permiten PNG, JPG y SVG.');
      }

      // Validar tamaño (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('El archivo es demasiado grande. Máximo 2MB.');
      }

      // Crear FormData para enviar al servidor
      const formData = new FormData();
      formData.append('icon', file);

      // Enviar al servidor
      const response = await fetch('/api/icons/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir el archivo al servidor.');
      }

      const result = await response.json();

      // Crear el objeto IconOption
      const newIcon: IconOption = {
        id: `custom-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''), // Remover extensión
        path: result.path,
        type: 'custom',
        preview: result.path
      };

      onUpload(newIcon);

      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al subir el archivo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
      handleFileSelect({ target: { files: dataTransfer.files } } as any);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="mb-6">
      <h4 className="text-md font-medium text-text-primary mb-4">Subir Icono Personalizado</h4>
      
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
          ${isUploading 
            ? 'border-accent bg-accent/5' 
            : 'border-border hover:border-accent/50 hover:bg-bg-tertiary/50'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/svg+xml"
          onChange={handleFileSelect}
          className="hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full"></div>
            <p className="text-sm text-text-secondary">Subiendo icono...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <Upload className="w-8 h-8 text-text-muted" />
            <div>
              <p className="text-sm text-text-primary font-medium">
                Arrastra un archivo aquí o{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-accent hover:text-accent-blue-light underline"
                >
                  selecciona uno
                </button>
              </p>
              <p className="text-xs text-text-muted mt-1">
                PNG, JPG o SVG (máximo 2MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-error-light border border-error rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
          <p className="text-sm text-error">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-error hover:text-error/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default IconUploader;