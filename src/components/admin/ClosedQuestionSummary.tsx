import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Users, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

interface VoteStats {
  option: string;
  count: number;
  percentage: number;
  showPercentage: boolean;
}

interface ClosedQuestionSummaryProps {
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
    votingClosed: boolean;
  };
  stats: VoteStats[];
  totalVotes: number;
}

const ClosedQuestionSummary: React.FC<ClosedQuestionSummaryProps> = ({
  question,
  stats,
  totalVotes
}) => {
  const { t } = useTranslation();

  // Colores para cada opción
  const optionColors = {
    a: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    b: { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    c: { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' }
  };

  // Encontrar la opción más votada
  const mostVotedOption = stats.reduce((max, stat) => 
    max.count > stat.count ? max : stat, { option: '', count: 0, percentage: 0 }
  );

  // Verificar si hay empate
  const maxCount = Math.max(...stats.map(s => s.count));
  const leadersCount = stats.filter(s => s.count === maxCount && s.count > 0).length;
  const isTie = leadersCount > 1 && maxCount > 0;

  // Calcular estadísticas adicionales
  const correctAnswerStats = stats.find(s => s.option === question.correct_option?.toLowerCase());
  const correctPercentage = correctAnswerStats ? correctAnswerStats.percentage : 0;
  const incorrectPercentage = 100 - correctPercentage;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mt-4">
      {/* Header del Resumen */}
      <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-lg font-bold">Resumen de Resultados</h4>
              <p className="text-gray-200 text-sm">Pregunta Finalizada</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 px-3 py-1 rounded-lg">
              <span className="text-sm font-medium">
                {totalVotes} {totalVotes === 1 ? 'voto' : 'votos'}
              </span>
            </div>
            {question.correct_option && (
              <div className="bg-green-500/20 px-3 py-1 rounded-lg border border-green-400/30">
                <span className="text-sm font-medium text-green-100">
                  Respuesta: {question.correct_option.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Total de Participantes */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Participantes</p>
                <p className="text-2xl font-bold">{totalVotes}</p>
              </div>
              <Users className="h-8 w-8 text-blue-200" />
            </div>
          </div>

          {/* Respuestas Correctas */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Correctas</p>
                <p className="text-2xl font-bold">{correctPercentage}%</p>
                <p className="text-green-100 text-xs">
                  {correctAnswerStats?.count || 0} votos
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </div>
          </div>

          {/* Respuestas Incorrectas */}
          <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Incorrectas</p>
                <p className="text-2xl font-bold">{incorrectPercentage}%</p>
                <p className="text-red-100 text-xs">
                  {totalVotes - (correctAnswerStats?.count || 0)} votos
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-200" />
            </div>
          </div>

          {/* Opción Más Votada */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">
                  {isTie ? 'Empate' : 'Más Votada'}
                </p>
                <p className="text-2xl font-bold">
                  {isTie ? '🤝' : mostVotedOption.option.toUpperCase()}
                </p>
                {!isTie && (
                  <p className="text-purple-100 text-xs">
                    {mostVotedOption.percentage}%
                  </p>
                )}
              </div>
              <TrendingUp className="h-8 w-8 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Gráfico de Resultados Detallado */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Distribución Detallada de Votos
          </h5>
          
          <div className="space-y-4">
            {['a', 'b', 'c'].map((option) => {
              const optionKey = `option_${option}` as keyof typeof question;
              const optionContent = question[optionKey] as string;
              const statForOption = stats.find(s => s.option === option);
              const colors = optionColors[option as keyof typeof optionColors];
              const isCorrect = question.correct_option?.toLowerCase() === option;
              const isMostVoted = option === mostVotedOption.option && !isTie;
              
              return (
                <div key={option} className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  isCorrect ? 'bg-green-50 border-green-200 shadow-md' : 
                  isMostVoted ? `${colors.light} ${colors.border} shadow-md` : 
                  'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                        isCorrect ? 'bg-green-500 text-white ring-2 ring-green-300' :
                        colors.bg + ' text-white'
                      }`}>
                        {option.toUpperCase()}
                      </span>
                      <div className="flex-1">
                        <p className={`font-medium ${
                          isCorrect ? 'text-green-800' : 
                          isMostVoted ? colors.text : 'text-gray-800'
                        }`}>
                          {optionContent}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          {isCorrect && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Respuesta Correcta
                            </span>
                          )}
                          {isMostVoted && !isCorrect && (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors.light} ${colors.text}`}>
                              👑 Más Votada
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${
                        isCorrect ? 'text-green-700' : 
                        isMostVoted ? colors.text : 'text-gray-700'
                      }`}>
                        {statForOption?.count || 0}
                      </p>
                      <p className={`text-sm ${
                        isCorrect ? 'text-green-600' : 
                        isMostVoted ? colors.text : 'text-gray-500'
                      }`}>
                        {statForOption?.percentage || 0}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all duration-700 ease-out ${
                          isCorrect ? 'bg-green-500' : colors.bg
                        } ${isMostVoted ? 'shadow-lg' : ''}`}
                        style={{ 
                          width: `${Math.max(statForOption?.percentage || 0, 2)}%`,
                          transitionDelay: '200ms'
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Información Adicional */}
        {totalVotes === 0 && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-yellow-600 mr-2" />
              <p className="text-yellow-800 font-medium">
                Esta pregunta no recibió votos durante la sesión.
              </p>
            </div>
          </div>
        )}

        {question.explanation && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h6 className="font-semibold text-blue-800 mb-2">Explicación:</h6>
            <p className="text-blue-700">{question.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClosedQuestionSummary;