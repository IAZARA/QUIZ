import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLinkSharingStore } from '../../store/linkSharingStore';
import { ExternalLink, Globe, ArrowRight, Info } from 'lucide-react';

const LinkSharingView: React.FC = () => {
  const { t } = useTranslation();
  const {
    activeLink,
    activeLinks,
    isLinkSharingActive,
    initializeSocket,
    socket
  } = useLinkSharingStore();

  useEffect(() => {
    // Inicializar socket si no existe
    if (!socket) {
      initializeSocket();
    }

    // Solicitar estado actual al conectarse
    if (socket) {
      socket.emit('request:link-status');
    }
  }, [socket, initializeSocket]);

  const handleLinkClick = (url: string) => {
    // Abrir en nueva pestaña
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Si no hay links activos (ni individual ni múltiples)
  if (!activeLink && activeLinks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-600 mb-2">
            No hay enlaces compartidos
          </h3>
          <p className="text-gray-500">
            El presentador compartirá enlaces cuando estén disponibles
          </p>
        </div>
      </div>
    );
  }

  // Si hay múltiples links activos (compartir todos)
  if (activeLinks.length > 0) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Globe className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Enlaces Compartidos
          </h2>
          <p className="text-gray-600">
            El presentador ha compartido {activeLinks.length} enlaces contigo
          </p>
        </div>

        {/* Grid de Links */}
        <div className="grid gap-6 md:grid-cols-2">
          {activeLinks.map((link, index) => (
            <div key={link._id || index} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="p-6">
                {/* Título */}
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex-1">
                    {link.title}
                  </h3>
                  <div className="ml-4 p-2 bg-blue-50 rounded-lg">
                    <ExternalLink className="h-4 w-4 text-blue-600" />
                  </div>
                </div>

                {/* URL */}
                <div className="mb-4">
                  <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                    <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-blue-600 font-medium truncate text-sm">
                      {link.url}
                    </span>
                  </div>
                </div>

                {/* Descripción */}
                {link.description && (
                  <div className="mb-4">
                    <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                      <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {link.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Botón de acción */}
                <button
                  onClick={() => handleLinkClick(link.url)}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 font-medium text-sm"
                >
                  <span>Abrir Enlace</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Nota de seguridad */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              <strong>Nota de seguridad:</strong> Estos enlaces se abrirán en nuevas pestañas.
              Asegúrate de que confías en el presentador antes de hacer clic.
            </p>
          </div>
        </div>

        {/* Instrucciones adicionales */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            💡 Mantén esta página abierta para recibir nuevos enlaces del presentador
          </p>
        </div>
      </div>
    );
  }

  // Si hay un link individual activo
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Globe className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Enlace Compartido
        </h2>
        <p className="text-gray-600">
          El presentador ha compartido el siguiente enlace contigo
        </p>
      </div>

      {/* Link Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
        <div className="p-6">
          {/* Título */}
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 flex-1">
              {activeLink!.title}
            </h3>
            <div className="ml-4 p-2 bg-blue-50 rounded-lg">
              <ExternalLink className="h-5 w-5 text-blue-600" />
            </div>
          </div>

          {/* URL */}
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">Enlace:</p>
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-blue-600 font-medium truncate">
                {activeLink!.url}
              </span>
            </div>
          </div>

          {/* Descripción */}
          {activeLink!.description && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">Descripción:</p>
              <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700 text-sm leading-relaxed">
                  {activeLink!.description}
                </p>
              </div>
            </div>
          )}

          {/* Botón de acción */}
          <button
            onClick={() => handleLinkClick(activeLink!.url)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 font-medium"
          >
            <span>Abrir Enlace</span>
            <ArrowRight className="h-5 w-5" />
          </button>

          {/* Nota de seguridad */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-800">
                <strong>Nota de seguridad:</strong> Este enlace se abrirá en una nueva pestaña.
                Asegúrate de que confías en el presentador antes de hacer clic.
              </p>
            </div>
          </div>
        </div>

        {/* Footer con timestamp */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Compartido por el presentador • {new Date(activeLink!.updatedAt).toLocaleString('es-ES')}
          </p>
        </div>
      </div>

      {/* Instrucciones adicionales */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          💡 Mantén esta página abierta para recibir nuevos enlaces del presentador
        </p>
      </div>
    </div>
  );
};

export default LinkSharingView;