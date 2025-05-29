import React, { useState, useEffect } from 'react';
import { useQuizConfigStore } from '../store/quizConfigStore';
import { QuizConfig } from '../types';
import { Clock, EyeOff, Eye, UserPlus, Users, Save, Check, AlertCircle } from 'lucide-react'; // Added Check, AlertCircle

import { Volume2, VolumeX } from 'lucide-react'; // Import sound icons

// Constantes para validación
const MIN_TIMER = 10;
const MAX_TIMER = 120;
const MIN_VOLUME = 0.0;
const MAX_VOLUME = 1.0;

type Props = {
  onSaved?: () => void;
}

const QuizConfigPanel: React.FC<Props> = ({ onSaved }) => {
  const { config, isLoading, getConfig, saveConfig, resetConfig } = useQuizConfigStore();
  
  // Estado del formulario
  const [formState, setFormState] = useState({
    defaultTimer: config.defaultTimer,
    showRankings: config.showRankings,
    allowJoinDuringQuiz: config.allowJoinDuringQuiz,
    soundsEnabled: config.soundsEnabled ?? true,
    masterVolume: config.masterVolume ?? 0.75,
    logoUrl: config.logoUrl ?? '',
    selectedFile: null as File | null
  });
  
  // Estado para mensajes
  const [status, setStatus] = useState<{
    success: boolean;
    message: string;
    visible: boolean;
  }>({
    success: false,
    message: '',
    visible: false
  });
  
  // Estado para errores de validación
  const [errors, setErrors] = useState<{
    defaultTimer?: string;
    masterVolume?: string;
    logoUrl?: string;
  }>({});

  // Cargar configuración actual
  useEffect(() => {
    getConfig();
  }, [getConfig]);

  // Actualizar formulario cuando cambia la configuración
  useEffect(() => {
    setFormState({
      defaultTimer: config.defaultTimer,
      showRankings: config.showRankings,
      allowJoinDuringQuiz: config.allowJoinDuringQuiz,
      soundsEnabled: config.soundsEnabled ?? true,
      masterVolume: config.masterVolume ?? 0.75,
      logoUrl: config.logoUrl ?? '',
      selectedFile: null // Reset selected file on config change
    });
  }, [config]);

  // Manejar cambios en los inputs
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'logoFile') {
      const file = (e.target as HTMLInputElement).files?.[0] || null;
      setFormState(prevState => ({
        ...prevState,
        selectedFile: file,
        // Si se selecciona un archivo, limpiar la URL del logo para priorizar el archivo
        logoUrl: file ? '' : prevState.logoUrl 
      }));
      if (file) {
        setErrors(prev => ({ ...prev, logoUrl: undefined }));
      }
      return; // Salir temprano para el input de archivo
    }

    // Actualizar el estado del formulario para otros inputs
    setFormState(prevState => {
      let newFieldValue;
      if (type === 'checkbox') {
        newFieldValue = checked;
      } else if (name === 'masterVolume') {
        newFieldValue = parseFloat(value);
      } else if (type === 'number' || name === 'defaultTimer') {
        newFieldValue = parseInt(value, 10);
      } else {
        newFieldValue = value;
      }
      
      // Si se está actualizando logoUrl, limpiar el selectedFile
      const updatedState = {
        ...prevState,
        [name]: newFieldValue,
        selectedFile: name === 'logoUrl' ? null : prevState.selectedFile
      };
      return updatedState;
    });
    
    // Validaciones
    if (name === 'defaultTimer') {
      const timerValue = parseInt(value, 10);
      if (isNaN(timerValue)) {
        setErrors(prev => ({ ...prev, defaultTimer: 'El tiempo debe ser un número válido' }));
      } else if (timerValue < MIN_TIMER || timerValue > MAX_TIMER) {
        setErrors(prev => ({ ...prev, defaultTimer: `El tiempo debe estar entre ${MIN_TIMER} y ${MAX_TIMER} segundos` }));
      } else {
        setErrors(prev => ({ ...prev, defaultTimer: undefined }));
      }
    } else if (name === 'masterVolume') {
      const volumeValue = parseFloat(value);
      if (isNaN(volumeValue)) {
        setErrors(prev => ({ ...prev, masterVolume: 'El volumen debe ser un número válido' }));
      } else if (volumeValue < MIN_VOLUME || volumeValue > MAX_VOLUME) {
        setErrors(prev => ({ ...prev, masterVolume: `El volumen debe estar entre ${MIN_VOLUME * 100}% y ${MAX_VOLUME * 100}%` }));
      } else {
        setErrors(prev => ({ ...prev, masterVolume: undefined }));
      }
    } else if (name === 'logoUrl') {
      if (value.trim() !== '' && !isValidUrl(value)) {
        setErrors(prev => ({ ...prev, logoUrl: 'La URL del logo no es válida' }));
      } else {
        setErrors(prev => ({ ...prev, logoUrl: undefined }));
      }
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleRemoveLogo = () => {
    setFormState(prev => ({ ...prev, logoUrl: '', selectedFile: null }));
    // Potencialmente llamar a una función para eliminar el logo en el backend también
    // Por ahora, solo limpia la URL en el estado del formulario
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar si hay errores
    if (errors.defaultTimer || errors.masterVolume || errors.logoUrl) {
      setStatus({
        success: false,
        message: 'Por favor, corrige los errores antes de guardar',
        visible: true
      });
      return;
    }
    
    // Guardar la configuración
    let success = false;
    let message = '';

    if (formState.selectedFile) {
      // Si hay un archivo seleccionado, usar FormData
      const formData = new FormData();
      formData.append('defaultTimer', formState.defaultTimer.toString());
      formData.append('showRankings', formState.showRankings.toString());
      formData.append('allowJoinDuringQuiz', formState.allowJoinDuringQuiz.toString());
      formData.append('soundsEnabled', (formState.soundsEnabled ?? true).toString());
      formData.append('masterVolume', (formState.masterVolume ?? 0.75).toString());
      formData.append('logoFile', formState.selectedFile);
      // No enviamos logoUrl si se está subiendo un archivo

      // Aquí llamarías a una función de guardado que maneje FormData
      // Por ejemplo: success = await saveConfigWithFormData(formData);
      // Esta función debería estar en tu store y hacer el fetch correspondiente.
      // Por ahora, simularemos el éxito y mostraremos un mensaje.
      
      // Simulación de la llamada a la API para FormData
      try {
        const response = await fetch('/api/admin/config-upload', { // Asumiendo un endpoint diferente para FormData
          method: 'POST',
          body: formData,
          // No establecer 'Content-Type': 'multipart/form-data', el navegador lo hace automáticamente con FormData
        });
        if (response.ok) {
          const updatedConfig = await response.json();
          useQuizConfigStore.setState({ config: updatedConfig, isLoading: false }); // Actualizar store manualmente
          success = true;
          message = 'Configuración y logo guardados correctamente.';
          setFormState(prev => ({ ...prev, selectedFile: null })); // Limpiar archivo seleccionado
        } else {
          const errorData = await response.json();
          message = errorData.message || 'Error al guardar la configuración con el logo.';
          success = false;
        }
      } catch (error) {
        console.error('Error al guardar con FormData:', error);
        message = 'Error de red o servidor al guardar con el logo.';
        success = false;
      }

    } else {
      // Si no hay archivo, usar JSON como antes, incluyendo logoUrl
      const configToSave: Partial<QuizConfig> = {
        defaultTimer: formState.defaultTimer,
        showRankings: formState.showRankings,
        allowJoinDuringQuiz: formState.allowJoinDuringQuiz,
        soundsEnabled: formState.soundsEnabled,
        masterVolume: formState.masterVolume,
        logoUrl: formState.logoUrl, // Enviar la URL del logo
      };
      success = await saveConfig(configToSave); // saveConfig ya existe y maneja JSON
      message = success
        ? 'Configuración guardada correctamente'
        : 'Error al guardar la configuración';
    }
    
    setStatus({ success, message, visible: true });

    if (success && onSaved) {
      onSaved();
    }
    
    setTimeout(() => {
      setStatus(prev => ({ ...prev, visible: false }));
    }, 3000);
  };
  
  // Manejar reinicio de configuración
  const handleReset = () => {
    // resetConfig() se encarga de actualizar el store, que a su vez actualiza formState via useEffect
    resetConfig(); 
    setErrors({}); // Limpiar errores locales
    setStatus({
      success: true,
      message: 'Configuración restablecida a valores por defecto',
      visible: true
    });
    
    // Ocultar el mensaje después de 3 segundos
    setTimeout(() => {
      setStatus(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  return (
    <div className="bg-bg-primary shadow-md rounded-lg p-6 w-full max-w-2xl mx-auto text-text-primary">
      <h2 className="text-xl font-semibold mb-6 text-text-primary">Configuración del Quiz</h2>
      
      {status.visible && (
        <div 
          className={`mb-4 p-3 rounded-md border-l-4 ${status.success ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}
        >
          <div className="flex">
            <div className="flex-shrink-0">
              {status.success ? <Check className="h-5 w-5 text-green-500" /> : <AlertCircle className="h-5 w-5 text-red-500" />}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${status.success ? 'text-green-800' : 'text-red-800'}`}>
                {status.message}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-text-secondary mb-2 font-medium">
            <Clock size={18} className="inline mr-2" />
            Tiempo por defecto para preguntas (segundos)
          </label>
          <input
            type="number"
            name="defaultTimer"
            value={formState.defaultTimer}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-accent focus:ring-offset-bg-primary transition bg-bg-secondary text-text-primary
              ${errors.defaultTimer ? 'border-red-500 bg-red-50' : 'border-border-color'}`}
            min={MIN_TIMER}
            max={MAX_TIMER}
          />
          {errors.defaultTimer && (
            <p className="mt-1 text-sm text-red-600">{errors.defaultTimer}</p>
          )}
          <p className="mt-1 text-sm text-text-secondary">
            Este es el tiempo predeterminado para cada pregunta si no se especifica otro valor.
          </p>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              name="showRankings"
              id="showRankings"
              checked={formState.showRankings}
              onChange={handleChange}
              className="w-4 h-4 text-accent bg-bg-secondary rounded border-border-color focus:ring-accent focus:ring-offset-bg-primary"
            />
            <label htmlFor="showRankings" className="ml-2 text-text-secondary font-medium">
              {formState.showRankings ? (
                <Eye size={18} className="inline mr-2" />
              ) : (
                <EyeOff size={18} className="inline mr-2" />
              )}
              Mostrar clasificación durante el quiz
            </label>
          </div>
          <p className="text-sm text-text-secondary ml-6">
            Si está activado, los participantes podrán ver su posición en la clasificación durante el quiz.
          </p>
        </div>
        
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              name="allowJoinDuringQuiz"
              id="allowJoinDuringQuiz"
              checked={formState.allowJoinDuringQuiz}
              onChange={handleChange}
              className="w-4 h-4 text-accent bg-bg-secondary rounded border-border-color focus:ring-accent focus:ring-offset-bg-primary"
            />
            <label htmlFor="allowJoinDuringQuiz" className="ml-2 text-text-secondary font-medium">
              {formState.allowJoinDuringQuiz ? (
                <UserPlus size={18} className="inline mr-2" />
              ) : (
                <Users size={18} className="inline mr-2" />
              )}
              Permitir unirse durante el quiz
            </label>
          </div>
          <p className="text-sm text-text-secondary ml-6">
            Si está activado, los participantes podrán unirse incluso cuando el quiz ya haya comenzado.
          </p>
        </div>

        {/* Control de Sonidos */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              name="soundsEnabled"
              id="soundsEnabled"
              checked={formState.soundsEnabled}
              onChange={handleChange}
              className="w-4 h-4 text-accent bg-bg-secondary rounded border-border-color focus:ring-accent focus:ring-offset-bg-primary"
            />
            <label htmlFor="soundsEnabled" className="ml-2 text-text-secondary font-medium">
              {formState.soundsEnabled ? (
                <Volume2 size={18} className="inline mr-2" />
              ) : (
                <VolumeX size={18} className="inline mr-2" />
              )}
              Habilitar sonidos
            </label>
          </div>
          <p className="text-sm text-text-secondary ml-6">
            Activa o desactiva todos los sonidos de la aplicación.
          </p>
        </div>

        {/* Control de Volumen Maestro */}
        <div className="mb-8">
          <label className="block text-text-secondary mb-2 font-medium">
            <Volume2 size={18} className="inline mr-2" />
            Volumen maestro: {Math.round((formState.masterVolume || 0) * 100)}%
          </label>
          <input
            type="range"
            name="masterVolume"
            value={formState.masterVolume}
            onChange={handleChange}
            min={MIN_VOLUME}
            max={MAX_VOLUME}
            step="0.01"
            className={`w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer
              ${errors.masterVolume ? 'border-red-500 bg-red-50' : 'border-border-color'} 
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-bg-primary
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-accent
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:w-4
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-accent
              [&::-moz-range-thumb]:cursor-pointer`}
            disabled={!formState.soundsEnabled}
          />
          {errors.masterVolume && (
            <p className="mt-1 text-sm text-red-600">{errors.masterVolume}</p>
          )}
          <p className="mt-1 text-sm text-text-secondary">
            Ajusta el volumen general de todos los sonidos.
          </p>
        </div>

        {/* Campo para URL del Logo o Subida de Archivo */}
        <div className="mb-8">
          <label className="block text-text-secondary mb-2 font-medium">
            Logo del Quiz (URL o Subir Archivo)
          </label>
          <input
            type="text"
            name="logoUrl"
            placeholder="https://ejemplo.com/logo.png"
            value={formState.logoUrl}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-accent focus:ring-offset-bg-primary transition bg-bg-secondary text-text-primary mb-2
              ${errors.logoUrl ? 'border-red-500 bg-red-50' : 'border-border-color'}`}
            disabled={!!formState.selectedFile} // Deshabilitar si hay un archivo seleccionado
          />
          {errors.logoUrl && (
            <p className="mt-1 text-sm text-red-600">{errors.logoUrl}</p>
          )}
          
          <input
            type="file"
            name="logoFile"
            accept="image/png, image/jpeg, image/gif, image/svg+xml"
            onChange={handleChange}
            className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-button-text hover:file:brightness-95 disabled:opacity-50"
            disabled={!!formState.logoUrl && formState.logoUrl.trim() !== ''} // Deshabilitar si hay una URL ingresada
          />
          <p className="mt-1 text-sm text-text-secondary">
            Sube un archivo o ingresa una URL para el logo. Si ambos se proporcionan, el archivo subido tendrá prioridad.
          </p>

          {/* Vista previa del logo */}
          {formState.selectedFile && (
            <div className="mt-4">
              <p className="text-sm text-text-secondary font-medium mb-1">Vista previa del archivo seleccionado:</p>
              <img 
                src={URL.createObjectURL(formState.selectedFile)} 
                alt="Vista previa del logo" 
                className="max-h-32 rounded-md border border-border-color" 
              />
            </div>
          )}
          {/* Mostrar logo actual si no hay archivo seleccionado pero hay URL */}
          {!formState.selectedFile && formState.logoUrl && isValidUrl(formState.logoUrl) && (
             <div className="mt-4">
               <p className="text-sm text-text-secondary font-medium mb-1">Logo actual (desde URL):</p>
               <img 
                 src={formState.logoUrl} 
                 alt="Logo actual" 
                 className="max-h-32 rounded-md border border-border-color"
               />
               <button
                 type="button"
                 onClick={handleRemoveLogo}
                 className="mt-2 text-sm text-red-500 hover:text-red-700"
               >
                 Eliminar logo
               </button>
             </div>
          )}
           {/* Mostrar logo de config.logoUrl si no hay nada en formState.logoUrl ni selectedFile y config.logoUrl es válido */}
          {!formState.selectedFile && !formState.logoUrl && config.logoUrl && isValidUrl(config.logoUrl) && (
            <div className="mt-4">
              <p className="text-sm text-text-secondary font-medium mb-1">Logo configurado actualmente:</p>
              <img
                src={config.logoUrl}
                alt="Logo configurado"
                className="max-h-32 rounded-md border border-border-color"
              />
              <button
                type="button"
                onClick={handleRemoveLogo} // Este botón ahora limpiará config.logoUrl a través del estado del formulario
                className="mt-2 text-sm text-red-500 hover:text-red-700"
              >
                Eliminar logo
              </button>
            </div>
          )}
        </div>
        
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-bg-secondary text-text-primary rounded-md hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-bg-primary transition flex items-center"
            disabled={isLoading}
          >
            <Users size={18} className="mr-2" />
            Restablecer valores
          </button>
          
          <button
            type="submit"
            className="px-6 py-2 bg-accent text-button-text rounded-md hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-bg-primary transition disabled:opacity-50 flex items-center"
            disabled={isLoading || !!errors.defaultTimer || !!errors.masterVolume || !!errors.logoUrl}
          >
            <Save size={18} className="mr-2" />
            {isLoading ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuizConfigPanel;