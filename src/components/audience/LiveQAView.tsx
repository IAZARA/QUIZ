import React, { useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { useParticipantStore } from '../../store/participantStore'; // To get participant name

interface Question {
  _id: string;
  content: string;
  participantName?: string;
  isApproved: boolean;
  isAnswered: boolean;
  createdAt: string;
  // Add any other relevant fields from your backend model
}

interface LiveQAViewProps {
  socket: Socket | null;
  roomCode?: string; // Optional room code for joining specific Q&A rooms
}

const LiveQAView: React.FC<LiveQAViewProps> = ({ socket, roomCode }) => {
  const [newQuestionText, setNewQuestionText] = useState('');
  const [questionsList, setQuestionsList] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentParticipant } = useParticipantStore();

  const fetchAudienceQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams = roomCode ? `?roomCode=${roomCode}` : '';
      const response = await fetch(`/api/qa/questions/audience${queryParams}`);
      if (!response.ok) {
        throw new Error(`Error fetching questions: ${response.statusText}`);
      }
      const data: Question[] = await response.json();
      setQuestionsList(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch questions.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [roomCode]);

  useEffect(() => {
    fetchAudienceQuestions();

    if (socket) {
      // Join a general audience room or a specific one if roomCode is provided
      const targetRoom = roomCode ? `audience_room_${roomCode}` : 'audience_room_general';
      socket.emit('join_audience_room', roomCode); // Use roomCode directly if backend expects that for specific room, or targetRoom

      const handleQuestionApproved = (approvedQuestion: Question) => {
        setQuestionsList(prevQuestions => {
          // Avoid duplicates, update if exists, otherwise add
          const existingIndex = prevQuestions.findIndex(q => q._id === approvedQuestion._id);
          if (existingIndex > -1) {
            const updatedQuestions = [...prevQuestions];
            updatedQuestions[existingIndex] = { ...updatedQuestions[existingIndex], ...approvedQuestion, isApproved: true };
            return updatedQuestions;
          }
          return [...prevQuestions, approvedQuestion];
        });
      };

      const handleQuestionAnswered = (answeredQuestion: Question) => {
        setQuestionsList(prevQuestions =>
          prevQuestions.map(q =>
            q._id === answeredQuestion._id ? { ...q, ...answeredQuestion, isAnswered: true } : q
          )
        );
      };
      
      const handleNewQuestionForAdmins = (newQuestion: Question) => {
        // If the current user submitted this question, add it to their list as pending
        // This requires matching based on participantName or a temporary client-side ID
        // For simplicity, if participantName matches, we can add it.
        // Or, the backend could echo the question back to the submitter with a special event.
        if (newQuestion.participantName === currentParticipant?.name) {
             // Check if it's not already in the list from a direct API response
            if (!questionsList.find(q => q._id === newQuestion._id)) {
                setQuestionsList(prevQuestions => [...prevQuestions, { ...newQuestion, isApproved: false, isAnswered: false}]);
            }
        }
      };

      socket.on('question_approved', handleQuestionApproved);
      socket.on('question_answered', handleQuestionAnswered);
      // Assuming 'new_question_submitted' is an event targeted at the submitter
      // or 'new_question' is a general event and we filter client-side.
      // The backend currently has `new_question` going to `admin_qa`.
      // Let's assume for now the user sees their question when it's approved.

      return () => {
        socket.off('question_approved', handleQuestionApproved);
        socket.off('question_answered', handleQuestionAnswered);
        // socket.off('new_question_submitted', handleNewQuestionForAdmins);
        socket.emit('leave_audience_room', roomCode);
      };
    }
  }, [socket, fetchAudienceQuestions, roomCode, currentParticipant?.name]);

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) {
      setError('Question cannot be empty.');
      return;
    }
    if (!socket) {
      setError('Not connected to server. Cannot submit question.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload: { content: string; participantName?: string; roomCode?: string } = {
        content: newQuestionText,
      };
      if (currentParticipant) {
        payload.participantName = currentParticipant.name;
      }
      if (roomCode) {
        payload.roomCode = roomCode;
      }

      const response = await fetch('/api/qa/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error submitting question: ${response.statusText}`);
      }

      const submittedQuestion: Question = await response.json();
      setNewQuestionText('');
      // Optionally, add to list immediately with a "Pending" status
      // This gives the user immediate feedback.
      // Backend currently sends 'new_question' to admins only.
      // For the audience to see their own pending question, we'd need a different mechanism
      // or add it here client-side and wait for 'question_approved' to update it.
      setQuestionsList(prevQuestions => [...prevQuestions, { ...submittedQuestion, isApproved: false, isAnswered: false }]);
      // No, this is not ideal, as the _id might not be final or it creates a duplicate if 'question_approved' comes quickly.
      // Best to rely on 'question_approved' or a specific echo event for the submitter.
      // For now, we'll wait for the 'question_approved' event. The user will see their question once approved.
      // Or, if the POST returns the full question object, we can add it.
      // The current backend qa-routes.js POST /questions returns the newQuestion.
      // Let's add it to the list but ensure 'question_approved' can update it.
       setQuestionsList(prevQuestions => {
          // Add if not present, otherwise do nothing (approved event will handle update)
          if (!prevQuestions.find(q => q._id === submittedQuestion._id)) {
            return [...prevQuestions, submittedQuestion]; // submittedQuestion already has isApproved: false by default from schema
          }
          return prevQuestions;
        });


    } catch (err: any) {
      setError(err.message || 'Failed to submit question.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusText = (question: Question): string => {
    if (question.isAnswered) return 'Answered';
    if (question.isApproved) return 'Approved';
    return 'Pending Review';
  };

  return (
    <div className="p-4 bg-gray-800 text-white rounded-lg shadow-xl max-w-2xl mx-auto my-8">
      <h2 className="text-2xl font-bold mb-6 text-center text-teal-400">Live Q&A</h2>

      <form onSubmit={handleSubmitQuestion} className="mb-8">
        <textarea
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-shadow duration-200 ease-in-out"
          rows={3}
          value={newQuestionText}
          onChange={(e) => setNewQuestionText(e.target.value)}
          placeholder="Type your question here..."
          disabled={isLoading}
        />
        <button
          type="submit"
          className="mt-3 w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 ease-in-out disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Submitting...' : 'Submit Question'}
        </button>
        {error && <p className="text-red-400 mt-3 text-sm">{error}</p>}
      </form>

      <h3 className="text-xl font-semibold mb-4 text-teal-300">Questions</h3>
      {isLoading && questionsList.length === 0 && <p className="text-gray-400">Loading questions...</p>}
      
      {questionsList.length === 0 && !isLoading && (
        <p className="text-gray-400">No questions yet. Be the first to ask!</p>
      )}

      <ul className="space-y-4">
        {questionsList.slice().sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(q => (
          <li key={q._id} className="p-4 bg-gray-700 rounded-lg shadow">
            <p className="text-gray-300 text-sm mb-1">
              {q.participantName || 'Anonymous'} - <span className="text-xs text-gray-500">{new Date(q.createdAt).toLocaleTimeString()}</span>
            </p>
            <p className="text-white mb-2">{q.content}</p>
            <span
              className={`px-3 py-1 text-xs font-semibold rounded-full
                ${q.isAnswered ? 'bg-green-600 text-green-100' : ''}
                ${q.isApproved && !q.isAnswered ? 'bg-blue-600 text-blue-100' : ''}
                ${!q.isApproved && !q.isAnswered ? 'bg-yellow-600 text-yellow-100' : ''}
              `}
            >
              {getStatusText(q)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LiveQAView;
