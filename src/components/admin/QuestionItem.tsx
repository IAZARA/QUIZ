import React from 'react';
import { Play, StopCircle, Trash2, Edit2, Eye, EyeOff, Clock } from 'lucide-react';

interface QuestionItemProps {
  question: {
    _id: string;
    content: string;
    case?: string;
    option_a: string;
    option_b: string;
    option_c: string;
    correct_option?: string;
    explanation?: string;
    explanation_image?: string;
    is_active: boolean;
    timer?: number;
  };
  isActive: boolean;
  showCheatSheet: boolean;
  votes: Record<string, number>;
  timeRemaining: number | null;
  onEdit: () => void;
  onDelete: () => void;
  onStartVoting: () => void;
  onStopVoting: () => void;
  onToggleCheatSheet: () => void;
  onTimerChange: (seconds: number) => void;
  calculateStats: () => { option: string; count: number; percentage: number }[];
}

const QuestionItem: React.FC<QuestionItemProps> = ({
  question,
  isActive,
  showCheatSheet,
  votes,
  timeRemaining,
  onEdit,
  onDelete,
  onStartVoting,
  onStopVoting,
  onToggleCheatSheet,
  onTimerChange,
  calculateStats
}) => {
  const stats = calculateStats();
  const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);

  return (
    <div className={`bg-white shadow overflow-hidden sm:rounded-lg mb-4 ${isActive ? 'border-2 border-blue-500' : ''}`}>
      <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">{question.content}</h3>
          {question.case && (
            <p className="mt-1 max-w-2xl text-sm text-gray-500">{question.case}</p>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            title="Editar pregunta"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            title="Eliminar pregunta"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={onToggleCheatSheet}
            className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            title={showCheatSheet ? "Ocultar chuleta" : "Mostrar chuleta"}
          >
            {showCheatSheet ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {showCheatSheet && (
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6 bg-yellow-50">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Opción A</dt>
              <dd className="mt-1 text-sm text-gray-900">{question.option_a}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Opción B</dt>
              <dd className="mt-1 text-sm text-gray-900">{question.option_b}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Opción C</dt>
              <dd className="mt-1 text-sm text-gray-900">{question.option_c}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Respuesta Correcta</dt>
              <dd className="mt-1 text-sm text-green-600 font-medium">
                Opción {question.correct_option?.toUpperCase() || 'No definida'}
              </dd>
            </div>
            {question.explanation && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Explicación</dt>
                <dd className="mt-1 text-sm text-gray-900">{question.explanation}</dd>
              </div>
            )}
            {question.explanation_image && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Imagen de Explicación</dt>
                <dd className="mt-1">
                  <img src={question.explanation_image} alt="Explicación" className="h-32 w-auto object-cover rounded-md" />
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2">
            {!isActive ? (
              <button
                onClick={onStartVoting}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-1" />
                Iniciar Votación
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-md">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-700">
                    {timeRemaining !== null ? `${timeRemaining}s` : 'Sin límite'}
                  </span>
                </div>
                
                <select
                  value={question.timer || 0}
                  onChange={(e) => onTimerChange(parseInt(e.target.value, 10))}
                  className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  disabled={isActive && timeRemaining !== null}
                >
                  <option value="0">Sin límite</option>
                  <option value="30">30s</option>
                  <option value="60">1min</option>
                  <option value="120">2min</option>
                  <option value="180">3min</option>
                  <option value="300">5min</option>
                </select>
              </div>
            )}
          </div>

          {isActive && (
            <div className="w-full sm:w-auto">
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Resultados en tiempo real:</h4>
                <div className="space-y-3">
                  {stats.map((stat) => (
                    <div key={stat.option} className="flex items-center">
                      <span className={`w-8 text-sm font-medium ${stat.count > 0 ? 'text-blue-700 font-semibold' : 'text-gray-700'}`}>
                        {stat.option.toUpperCase()}:
                      </span>
                      <div className="flex-1 ml-2 relative">
                        {/* Barra de fondo */}
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          {/* Barra de progreso */}
                          <div
                            className={`h-3 rounded-full ${stat.count > 0 ? 'bg-blue-600' : 'bg-gray-300'}`}
                            style={{ width: `${Math.max(stat.percentage, 2)}%` }}
                          ></div>
                          
                          {/* Indicador visual para opciones con votos */}
                          {stat.count > 0 && (
                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-start pl-2">
                              <span className="text-xs font-medium text-white drop-shadow-sm">
                                {stat.count} {stat.count === 1 ? 'voto' : 'votos'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`ml-2 text-sm ${stat.count > 0 ? 'text-blue-700 font-semibold' : 'text-gray-500'} min-w-[80px] text-right`}>
                        {stat.count} {stat.count === 1 ? 'voto' : 'votos'} ({stat.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-gray-200 text-sm text-gray-700 flex justify-between items-center">
                  <div>
                    {totalVotes === 0 ? (
                      <span className="text-yellow-600">No hay votos todavía</span>
                    ) : totalVotes === 1 ? (
                      <span>Hay <strong>1</strong> voto en total</span>
                    ) : (
                      <span>Hay <strong>{totalVotes}</strong> votos en total</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {stats.some(s => s.count > 0) ? (
                      <span>
                        Opción más votada: <strong className="text-blue-700">
                          {stats.reduce((max, stat) => max.count > stat.count ? max : stat, { option: '', count: 0, percentage: 0 }).option.toUpperCase()}
                        </strong>
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  onClick={onStopVoting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  Detener y Mostrar Respuesta Correcta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionItem;
