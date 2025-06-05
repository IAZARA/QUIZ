import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, AlertTriangle } from 'lucide-react';

interface PersonalResultProps {
  selectedOption: string | null;
  correctOption: string;
  hasVoted: boolean;
  question: {
    option_a: string;
    option_b: string;
    option_c: string;
  };
}

const PersonalResult: React.FC<PersonalResultProps> = ({
  selectedOption,
  correctOption,
  hasVoted,
  question
}) => {
  const { t } = useTranslation();

  // Determinar el estado del resultado
  const getResultState = () => {
    if (!hasVoted || !selectedOption) {
      return {
        type: 'no-vote',
        icon: AlertTriangle,
        title: 'No seleccionaste ninguna opción',
        message: 'No enviaste una respuesta para esta pregunta',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        iconColor: 'text-yellow-600',
        textColor: 'text-yellow-800'
      };
    }

    const isCorrect = selectedOption.toLowerCase() === correctOption.toLowerCase();
    
    if (isCorrect) {
      return {
        type: 'correct',
        icon: Check,
        title: '¡Correcto!',
        message: 'Tu respuesta fue correcta',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        iconColor: 'text-green-600',
        textColor: 'text-green-800'
      };
    } else {
      return {
        type: 'incorrect',
        icon: X,
        title: 'Incorrecto',
        message: 'Tu respuesta no fue correcta',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        iconColor: 'text-red-600',
        textColor: 'text-red-800'
      };
    }
  };

  const resultState = getResultState();
  const IconComponent = resultState.icon;

  // Obtener el contenido de la opción seleccionada y correcta
  const getOptionContent = (option: string) => {
    const optionKey = `option_${option.toLowerCase()}` as keyof typeof question;
    return question[optionKey] as string;
  };

  return (
    <div className="mt-6 animate-fadeInScale">
      {/* Resultado Principal */}
      <div className={`p-6 rounded-xl border-2 ${resultState.bgColor} ${resultState.borderColor} shadow-lg`}>
        <div className="flex items-center justify-center mb-4">
          <div className={`p-3 rounded-full ${resultState.bgColor} ${resultState.borderColor} border-2`}>
            <IconComponent className={`h-8 w-8 ${resultState.iconColor}`} />
          </div>
        </div>
        
        <div className="text-center">
          <h3 className={`text-2xl font-bold ${resultState.textColor} mb-2`}>
            {resultState.title}
          </h3>
          <p className={`text-lg ${resultState.textColor} opacity-80`}>
            {resultState.message}
          </p>
        </div>

        {/* Detalles de la respuesta */}
        <div className="mt-6 space-y-4">
          {hasVoted && selectedOption && (
            <div className="bg-white/50 rounded-lg p-4 border border-white/30">
              <div className="flex items-start space-x-3">
                <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  resultState.type === 'correct' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {selectedOption.toUpperCase()}
                </span>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${resultState.textColor} opacity-70 mb-1`}>
                    Tu respuesta:
                  </p>
                  <p className={`${resultState.textColor} font-medium`}>
                    {getOptionContent(selectedOption)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Mostrar respuesta correcta si la respuesta fue incorrecta o no votó */}
          {(resultState.type === 'incorrect' || resultState.type === 'no-vote') && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">
                  {correctOption.toUpperCase()}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-700 opacity-70 mb-1">
                    Respuesta correcta:
                  </p>
                  <p className="text-green-800 font-medium">
                    {getOptionContent(correctOption)}
                  </p>
                </div>
                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mensaje motivacional */}
      <div className="mt-4 text-center">
        {resultState.type === 'correct' && (
          <p className="text-green-600 font-medium animate-pulse">
            🎉 ¡Excelente trabajo! Sigue así.
          </p>
        )}
        {resultState.type === 'incorrect' && (
          <p className="text-blue-600 font-medium">
            💪 ¡No te preocupes! La próxima vez lo harás mejor.
          </p>
        )}
        {resultState.type === 'no-vote' && (
          <p className="text-orange-600 font-medium">
            ⏰ Recuerda participar en la próxima pregunta.
          </p>
        )}
      </div>
    </div>
  );
};

export default PersonalResult;