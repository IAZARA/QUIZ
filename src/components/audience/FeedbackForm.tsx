import React, { useState, FormEvent } from 'react';
import { useParticipantStore } from '../../store/participantStore';
import { apiClient } from '../../lib/api'; // Assuming apiClient is exported from your api utility

interface FeedbackFormProps {
  eventId: string;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ eventId }) => {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const participantInfo = useParticipantStore((state) => state.participantInfo);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    let authorIdToSubmit: string;

    if (isAnonymous) {
      authorIdToSubmit = 'anonymous';
    } else {
      if (!participantInfo?.id) {
        setError('Debes estar registrado para enviar una reseña no anónima.');
        setIsLoading(false);
        return;
      }
      authorIdToSubmit = participantInfo.id;
    }

    if (!rating) {
      setError('Por favor, selecciona una calificación.');
      setIsLoading(false);
      return;
    }

    if (comment.trim() === '') {
      setError('Por favor, deja un comentario.');
      setIsLoading(false);
      return;
    }
     if (comment.length > 5000) {
      setError('El comentario no puede exceder los 5000 caracteres.');
      setIsLoading(false);
      return;
    }


    const payload = {
      eventId,
      rating,
      comment,
      authorId: authorIdToSubmit,
      isAnonymous,
    };

    try {
      const response = await apiClient.post('/api/reviews', payload);
      if (response.status === 201) {
        setSuccessMessage('¡Reseña enviada con éxito!');
        setRating(null);
        setComment('');
        setIsAnonymous(false);
      } else {
        // Handle other success statuses if necessary, or rely on catch for errors
        setError(response.data?.message || 'Ocurrió un error al enviar la reseña.');
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Ocurrió un error de red o el servidor no respondió.');
      }
      console.error('Error submitting review:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-center text-gray-800 mb-6">
        Enviar Reseña del Evento
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Calificación (1 - 10):
          </label>
          <div className="flex flex-wrap gap-2">
            {[...Array(10)].map((_, i) => (
              <button
                type="button"
                key={i + 1}
                onClick={() => setRating(i + 1)}
                className={`w-10 h-10 rounded-md text-sm font-medium transition-colors
                  ${rating === i + 1
                    ? 'bg-blue-600 text-white ring-2 ring-blue-500 ring-offset-1'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400'
                  }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
            Comentario:
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Escribe tu comentario aquí..."
            maxLength={5000}
          />
           <p className="text-xs text-gray-500 mt-1 text-right">{comment.length} / 5000</p>
        </div>

        <div className="flex items-center">
          <input
            id="isAnonymous"
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isAnonymous" className="ml-2 block text-sm text-gray-900">
            Enviar de forma anónima
          </label>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm">
            {successMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Enviando...' : 'Enviar Reseña'}
        </button>
      </form>
    </div>
  );
};

export default FeedbackForm;
