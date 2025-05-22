import React, { useState, useEffect } from 'react';
import { Trash2, DownloadCloud, Loader2, UploadCloud } from 'lucide-react'; // Icons
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
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 border-b pb-3">Gestión de Documentos</h2>
      
      {/* Upload Section */}
      <div className="mb-8 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-medium text-gray-700 mb-3">Subir Nuevo Documento</h3>
        <div className="mb-4">
          <label htmlFor="documentUpload" className="block text-sm font-medium text-gray-700 mb-1">
            Seleccionar Documento (PDF, Word, PowerPoint)
          </label>
          <input 
            id="documentUpload"
            type="file" 
            onChange={handleFileChange} 
            accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            className="block w-full text-sm text-gray-600
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border file:border-gray-300
                       file:text-sm file:font-medium
                       file:bg-gray-100 file:text-gray-700
                       hover:file:bg-gray-200 cursor-pointer"
          />
          {selectedFile && (
            <p className="mt-1 text-xs text-gray-500">
              Archivo seleccionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        <button 
          onClick={handleUpload} 
          disabled={!selectedFile || uploading} 
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
          <p className={`mt-3 text-sm ${message.toLowerCase().startsWith('error') || message.startsWith('Por favor') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}
      </div>

      {/* Document List Section */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">Documentos Subidos</h3>
        {isLoadingList ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600 mr-3" />
            <p className="text-gray-600">Cargando documentos...</p>
          </div>
        ) : documents.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No hay documentos subidos todavía.</p>
        ) : (
          <ul className="space-y-3">
            {documents.map((doc) => (
              <li 
                key={doc._id} 
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-150"
              >
                <div className="flex-grow mb-2 sm:mb-0">
                  <a 
                    href={doc.url} 
                    download={doc.originalName} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-base break-all"
                  >
                    {doc.originalName}
                  </a>
                  <p className="text-xs text-gray-500 mt-1">
                    Subido: {new Date(doc.uploadDate).toLocaleDateString()} {new Date(doc.uploadDate).toLocaleTimeString()} | 
                    Tamaño: {(doc.fileSize / 1024).toFixed(2)} KB |
                    Tipo: {doc.fileType}
                  </p>
                </div>
                <button 
                  onClick={() => handleDelete(doc._id)} 
                  className="inline-flex items-center px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors"
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
