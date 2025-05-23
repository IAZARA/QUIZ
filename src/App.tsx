import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, createRoutesFromChildren, matchRoutes, useLocation, useNavigationType } from 'react-router-dom';
import { I18nextProvider, useTranslation } from 'react-i18next';
import i18n from './i18n';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AudienceView from './pages/AudienceView';
import Registration from './pages/Registration';
import { useAuthStore } from './store/authStore';
import { useQuestionStore } from './store/questionStore';
import { useParticipantStore } from './store/participantStore';

// Definir future flags para eliminar advertencias
const router = {
  basename: "/",
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

function ProtectedParticipantRoute({ children }: { children: React.ReactNode }) {
  const isRegistered = useParticipantStore((state) => state.isRegistered);
  
  if (!isRegistered) {
    return <Navigate to="/register" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Inicializar el store de preguntas
  const initialize = useQuestionStore((state) => state.initialize);
  const initialized = useQuestionStore((state) => state.initialized);
  
  useEffect(() => {
    const initApp = async () => {
      try {
        await initialize();
      } catch (err) {
        console.error('Error al inicializar la aplicación:', err);
        setError('Error al conectar con el servidor. Por favor, verifica tu conexión.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (!initialized) {
      initApp();
    } else {
      setIsLoading(false);
    }
  }, [initialize, initialized]);
  
  // Pantalla de carga
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('loading')}</h2>
          <p className="text-gray-600 mb-4">
            {/* Assuming you might want a more specific message here, or remove it if 'loading' is enough */}
            {t('loading')}
          </p>
        </div>
      </div>
    );
  }
  
  // Pantalla de error
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">{t('connectionErrorTitle')}</h2>
          <p className="text-gray-600 mb-4">{t('connectionError')}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {t('retryButton')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          <ProtectedParticipantRoute>
            <AudienceView />
          </ProtectedParticipantRoute>
        } 
      />
      <Route path="/register" element={<Registration />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedAdminRoute>
            <AdminDashboard />
          </ProtectedAdminRoute>
        } 
      />
      {/* Redirigir cualquier ruta no encontrada */}
      <Route path="*" element={<Navigate to="/register" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter future={router.future} basename={router.basename}>
        <Suspense fallback={<div>Loading...</div>}>
          <AppContent />
        </Suspense>
      </BrowserRouter>
    </I18nextProvider>
  );
}

export default App;