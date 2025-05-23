import React, { useState } from 'react'; // Added useState
import { PlusCircle, Bot } from 'lucide-react'; // Added Bot
import QuestionItem from './QuestionItem';
import AIQuestionGenerator from './AIQuestionGenerator'; // Added AIQuestionGenerator import

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
  const [showAIGenerator, setShowAIGenerator] = useState(false); // Added state for visibility

  return (
    <div className="text-text-primary"> {/* Apply base text color */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-text-primary">Banco de Preguntas</h2> {/* Updated */}
        <div className="flex"> {/* Added a flex container for buttons */}
          <button
            onClick={onNewQuestion}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-button-text bg-accent hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent" // Updated (assuming accent is blue-600)
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Nueva Pregunta
          </button>
          <button
            onClick={() => setShowAIGenerator(!showAIGenerator)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-button-text bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 ml-3" // Specific purple color kept, assuming it's intentional and not theme-dependent
          >
            <Bot className="h-4 w-4 mr-2" />
            {showAIGenerator ? 'Hide AI Generator' : 'AI Generate Questions'}
          </button>
        </div>
      </div>

      {/* Conditionally render AIQuestionGenerator */}
      {showAIGenerator && (
        <div className="mt-6 mb-6 p-4 bg-bg-secondary rounded-lg shadow-inner"> {/* Updated */}
          <AIQuestionGenerator />
        </div>
      )}

      {questions.length === 0 && !showAIGenerator ? ( // Added !showAIGenerator to hide this if AI generator is open and no questions
        <div className="bg-bg-primary shadow overflow-hidden sm:rounded-lg"> {/* Updated */}
          <div className="px-4 py-5 sm:p-6 text-center">
            <h3 className="text-lg leading-6 font-medium text-text-primary">No hay preguntas</h3> {/* Updated */}
            <div className="mt-2 max-w-xl text-sm text-text-secondary"> {/* Updated */}
              <p>Comienza creando una nueva pregunta para tu quiz o usa el generador AI.</p> {/* Modified text slightly */}
            </div>
            <div className="mt-5">
              <button
                onClick={onNewQuestion}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-button-text bg-accent hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent" // Updated
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
