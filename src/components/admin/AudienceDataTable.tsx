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
    <div className="p-4 sm:p-6 bg-bg-primary shadow-lg rounded-xl border border-border-color">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-text-primary mb-4 sm:mb-0 flex items-center">
          <Table className="h-6 w-6 mr-3 text-accent" />
          {t('audienceDataTable.title') || 'Audience Submitted Data'}
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Status indicator */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium">
            <div className={`w-2 h-2 rounded-full ${isAudienceDataActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className="text-text-secondary">
              {isAudienceDataActive 
                ? (t('audienceDataTable.formActive') || 'Formulario Activo') 
                : (t('audienceDataTable.formInactive') || 'Formulario Inactivo')
              }
            </span>
          </div>
          {/* Control buttons for activating/deactivating the form */}
          <div className="flex gap-2">
            {/* Botón para crear formulario dinámico */}
            <button
              onClick={handleOpenFormBuilder}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-bg-primary transition-all flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Formulario
            </button>
            
            {/* Mostrar formulario activo si existe */}
            {activeForm && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-secondary">
                  Activo: {activeForm.title}
                </span>
                <button
                  onClick={() => handleDeactivateDynamicForm(activeForm._id!)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  <Square className="h-3 w-3" />
                </button>
              </div>
            )}
            
            <button
              onClick={handleActivateForm}
              disabled={isAudienceDataActive || storeLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-bg-primary transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-4 w-4 mr-2" />
              {t('audienceDataTable.activateForm') || 'Solicitar Datos de la Audiencia'}
            </button>
            <button
              onClick={handleDeactivateForm}
              disabled={!isAudienceDataActive || storeLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-bg-primary transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Square className="h-4 w-4 mr-2" />
              {t('audienceDataTable.deactivateForm') || 'Desactivar Formulario'}
            </button>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={data.length === 0}
            className="px-4 py-2 bg-accent text-button-text rounded-md hover:brightness-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-5 w-5 mr-2" />
            {t('audienceDataTable.exportButton') || 'Export to CSV'}
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="text-text-secondary italic text-center py-8">
          {t('audienceDataTable.noData') || 'No audience data submitted yet.'}
        </p>
      ) : (
        <div className="overflow-x-auto shadow-md rounded-lg border border-border-color">
          <table className="min-w-full divide-y divide-border-color bg-bg-secondary">
            <thead className="bg-bg-primary">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  {t('audienceDataTable.nameHeader') || 'Name'}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  {t('audienceDataTable.emailHeader') || 'Email'}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  {t('audienceDataTable.commentsHeader') || 'Comments'}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                  {t('audienceDataTable.dateHeader') || 'Submission Date'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {data.map((item) => (
                <tr key={item._id} className="hover:bg-accent/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-text-primary">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{item.email}</td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-text-secondary break-words max-w-xs">
                    {item.comments || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{formatDate(item.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

     {/* Sección de Formularios Dinámicos */}
     {forms.length > 0 && (
       <div className="mt-8 border-t border-border-color pt-6">
         <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center">
           <Settings className="h-5 w-5 mr-2 text-accent" />
           Formularios Dinámicos Creados
         </h3>
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
           {forms.map((form) => (
             <div
               key={form._id}
               className={`p-4 border rounded-lg transition-colors ${
                 form.isActive
                   ? 'border-green-500 bg-green-500/5'
                   : 'border-border-color hover:border-accent/50'
               }`}
             >
               <div className="flex items-start justify-between mb-2">
                 <h4 className="font-medium text-text-primary truncate">
                   {form.title}
                 </h4>
                 <div className="flex items-center gap-1 ml-2">
                   {form.isActive && (
                     <span className="px-2 py-1 text-xs bg-green-500 text-white rounded">
                       Activo
                     </span>
                   )}
                 </div>
               </div>
               
               {form.description && (
                 <p className="text-sm text-text-secondary mb-3 line-clamp-2">
                   {form.description}
                 </p>
               )}
               
               <div className="text-xs text-text-secondary mb-3">
                 {form.fields?.length || 0} campos •
                 Creado: {new Date(form.createdAt).toLocaleDateString()}
               </div>
               
               <div className="flex items-center gap-2">
                 {!form.isActive ? (
                   <button
                     onClick={() => handleActivateDynamicForm(form._id!)}
                     className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                   >
                     <Play className="h-3 w-3" />
                     Activar
                   </button>
                 ) : (
                   <button
                     onClick={() => handleDeactivateDynamicForm(form._id!)}
                     className="flex items-center gap-1 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                   >
                     <Square className="h-3 w-3" />
                     Desactivar
                   </button>
                 )}
                 
                 <button
                   onClick={() => {
                     // TODO: Implementar vista de respuestas
                     console.log('Ver respuestas de', form._id);
                   }}
                   className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                 >
                   <Eye className="h-3 w-3" />
                   Ver Datos
                 </button>
               </div>
             </div>
           ))}
         </div>
       </div>
     )}
   </div>
  );
};

export default AudienceDataTable;
