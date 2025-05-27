import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react'; // Import Loader2 for spinner
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
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-bg-primary rounded-lg shadow-lg p-8 text-center">
          <img src="/escudo.png" alt="App Logo" className="h-24 w-24 mx-auto mb-6" />
          <Loader2 className="animate-spin h-10 w-10 mx-auto text-accent mb-6" />
          <h2 className="text-2xl font-bold text-text-primary mb-3">{t('loading')}</h2>
          <p className="text-text-secondary">
            {t('initializingAppPleaseWait')} 
          </p>
        </div>
      </div>
    );
  }
  
  // Pantalla de error
  if (error) {
    return (
      <div className="min-h-screen bg-bg-secondary flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-bg-primary rounded-lg shadow-lg p-8 text-center">
          <img src="/escudo.png" alt="App Logo" className="h-20 w-20 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-600 mb-3">{t('connectionErrorTitle')}</h2>
          <p className="text-text-secondary mb-6">{t('connectionError')}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-accent text-button-text rounded-md hover:brightness-95 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-bg-primary"
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
        <Suspense fallback={
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--color-bg-secondary)' }}>
            <svg className="animate-spin h-10 w-10 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        }>
          <AppContent />
        </Suspense>
      </BrowserRouter>
    </I18nextProvider>
  );
}

export default App;