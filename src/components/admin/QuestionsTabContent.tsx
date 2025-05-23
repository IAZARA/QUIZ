import React from 'react';
import { Award } from 'lucide-react';
import QuestionForm from './QuestionForm';
import QuestionsList from './QuestionsList';
// import { useQuestionStore } from '../../store/questionStore'; // Not used directly here if props are passed
// import { useQuizConfigStore } from '../../store/quizConfigStore'; // Used for config and isRankingVisible
import { useQuizConfigStore } from '../../store/quizConfigStore'; // For i18n
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
  correct_answer: string; // Assuming this is the key for correct_option in the form
  explanation: string;
  explanation_image: string;
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
  
  onClearView: () => void;
  onToggleRanking: () => void;
  onNewQuestion: () => void;
  onEditQuestion: (question: QuestionWithId) => void;
  onDeleteQuestion: (id: string) => void;
  onStartVoting: (questionId: string) => void;
  onStopVoting: () => void;
  onToggleCheatSheet: (questionId: string) => void;
  onTimerChange: (questionId: string, seconds: number) => void;
  onQuestionFormSubmit: (e: React.FormEvent) => void;
  onQuestionFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onQuestionFormCancel: () => void;
  calculateStats: () => Array<{ option: string; count: number; percentage: number; showPercentage: boolean }>;
  newQuestionButtonText: string; // Added for QuestionsList
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
  onClearView,
  onToggleRanking,
  onNewQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onStartVoting,
  onStopVoting,
  onToggleCheatSheet,
  onTimerChange,
  onQuestionFormSubmit,
  onQuestionFormChange,
  onQuestionFormCancel,
  calculateStats,
  newQuestionButtonText,
}) => {
  const { t } = useTranslation();
  const { config, isRankingVisible } = useQuizConfigStore();

  return (
    <div>
      <div className="mb-6 flex justify-end space-x-2">
        <button
          onClick={onClearView}
          className="inline-flex items-center px-3 py-1.5 border border-border-color shadow-sm text-sm font-medium rounded-md text-text-primary bg-bg-primary hover:bg-bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
        >
          {t('clearAudienceViewButton')}
        </button>
        {config.showRankings && (
          <button
            onClick={onToggleRanking}
            className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white ${ // text-white is hardcoded, consider 'text-button-text' if applicable
              isRankingVisible
                ? 'bg-yellow-600 hover:bg-yellow-700' // Specific colors kept
                : 'bg-purple-600 hover:bg-purple-700' // Specific colors kept
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
          >
            <Award className="h-4 w-4 mr-2" />
            {isRankingVisible ? t('hideRankingButton') : t('showRankingButton')}
          </button>
        )}
      </div>
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
