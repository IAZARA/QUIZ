import { useEffect, useState } from 'react';
import { useQuestionStore } from '../store/questionStore';
import { Clock, QrCode, X } from 'lucide-react';
import TimerSound from '../components/TimerSound';
import QRCode from 'react-qr-code';

export default function AudienceView() {
  const { currentQuestion, submitVote, votes, timeRemaining, initialized } = useQuestionStore();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(!initialized);
  const [showQR, setShowQR] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    // Update connection status based on store initialization
    if (initialized && isConnecting) {
      setIsConnecting(false);
    }
  }, [initialized, isConnecting]);

  // Reiniciar el estado de selección y voto cuando cambia la pregunta activa o su estado
  useEffect(() => {
    // Reiniciar el estado cuando:
    // 1. Cambia la pregunta (nuevo ID o nueva instancia)
    // 2. La pregunta cambia de estado (is_active cambia)
    // 3. La votación se abre nuevamente (votingClosed cambia)
    setSelectedOption(null);
    setHasVoted(false);
  }, [currentQuestion?._id, currentQuestion?.is_active, currentQuestion?.votingClosed]);

  // Ya no necesitamos este efecto porque el temporizador se maneja en el store
  // El tiempo se actualiza automáticamente a través del estado compartido

  // Efecto para cambiar la clase de animación cada 5 segundos
  useEffect(() => {
    const animations = [
      'animate-fadeIn',
      'animate-bounce',
      'animate-pulse',
      'animate-pulse-slow'
    ];
    let index = 0;
    
    const interval = setInterval(() => {
      setAnimationClass(animations[index]);
      index = (index + 1) % animations.length;
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleVote = async (option: string) => {
    // Verificar si se puede votar:
    // - Debe haber una pregunta activa
    // - El usuario no debe haber votado ya
    // - La pregunta debe estar activa
    // - La votación no debe estar cerrada
    if (!currentQuestion || hasVoted || !currentQuestion.is_active || currentQuestion.votingClosed) return;

    setSelectedOption(option);
    setHasVoted(true);
    await submitVote(currentQuestion._id, option);
  };

  const calculateStats = () => {
    const totalVotes = Object.values(votes).reduce((sum, count) => sum + count, 0);
    const stats = ['A', 'B', 'C'].map(option => {
      const count = votes[option] || 0;
      const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
      return { option, count, percentage };
    });
    return { stats, totalVotes };
  };

  // Pantalla de conexión
  if (isConnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-950 to-blue-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-semibold mb-4">
            Conectando con el servidor...
          </h2>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-950 to-blue-900 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Elementos decorativos de fondo */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/10 blur-3xl rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-400/10 blur-3xl rounded-full animate-pulse-slow"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 blur-3xl rounded-full animate-spin-slow"></div>
        
        <div className="absolute top-4 right-4 z-20">
          <button 
            onClick={() => setShowQR(!showQR)}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-all shadow-lg shadow-blue-500/20"
          >
            {showQR ? <X className="h-6 w-6 text-white" /> : <QrCode className="h-6 w-6 text-white" />}
          </button>
        </div>
        
        {showQR ? (
          <div className="text-center bg-white/90 backdrop-blur-md p-8 rounded-xl shadow-2xl relative overflow-hidden z-10 animate-fadeIn">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 blur-sm opacity-50 rounded-xl"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold text-blue-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">
                ¡Escanea para participar!
              </h2>
              <div className="p-3 bg-white rounded-lg shadow-inner mb-4">
                <QRCode 
                  value="https://iazarate.com" 
                  size={200} 
                  className="mx-auto"
                />
              </div>
              <p className="mt-4 text-gray-600 font-medium flex items-center justify-center">
                <span className="mr-2">iazarate.com</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center text-white relative z-10">
            <div className="mb-8 flex flex-col items-center justify-center">
              <div className="relative">
                <div className="absolute -inset-8 bg-blue-500/20 blur-xl rounded-full animate-pulse-slow"></div>
                <img 
                  src="/escudo.png" 
                  alt="Escudo" 
                  className="h-36 mb-4 drop-shadow-2xl animate-fadeIn relative z-10"
                />
              </div>
              <div className="relative">
                <div className="absolute -inset-6 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 blur-xl rounded-full"></div>
                <h1 className="text-5xl font-bold mb-3 relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-white">Quiz Interactivo</h1>
                <div className="h-1 w-32 mx-auto bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mb-3"></div>
                <p className="text-xl text-blue-200 relative z-10 font-medium">¡Prepárate para participar!</p>
              </div>
            </div>
            
            <div className="mb-10 relative">
              <div className="absolute -inset-4 bg-blue-500/10 blur-lg rounded-xl"></div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 relative z-10 shadow-xl">
                <h2 className={`text-2xl font-semibold ${animationClass}`}>
                  Esperando a que el presentador inicie una pregunta...
                </h2>
                
                <div className="mt-6 flex justify-center space-x-4">
                  <div className="animate-bounce delay-100 h-4 w-4 bg-blue-400 rounded-full shadow-lg shadow-blue-400/30"></div>
                  <div className="animate-bounce delay-300 h-4 w-4 bg-indigo-400 rounded-full shadow-lg shadow-indigo-400/30"></div>
                  <div className="animate-bounce delay-500 h-4 w-4 bg-purple-400 rounded-full shadow-lg shadow-purple-400/30"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const { stats, totalVotes } = calculateStats();
  const showResults = !currentQuestion.is_active || currentQuestion.votingClosed;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950 to-blue-900 relative">
      <div className="absolute top-4 right-4 z-20">
        <button 
          onClick={() => setShowQR(!showQR)}
          className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-all shadow-lg shadow-blue-500/20 backdrop-blur-sm border border-white/10 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-50"></div>
          <div className="relative z-10">
            {showQR ? <X className="h-6 w-6 text-white" /> : <QrCode className="h-6 w-6 text-white" />}
          </div>
        </button>
      </div>
      
      {showQR && (
        <div className="absolute top-16 right-4 bg-white/90 backdrop-blur-md p-5 rounded-xl shadow-2xl animate-fadeIn z-50 relative overflow-hidden">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 blur-sm opacity-50 rounded-xl"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
          <div className="relative z-10">
            <div className="p-2 bg-white rounded-lg shadow-inner mb-2">
              <QRCode 
                value="https://iazarate.com" 
                size={150} 
                className="mx-auto"
              />
            </div>
            <p className="mt-2 text-center text-gray-600 text-sm font-medium flex items-center justify-center">
              <span className="mr-1">iazarate.com</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </p>
          </div>
        </div>
      )}
      
      <TimerSound 
        timeRemaining={timeRemaining} 
        isActive={currentQuestion.is_active && !currentQuestion.votingClosed}
      />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col items-center justify-center">
          <img 
            src="/escudo.png" 
            alt="Escudo" 
            className="h-20 mb-2 drop-shadow-2xl animate-fadeIn"
          />
        </div>
        <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-8 text-white border border-white/10 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-400/10 blur-3xl rounded-full z-0"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-400/10 blur-3xl rounded-full z-0"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
            <h2 className="text-3xl font-bold">
              {currentQuestion.content}
            </h2>
            {timeRemaining !== null && !currentQuestion.votingClosed && (
              <div className={`flex items-center p-2 rounded-lg ${
                timeRemaining <= 5 
                  ? 'text-red-400 text-xl font-bold animate-pulse bg-red-500/10 border border-red-400/30'
                  : 'text-blue-200 bg-blue-500/10 border border-blue-400/30'
              }`}>
                <div className="relative mr-2">
                  <div className="absolute -inset-1 bg-blue-500/30 blur-md rounded-full"></div>
                  <Clock className={`h-6 w-6 relative ${timeRemaining > 0 ? 'animate-spin-slow' : ''}`} />
                </div>
                <span className="relative">
                  <span className={`absolute -inset-1 ${timeRemaining <= 5 ? 'bg-red-500/20' : 'bg-blue-500/20'} blur-md rounded-lg`}></span>
                  <span className="relative font-bold" data-testid="timer-display">{timeRemaining} {timeRemaining === 1 ? 'segundo restante' : 'segundos restantes'}</span>
                </span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {['A', 'B', 'C'].map((option) => {
              const optionContent = currentQuestion[`option_${option.toLowerCase()}` as keyof typeof currentQuestion];
              const isSelected = selectedOption === option;
              const isCorrect = currentQuestion.correct_option === option;
              const stat = stats.find(s => s.option === option);

              return (
                <div key={option} className="space-y-2">
                  <button
                    onClick={() => handleVote(option)}
                    disabled={hasVoted || !currentQuestion.is_active || currentQuestion.votingClosed}
                    className={`w-full p-6 text-left rounded-lg transition-all transform hover:scale-[1.01] relative overflow-hidden ${
                      isSelected
                        ? 'bg-blue-600/50 border-2 border-blue-400 shadow-lg shadow-blue-500/20'
                        : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                    } ${
                      showResults && isCorrect
                        ? 'bg-green-600/50 border-2 border-green-400 shadow-lg shadow-green-500/20'
                        : ''
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {/* Efecto de fondo para la opción seleccionada o correcta */}
                    {(isSelected || (showResults && isCorrect)) && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
                    )}
                    
                    <div className="flex justify-between items-center relative z-10">
                      <div className="flex items-center">
                        <span className={`font-bold text-lg mr-2 ${showResults && isCorrect ? 'text-green-300' : 'bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200'}`}>
                          {option}.
                        </span>
                        <span className="font-medium">
                          {String(optionContent || '')}
                        </span>
                      </div>
                      {showResults && (
                        <div className="text-right">
                          <span className="text-sm font-bold text-blue-200">
                            {stat?.percentage}%
                          </span>
                          <span className="text-xs text-gray-300 ml-1">({stat?.count} votos)</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Indicador visual para la opción seleccionada */}
                    {isSelected && !showResults && (
                      <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-blue-400 animate-pulse"></div>
                    )}
                    
                    {/* Indicador visual para la respuesta correcta */}
                    {showResults && isCorrect && (
                      <div className="absolute -right-1 -top-1 bg-green-500 text-white p-1 rounded-bl-lg rounded-tr-lg text-xs font-bold">✓ Correcta</div>
                    )}
                    {showResults && (
                      <div className="mt-3 h-3 bg-white/10 rounded-full overflow-hidden shadow-inner">
                        <div
                          className={`h-full transition-all duration-1000 ${
                            isCorrect ? 'bg-gradient-to-r from-green-500 to-green-300' : 'bg-gradient-to-r from-blue-500 to-blue-300'
                          } relative`}
                          style={{ width: `${stat?.percentage || 0}%` }}
                        >
                          {(stat?.percentage ?? 0) > 15 && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine"></div>
                          )}
                        </div>
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-8">
            {hasVoted && currentQuestion.is_active && !currentQuestion.votingClosed && (
              <div className="text-green-300 font-medium text-center text-lg bg-green-500/10 p-4 rounded-lg border border-green-400/30 animate-pulse-slow relative overflow-hidden">
                <div className="absolute -inset-2 bg-green-500/10 blur-xl"></div>
                <div className="relative z-10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  ¡Tu voto ha sido registrado!
                </div>
              </div>
            )}

            {hasVoted && (currentQuestion.votingClosed || !currentQuestion.is_active) && !currentQuestion.correct_option && (
              <div className="text-blue-200 text-center text-lg bg-blue-500/10 p-4 rounded-lg border border-blue-400/30 relative overflow-hidden">
                <div className="absolute -inset-2 bg-blue-500/10 blur-xl"></div>
                <div className="relative z-10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-400 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  La votación ha terminado. Esperando la respuesta correcta...
                </div>
              </div>
            )}

            {(currentQuestion.votingClosed || !currentQuestion.is_active) && currentQuestion.correct_option && (
              <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 border-2 border-green-400/50 rounded-lg p-6 mt-6 animate-fadeIn relative overflow-hidden shadow-lg shadow-green-500/10">
                <div className="absolute -inset-2 bg-green-500/10 blur-xl"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-300"></div>
                <div className="absolute -top-10 -right-10 w-20 h-20 bg-green-400/20 blur-2xl rounded-full"></div>
                <div className="text-green-300 font-bold mb-3 text-xl flex items-center relative z-10">
                  <div className="bg-green-500 rounded-full p-2 mr-3 shadow-lg shadow-green-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-green-100">
                    La respuesta correcta es la opción {currentQuestion.correct_option}
                  </span>
                </div>
                {(currentQuestion.explanation || currentQuestion.explanation_image) && (
                  <div className="text-green-200 mt-4 bg-green-900/20 p-6 rounded-lg border border-green-400/30 relative overflow-hidden">
                    <div className="absolute -inset-2 bg-gradient-to-r from-green-500/10 to-blue-500/10 blur-xl"></div>
                    <div className="relative z-10">
                      <div className="font-bold text-xl mb-3 bg-clip-text text-transparent bg-gradient-to-r from-green-300 to-blue-300">Explicación:</div>
                      {currentQuestion.explanation && (
                        <div className="text-white/90 leading-relaxed mb-4">
                          {typeof currentQuestion.explanation === 'object' 
                            ? JSON.stringify(currentQuestion.explanation) 
                            : String(currentQuestion.explanation)}
                        </div>
                      )}
                      {currentQuestion.explanation_image && (
                        <div className="mt-4">
                          <img 
                            src={currentQuestion.explanation_image} 
                            alt="Imagen explicativa" 
                            className="max-w-full rounded-lg shadow-lg border border-white/10 object-contain max-h-[300px] mx-auto"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              // En lugar de cargar una imagen externa, simplemente ocultamos la imagen y mostramos un mensaje
                              target.style.display = 'none';
                              target.parentElement?.insertAdjacentHTML('beforeend', 
                                '<div class="p-4 text-center text-red-400 border border-red-400/30 rounded-lg">Error al cargar la imagen</div>'
                              );
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {showResults && (
              <div className="mt-6 text-sm text-center">
                <div className="inline-flex items-center px-4 py-2 bg-blue-500/10 rounded-full border border-blue-400/30 shadow-inner">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="font-bold text-blue-200">
                    Total de votos: <span className="text-white">{totalVotes}</span>
                  </span>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white/50 text-xs bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-indigo-200">iazarate.com</span> © {new Date().getFullYear()}
      </div>
    </div>
  );
}