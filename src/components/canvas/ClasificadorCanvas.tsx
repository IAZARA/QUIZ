import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface ClasificadorCanvasProps {
  onStateChange?: (state: any) => void;
  initialState?: any;
  isInteractive?: boolean;
}

const ClasificadorCanvas: React.FC<ClasificadorCanvasProps> = ({ 
  onStateChange, 
  initialState = { frecuencia: 50, intensidad: 50 },
  isInteractive = true 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frecuencia, setFrecuencia] = useState(initialState.frecuencia || 50);
  const [intensidad, setIntensidad] = useState(initialState.intensidad || 50);
  const [resultado, setResultado] = useState('Ajusta los sliders para clasificar');
  const [resultadoClass, setResultadoClass] = useState('');

  // Definir las regiones de clasificación
  const regions = {
    normal: { color: 'rgba(144, 238, 144, 0.4)', xMin: 0, xMax: 60, yMin: 0, yMax: 60 },
    sospechoso: { color: 'rgba(255, 165, 0, 0.4)', xMin: 40, xMax: 100, yMin: 40, yMax: 100 },
    muySospechoso: { color: 'rgba(255, 99, 71, 0.5)', xMin: 75, xMax: 100, yMin: 75, yMax: 100 }
  };

  // Datos de entrenamiento de ejemplo
  const trainingData = [
    // Normal
    { x: 10, y: 15, type: 'normal', color: '#059669' },
    { x: 25, y: 30, type: 'normal', color: '#059669' },
    { x: 5, y: 40, type: 'normal', color: '#059669' },
    { x: 35, y: 10, type: 'normal', color: '#059669' },
    // Sospechoso
    { x: 50, y: 70, type: 'sospechoso', color: '#dc2626' },
    { x: 70, y: 55, type: 'sospechoso', color: '#dc2626' },
    { x: 45, y: 80, type: 'sospechoso', color: '#dc2626' },
    { x: 80, y: 45, type: 'sospechoso', color: '#dc2626' },
    // Muy Sospechoso
    { x: 90, y: 95, type: 'muySospechoso', color: '#b91c1c' },
    { x: 85, y: 80, type: 'muySospechoso', color: '#b91c1c' },
    { x: 98, y: 88, type: 'muySospechoso', color: '#b91c1c' }
  ];

  const drawCanvas = (frecuenciaVal: number, intensidadVal: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const CANVAS_WIDTH = canvas.width;
    const CANVAS_HEIGHT = canvas.height;

    // Limpiar canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Dibujar regiones de clasificación
    // Región normal
    ctx.fillStyle = regions.normal.color;
    ctx.fillRect(
      (regions.normal.xMin / 100) * CANVAS_WIDTH,
      (CANVAS_HEIGHT - (regions.normal.yMax / 100) * CANVAS_HEIGHT),
      ((regions.normal.xMax - regions.normal.xMin) / 100) * CANVAS_WIDTH,
      ((regions.normal.yMax - regions.normal.yMin) / 100) * CANVAS_HEIGHT
    );

    // Región sospechosa
    ctx.fillStyle = regions.sospechoso.color;
    ctx.fillRect(
      (regions.sospechoso.xMin / 100) * CANVAS_WIDTH,
      (CANVAS_HEIGHT - (regions.sospechoso.yMax / 100) * CANVAS_HEIGHT),
      ((regions.sospechoso.xMax - regions.sospechoso.xMin) / 100) * CANVAS_WIDTH,
      ((regions.sospechoso.yMax - regions.sospechoso.yMin) / 100) * CANVAS_HEIGHT
    );

    // Región muy sospechosa
    ctx.fillStyle = regions.muySospechoso.color;
    ctx.fillRect(
      (regions.muySospechoso.xMin / 100) * CANVAS_WIDTH,
      (CANVAS_HEIGHT - (regions.muySospechoso.yMax / 100) * CANVAS_HEIGHT),
      ((regions.muySospechoso.xMax - regions.muySospechoso.xMin) / 100) * CANVAS_WIDTH,
      ((regions.muySospechoso.yMax - regions.muySospechoso.yMin) / 100) * CANVAS_HEIGHT
    );

    // Dibujar puntos de entrenamiento
    trainingData.forEach(point => {
      ctx.beginPath();
      ctx.arc((point.x / 100) * CANVAS_WIDTH, (CANVAS_HEIGHT - (point.y / 100) * CANVAS_HEIGHT), 5, 0, Math.PI * 2);
      ctx.fillStyle = point.color;
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Dibujar ejes
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Eje X
    ctx.moveTo(0, CANVAS_HEIGHT);
    ctx.lineTo(CANVAS_WIDTH, CANVAS_HEIGHT);
    // Eje Y
    ctx.moveTo(0, CANVAS_HEIGHT);
    ctx.lineTo(0, 0);
    ctx.stroke();

    // Etiquetas de ejes
    ctx.font = '14px Inter';
    ctx.fillStyle = '#374151';
    ctx.fillText('Frecuencia de Eventos (0-100)', CANVAS_WIDTH / 2 - 80, CANVAS_HEIGHT - 5);
    
    ctx.save();
    ctx.translate(15, CANVAS_HEIGHT / 2 + 50);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Intensidad de Eventos (0-100)', 0, 0);
    ctx.restore();

    // Dibujar punto actual del usuario
    const currentX = (frecuenciaVal / 100) * CANVAS_WIDTH;
    const currentY = (CANVAS_HEIGHT - (intensidadVal / 100) * CANVAS_HEIGHT);

    ctx.beginPath();
    ctx.arc(currentX, currentY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#4f46e5';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const classifyActivity = (frecuenciaVal: number, intensidadVal: number) => {
    let classification = 'Normal';
    let resultClass = 'result-normal';

    const highThreshold = 60;
    const veryHighThreshold = 80;

    if (frecuenciaVal >= veryHighThreshold && intensidadVal >= veryHighThreshold) {
      classification = '¡ACTIVIDAD MUY SOSPECHOSA!';
      resultClass = 'result-muy-sospechoso';
    } else if (frecuenciaVal >= highThreshold || intensidadVal >= highThreshold) {
      classification = 'Actividad Sospechosa';
      resultClass = 'result-sospechoso';
    } else {
      classification = 'Actividad Normal';
      resultClass = 'result-normal';
    }

    setResultado(`Resultado: ${classification}`);
    setResultadoClass(resultClass);

    // Notificar cambio de estado
    if (onStateChange) {
      onStateChange({
        frecuencia: frecuenciaVal,
        intensidad: intensidadVal,
        resultado: classification,
        resultClass
      });
    }
  };

  const handleFrecuenciaChange = (value: number) => {
    if (!isInteractive) return;
    setFrecuencia(value);
    classifyActivity(value, intensidad);
    drawCanvas(value, intensidad);
  };

  const handleIntensidadChange = (value: number) => {
    if (!isInteractive) return;
    setIntensidad(value);
    classifyActivity(frecuencia, value);
    drawCanvas(frecuencia, value);
  };

  useEffect(() => {
    classifyActivity(frecuencia, intensidad);
    drawCanvas(frecuencia, intensidad);
  }, []);

  // Actualizar cuando cambie el estado inicial
  useEffect(() => {
    if (initialState) {
      setFrecuencia(initialState.frecuencia || 50);
      setIntensidad(initialState.intensidad || 50);
      classifyActivity(initialState.frecuencia || 50, initialState.intensidad || 50);
      drawCanvas(initialState.frecuencia || 50, initialState.intensidad || 50);
    }
  }, [initialState]);

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-xl p-3 sm:p-6 max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="text-center mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Clasificador Visual de Actividad
        </h1>
        <p className="text-base sm:text-lg text-gray-600">
          ¡Explora el Machine Learning de forma visual! Ajusta los sliders para ver cómo se clasifica una actividad.
        </p>
      </div>

      {isInteractive && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-semibold text-gray-700">
              Frecuencia de Eventos (0-100):
              <span className="font-normal text-indigo-700 ml-2">{frecuencia}</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={frecuencia}
              onChange={(e) => handleFrecuenciaChange(parseInt(e.target.value))}
              className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer slider"
              style={{ touchAction: 'manipulation' }}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-semibold text-gray-700">
              Intensidad de Eventos (0-100):
              <span className="font-normal text-indigo-700 ml-2">{intensidad}</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={intensidad}
              onChange={(e) => handleIntensidadChange(parseInt(e.target.value))}
              className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer slider"
              style={{ touchAction: 'manipulation' }}
            />
          </div>
        </div>
      )}

      <div className="flex justify-center mb-4 sm:mb-6 w-full overflow-hidden">
        <div className="w-full max-w-full" style={{ minHeight: '250px' }}>
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="border border-gray-300 rounded-lg bg-gray-50 shadow-inner w-full h-auto max-w-full"
            style={{ display: 'block', touchAction: 'manipulation' }}
          />
        </div>
      </div>

      <div className={`text-center p-3 sm:p-4 rounded-lg font-semibold text-base sm:text-lg ${
        resultadoClass === 'result-normal' ? 'bg-green-100 text-green-800' :
        resultadoClass === 'result-sospechoso' ? 'bg-orange-100 text-orange-800' :
        resultadoClass === 'result-muy-sospechoso' ? 'bg-red-100 text-red-800 animate-pulse' :
        'bg-gray-100 text-gray-800'
      }`}>
        {resultado}
      </div>

      <div className="mt-6 sm:mt-8 text-left text-gray-700 bg-blue-50 rounded-lg p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">¿Cómo funciona esto?</h2>
        <p className="mb-3 sm:mb-4 text-sm sm:text-base">
          En esta demostración, el <strong>Machine Learning</strong> "aprende" a reconocer patrones en los datos.
          Cada punto en el gráfico representa una "actividad" con una "frecuencia" (eje horizontal) y una "intensidad" (eje vertical).
          Los puntos de colores son los datos que el sistema ya "conoce" (datos de entrenamiento).
        </p>
        <p className="mb-3 sm:mb-4 text-sm sm:text-base">
          El área verde representa actividades "Normales", el área naranja "Sospechosas" y el área roja "Muy Sospechosas".
          Cuando mueves los sliders, el punto azul se mueve y el sistema lo clasifica basándose en qué "región" del gráfico cae,
          imitando cómo un algoritmo de ML predice una nueva entrada basándose en patrones aprendidos.
        </p>
        <p className="font-medium text-gray-800 text-sm sm:text-base">
          Esta capacidad de clasificar nuevos datos sin reglas explícitas programadas es el núcleo del Machine Learning
          y lo hace invaluable para detectar anomalías y apoyar la investigación criminal, donde los patrones pueden ser complejos y masivos.
        </p>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .slider::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #4f46e5;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            border: 2px solid white;
          }
          
          .slider::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #4f46e5;
            cursor: pointer;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            border: 2px solid white;
          }
        `
      }} />
    </motion.div>
  );
};

export default ClasificadorCanvas;