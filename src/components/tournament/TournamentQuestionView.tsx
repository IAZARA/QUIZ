import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button'; // Assuming Button component exists

// Define the structure of a single question
interface Question {
  question_id: string;
  content: string;
  options: { [key: string]: string }; // e.g., { A: "Option A", B: "Option B" }
  correct_option: string; // Key of the correct option, e.g., "A"
}

// Define the structure for a submitted answer
interface SubmittedAnswer {
  question_id: string;
  selected_option: string;
  time_taken_ms: number;
}

// Define the props for the component
interface TournamentQuestionViewProps {
  questions: Question[]; // Should ideally be of length 5
  tournamentId: string;
  roundNumber: number;
  matchId: string;
  participantId: string; // Currently unused in this component's logic directly, but good for context
  onComplete: (answers: SubmittedAnswer[]) => void;
}

const PER_QUESTION_TIME_LIMIT_SECONDS = 15;

const TournamentQuestionView: React.FC<TournamentQuestionViewProps> = ({
  questions,
  // tournamentId, // Available if needed for API calls within component (not in this version)
  // roundNumber,
  // matchId,
  // participantId,
  onComplete,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [collectedAnswers, setCollectedAnswers] = useState<SubmittedAnswer[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [timeLeftForQuestion, setTimeLeftForQuestion] = useState<number>(PER_QUESTION_TIME_LIMIT_SECONDS);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);

  const currentQuestion = questions[currentQuestionIndex];

  const moveToNextQuestionOrComplete = useCallback((answer: SubmittedAnswer) => {
    const updatedAnswers = [...collectedAnswers, answer];
    setCollectedAnswers(updatedAnswers);

    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIdx => prevIdx + 1);
      setQuestionStartTime(Date.now());
      setTimeLeftForQuestion(PER_QUESTION_TIME_LIMIT_SECONDS);
    } else {
      onComplete(updatedAnswers);
    }
  }, [collectedAnswers, currentQuestionIndex, questions.length, onComplete, timerId]);
  
  // Effect for question timer
  useEffect(() => {
    if (!currentQuestion) return; // All questions answered or no questions

    // Clear any existing timer before starting a new one
    if (timerId) {
      clearInterval(timerId);
    }

    setQuestionStartTime(Date.now()); // Reset start time for the new question
    setTimeLeftForQuestion(PER_QUESTION_TIME_LIMIT_SECONDS); // Reset timer display

    const newTimerId = setInterval(() => {
      setTimeLeftForQuestion(prevTime => {
        if (prevTime <= 1) { // Timer runs out
          clearInterval(newTimerId);
          // Automatically submit a "TIMEOUT" answer
          moveToNextQuestionOrComplete({
            question_id: currentQuestion.question_id,
            selected_option: "TIMEOUT", // Special value for timeout
            time_taken_ms: PER_QUESTION_TIME_LIMIT_SECONDS * 1000,
          });
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    setTimerId(newTimerId);

    // Cleanup function to clear interval when component unmounts or question changes
    return () => {
      if (newTimerId) {
        clearInterval(newTimerId);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestionIndex, questions]); // Rerun timer when question changes

  const handleAnswerSelection = useCallback((optionKey: string) => {
    if (!currentQuestion) return;

    const timeTaken = Date.now() - questionStartTime;
    const answer: SubmittedAnswer = {
      question_id: currentQuestion.question_id,
      selected_option: optionKey,
      time_taken_ms: timeTaken,
    };
    moveToNextQuestionOrComplete(answer);
  }, [currentQuestion, questionStartTime, moveToNextQuestionOrComplete]);


  if (!currentQuestion) {
    // This state should ideally be handled by the parent component
    // (e.g., by not rendering this view if questions are completed)
    return (
      <div className="p-4 text-center bg-gray-100 shadow-md rounded-lg">
        <p className="text-lg">Todas las preguntas han sido respondidas.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white shadow-xl rounded-xl max-w-2xl mx-auto my-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-800">Pregunta {currentQuestionIndex + 1} de {questions.length}</h1>
        <p className="text-sm text-gray-500">Torneo de Trivia</p>
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg shadow">
        <p className="text-xl text-gray-700 leading-relaxed">{currentQuestion.content}</p>
      </div>

      <div className="mb-6 text-center">
        <p className="text-2xl font-mono font-semibold text-red-500">
          Tiempo restante: {timeLeftForQuestion}s
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(currentQuestion.options).map(([key, value]) => (
          <Button
            key={key}
            variant="outline"
            className="w-full p-4 text-left text-lg hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 transition-all duration-150 ease-in-out"
            onClick={() => handleAnswerSelection(key)}
          >
            <span className="font-semibold mr-2">{key}:</span> {value}
          </Button>
        ))}
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">
          ID Partido: {matchId} - Ronda: {roundNumber}
        </p>
      </div>
    </div>
  );
};

export default TournamentQuestionView;
