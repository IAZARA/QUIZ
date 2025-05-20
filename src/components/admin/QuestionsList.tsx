import React from 'react';
import { PlusCircle } from 'lucide-react';
import QuestionItem from './QuestionItem';

interface Question {
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
}

interface QuestionsListProps {
  questions: Question[];
  currentQuestion: Question | null;
  showCheatSheet: Record<string, boolean>;
  votes: Record<string, number>;
  timeRemaining: number | null;
  onNewQuestion: () => void;
  onEditQuestion: (question: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onStartVoting: (id: string) => void;
  onStopVoting: () => void;
  onToggleCheatSheet: (id: string) => void;
  onTimerChange: (id: string, seconds: number) => void;
  calculateStats: () => { option: string; count: number; percentage: number }[];
}

const QuestionsList: React.FC<QuestionsListProps> = ({
  questions,
  currentQuestion,
  showCheatSheet,
  votes,
  timeRemaining,
  onNewQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onStartVoting,
  onStopVoting,
  onToggleCheatSheet,
  onTimerChange,
  calculateStats
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-gray-900">Banco de Preguntas</h2>
        <button
          onClick={onNewQuestion}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Nueva Pregunta
        </button>
      </div>

      {questions.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6 text-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">No hay preguntas</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>Comienza creando una nueva pregunta para tu quiz.</p>
            </div>
            <div className="mt-5">
              <button
                onClick={onNewQuestion}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Nueva Pregunta
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question) => (
            <QuestionItem
              key={question._id}
              question={question}
              isActive={currentQuestion?._id === question._id}
              showCheatSheet={!!showCheatSheet[question._id]}
              votes={votes}
              timeRemaining={timeRemaining}
              onEdit={() => onEditQuestion(question)}
              onDelete={() => onDeleteQuestion(question._id)}
              onStartVoting={() => onStartVoting(question._id)}
              onStopVoting={onStopVoting}
              onToggleCheatSheet={() => onToggleCheatSheet(question._id)}
              onTimerChange={(seconds) => onTimerChange(question._id, seconds)}
              calculateStats={calculateStats}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionsList;
