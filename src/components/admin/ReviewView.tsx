import React, { useEffect, useState, useMemo } from 'react';
import { useReviewStore } from '../../store/reviewStore';
import { Review } from '../../types';
import { Download } from 'lucide-react';

interface ReviewViewProps {
  eventId: string;
}

const ReviewView: React.FC<ReviewViewProps> = ({ eventId }) => {
  const {
    reviews,
    isLoading,
    error,
    isReviewsActive,
    fetchReviews,
    fetchReviewsStatus,
    activateReviews,
    deactivateReviews
  } = useReviewStore();
  const [exportFormat, setExportFormat] = useState<'pdf' | 'word' | 'excel'>('pdf');
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating-high' | 'rating-low'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 6;

  useEffect(() => {
    if (eventId) {
      fetchReviews(eventId);
      fetchReviewsStatus();
    }
  }, [eventId, fetchReviews, fetchReviewsStatus]);

  // Estadísticas calculadas
  const statistics = useMemo(() => {
    if (reviews.length === 0) return null;
    
    const totalReviews = reviews.length;
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    const ratingDistribution = {
      high: reviews.filter(r => r.rating >= 8).length,
      medium: reviews.filter(r => r.rating >= 5 && r.rating < 8).length,
      low: reviews.filter(r => r.rating < 5).length
    };
    
    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      anonymousCount: reviews.filter(r => r.isAnonymous).length
    };
  }, [reviews]);

  // Filtrado y ordenamiento de reseñas
  const filteredAndSortedReviews = useMemo(() => {
    let filtered = reviews.filter(review => {
      const matchesSearch = review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           review.authorId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRating = ratingFilter === 'all' ||
                           (ratingFilter === 'high' && review.rating >= 8) ||
                           (ratingFilter === 'medium' && review.rating >= 5 && review.rating < 8) ||
                           (ratingFilter === 'low' && review.rating < 5);
      
      return matchesSearch && matchesRating;
    });

    // Ordenamiento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'rating-high':
          return b.rating - a.rating;
        case 'rating-low':
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

    return filtered;
  }, [reviews, searchTerm, ratingFilter, sortBy]);

  // Paginación
  const totalPages = Math.ceil(filteredAndSortedReviews.length / reviewsPerPage);
  const paginatedReviews = filteredAndSortedReviews.slice(
    (currentPage - 1) * reviewsPerPage,
    currentPage * reviewsPerPage
  );

  // Reset página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, ratingFilter, sortBy]);

  const handleActivateReviews = async () => {
    await activateReviews();
  };

  const handleDeactivateReviews = async () => {
    await deactivateReviews();
  };

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
      return dateString;
    }
  };

  const convertToCSV = (reviewsToConvert: Review[]) => {
    const headers = ['Calificación', 'Comentario', 'Autor', 'Anónimo', 'Fecha de Creación'];
    const rows = reviewsToConvert.map(review =>
      [
        `"${review.rating}/10"`,
        `"${(review.comment || '').replace(/"/g, '""')}"`,
        `"${review.authorId.replace(/"/g, '""')}"`,
        `"${review.isAnonymous ? 'Sí' : 'No'}"`,
        `"${formatDateTime(review.createdAt)}"`
      ].join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  };

  const handleExportExcel = () => {
    if (filteredAndSortedReviews.length === 0) {
      alert('No hay reseñas para exportar.');
      return;
    }
    
    const csvData = convertToCSV(filteredAndSortedReviews);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `reseñas-${eventId}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      alert('La exportación a CSV no es compatible con este navegador.');
    }
  };

  const handleExport = () => {
    if (!eventId) {
      console.error('No eventId provided for export.');
      return;
    }

    if (exportFormat === 'excel') {
      handleExportExcel();
      return;
    }

    const url = `/api/reviews/export?eventId=${eventId}&format=${exportFormat}`;
    try {
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reviews-${eventId}.${exportFormat}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  if (!eventId) {
    return (
      <div className="p-4 text-center text-gray-600 ">
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
      <div className="p-4 text-center text-red-600 bg-red-50 border border-red-300 rounded-md">
        Error al cargar reseñas: {error}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Header con controles de activación */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Gestión de Reseñas
                  </h1>
                  <p className="text-gray-600">
                    Evento: <span className="font-medium text-gray-900">{eventId}</span>
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleActivateReviews}
                    disabled={isReviewsActive}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      isReviewsActive
                        ? 'bg-green-100 text-green-800 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md'
                    }`}
                  >
                    {isReviewsActive ? '✓ Formulario Activo' : 'Activar Formulario'}
                  </button>
                  
                  <button
                    onClick={handleDeactivateReviews}
                    disabled={!isReviewsActive}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      !isReviewsActive
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-md'
                    }`}
                  >
                    Desactivar Formulario
                  </button>
                </div>
              </div>

              {/* Indicador de estado */}
              <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    isReviewsActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Estado: {isReviewsActive ? 'Activo' : 'Inactivo'}
                    </span>
                    <p className="text-xs text-gray-600 mt-1">
                      {isReviewsActive
                        ? 'Los participantes pueden enviar reseñas del evento'
                        : 'El formulario de reseñas está oculto para los participantes'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Estado vacío mejorado */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m10 0v10a2 2 0 01-2 2H9a2 2 0 01-2-2V8m10 0H7m5 5.5a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Aún no hay reseñas para este evento
              </h3>
              
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {isReviewsActive
                  ? 'El formulario está activo. Las reseñas aparecerán aquí cuando los participantes las envíen.'
                  : 'Activa el formulario de reseñas para que los participantes puedan enviar sus comentarios.'
                }
              </p>

              {/* Opciones de exportación */}
              <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
                <h4 className="text-sm font-medium text-gray-900 mb-4">
                  Opciones de Exportación
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                  <label className="flex items-center text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="exportFormat"
                      value="pdf"
                      checked={exportFormat === 'pdf'}
                      onChange={() => setExportFormat('pdf')}
                      className="mr-2 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="flex items-center gap-1">
                      📄 PDF
                    </span>
                  </label>
                  <label className="flex items-center text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="exportFormat"
                      value="word"
                      checked={exportFormat === 'word'}
                      onChange={() => setExportFormat('word')}
                      className="mr-2 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="flex items-center gap-1">
                      📝 Word
                    </span>
                  </label>
                  <label className="flex items-center text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="exportFormat"
                      value="excel"
                      checked={exportFormat === 'excel'}
                      onChange={() => setExportFormat('excel')}
                      className="mr-2 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="flex items-center gap-1">
                      📊 Excel
                    </span>
                  </label>
                </div>
                
                <button
                  onClick={handleExport}
                  disabled={!eventId || isLoading || reviews.length === 0}
                  className="w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed transition-all duration-200"
                >
                  Exportar Reseñas (Sin datos)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-gray-50  min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header con controles de activación */}
        <div className="bg-white  rounded-lg shadow-sm border border-gray-200  mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900  mb-2">
                  Gestión de Reseñas
                </h1>
                <p className="text-gray-600 ">
                  Evento: <span className="font-medium text-gray-900 ">{eventId}</span>
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleActivateReviews}
                  disabled={isReviewsActive}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isReviewsActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md'
                  }`}
                >
                  {isReviewsActive ? '✓ Formulario Activo' : 'Activar Formulario'}
                </button>
                
                <button
                  onClick={handleDeactivateReviews}
                  disabled={!isReviewsActive}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    !isReviewsActive
                      ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-md'
                  }`}
                >
                  Desactivar Formulario
                </button>
              </div>
            </div>

            {/* Indicador de estado */}
            <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  isReviewsActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`}></div>
                <div>
                  <span className="text-sm font-medium text-gray-900 ">
                    Estado: {isReviewsActive ? 'Activo' : 'Inactivo'}
                  </span>
                  <p className="text-xs text-gray-600  mt-1">
                    {isReviewsActive 
                      ? 'Los participantes pueden enviar reseñas del evento'
                      : 'El formulario de reseñas está oculto para los participantes'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de estadísticas */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white  rounded-lg shadow-sm border border-gray-200  p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 ">Total Reseñas</p>
                  <p className="text-2xl font-bold text-gray-900 ">{statistics.totalReviews}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white  rounded-lg shadow-sm border border-gray-200  p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 ">Calificación Promedio</p>
                  <p className="text-2xl font-bold text-gray-900 ">{statistics.averageRating}/10</p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white  rounded-lg shadow-sm border border-gray-200  p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 ">Reseñas Positivas</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{statistics.ratingDistribution.high}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white  rounded-lg shadow-sm border border-gray-200  p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 ">Anónimas</p>
                  <p className="text-2xl font-bold text-gray-900 ">{statistics.anonymousCount}</p>
                </div>
                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600 " fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controles de filtrado y búsqueda */}
        <div className="bg-white  rounded-lg shadow-sm border border-gray-200  mb-6">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Búsqueda */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Buscar en reseñas
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por comentario o autor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 "
                  />
                  <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Filtro por calificación */}
              <div className="lg:w-48">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Filtrar por calificación
                </label>
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 "
                >
                  <option value="all">Todas las calificaciones</option>
                  <option value="high">Altas (8-10)</option>
                  <option value="medium">Medias (5-7)</option>
                  <option value="low">Bajas (1-4)</option>
                </select>
              </div>

              {/* Ordenamiento */}
              <div className="lg:w-48">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ordenar por
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 "
                >
                  <option value="newest">Más recientes</option>
                  <option value="oldest">Más antiguas</option>
                  <option value="rating-high">Calificación alta</option>
                  <option value="rating-low">Calificación baja</option>
                </select>
              </div>

              {/* Exportación */}
              <div className="lg:w-48">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Exportar
                </label>
                <div className="flex gap-2">
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as any)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 "
                  >
                    <option value="pdf">PDF</option>
                    <option value="word">Word</option>
                  </select>
                  <button
                    onClick={handleExport}
                    disabled={!eventId || isLoading || filteredAndSortedReviews.length === 0}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-all duration-200"
                    title="Exportar reseñas"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Información de resultados */}
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600 ">
              <span>
                Mostrando {paginatedReviews.length} de {filteredAndSortedReviews.length} reseñas
                {filteredAndSortedReviews.length !== reviews.length && ` (${reviews.length} total)`}
              </span>
              {(searchTerm || ratingFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setRatingFilter('all');
                    setSortBy('newest');
                  }}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Lista de reseñas */}
        <div className="space-y-4 mb-6">
          {paginatedReviews.map((review) => (
            <div
              key={review._id}
              className="bg-white  shadow-sm rounded-lg border border-gray-200  hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 text-sm font-semibold rounded-full ${
                        review.rating >= 8
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : review.rating >= 5
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {review.rating}/10
                    </span>
                    <div className="flex items-center gap-1">
                      {[...Array(10)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 ">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {review.isAnonymous ? 'Anónimo' : review.authorId}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDateTime(review.createdAt)}
                    </span>
                  </div>
                </div>

                {review.comment && (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="bg-white  rounded-lg shadow-sm border border-gray-200 ">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed  dark:border-gray-600  dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  >
                    Anterior
                  </button>
                  
                  {/* Números de página */}
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg ${
                            currentPage === page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-700  dark:border-gray-600  dark:hover:bg-gray-700 dark:hover:text-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2 text-gray-500">...</span>;
                    }
                    return null;
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed  dark:border-gray-600  dark:hover:bg-gray-700 dark:hover:text-gray-300"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewView;
