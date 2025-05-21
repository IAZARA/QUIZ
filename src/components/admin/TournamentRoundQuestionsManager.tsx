import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button'; // Assuming this path is correct
import { Input } from '@/components/ui/input';   // Assuming this path is correct
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // For messages
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface QuestionOption {
  A: string;
  B: string;
  C: string;
}

interface Question {
  question_id?: string;
  content: string;
  options: QuestionOption;
  correct_option: string; // 'A', 'B', or 'C'
}

interface TournamentRound {
  roundNumber: number;
  matches: any[]; // Define if needed, for now we only need roundNumber and questions
  questions?: Question[];
}

interface Tournament {
  _id: string;
  name?: string; // Assuming a tournament might have a name
  status: string;
  rounds: TournamentRound[];
}

const DEFAULT_NUM_QUESTIONS = 5;

const initialQuestionState = (): Question => ({
  content: '',
  options: { A: '', B: '', C: '' },
  correct_option: '',
});

const TournamentRoundQuestionsManager: React.FC = () => {
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);
  const [selectedRoundNumber, setSelectedRoundNumber] = useState<number | null>(null);
  const [roundQuestions, setRoundQuestions] = useState<Question[]>(
    Array(DEFAULT_NUM_QUESTIONS).fill(null).map(initialQuestionState)
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveTournament = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/tournament'); // Assuming this gets the active one
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error ${response.status}: Failed to fetch tournament`);
        }
        const data = await response.json();
        if (data.active && data.tournament) {
          setActiveTournament(data.tournament);
        } else {
          setActiveTournament(null); // No active tournament
          setError('No active tournament found or tournament data is invalid.');
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching tournament data.');
        setActiveTournament(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveTournament();
  }, []);

  useEffect(() => {
    if (activeTournament && selectedRoundNumber !== null) {
      const round = activeTournament.rounds.find(r => r.roundNumber === selectedRoundNumber);
      let questionsToSet: Question[] = [];
      if (round && round.questions && round.questions.length > 0) {
        questionsToSet = round.questions.slice(0, DEFAULT_NUM_QUESTIONS).map(q => ({
            question_id: q.question_id,
            content: q.content || '',
            options: q.options || { A: '', B: '', C: '' },
            correct_option: q.correct_option || '',
        }));
      }
      // Pad with empty questions if less than DEFAULT_NUM_QUESTIONS
      while (questionsToSet.length < DEFAULT_NUM_QUESTIONS) {
        questionsToSet.push(initialQuestionState());
      }
      setRoundQuestions(questionsToSet);
    } else {
      setRoundQuestions(Array(DEFAULT_NUM_QUESTIONS).fill(null).map(initialQuestionState));
    }
  }, [activeTournament, selectedRoundNumber]);

  const handleQuestionChange = (index: number, field: keyof Pick<Question, 'content'>, value: string) => {
    const updatedQuestions = [...roundQuestions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setRoundQuestions(updatedQuestions);
  };

  const handleOptionChange = (questionIndex: number, optionKey: keyof QuestionOption, value: string) => {
    const updatedQuestions = [...roundQuestions];
    updatedQuestions[questionIndex].options[optionKey] = value;
    setRoundQuestions(updatedQuestions);
  };

  const handleCorrectOptionChange = (questionIndex: number, optionKey: string) => {
    const updatedQuestions = [...roundQuestions];
    updatedQuestions[questionIndex].correct_option = optionKey;
    setRoundQuestions(updatedQuestions);
  };

  const validateQuestions = (): boolean => {
    for (const q of roundQuestions) {
      if (!q.content.trim()) return false;
      if (!q.options.A.trim() || !q.options.B.trim() || !q.options.C.trim()) return false;
      if (!['A', 'B', 'C'].includes(q.correct_option)) return false;
    }
    return true;
  };

  const handleSaveRoundQuestions = async () => {
    if (!activeTournament || selectedRoundNumber === null) {
      setError("No active tournament or round selected.");
      return;
    }
    if (!validateQuestions()) {
      setError("All fields for all 5 questions must be filled, and a correct option selected for each.");
      setSuccessMessage(null);
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/tournament/${activeTournament._id}/round/${selectedRoundNumber}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: roundQuestions }),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || `Error ${response.status}: Failed to save questions`);
      }
      setSuccessMessage('Questions saved successfully!');
      // Optionally, refresh active tournament data to get new question_ids if backend sends them
      // For now, we assume the local state is fine or admin can re-select round to refresh
       if (responseData.round && responseData.round.questions) {
         const updatedTournamentRounds = activeTournament.rounds.map(r => {
           if (r.roundNumber === selectedRoundNumber) {
             return { ...r, questions: responseData.round.questions };
           }
           return r;
         });
         setActiveTournament({ ...activeTournament, rounds: updatedTournamentRounds });
         // This will also trigger the useEffect to repopulate roundQuestions with new IDs
       }

    } catch (err) {
      console.error("Save error:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while saving questions.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-12 w-12 animate-spin text-blue-500" /> <p className="ml-3 text-lg">Loading tournament data...</p></div>;
  }

  if (error && !activeTournament) { // Show critical error if tournament couldn't be loaded
    return (
      <Alert variant="destructive" className="max-w-lg mx-auto my-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Tournament</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (!activeTournament) {
    return (
      <div className="p-6 text-center text-gray-600">
        <p className="text-xl">No active tournament found.</p>
        <p>Please ensure a tournament has been started to manage questions.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Manage Round Questions</h1>
      
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-3 text-gray-700">Select Round</h2>
        <div className="flex flex-wrap gap-2">
          {activeTournament.rounds.map(round => (
            <Button
              key={round.roundNumber}
              variant={selectedRoundNumber === round.roundNumber ? 'default' : 'outline'}
              onClick={() => setSelectedRoundNumber(round.roundNumber)}
              className="text-sm sm:text-base"
            >
              Round {round.roundNumber}
            </Button>
          ))}
        </div>
      </div>

      {selectedRoundNumber !== null && (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md space-y-8">
          <h2 className="text-xl font-semibold text-gray-700">
            Questions for Round {selectedRoundNumber}
          </h2>
          {roundQuestions.map((q, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3 bg-gray-50/50">
              <h3 className="font-medium text-md text-gray-600">Question {index + 1}</h3>
              <div>
                <label htmlFor={`content-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <Input
                  id={`content-${index}`}
                  type="text"
                  placeholder="Question content"
                  value={q.content}
                  onChange={(e) => handleQuestionChange(index, 'content', e.target.value)}
                  className="w-full"
                />
              </div>
              {(['A', 'B', 'C'] as const).map(optionKey => (
                <div key={optionKey}>
                  <label htmlFor={`option-${optionKey}-${index}`} className="block text-sm font-medium text-gray-700 mb-1">Option {optionKey}</label>
                  <Input
                    id={`option-${optionKey}-${index}`}
                    type="text"
                    placeholder={`Option ${optionKey} text`}
                    value={q.options[optionKey]}
                    onChange={(e) => handleOptionChange(index, optionKey, e.target.value)}
                    className="w-full"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correct Option</label>
                <div className="flex items-center space-x-4">
                  {(['A', 'B', 'C'] as const).map(optionKey => (
                    <label key={optionKey} className="flex items-center space-x-1 cursor-pointer">
                      <input
                        type="radio"
                        name={`correct-option-${index}`}
                        value={optionKey}
                        checked={q.correct_option === optionKey}
                        onChange={() => handleCorrectOptionChange(index, optionKey)}
                        className="form-radio h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                      />
                      <span className="text-sm">{optionKey}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ))}
          
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {successMessage && (
            <Alert variant="default" className="mt-4 bg-green-50 border-green-300 text-green-700">
               <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleSaveRoundQuestions}
            disabled={isSaving}
            className="w-full sm:w-auto text-base py-2.5 px-6"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Questions for Round {selectedRoundNumber}
          </Button>
        </div>
      )}
    </div>
  );
};

export default TournamentRoundQuestionsManager;
