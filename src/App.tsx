import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, createRoutesFromChildren, matchRoutes, useLocation, useNavigationType } from 'react-router-dom';
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

function App() {
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Cargando...</h2>
          <p className="text-gray-600 mb-4">
            Conectando con el servidor, por favor espera.
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
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error de Conexión</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter future={router.future} basename={router.basename}>
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
    </BrowserRouter>
  );
}

export default App;