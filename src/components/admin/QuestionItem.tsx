import React from 'react';
import { Play, StopCircle, Trash2, Edit2, Eye, EyeOff, Clock } from 'lucide-react';
import VotingDashboard from './VotingDashboard';
import ClosedQuestionSummary from './ClosedQuestionSummary';

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
    votingClosed?: boolean;
  };
  isActive: boolean;
  showCheatSheet: boolean;
  votes: Record<string, number>;
  timeRemaining: number | null;
  onEdit: () => void;
  onDelete: () => void;
  onStartVoting: () => void;
  onStopVoting: () => void;
  onShowResults: (correctOption: string) => void;
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
  onShowResults,
  onToggleCheatSheet,
  onTimerChange,
  calculateStats
}) => {
  const stats = calculateStats().map(stat => ({
    ...stat,
    showPercentage: true
  }));
  const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);

  return (
    <div className={`bg-white shadow overflow-hidden sm:rounded-lg mb-4 transition-all duration-300 ${
      isActive ? 'border-2 border-blue-500 shadow-lg' :
      question.votingClosed && totalVotes > 0 ? 'border-2 border-gray-300 bg-gray-50' :
      'border border-gray-200 hover:shadow-md'
    }`}>
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
              <div className="flex items-center space-x-3">
                <button
                  onClick={onStartVoting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-all duration-200 transform hover:scale-105 shadow-md"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Votación
                </button>
                
                {/* Estado de la pregunta */}
                {question.votingClosed && totalVotes > 0 ? (
                  <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-md">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">
                      Finalizada - {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}
                    </span>
                  </div>
                ) : question.votingClosed ? (
                  <div className="flex items-center space-x-2 bg-yellow-100 px-3 py-2 rounded-md">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium text-yellow-700">
                      Sin votos recibidos
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 bg-blue-100 px-3 py-2 rounded-md">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-blue-700">
                      Lista para usar
                    </span>
                  </div>
                )}
              </div>
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
            <div className="w-full mt-6">
              <VotingDashboard
                question={{
                  ...question,
                  votingClosed: question.votingClosed || false
                }}
                stats={stats}
                timeRemaining={timeRemaining}
                totalVotes={totalVotes}
                onStopVoting={onStopVoting}
                onShowResults={onShowResults}
              />
            </div>
          )}

          {/* Mostrar resumen cuando la pregunta está cerrada y tiene votos */}
          {!isActive && question.votingClosed && totalVotes > 0 && (
            <div className="w-full mt-6">
              <ClosedQuestionSummary
                question={{
                  ...question,
                  votingClosed: question.votingClosed || false
                }}
                stats={stats}
                totalVotes={totalVotes}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionItem;
