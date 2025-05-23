import React, { useState, useEffect } from 'react';
import { useQuizConfigStore } from '../store/quizConfigStore';
import { QuizConfig } from '../types';
import { Clock, EyeOff, Eye, UserPlus, Users, Save } from 'lucide-react';

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
    masterVolume: config.masterVolume ?? 0.75
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
      masterVolume: config.masterVolume ?? 0.75
    });
  }, [config]);

  // Manejar cambios en los inputs
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    // Actualizar el estado del formulario
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
      
      return {
        ...prevState,
        [name]: newFieldValue
      };
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
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar si hay errores
    if (errors.defaultTimer || errors.masterVolume) {
      setStatus({
        success: false,
        message: 'Por favor, corrige los errores antes de guardar',
        visible: true
      });
      return;
    }
    
    // Guardar la configuración
    const success = await saveConfig(formState);
    
    // Mostrar mensaje de estado
    setStatus({
      success,
      message: success 
        ? 'Configuración guardada correctamente' 
        : 'Error al guardar la configuración',
      visible: true
    });

    // Llamar al callback si existe y la operación fue exitosa
    if (success && onSaved) {
      onSaved();
    }
    
    // Ocultar el mensaje después de 3 segundos
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
    <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-6 text-gray-800">Configuración del Quiz</h2>
      
      {status.visible && (
        <div 
          className={`mb-4 p-3 rounded-md ${status.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
        >
          {status.message}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2 font-medium">
            <Clock size={18} className="inline mr-2" />
            Tiempo por defecto para preguntas (segundos)
          </label>
          <input
            type="number"
            name="defaultTimer"
            value={formState.defaultTimer}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 transition
              ${errors.defaultTimer ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            min={MIN_TIMER}
            max={MAX_TIMER}
          />
          {errors.defaultTimer && (
            <p className="mt-1 text-sm text-red-600">{errors.defaultTimer}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
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
              className="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="showRankings" className="ml-2 text-gray-700 font-medium">
              {formState.showRankings ? (
                <Eye size={18} className="inline mr-2" />
              ) : (
                <EyeOff size={18} className="inline mr-2" />
              )}
              Mostrar clasificación durante el quiz
            </label>
          </div>
          <p className="text-sm text-gray-500 ml-6">
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
              className="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="allowJoinDuringQuiz" className="ml-2 text-gray-700 font-medium">
              {formState.allowJoinDuringQuiz ? (
                <UserPlus size={18} className="inline mr-2" />
              ) : (
                <Users size={18} className="inline mr-2" />
              )}
              Permitir unirse durante el quiz
            </label>
          </div>
          <p className="text-sm text-gray-500 ml-6">
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
              className="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="soundsEnabled" className="ml-2 text-gray-700 font-medium">
              {formState.soundsEnabled ? (
                <Volume2 size={18} className="inline mr-2" />
              ) : (
                <VolumeX size={18} className="inline mr-2" />
              )}
              Habilitar sonidos
            </label>
          </div>
          <p className="text-sm text-gray-500 ml-6">
            Activa o desactiva todos los sonidos de la aplicación.
          </p>
        </div>

        {/* Control de Volumen Maestro */}
        <div className="mb-8">
          <label className="block text-gray-700 mb-2 font-medium">
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
            className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer
              ${errors.masterVolume ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
            disabled={!formState.soundsEnabled} // Deshabilitar si los sonidos están apagados
          />
          {errors.masterVolume && (
            <p className="mt-1 text-sm text-red-600">{errors.masterVolume}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Ajusta el volumen general de todos los sonidos.
          </p>
        </div>
        
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition flex items-center"
            disabled={isLoading}
          >
            <Users size={18} className="mr-2" />
            Restablecer valores
          </button>
          
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50 flex items-center"
            disabled={isLoading || !!errors.defaultTimer || !!errors.masterVolume}
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