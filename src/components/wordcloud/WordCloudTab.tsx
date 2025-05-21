import React, { useState, useEffect } from 'react';
import { Cloud, RefreshCw, Send } from 'lucide-react';
import { useWordCloudStore } from '../../store/wordCloudStore';
import ReactWordcloud from 'react-wordcloud';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';

interface WordCloudTabProps {
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const WordCloudTab: React.FC<WordCloudTabProps> = ({ showNotification }) => {
  const { 
    isActive, 
    words, 
    startWordCloud, 
    stopWordCloud, 
    resetWordCloud,
    fetchWords
  } = useWordCloudStore();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadWords = async () => {
      setLoading(true);
      await fetchWords();
      setLoading(false);
    };
    
    loadWords();
  }, [fetchWords]);

  const handleStartWordCloud = async () => {
    try {
      await startWordCloud();
      showNotification('Nube de palabras activada', 'success');
    } catch (error) {
      console.error('Error al activar la nube de palabras:', error);
      showNotification('Error al activar la nube de palabras', 'error');
    }
  };

  const handleStopWordCloud = async () => {
    try {
      await stopWordCloud();
      showNotification('Nube de palabras desactivada', 'success');
    } catch (error) {
      console.error('Error al desactivar la nube de palabras:', error);
      showNotification('Error al desactivar la nube de palabras', 'error');
    }
  };

  const handleResetWordCloud = async () => {
    try {
      await resetWordCloud();
      showNotification('Nube de palabras reiniciada', 'success');
    } catch (error) {
      console.error('Error al reiniciar la nube de palabras:', error);
      showNotification('Error al reiniciar la nube de palabras', 'error');
    }
  };

  // Convertir las palabras al formato esperado por react-wordcloud
  const wordCloudData = words.map(word => ({
    text: word.text,
    value: word.count
  }));

  const options = {
    colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'],
    enableTooltip: true,
    deterministic: false,
    fontFamily: 'impact',
    fontSizes: [20, 60],
    fontStyle: 'normal',
    fontWeight: 'normal',
    padding: 1,
    rotations: 3,
    rotationAngles: [0, 90],
    scale: 'sqrt',
    spiral: 'archimedean',
    transitionDuration: 1000
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center">
        <div className="animate-pulse text-gray-500 flex flex-col items-center">
          <div className="w-12 h-12 mb-4 rounded-full bg-gray-200"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 sm:p-6">
      <div className="flex flex-col">
        {/* Encabezado y controles */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <Cloud className="h-5 w-5 mr-2 text-blue-500" />
            Nube de Palabras Interactiva
          </h2>
          <div className="flex space-x-3">
            {!isActive ? (
              <button
                onClick={handleStartWordCloud}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Send className="h-4 w-4 mr-2" />
                Iniciar Nube de Palabras
              </button>
            ) : (
              <button
                onClick={handleStopWordCloud}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                <Send className="h-4 w-4 mr-2" />
                Detener Nube de Palabras
              </button>
            )}
            <button
              onClick={handleResetWordCloud}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reiniciar
            </button>
          </div>
        </div>

        {/* Estado actual */}
        <div className={`mb-6 p-4 rounded-md ${isActive ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
          <p className="text-sm font-medium">
            Estado: <span className={isActive ? 'text-green-600' : 'text-gray-600'}>
              {isActive ? 'Activo - Los participantes pueden enviar palabras' : 'Inactivo'}
            </span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {isActive 
              ? 'Los participantes están enviando palabras que se mostrarán en la nube a continuación.' 
              : 'Activa la nube de palabras para permitir que los participantes envíen sus palabras.'}
          </p>
        </div>

        {/* Visualización de la nube de palabras */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-900">Visualización de la Nube de Palabras</h3>
          </div>
          <div className="p-6" style={{ height: '500px' }}>
            {wordCloudData.length > 0 ? (
              <ReactWordcloud words={wordCloudData} options={options} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500 text-center">
                  No hay palabras para mostrar. {isActive ? 'Espera a que los participantes envíen palabras.' : 'Activa la nube de palabras para comenzar.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordCloudTab;
