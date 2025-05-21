import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { UploadCloud, Trash2, ToggleLeft, ToggleRight, AlertCircle, CheckCircle, Loader2, FileText, CalendarDays, Package } from 'lucide-react';

interface SharedFile {
  _id: string;
  originalName: string;
  mimeType: string;
  size: number;
  isActive: boolean;
  uploadedAt: string;
  uniqueFilename: string;
  serverPath: string;
}

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to format date
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const AdminFileSharingTab: React.FC = () => {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const API_BASE_URL = '/api/files'; // Make sure this matches your backend route

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get<SharedFile[]>(`${API_BASE_URL}/`);
      setFiles(response.data);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('No se pudieron cargar los archivos. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setError(null); 
      setSuccessMessage(null); // Clear messages on new file selection
    }
  };
  
  // Auto-dismiss success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000); // Dismiss after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Por favor, selecciona un archivo para subir.');
      return;
    }
    setIsUploading(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccessMessage(`Archivo "${selectedFile.name}" subido exitosamente.`);
      setSelectedFile(null); // Clear selection
      document.getElementById('file-upload-input') && (document.getElementById('file-upload-input') as HTMLInputElement).value = ""; // Clear file input
      fetchFiles(); // Refresh file list
    } catch (err: any) {
      console.error('Error uploading file:', err);
      const errorMsg = err.response?.data?.message || 'Error al subir el archivo. Verifica el tamaño o tipo de archivo.';
      setError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleActive = async (fileId: string) => {
    setError(null);
    setSuccessMessage(null);
    try {
      await axios.put(`${API_BASE_URL}/${fileId}/toggle`);
      setSuccessMessage('Estado del archivo actualizado.');
      fetchFiles(); // Refresh file list
    } catch (err) {
      console.error('Error toggling file status:', err);
      setError('No se pudo actualizar el estado del archivo.');
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    setError(null);
    setSuccessMessage(null);
    if (window.confirm(`¿Estás seguro de que quieres eliminar el archivo "${fileName}"? Esta acción no se puede deshacer.`)) {
      try {
        await axios.delete(`${API_BASE_URL}/${fileId}`);
        setSuccessMessage(`Archivo "${fileName}" eliminado.`);
        fetchFiles(); // Refresh file list
      } catch (err) {
        console.error('Error deleting file:', err);
        setError('No se pudo eliminar el archivo.');
      }
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Administrar Archivos Compartidos</h2>

      {/* File Upload Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-medium text-gray-700 mb-4">Subir Nuevo Archivo</h3>
        <div className="flex items-center space-x-4">
          <input
            id="file-upload-input"
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-blue-50 file:text-blue-700
                       hover:file:bg-blue-100"
          />
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 flex items-center"
          >
            {isUploading ? (
              <Loader2 className="animate-spin h-4 w-4 mr-1.5" />
            ) : (
              <UploadCloud className="h-4 w-4 mr-1.5" />
            )}
            {isUploading ? 'Subiendo...' : 'Subir Archivo'}
          </button>
        </div>
        {selectedFile && <p className="text-sm text-gray-600 mt-3">Archivo seleccionado: {selectedFile.name} ({formatFileSize(selectedFile.size)})</p>}
      </div>

      {/* Messages - Using a consistent style for messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 mb-6 rounded-md flex items-center text-sm shadow-sm" role="alert">
          <AlertCircle className="h-5 w-5 mr-2.5 flex-shrink-0" />
          <p className="flex-grow">{error}</p>
          <button onClick={() => setError(null)} className="ml-2 p-1 text-red-700 hover:text-red-900">✕</button>
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-3.5 mb-6 rounded-md flex items-center text-sm shadow-sm" role="alert">
          <CheckCircle className="h-5 w-5 mr-2.5 flex-shrink-0" />
          <p className="flex-grow">{successMessage}</p>
           <button onClick={() => setSuccessMessage(null)} className="ml-2 p-1 text-green-700 hover:text-green-900">✕</button>
        </div>
      )}

      {/* File List Section */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-medium text-gray-700 mb-4">Archivos Subidos</h3>
        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            <p className="ml-3 text-gray-600">Cargando archivos...</p>
          </div>
        )}
        {!isLoading && files.length === 0 && (
          <p className="text-gray-500 text-center py-4">No hay archivos subidos todavía.</p>
        )}
        {!isLoading && files.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subido</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tamaño</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.map((file) => (
                  <tr key={file._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 truncate" title={file.originalName}>{file.originalName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarDays className="h-4 w-4 mr-1.5 text-gray-400"/>
                        {formatDate(file.uploadedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Package className="h-4 w-4 mr-1.5 text-gray-400"/>
                        {formatFileSize(file.size)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        file.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {file.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleToggleActive(file._id)}
                        title={file.isActive ? 'Desactivar' : 'Activar'}
                        className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${file.isActive ? 'text-yellow-500 hover:text-yellow-600' : 'text-green-500 hover:text-green-600'}`}
                      >
                        {file.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file._id, file.originalName)}
                        title="Eliminar Archivo"
                        className="p-2 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFileSharingTab;
