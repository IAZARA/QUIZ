import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { DownloadCloud, FileText, AlertTriangle, Loader2, Archive } from 'lucide-react';
import { Socket } from 'socket.io-client'; // Import Socket type

interface SharedFilesDisplayProps {
  socket?: Socket | null; // Socket can be null or undefined initially
}

interface ActiveSharedFile {
  _id: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string; // Keep for potential future use like sorting, though not displayed initially
}

// Helper function to format file size (can be moved to a utils file if shared)
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const SharedFilesDisplay: React.FC<SharedFilesDisplayProps> = ({ socket }) => {
  const [activeFiles, setActiveFiles] = useState<ActiveSharedFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = '/api/files';

  const fetchActiveFiles = useCallback(async () => {
    // console.log('SharedFilesDisplay: Fetching active files...'); // Debug log
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get<ActiveSharedFile[]>(`${API_BASE_URL}/active_for_audience`);
      setActiveFiles(response.data);
      // console.log('SharedFilesDisplay: Active files fetched:', response.data.length); // Debug log
    } catch (err) {
      console.error('Error fetching active files:', err);
      setError('No se pudieron cargar los archivos compartidos. Intenta recargar la página.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveFiles(); // Initial fetch

    if (socket) {
      // console.log('SharedFilesDisplay: Socket available, setting up listener.'); // Debug log
      const handleSharedFilesUpdate = () => {
        // console.log('SharedFilesDisplay: Received shared_files_updated event. Refetching.'); // Debug log
        fetchActiveFiles();
      };
      
      socket.on('shared_files_updated', handleSharedFilesUpdate);

      return () => {
        // console.log('SharedFilesDisplay: Cleaning up socket listener.'); // Debug log
        socket.off('shared_files_updated', handleSharedFilesUpdate);
      };
    } else {
      // console.log('SharedFilesDisplay: Socket not available on mount/update.'); // Debug log
    }
  }, [fetchActiveFiles, socket]);

  if (isLoading) {
    return (
      <div className="mt-8 p-4 bg-white shadow-md rounded-lg flex items-center justify-center text-gray-500">
        <Loader2 className="h-6 w-6 animate-spin mr-3" />
        <span>Cargando archivos compartidos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 p-6 bg-red-50 shadow-md rounded-lg flex flex-col items-center justify-center text-red-700">
        <AlertTriangle className="h-10 w-10 mb-3" />
        <p className="text-lg font-semibold">Error al cargar archivos</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={fetchActiveFiles}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (activeFiles.length === 0) {
    return (
      <div className="mt-8 p-6 bg-white shadow-md rounded-lg flex flex-col items-center justify-center text-gray-500">
        <Archive className="h-12 w-12 mb-3 text-gray-400" />
        <p className="text-lg font-semibold">No hay archivos compartidos</p>
        <p className="text-sm">No hay archivos disponibles para descargar en este momento.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 p-4 sm:p-6 bg-white shadow-lg rounded-xl border border-gray-200">
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6 flex items-center">
        <DownloadCloud className="h-6 w-6 mr-3 text-blue-600" />
        Archivos Compartidos
      </h2>
      <ul className="space-y-3 sm:space-y-4">
        {activeFiles.map((file) => (
          <li
            key={file._id}
            className="p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors duration-150 flex flex-col sm:flex-row items-start sm:items-center justify-between border border-gray-200"
          >
            <div className="flex items-center mb-2 sm:mb-0">
              <FileText className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0" />
              <div>
                <span className="text-sm sm:text-md font-medium text-gray-700 break-all">{file.originalName}</span>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)} - {file.mimeType}</p>
              </div>
            </div>
            <a
              href={`${API_BASE_URL}/download/${file._id}`}
              download={file.originalName} // Suggests the original filename to the browser
              className="mt-2 sm:mt-0 sm:ml-4 inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent text-xs sm:text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform hover:scale-105"
            >
              <DownloadCloud className="h-4 w-4 mr-2" />
              Descargar
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SharedFilesDisplay;
