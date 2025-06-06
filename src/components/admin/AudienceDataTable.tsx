import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Loader2, AlertTriangle, Table, Play, Square, Plus, Settings, Eye } from 'lucide-react';
import { useAudienceDataStore } from '../../store/audienceDataStore';
import { useFormBuilderStore } from '../../store/formBuilderStore';
import FormBuilder from './FormBuilder';

interface AudienceData {
  _id: string;
  name: string;
  email: string;
  comments?: string;
  createdAt: string;
}

const AudienceDataTable: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<AudienceData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showFormBuilder, setShowFormBuilder] = useState<boolean>(false);
  const [currentEventId] = useState<string>('default-event'); // TODO: obtener del contexto
  
  const {
    isAudienceDataActive,
    isLoading: storeLoading,
    activateAudienceData,
    deactivateAudienceData
  } = useAudienceDataStore();

  const {
    forms,
    activeForm,
    fetchForms,
    fetchActiveForm,
    activateForm,
    deactivateForm,
    initializeSocket
  } = useFormBuilderStore();

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/audience-data');
      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.message || 'Failed to fetch audience data.');
      }
      const result: AudienceData[] = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
      console.error('Error fetching audience data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchForms(currentEventId, true);
    fetchActiveForm(currentEventId);
    initializeSocket();
  }, [currentEventId, fetchForms, fetchActiveForm, initializeSocket]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleActivateForm = async () => {
    try {
      await activateAudienceData();
    } catch (error) {
      console.error('Error activating audience data form:', error);
    }
  };

  const handleDeactivateForm = async () => {
    try {
      await deactivateAudienceData();
    } catch (error) {
      console.error('Error deactivating audience data form:', error);
    }
  };

  // Funciones para formularios dinámicos
  const handleActivateDynamicForm = async (formId: string) => {
    try {
      await activateForm(formId);
    } catch (error) {
      console.error('Error activating dynamic form:', error);
    }
  };

  const handleDeactivateDynamicForm = async (formId: string) => {
    try {
      await deactivateForm(formId);
    } catch (error) {
      console.error('Error deactivating dynamic form:', error);
    }
  };

  const handleOpenFormBuilder = () => {
    setShowFormBuilder(true);
  };

  const handleCloseFormBuilder = () => {
    setShowFormBuilder(false);
    // Refrescar formularios después de cerrar el constructor
    fetchForms(currentEventId, true);
    fetchActiveForm(currentEventId);
  };

  const convertToCSV = (dataToConvert: AudienceData[]) => {
    const headers = ['Name', 'Email', 'Comments', 'Submission Date'];
    const rows = dataToConvert.map(item => 
      [
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.email.replace(/"/g, '""')}"`,
        `"${(item.comments || '').replace(/"/g, '""')}"`,
        `"${formatDate(item.createdAt)}"`
      ].join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  };

  const handleExportCSV = () => {
    if (data.length === 0) {
      alert(t('audienceDataTable.noDataToExport') || "No data to export.");
      return;
    }
    const csvData = convertToCSV(data);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { // Feature detection
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'audience_data.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      alert(t('audienceDataTable.browserNotSupported') || "CSV export not fully supported in this browser.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10 text-text-secondary">
        <Loader2 className="animate-spin h-8 w-8 mr-3 text-accent" />
        {t('loading') || 'Loading...'}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-md shadow-md text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">
          {t('connectionErrorTitle') || 'Error'}
        </h3>
        <p className="text-red-600 dark:text-red-500 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          {t('retryButton') || 'Retry'}
        </button>
      </div>
    );
  }

  // Si está abierto el constructor de formularios, mostrarlo
  if (showFormBuilder) {
    return (
      <div className="fixed inset-0 bg-bg-primary z-50">
        <FormBuilder
          eventId={currentEventId}
          onClose={handleCloseFormBuilder}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header mejorado con gradiente */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl shadow-2xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 flex items-center">
                <div className="bg-white/20 p-3 rounded-xl mr-4 backdrop-blur-sm">
                  <Table className="h-8 w-8 text-white" />
                </div>
                Solicitar datos a la audiencia
              </h1>
              <p className="text-blue-100 text-lg">
                Gestiona y visualiza la información recopilada de tu audiencia
              </p>
            </div>
            
            {/* Status indicator mejorado */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3">
              <div className={`w-3 h-3 rounded-full ${isAudienceDataActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-white font-medium">
                {isAudienceDataActive 
                  ? 'Formulario Activo' 
                  : 'Formulario Inactivo'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Panel de control con diseño mejorado */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            Panel de Control
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Botón para crear formulario dinámico */}
            <button
              onClick={handleOpenFormBuilder}
              className="group bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center justify-center mb-2">
                <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
              </div>
              <span className="font-semibold">Crear Formulario</span>
            </button>
            
            <button
              onClick={handleActivateForm}
              disabled={isAudienceDataActive || storeLoading}
              className="group bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-4 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="flex items-center justify-center mb-2">
                <Play className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <span className="font-semibold">Solicitar Datos de la Audiencia</span>
            </button>
            
            <button
              onClick={handleDeactivateForm}
              disabled={!isAudienceDataActive || storeLoading}
              className="group bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl p-4 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="flex items-center justify-center mb-2">
                <Square className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <span className="font-semibold">Desactivar Formulario</span>
            </button>
            
            <button
              onClick={handleExportCSV}
              disabled={data.length === 0}
              className="group bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-4 hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="flex items-center justify-center mb-2">
                <Download className="h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <span className="font-semibold">Exportar a CSV</span>
            </button>
          </div>
          
          {/* Mostrar formulario activo si existe */}
          {activeForm && (
            <div className="mt-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-emerald-100 p-2 rounded-lg mr-3">
                    <Eye className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-emerald-800">Formulario Activo</h3>
                    <p className="text-emerald-600">{activeForm.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeactivateDynamicForm(activeForm._id!)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  Desactivar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Contenido principal con diseño mejorado */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {data.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Table className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Aún no se han enviado datos de audiencia
              </h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Los datos aparecerán aquí una vez que los participantes completen el formulario
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <Table className="h-5 w-5 text-blue-600" />
                  </div>
                  Datos Recopilados ({data.length} registros)
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Comentarios
                      </th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Fecha de Envío
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.map((item, index) => (
                      <tr key={item._id} className={`hover:bg-blue-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center mr-3">
                              <span className="text-blue-600 font-semibold text-sm">
                                {item.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                          <div className="truncate" title={item.comments || '-'}>
                            {item.comments || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatDate(item.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sección de Formularios Dinámicos */}
        {forms.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <Settings className="h-5 w-5 text-purple-600" />
                </div>
                Formularios Dinámicos Creados
              </h3>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {forms.map((form) => (
                  <div
                    key={form._id}
                    className={`group relative bg-gradient-to-br from-white to-gray-50 border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                      form.isActive
                        ? 'border-green-400 shadow-lg shadow-green-100'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    {form.isActive && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold animate-pulse">
                        Activo
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-800 text-lg mb-2 group-hover:text-purple-600 transition-colors">
                        {form.title}
                      </h4>
                      {form.description && (
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {form.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="bg-gray-100 rounded-lg p-3 mb-4">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{form.fields?.length || 0}</span> campos •
                        <span className="ml-2">Creado: {new Date(form.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      {!form.isActive ? (
                        <button
                          onClick={() => handleActivateDynamicForm(form._id!)}
                          className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105"
                        >
                          <Play className="h-4 w-4" />
                          Activar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeactivateDynamicForm(form._id!)}
                          className="flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105"
                        >
                          <Square className="h-4 w-4" />
                          Desactivar
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          // TODO: Implementar vista de respuestas
                          console.log('Ver respuestas de', form._id);
                        }}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                      >
                        <Eye className="h-4 w-4" />
                        Ver Datos
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudienceDataTable;
