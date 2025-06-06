import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLinkSharingStore } from '../../store/linkSharingStore';
import { 
  Link, 
  Plus, 
  Edit, 
  Trash2, 
  Share, 
  StopCircle, 
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  AlertCircle
} from 'lucide-react';

interface LinkFormData {
  title: string;
  url: string;
  description: string;
}

const LinkSharingTab: React.FC = () => {
  const { t } = useTranslation();
  const {
    links,
    activeLink,
    activeLinks,
    isLinkSharingActive,
    loadLinks,
    createLink,
    updateLinkById,
    deleteLinkById,
    shareLink,
    shareAllLinks,
    stopSharingLink,
    initializeSocket
  } = useLinkSharingStore();

  const [showForm, setShowForm] = useState(false);
  const [editingLink, setEditingLink] = useState<string | null>(null);
  const [formData, setFormData] = useState<LinkFormData>({
    title: '',
    url: '',
    description: ''
  });
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

  useEffect(() => {
    loadLinks();
    initializeSocket();
  }, [loadLinks, initializeSocket]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.url.trim()) {
      showNotification('El título y la URL son obligatorios', 'error');
      return;
    }

    // Validar URL
    try {
      new URL(formData.url);
    } catch {
      showNotification('Por favor ingresa una URL válida', 'error');
      return;
    }

    try {
      if (editingLink) {
        await updateLinkById(editingLink, {
          title: formData.title.trim(),
          url: formData.url.trim(),
          description: formData.description.trim(),
          isActive: true
        });
        showNotification('Link actualizado correctamente', 'success');
      } else {
        await createLink({
          title: formData.title.trim(),
          url: formData.url.trim(),
          description: formData.description.trim(),
          isActive: true
        });
        showNotification('Link creado correctamente', 'success');
      }
      
      resetForm();
    } catch (error) {
      showNotification('Error al guardar el link', 'error');
    }
  };

  const resetForm = () => {
    setFormData({ title: '', url: '', description: '' });
    setShowForm(false);
    setEditingLink(null);
  };

  const handleEdit = (link: any) => {
    setFormData({
      title: link.title,
      url: link.url,
      description: link.description || ''
    });
    setEditingLink(link._id);
    setShowForm(true);
  };

  const handleDelete = async (linkId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este link?')) {
      try {
        await deleteLinkById(linkId);
        showNotification('Link eliminado correctamente', 'success');
      } catch (error) {
        showNotification('Error al eliminar el link', 'error');
      }
    }
  };

  const handleShare = async (linkId: string) => {
    try {
      await shareLink(linkId);
      showNotification('Link compartido con la audiencia', 'success');
    } catch (error) {
      showNotification('Error al compartir el link', 'error');
    }
  };

  const handleStopSharing = async () => {
    try {
      await stopSharingLink();
      showNotification('Se detuvo el compartir link', 'success');
    } catch (error) {
      showNotification('Error al detener el compartir link', 'error');
    }
  };

  const handleShareAll = async () => {
    try {
      await shareAllLinks();
      showNotification('Todos los links han sido compartidos con la audiencia', 'success');
    } catch (error) {
      showNotification('Error al compartir todos los links', 'error');
    }
  };


  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Notificación */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 
          notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-100 rounded-full">
              <Link className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Compartir Links</h1>
              <p className="text-gray-600">Gestiona y comparte enlaces con tu audiencia</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Botón Compartir Todos o Detener Compartir */}
            {(activeLink || activeLinks.length > 0) ? (
              <button
                onClick={handleStopSharing}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                <StopCircle className="h-4 w-4" />
                <span>Detener Compartir</span>
              </button>
            ) : links.length > 0 ? (
              <button
                onClick={handleShareAll}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Share className="h-4 w-4" />
                <span>Compartir Todos los Links</span>
              </button>
            ) : null}

            {/* Botón nuevo link */}
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Link</span>
            </button>
          </div>
        </div>

        {/* Estado actual */}
        {(activeLink || activeLinks.length > 0) && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                <Eye className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                {activeLink ? (
                  <>
                    <p className="font-medium text-green-800">✅ Compartiendo link individual:</p>
                    <p className="text-green-700 font-semibold">{activeLink.title}</p>
                    <p className="text-sm text-green-600">La audiencia puede ver este enlace específico</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-green-800">✅ Compartiendo todos los links:</p>
                    <p className="text-green-700 font-semibold">{activeLinks.length} enlaces disponibles</p>
                    <p className="text-sm text-green-600">La audiencia puede ver todos los enlaces guardados</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingLink ? 'Editar Link' : 'Nuevo Link'}
          </h2>
          
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white placeholder-gray-500"
                placeholder="Ej: Sitio web oficial, Documentación, etc."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL *
              </label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white placeholder-gray-500"
                placeholder="https://ejemplo.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white placeholder-gray-500"
                rows={3}
                placeholder="Descripción opcional del enlace"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingLink ? 'Actualizar' : 'Crear'} Link
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de links */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Links Guardados ({links.length})</h2>
        </div>

        {links.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay links guardados</p>
            <p className="text-sm text-gray-400">Crea tu primer link para comenzar</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {links.map((link) => (
              <div key={link._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-medium text-gray-900">{link.title}</h3>
                      {activeLink?._id === link._id && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                          ✅ Visible para Audiencia (Individual)
                        </span>
                      )}
                      {activeLinks.length > 0 && activeLinks.some(activeLink => activeLink._id === link._id) && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                          ✅ Visible para Audiencia (Grupo)
                        </span>
                      )}
                    </div>
                    <p className="text-blue-600 hover:text-blue-800 mb-1">
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1">
                        <span>{link.url}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                    {link.description && (
                      <p className="text-gray-600 text-sm">{link.description}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleShare(link._id!)}
                      disabled={activeLink?._id === link._id}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors font-medium ${
                        activeLink?._id === link._id
                          ? 'bg-green-100 text-green-700 cursor-default'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      <Share className="h-4 w-4" />
                      <span>
                        {activeLink?._id === link._id
                          ? '✅ Compartiendo'
                          : 'Compartir Solo Este'
                        }
                      </span>
                    </button>

                    <button
                      onClick={() => handleEdit(link)}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => handleDelete(link._id!)}
                      className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkSharingTab;