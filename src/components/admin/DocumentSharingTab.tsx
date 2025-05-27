import React, { useState, useEffect } from 'react';
import { Trash2, DownloadCloud, Loader2, UploadCloud, FileX } from 'lucide-react'; // Icons, Added FileX
import { IDocument } from '../../types'; // Import from shared types

const DocumentSharingTab: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(false);

  const fetchDocuments = async () => {
    setIsLoadingList(true);
    setMessage(null);
    try {
      const response = await fetch('/api/documents');
      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || 'Error al cargar los documentos.');
      }
      const data: IDocument[] = await response.json();
      setDocuments(data);
    } catch (error: any) {
      setMessage(`Error al cargar la lista de documentos: ${error.message}`);
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setMessage(null); 
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Por favor, selecciona un archivo primero.');
      return;
    }

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('document', selectedFile);

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`Documento subido exitosamente: ${result.originalName}`);
        setSelectedFile(null); 
        fetchDocuments(); // Refresh document list
      } else {
        setMessage(result.error || 'Error al subir el documento. Por favor, inténtalo de nuevo.');
        console.error('Upload error:', result.error);
      }
    } catch (error) {
      setMessage('Error de red o del servidor al subir el documento.');
      console.error('Network or server error during upload:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este documento?')) {
      setMessage(null);
      try {
        const response = await fetch(`/api/documents/${documentId}`, {
          method: 'DELETE',
        });
        const result = await response.json();
        if (response.ok) {
          setMessage(result.message || 'Documento eliminado exitosamente.');
          fetchDocuments(); // Refresh document list
        } else {
          throw new Error(result.error || 'Error al eliminar el documento.');
        }
      } catch (error: any) {
        setMessage(`Error al eliminar el documento: ${error.message}`);
        console.error('Error deleting document:', error);
      }
    }
  };

  return (
    <div className="p-6 bg-bg-primary shadow-md rounded-lg text-text-primary">
      <h2 className="text-2xl font-semibold mb-6 text-text-primary border-b border-border-color pb-3">Gestión de Documentos</h2>
      
      {/* Upload Section */}
      <div className="mb-8 p-4 border border-border-color rounded-lg bg-bg-secondary">
        <h3 className="text-lg font-medium text-text-secondary mb-3">Subir Nuevo Documento</h3>
        <div className="mb-4">
          <label htmlFor="documentUpload" className="block text-sm font-medium text-text-secondary mb-1">
            Seleccionar Documento (PDF, Word, PowerPoint)
          </label>
          <input 
            id="documentUpload"
            type="file" 
            onChange={handleFileChange} 
            accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            className="block w-full text-sm text-text-secondary
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border file:border-border-color
                       file:text-sm file:font-medium
                       file:bg-bg-tertiary file:text-text-primary
                       hover:file:brightness-95 cursor-pointer"
          />
          {selectedFile && (
            <p className="mt-1 text-xs text-text-secondary">
              Archivo seleccionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        <button 
          onClick={handleUpload} 
          disabled={!selectedFile || uploading} 
          className="inline-flex items-center px-4 py-2 bg-accent text-button-text rounded-md hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-bg-secondary disabled:bg-bg-disabled disabled:text-text-disabled disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
              Subiendo...
            </>
          ) : (
            <>
              <UploadCloud className="-ml-1 mr-2 h-5 w-5" />
              Subir Documento
            </>
          )}
        </button>

        {message && (
          <p className={`mt-3 text-sm ${message.toLowerCase().startsWith('error') || message.startsWith('Por favor') ? 'text-red-800' : 'text-green-800'}`}>
            {message}
          </p>
        )}
      </div>

      {/* Document List Section */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4 text-text-secondary">Documentos Subidos</h3>
        {isLoadingList ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="animate-spin h-8 w-8 text-accent mr-3" />
            <p className="text-text-secondary">Cargando documentos...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-10 bg-bg-secondary rounded-lg">
            <FileX className="mx-auto h-12 w-12 text-text-secondary opacity-75 mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-1">No Hay Documentos</h3>
            <p className="text-sm text-text-secondary mb-4">Sube documentos para compartirlos con la audiencia.</p>
            {/* Optional button removed as per instruction for now */}
          </div>
        ) : (
          <ul className="space-y-3">
            {documents.map((doc) => (
              <li 
                key={doc._id} 
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-bg-secondary border border-border-color rounded-lg shadow-sm hover:shadow-md transition-shadow duration-150"
              >
                <div className="flex-grow mb-2 sm:mb-0">
                  <a 
                    href={doc.url} 
                    download={doc.originalName} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:brightness-125 hover:underline font-medium text-base break-all"
                  >
                    {doc.originalName}
                  </a>
                  <p className="text-xs text-text-secondary mt-1">
                    Subido: {new Date(doc.uploadDate).toLocaleDateString()} {new Date(doc.uploadDate).toLocaleTimeString()} | 
                    Tamaño: {(doc.fileSize / 1024).toFixed(2)} KB |
                    Tipo: {doc.fileType}
                  </p>
                </div>
                <button 
                  onClick={() => handleDelete(doc._id)} 
                  className="inline-flex items-center px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-bg-secondary transition-colors"
                  aria-label={`Eliminar ${doc.originalName}`}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DocumentSharingTab;
