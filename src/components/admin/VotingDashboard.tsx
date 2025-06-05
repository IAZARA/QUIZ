import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StopCircle, Clock, TrendingUp, Users, Crown, AlertTriangle, CheckCircle } from 'lucide-react';

interface VoteStats {
  option: string;
  count: number;
  percentage: number;
  showPercentage: boolean;
}

interface VotingDashboardProps {
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
  stats: VoteStats[];
  timeRemaining: number | null;
  totalVotes: number;
  onStopVoting: () => void;
  onShowResults: (correctOption: string) => void;
}

const VotingDashboard: React.FC<VotingDashboardProps> = ({
  question,
  stats,
  timeRemaining,
  totalVotes,
  onStopVoting,
  onShowResults
}) => {
  const { t } = useTranslation();
  const [previousLeader, setPreviousLeader] = useState<string | null>(null);
  const [showLeaderChange, setShowLeaderChange] = useState(false);
  const [previousTotal, setPreviousTotal] = useState(0);
  const [showNewVote, setShowNewVote] = useState(false);
  const [isStoppingVoting, setIsStoppingVoting] = useState(false);

  // Encontrar la opción líder
  const currentLeader = stats.reduce((max, stat) => 
    max.count > stat.count ? max : stat, { option: '', count: 0, percentage: 0 }
  );

  // Detectar cambio de líder
  useEffect(() => {
    if (previousLeader && previousLeader !== currentLeader.option && currentLeader.count > 0) {
      setShowLeaderChange(true);
      setTimeout(() => setShowLeaderChange(false), 2000);
    }
    setPreviousLeader(currentLeader.option);
  }, [currentLeader.option, previousLeader]);

  // Detectar nuevo voto
  useEffect(() => {
    if (totalVotes > previousTotal) {
      setShowNewVote(true);
      setTimeout(() => setShowNewVote(false), 1000);
    }
    setPreviousTotal(totalVotes);
  }, [totalVotes, previousTotal]);

  // Colores para cada opción
  const optionColors = {
    a: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    b: { bg: 'bg-green-500', light: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
    c: { bg: 'bg-orange-500', light: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' }
  };

  // Verificar si hay empate
  const maxCount = Math.max(...stats.map(s => s.count));
  const leadersCount = stats.filter(s => s.count === maxCount && s.count > 0).length;
  const isTie = leadersCount > 1 && maxCount > 0;

  // Función para manejar el clic del botón de detener
  const handleStopVoting = () => {
    setIsStoppingVoting(true);
    onStopVoting();
  };

  // Función para manejar mostrar resultados
  const handleShowResults = () => {
    // Buscar la respuesta correcta en las opciones de la pregunta
    // Si no hay correct_option definido, usar la primera opción como fallback
    const correctOption = question.correct_option || 'a';
    onShowResults(correctOption);
  };

  // Renderizar botones de acción según el estado
  const renderActionButtons = () => {
    if (!question.votingClosed) {
      // Votación activa - mostrar botón de detener
      return (
        <button
          onClick={handleStopVoting}
          disabled={isStoppingVoting}
          className={`text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 shadow-lg transition-all duration-300 ${
            isStoppingVoting
              ? 'bg-orange-600 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 transform hover:scale-105'
          }`}
        >
          <StopCircle className={`h-5 w-5 ${isStoppingVoting ? 'animate-spin' : ''}`} />
          <span>{isStoppingVoting ? 'Deteniendo...' : 'Detener Votación'}</span>
        </button>
      );
    } else if (!question.correct_option) {
      // Votación cerrada pero sin resultados - mostrar botón de resultados
      return (
        <button
          onClick={handleShowResults}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 shadow-lg transform hover:scale-105 transition-all duration-300"
        >
          <CheckCircle className="h-5 w-5" />
          <span>Mostrar Respuesta Correcta</span>
        </button>
      );
    } else {
      // Resultados ya mostrados
      return (
        <div className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 shadow-lg">
          <CheckCircle className="h-5 w-5" />
          <span>Resultados Mostrados</span>
        </div>
      );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header del Dashboard */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Centro de Comando</h3>
              <p className="text-blue-100">Votación en Tiempo Real</p>
            </div>
          </div>
          
          {/* Timer */}
          <div className="flex items-center space-x-4">
            {timeRemaining !== null && (
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                timeRemaining <= 10 ? 'bg-red-500/20 text-red-100' : 'bg-white/20'
              }`}>
                <Clock className="h-5 w-5" />
                <span className="text-lg font-mono font-bold">
                  {timeRemaining}s
                </span>
              </div>
            )}
            
            {renderActionButtons()}
          </div>
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Contador Total de Votos */}
          <div className="lg:col-span-1">
            <div className={`bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg transform transition-all duration-300 ${
              showNewVote ? 'scale-105 ring-4 ring-purple-300' : ''
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total de Votos</p>
                  <p className="text-4xl font-bold mt-1">{totalVotes}</p>
                </div>
                <Users className="h-12 w-12 text-purple-200" />
              </div>
              {showNewVote && (
                <div className="mt-2 text-sm text-purple-100 animate-pulse">
                  ¡Nuevo voto recibido!
                </div>
              )}
            </div>
          </div>

          {/* Opción Líder */}
          <div className="lg:col-span-1">
            <div className={`bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-xl shadow-lg transform transition-all duration-300 ${
              showLeaderChange ? 'scale-105 ring-4 ring-yellow-300' : ''
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">
                    {isTie ? 'Empate' : 'Opción Líder'}
                  </p>
                  <p className="text-3xl font-bold mt-1">
                    {isTie ? '🤝' : currentLeader.option.toUpperCase()}
                  </p>
                  {!isTie && (
                    <p className="text-yellow-100 text-sm">
                      {currentLeader.count} votos ({currentLeader.percentage}%)
                    </p>
                  )}
                </div>
                {isTie ? (
                  <AlertTriangle className="h-12 w-12 text-yellow-200" />
                ) : (
                  <Crown className="h-12 w-12 text-yellow-200" />
                )}
              </div>
              {showLeaderChange && !isTie && (
                <div className="mt-2 text-sm text-yellow-100 animate-pulse">
                  ¡Nuevo líder!
                </div>
              )}
            </div>
          </div>

          {/* Participación */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Distribución de Votos</p>
                  <p className="text-lg font-semibold">Tiempo Real</p>
                </div>
                <TrendingUp className="h-8 w-8 text-indigo-200" />
              </div>
              
              <div className="space-y-2">
                {stats.map((stat) => {
                  const colors = optionColors[stat.option as keyof typeof optionColors];
                  const isLeader = stat.option === currentLeader.option && !isTie;
                  
                  return (
                    <div key={stat.option} className="flex items-center space-x-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${colors.bg} text-white ${
                        isLeader ? 'ring-2 ring-yellow-300' : ''
                      }`}>
                        {stat.option.toUpperCase()}
                      </span>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-indigo-100 text-sm font-medium">
                            {stat.count} votos
                          </span>
                          <span className="text-white font-bold">
                            {stat.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-indigo-400/30 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ease-out ${colors.bg}`}
                            style={{ width: `${Math.max(stat.percentage, 2)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos de Barras Grandes */}
        <div className="bg-gray-50 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Estadísticas Detalladas por Opción
          </h4>
          
          <div className="space-y-6">
            {['a', 'b', 'c'].map((option) => {
              const optionKey = `option_${option}` as keyof typeof question;
              const optionContent = question[optionKey] as string;
              const statForOption = stats.find(s => s.option === option);
              const colors = optionColors[option as keyof typeof optionColors];
              const isLeader = option === currentLeader.option && !isTie;
              const isCorrect = question.correct_option?.toLowerCase() === option;
              
              return (
                <div key={option} className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                  isLeader ? `${colors.light} ${colors.border} shadow-md` : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${colors.bg} text-white ${
                        isLeader ? 'ring-2 ring-yellow-400' : ''
                      }`}>
                        {option.toUpperCase()}
                      </span>
                      <div className="flex-1">
                        <p className={`font-medium ${isLeader ? colors.text : 'text-gray-800'}`}>
                          {optionContent}
                        </p>
                        {isCorrect && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                            ✓ Respuesta Correcta
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${isLeader ? colors.text : 'text-gray-700'}`}>
                        {statForOption?.count || 0}
                      </p>
                      <p className={`text-sm ${isLeader ? colors.text : 'text-gray-500'}`}>
                        {statForOption?.percentage || 0}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className={`h-4 rounded-full transition-all duration-700 ease-out ${colors.bg} ${
                          isLeader ? 'shadow-lg' : ''
                        }`}
                        style={{ 
                          width: `${Math.max(statForOption?.percentage || 0, 2)}%`,
                          transitionDelay: '200ms'
                        }}
                      ></div>
                    </div>
                    
                    {isLeader && (
                      <div className="absolute -top-1 -right-1">
                        <Crown className="h-6 w-6 text-yellow-500" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Información Adicional */}
        {totalVotes === 0 && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
              <p className="text-yellow-800 font-medium">
                Esperando votos de la audiencia...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VotingDashboard;