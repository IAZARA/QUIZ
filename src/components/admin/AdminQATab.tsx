import React, { useState, useEffect, useCallback } from 'react';
// Socket will be managed by Zustand store, so direct import might not be needed here
// import { Socket } from 'socket.io-client'; 
import { CheckCircle, XCircle, Clock, MessageSquare, User, Calendar } from 'lucide-react';
import { useAdminSocketStore } from '../../store/adminSocketStore'; // Import the store

interface Question {
  _id: string;
  content: string;
  participantName?: string;
  isApproved: boolean;
  isAnswered: boolean;
  createdAt: string;
  roomCode?: string;
}

// AdminQATabProps no longer needs the socket prop
interface AdminQATabProps {}

const AdminQATab: React.FC<AdminQATabProps> = () => {
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Use the admin socket store
  const { socket, connectAdminSocket, isConnected, disconnectAdminSocket } = useAdminSocketStore();

  const fetchAllQuestions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/qa/questions');
      if (!response.ok) {
        throw new Error(`Error fetching questions: ${response.statusText}`);
      }
      const data: Question[] = await response.json();
      setAllQuestions(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err: any) {
      setError(err.message || 'Failed to fetch questions.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch initial data
    fetchAllQuestions();
  }, [fetchAllQuestions]);

  useEffect(() => {
    // Connect to socket if not already connected by the store
    // The store's connectAdminSocket handles ensuring only one connection
    // and also joining the 'admin_qa_room'
    if (!isConnected) {
      connectAdminSocket();
    }
    // The AdminQATab will not disconnect the socket on its own unmount.
    // The socket lifecycle is managed by the store, potentially shared by other admin tabs.
    // If a global disconnect is needed when AdminDashboard unmounts, that would be handled there.
  }, [connectAdminSocket, isConnected]);

  useEffect(() => {
    // Setup event listeners when socket is available and connected
    if (socket && isConnected) {
      const handleNewQuestion = (newQuestion: Question) => {
        setAllQuestions(prevQuestions =>
          [newQuestion, ...prevQuestions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        );
      };

      const handleQuestionUpdated = (updatedQuestion: Question) => {
        setAllQuestions(prevQuestions =>
          prevQuestions.map(q => (q._id === updatedQuestion._id ? updatedQuestion : q))
                       .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        );
      };

      socket.on('new_question', handleNewQuestion);
      socket.on('question_updated', handleQuestionUpdated);

      return () => {
        // Cleanup listeners when component unmounts or socket instance changes
        socket.off('new_question', handleNewQuestion);
        socket.off('question_updated', handleQuestionUpdated);
      };
    }
  }, [socket, isConnected]); // Rerun effect if socket instance or connection status changes

  const handleApproveQuestion = async (questionId: string) => {
    setActionLoading(prev => ({ ...prev, [questionId]: true }));
    setError(null);
    try {
      const response = await fetch(`/api/qa/questions/${questionId}/approve`, {
        method: 'PUT',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve question');
      }
      // The 'question_updated' socket event should handle the state update.
      // If not, uncomment the line below or refetch:
      // fetchAllQuestions(); 
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setActionLoading(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const handleMarkAsAnswered = async (questionId: string) => {
    setActionLoading(prev => ({ ...prev, [questionId]: true }));
    setError(null);
    try {
      const response = await fetch(`/api/qa/questions/${questionId}/answer`, {
        method: 'PUT',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark as answered');
      }
      // The 'question_updated' socket event should handle the state update.
      // If not, uncomment the line below or refetch:
      // fetchAllQuestions();
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setActionLoading(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const getStatusPill = (question: Question) => {
    if (question.isAnswered) {
      return <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-200 rounded-full">Answered</span>;
    }
    if (question.isApproved) {
      return <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-200 rounded-full">Approved</span>;
    }
    return <span className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-200 rounded-full">Pending</span>;
  };

  if (isLoading && allQuestions.length === 0) {
    return <div className="p-4 text-center text-gray-500">Loading questions...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Live Q&A Management</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {allQuestions.length === 0 && !isLoading && (
        <div className="text-center py-10">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No questions yet</h3>
          <p className="mt-1 text-sm text-gray-500">Submitted questions will appear here.</p>
        </div>
      )}

      <div className="space-y-4">
        {allQuestions.map((q) => (
          <div key={q._id} className="bg-white p-5 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row justify-between sm:items-start">
              <div className="flex-1 mb-4 sm:mb-0">
                <p className="text-gray-800 text-lg mb-2">{q.content}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span className="flex items-center"><User size={14} className="mr-1" /> {q.participantName || 'Anonymous'}</span>
                  <span className="flex items-center"><Calendar size={14} className="mr-1" /> {new Date(q.createdAt).toLocaleString()}</span>
                  {q.roomCode && <span className="flex items-center"><Clock size={14} className="mr-1" /> Room: {q.roomCode}</span>}
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                {getStatusPill(q)}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              {!q.isApproved && !q.isAnswered && (
                <button
                  onClick={() => handleApproveQuestion(q._id)}
                  disabled={actionLoading[q._id] || !isConnected}
                  className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <CheckCircle size={16} className="mr-2" />
                  {actionLoading[q._id] ? 'Approving...' : 'Approve'}
                </button>
              )}
              {q.isApproved && !q.isAnswered && (
                <button
                  onClick={() => handleMarkAsAnswered(q._id)}
                  disabled={actionLoading[q._id] || !isConnected}
                  className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <CheckCircle size={16} className="mr-2" />
                  {actionLoading[q._id] ? 'Marking...' : 'Mark as Answered'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminQATab;
