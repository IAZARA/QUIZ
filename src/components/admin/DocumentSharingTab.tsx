import React, { useState, useEffect } from 'react';
import { Trash2, DownloadCloud, Loader2, UploadCloud, FileX, Eye, EyeOff } from 'lucide-react'; // Icons, Added FileX, Eye, EyeOff
import { useDocumentSharingStore } from '../../store/documentSharingStore';

const DocumentSharingTab: React.FC = () => {
  const {
    documents,
    isDocumentsActive,
    isLoading, // From store
    error,     // From store
    loadDocuments,
    activateDocumentsView,
    deactivateDocumentsView,
  } = useDocumentSharingStore();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false); // Local state for upload button
  const [actionMessage, setActionMessage] = useState<string | null>(null); // Local state for specific action feedback

  useEffect(() => {
    loadDocuments(); // Load documents on mount
  }, [loadDocuments]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setActionMessage(null); 
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setActionMessage('Por favor, selecciona un archivo primero.');
      return;
    }

    setUploading(true);
    setActionMessage(null);

    const formData = new FormData();
    formData.append('document', selectedFile);

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setActionMessage(`Documento subido exitosamente: ${result.originalName}. La lista se actualizará.`);
        setSelectedFile(null); 
        loadDocuments(); // Refresh document list for admin panel
      } else {
        setActionMessage(result.error || 'Error al subir el documento. Por favor, inténtalo de nuevo.');
        console.error('Upload error:', result.error);
      }
    } catch (err) {
      setActionMessage('Error de red o del servidor al subir el documento.');
      console.error('Network or server error during upload:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este documento?')) {
      setActionMessage(null);
      try {
        const response = await fetch(`/api/documents/${documentId}`, {
          method: 'DELETE',
        });
        const result = await response.json();
        if (response.ok) {
          setActionMessage(result.message || 'Documento eliminado exitosamente. La lista se actualizará.');
          loadDocuments(); // Refresh document list for admin panel
        } else {
          throw new Error(result.error || 'Error al eliminar el documento.');
        }
      } catch (err: any) {
        setActionMessage(`Error al eliminar el documento: ${err.message}`);
        console.error('Error deleting document:', err);
      }
    }
  };
  
  const handleToggleDocumentsVisibility = async () => {
    setActionMessage(null);
    try {
      if (isDocumentsActive) {
        await deactivateDocumentsView();
        setActionMessage('Vista de documentos desactivada para la audiencia.');
      } else {
        await activateDocumentsView();
        setActionMessage('Vista de documentos activada para la audiencia.');
      }
    } catch (err) {
      // Error is set in the store by activate/deactivate functions
      // The store's error will be displayed by the {error && ...} block
      console.error("Error toggling documents visibility", err);
    }
  };

  return (
    <div className="p-6 bg-bg-primary shadow-md rounded-lg text-text-primary">
      <h2 className="text-2xl font-semibold mb-6 text-text-primary border-b border-border-color pb-3">Gestión de Documentos</h2>

      {/* Activation Controls Section */}
      <div className="mb-8 p-4 border border-border-color rounded-lg bg-bg-secondary">
        <h3 className="text-lg font-medium text-text-secondary mb-3">Control de Visibilidad para Audiencia</h3>
        <button 
          onClick={handleToggleDocumentsVisibility} 
          disabled={isLoading} // Using store's isLoading for this button
          className={`w-full inline-flex items-center justify-center px-4 py-2 font-semibold rounded-md transition-colors duration-150 ease-in-out
            ${isDocumentsActive 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-green-600 hover:bg-green-700 text-white'}
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-secondary
            ${isDocumentsActive ? 'focus:ring-red-500' : 'focus:ring-green-500'}
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading 
            ? <Loader2 className="animate-spin h-5 w-5 mr-2" />
            : isDocumentsActive ? <EyeOff className="h-5 w-5 mr-2" /> : <Eye className="h-5 w-5 mr-2" />}
          {isLoading 
            ? (isDocumentsActive ? 'Desactivando...' : 'Activando...') 
            : (isDocumentsActive ? 'Ocultar Documentos de Audiencia' : 'Mostrar Documentos a Audiencia')}
        </button>
        {/* Display general store error if any related to activation/deactivation */}
        {error && actionMessage === null && <p className="text-red-500 text-sm mt-2">Error de la tienda: {error}</p>}
        {/* Display specific action message for activation/deactivation */}
        {actionMessage && (actionMessage.includes('activada') || actionMessage.includes('desactivada')) && (
            <p className={`mt-2 text-sm ${error ? 'text-red-500' : 'text-green-500'}`}>{actionMessage}</p>
        )}
      </div>
      
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

        {actionMessage && !(actionMessage.includes('activada') || actionMessage.includes('desactivada')) && (
          <p className={`mt-3 text-sm ${actionMessage.toLowerCase().startsWith('error') || actionMessage.startsWith('Por favor') ? 'text-red-500' : 'text-green-500'}`}>
            {actionMessage}
          </p>
        )}
      </div>

      {/* Document List Section */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4 text-text-secondary">Documentos Subidos</h3>
        {isLoading && documents.length === 0 ? ( // Use store's isLoading
          <div className="flex items-center justify-center py-4">
            <Loader2 className="animate-spin h-8 w-8 text-accent mr-3" />
            <p className="text-text-secondary">Cargando documentos...</p>
          </div>
        ) : error && documents.length === 0 ? ( // Display store error if loading fails
           <div className="text-center py-10 bg-bg-secondary rounded-lg">
            <FileX className="mx-auto h-12 w-12 text-red-500 opacity-75 mb-4" />
            <h3 className="text-lg font-medium text-red-500 mb-1">Error al Cargar Documentos</h3>
            <p className="text-sm text-red-400 mb-4">{error}</p>
            <button onClick={() => loadDocuments()} className="text-accent hover:underline">Reintentar</button>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-10 bg-bg-secondary rounded-lg">
            <FileX className="mx-auto h-12 w-12 text-text-secondary opacity-75 mb-4" />
            <h3 className="text-lg font-medium text-text-primary mb-1">No Hay Documentos</h3>
            <p className="text-sm text-text-secondary mb-4">Sube documentos para compartirlos con la audiencia.</p>
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
