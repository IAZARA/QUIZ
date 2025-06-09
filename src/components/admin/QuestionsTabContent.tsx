import React from 'react';
import QuestionForm from './QuestionForm';
import QuestionsList from './QuestionsList';
import { useTranslation } from 'react-i18next';

// Define types for props - adjust based on actual needs from AdminDashboard
interface QuestionWithId {
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

// More specific type for question form data, matching the 'question' state in AdminDashboard
interface QuestionFormData {
  content: string;
  case: string;
  option_a: string;
  option_b: string;
  option_c: string;
  correct_answer: string;
  explanation: string;
  explanation_image: string;
  [key: string]: string; // Para opciones adicionales
}

interface QuestionsTabContentProps {
  showForm: boolean;
  editingQuestion: string | null;
  questionFormData: QuestionFormData;
  currentQuestion: QuestionWithId | null;
  questions: QuestionWithId[];
  showCheatSheet: Record<string, boolean>;
  votes: Record<string, number>;
  timeRemaining: number | null;
  
  onNewQuestion: () => void;
  onEditQuestion: (question: QuestionWithId) => void;
  onDeleteQuestion: (id: string) => void;
  onStartVoting: (questionId: string) => void;
  onStopVoting: () => void;
  onShowResults: () => void;
  onToggleCheatSheet: (questionId: string) => void;
  onTimerChange: (questionId: string, seconds: number) => void;
  onQuestionFormSubmit: (e: React.FormEvent) => Promise<void>;
  onQuestionFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onQuestionFormCancel: () => void;
  calculateStats: () => Array<{ option: string; count: number; percentage: number; showPercentage: boolean }>;
  newQuestionButtonText: string;
}

const QuestionsTabContent: React.FC<QuestionsTabContentProps> = ({
  showForm,
  editingQuestion,
  questionFormData,
  currentQuestion,
  questions,
  showCheatSheet,
  votes,
  timeRemaining,
  onNewQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onStartVoting,
  onStopVoting,
  onShowResults,
  onToggleCheatSheet,
  onTimerChange,
  onQuestionFormSubmit,
  onQuestionFormChange,
  onQuestionFormCancel,
  calculateStats,
  newQuestionButtonText,
}) => {

  return (
    <div>
      {showForm ? (
        <div className="mt-6">
          <div className="bg-bg-primary shadow-lg overflow-hidden sm:rounded-xl">
            <div className="p-0">
              <QuestionForm
                initialQuestion={questionFormData}
                isEditing={!!editingQuestion}
                onSubmit={onQuestionFormSubmit}
                onCancel={onQuestionFormCancel}
                onChange={onQuestionFormChange}
              />
            </div>
          </div>
        </div>
      ) : (
        <QuestionsList
          questions={questions}
          currentQuestion={currentQuestion}
          showCheatSheet={showCheatSheet}
          votes={votes}
          timeRemaining={timeRemaining}
          onNewQuestion={onNewQuestion}
          onEditQuestion={onEditQuestion}
          onDeleteQuestion={onDeleteQuestion}
          onStartVoting={onStartVoting}
          onStopVoting={onStopVoting}
          onShowResults={onShowResults}
          onToggleCheatSheet={onToggleCheatSheet}
          onTimerChange={onTimerChange}
          calculateStats={calculateStats}
          newQuestionButtonText={newQuestionButtonText} // Pass the prop
        />
      )}
    </div>
  );
};

export default QuestionsTabContent;
