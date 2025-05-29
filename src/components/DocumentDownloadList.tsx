import React, { useState, useEffect } from 'react';
import { IDocument } from '../types'; // Import from shared types
import { Download, Loader2, AlertTriangle, FileText, FileType, FileSpreadsheet, FileImage, FileArchive, Music, Video, FileCode, FileQuestion } from 'lucide-react';

// Helper function to get file icon based on extension
const getFileIcon = (fileName: string): React.ElementType => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return FileType;
    case 'doc':
    case 'docx':
      return FileText; // Could use a specific Word icon if available or needed
    case 'xls':
    case 'xlsx':
      return FileSpreadsheet;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return FileImage;
    case 'zip':
    case 'rar':
    case 'tar':
    case 'gz':
      return FileArchive;
    case 'mp3':
    case 'wav':
      return Music;
    case 'mp4':
    case 'avi':
    case 'mov':
      return Video;
    case 'js':
    case 'ts':
    case 'html':
    case 'css':
    case 'json':
    case 'py':
      return FileCode;
    default:
      return FileQuestion; // Generic file icon for unknown types
  }
};

const DocumentDownloadList: React.FC = () => {
  const [documents, setDocuments] = useState<IDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/documents');
      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || 'Error al cargar los documentos.');
      }
      const data: IDocument[] = await response.json();
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error desconocido.');
      console.error('Error fetching documents for download list:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <div className="p-4 sm:p-6 bg-bg-primary shadow-lg rounded-xl mt-8 border border-border-color">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-text-primary flex items-center">
        <FileText className="h-6 w-6 mr-3 text-accent" />
        Material de Descarga
      </h2>
      
      {isLoading && (
        <div className="flex items-center justify-center py-6 text-text-secondary">
          <Loader2 className="animate-spin h-6 w-6 mr-3" />
          Cargando documentos...
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
            <div>
              <p className="font-semibold text-red-700 dark:text-red-400">Error</p>
              <p className="text-red-600 dark:text-red-500 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && documents.length === 0 && (
        <p className="text-sm text-gray-500 italic py-4 text-center">
          No hay documentos disponibles por el momento.
        </p>
      )}

      {!isLoading && !error && documents.length > 0 && (
        <ul className="space-y-3">
          {documents.map((doc) => (
            <li 
              key={doc._id} 
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 bg-bg-secondary border border-border-color rounded-lg hover:bg-accent/10 transition-colors duration-150"
            >
            <div className="flex items-center flex-grow mb-2 sm:mb-0 min-w-0">
              {React.createElement(getFileIcon(doc.originalName), { className: "h-5 w-5 mr-3 text-accent flex-shrink-0" })}
              <div className="flex-grow min-w-0">
                <p className="text-text-primary font-medium text-base break-all truncate" title={doc.originalName}>
                  {doc.originalName}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  Subido: {new Date(doc.uploadDate).toLocaleDateString()} | 
                  Tamaño: {(doc.fileSize / 1024).toFixed(2)} KB
                </p>
              </div>
              </div>
              <a 
                href={doc.url} 
                download={doc.originalName}
                target="_blank"
                rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1.5 bg-accent text-button-text text-xs sm:text-sm font-medium rounded-md hover:brightness-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary transition-all"
                aria-label={`Descargar ${doc.originalName}`}
              >
                <Download className="h-4 w-4 mr-1.5" />
                Descargar
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default DocumentDownloadList;
