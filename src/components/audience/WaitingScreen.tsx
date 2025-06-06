import React from 'react';
import { useTranslation } from 'react-i18next';
import { QrCode, X } from 'lucide-react';
import QRCode from 'react-qr-code';
import LoadingDots from '../common/LoadingDots';
import { useIconStore } from '../../store/iconStore';

interface WaitingScreenProps {
  showQR: boolean;
  setShowQR: (show: boolean) => void;
}

const WaitingScreen: React.FC<WaitingScreenProps> = ({ showQR, setShowQR }) => {
  const { t } = useTranslation();
  const { selectedIcon } = useIconStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Elementos decorativos de fondo minimalistas */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-400/5 blur-2xl rounded-full animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-blue-400/8 blur-2xl rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-400/3 blur-3xl rounded-full animate-pulse-subtle"></div>
      
      {/* Patrón geométrico sutil */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" className="text-white" />
        </svg>
      </div>

      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setShowQR(!showQR)}
          className="bg-blue-800/80 backdrop-blur-sm border border-blue-600/30 hover:bg-blue-700 hover:border-blue-400/50 p-3 rounded-xl transition-all duration-200 ease-out shadow-md hover:shadow-lg transform hover:scale-105 group"
        >
          {showQR ? (
            <X className="h-5 w-5 text-white group-hover:text-blue-300 transition-colors duration-200" />
          ) : (
            <QrCode className="h-5 w-5 text-white group-hover:text-blue-300 transition-colors duration-200" />
          )}
        </button>
      </div>

      {showQR ? (
        <div
          className="text-center bg-blue-800/95 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-blue-600/30 relative overflow-hidden z-10 animate-fadeInScale max-w-sm mx-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="qrModalTitle"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-300 rounded-t-2xl"></div>
          <div className="relative z-10">
            <h2 id="qrModalTitle" className="text-xl font-semibold text-white mb-6">
              {t('scanToParticipate')}
            </h2>
            <div className="p-4 bg-white rounded-xl shadow-sm mb-6 transform hover:scale-105 transition-transform duration-200">
              <QRCode
                value="https://iazarate.com"
                size={180}
                className="mx-auto"
              />
            </div>
            <div className="flex items-center justify-center text-blue-200 text-sm">
              <span className="mr-2 font-medium">iazarate.com</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center relative z-10 max-w-2xl mx-auto px-6">
          <div className="mb-12 flex flex-col items-center justify-center">
            <div className="relative mb-8">
              <div className="absolute -inset-6 bg-blue-400/10 blur-2xl rounded-full animate-breathe"></div>
              <img
                src={selectedIcon.path}
                alt={selectedIcon.name}
                className="h-32 drop-shadow-lg animate-fadeIn relative z-10 transform hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  // Fallback al escudo por defecto si hay error
                  const target = e.target as HTMLImageElement;
                  target.src = '/escudo.png';
                }}
              />
            </div>
            <div className="relative">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white animate-fadeInUp">
                {t('interactiveQuiz')}
              </h1>
              <div className="h-0.5 w-24 mx-auto bg-gradient-to-r from-blue-400 to-blue-300 rounded-full mb-4 animate-slideInRight"></div>
              <p className="text-lg text-blue-200 font-medium animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                {t('getReadyToParticipate')}
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="bg-blue-800/80 backdrop-blur-md border border-blue-600/30 rounded-lg p-6 shadow-xl transform hover:scale-105 transition-all duration-200 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
              <h2 className="text-xl font-semibold text-white mb-6">
                Esperando a que el presentador inicie
              </h2>

              <div className="flex justify-center mb-6">
                <LoadingDots size="md" color="white" className="animate-fadeIn" />
              </div>
              
              <p className="text-sm text-blue-200">
                El presentador iniciará la sesión en breve
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitingScreen;
