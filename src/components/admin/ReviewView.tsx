import React, { useEffect, useState } from 'react';
import { useReviewStore } from '../../store/reviewStore';
import { Review } from '../../types';

interface ReviewViewProps {
  eventId: string;
}

const ReviewView: React.FC<ReviewViewProps> = ({ eventId }) => {
  const { reviews, isLoading, error, fetchReviews } = useReviewStore();
  const [exportFormat, setExportFormat] = useState<'pdf' | 'word'>('pdf'); // Default to PDF

  useEffect(() => {
    if (eventId) {
      fetchReviews(eventId);
    }
  }, [eventId, fetchReviews]);

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString; // fallback to original string if formatting fails
    }
  };

  const handleExport = () => {
    if (!eventId) {
      console.error('No eventId provided for export.');
      // Optionally, show a user-facing error message here
      return;
    }

    const url = `/api/reviews/export?eventId=${eventId}&format=${exportFormat}`;
    try {
      // Create a temporary anchor element
      const link = document.createElement('a');
      link.href = url;
      // Set a default filename, the backend will set the final one via Content-Disposition
      link.setAttribute('download', `reviews-${eventId}.${exportFormat}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link); // Clean up
    } catch (err) {
      console.error('Export failed:', err);
      // Optionally, display an error message to the user
    }
  };

  if (!eventId) {
    return (
      <div className="p-4 text-center text-gray-600 dark:text-gray-400">
        Por favor, selecciona un evento para ver las reseñas.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-700 dark:text-gray-300">
        Cargando reseñas...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900_alpha_30 border border-red-300 dark:border-red-700 rounded-md">
        Error al cargar reseñas: {error}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 shadow-md rounded-lg">
        <p className="text-center text-gray-600 dark:text-gray-400">
          Aún no hay reseñas para este evento.
        </p>
        <div className="mt-6 text-center">
          {/* Export options can still be shown, but button remains disabled if no reviews */}
          <div className="my-4 flex flex-col items-center space-y-2 sm:flex-row sm:justify-center sm:space-y-0 sm:space-x-4">
            <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                name="exportFormat"
                value="pdf"
                checked={exportFormat === 'pdf'}
                onChange={() => setExportFormat('pdf')}
                className="mr-2 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
              />
              PDF
            </label>
            <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                name="exportFormat"
                value="word"
                checked={exportFormat === 'word'}
                onChange={() => setExportFormat('word')}
                className="mr-2 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
              />
              Word (.docx)
            </label>
          </div>
          <button
            onClick={handleExport}
            disabled={!eventId || isLoading || reviews.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 dark:disabled:bg-gray-600"
          >
            Exportar Reseñas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 text-center sm:text-left">
            Reseñas del Evento: <span className="font-normal">{eventId}</span>
          </h1>
          <div className="flex flex-col items-center gap-3">
             <div className="flex space-x-3 items-center">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Formato:</label>
                <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    name="exportFormatOption"
                    value="pdf"
                    checked={exportFormat === 'pdf'}
                    onChange={() => setExportFormat('pdf')}
                    className="mr-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                  />
                  PDF
                </label>
                <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    name="exportFormatOption"
                    value="word"
                    checked={exportFormat === 'word'}
                    onChange={() => setExportFormat('word')}
                    className="mr-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                  />
                  Word
                </label>
            </div>
            <button
              onClick={handleExport}
              disabled={!eventId || isLoading || reviews.length === 0}
              className="w-full sm:w-auto px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 dark:disabled:bg-gray-600"
            >
              Exportar Reseñas
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-5 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex justify-between items-start mb-2">
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full
                    ${review.rating >= 8
                      ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100'
                      : review.rating >= 5
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-100'
                        : 'bg-red-100 text-red-800 dark:bg-red-600 dark:text-red-100'
                    }`}
                >
                  Calificación: {review.rating}/10
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDateTime(review.createdAt)}
                </span>
              </div>

              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-3">
                {review.comment}
              </p>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                Autor: <span className="font-medium text-gray-800 dark:text-gray-200">
                  {review.isAnonymous ? 'Anónimo' : review.authorId}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewView;
