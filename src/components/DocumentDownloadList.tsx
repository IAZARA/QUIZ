import React, { useState, useEffect } from 'react';
import { IDocument } from '../types'; // Import from shared types
import { Download, Loader2, AlertTriangle, FileText } from 'lucide-react';

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
    <div className="p-4 sm:p-6 bg-white shadow-lg rounded-xl mt-8">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-800 flex items-center">
        <FileText className="h-6 w-6 mr-3 text-blue-600" />
        Material de Descarga
      </h2>
      
      {isLoading && (
        <div className="flex items-center justify-center py-6 text-gray-600">
          <Loader2 className="animate-spin h-6 w-6 mr-3" />
          Cargando documentos...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
            <div>
              <p className="font-semibold text-red-700">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
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
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors duration-150"
            >
              <div className="flex-grow mb-2 sm:mb-0">
                <p className="text-gray-800 font-medium text-base break-all">
                  {doc.originalName}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Subido: {new Date(doc.uploadDate).toLocaleDateString()} | 
                  Tamaño: {(doc.fileSize / 1024).toFixed(2)} KB
                </p>
              </div>
              <a 
                href={doc.url} 
                download={doc.originalName}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
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
