import React from 'react';
import { useTranslation } from 'react-i18next';
import { QrCode, X } from 'lucide-react';
import QRCode from 'react-qr-code';

interface WaitingScreenProps {
  showQR: boolean;
  setShowQR: (show: boolean) => void;
}

const WaitingScreen: React.FC<WaitingScreenProps> = ({ showQR, setShowQR }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-800 to-blue-900 flex flex-col items-center justify-center relative overflow-hidden text-white">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full animate-pulse-slow delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 blur-3xl rounded-full animate-spin-slow"></div>

      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setShowQR(!showQR)}
          className="bg-blue-700/20 dark:bg-blue-700/30 hover:bg-blue-700/30 dark:hover:bg-blue-700/40 p-2 rounded-full transition-all shadow-lg shadow-blue-500/20"
        >
          {showQR ? <X className="h-6 w-6 text-white" /> : <QrCode className="h-6 w-6 text-white" />}
        </button>
      </div>

      {showQR ? (
        <div
          className="text-center bg-blue-700/90 backdrop-blur-md p-8 rounded-xl shadow-2xl relative overflow-hidden z-10 animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="qrModalTitle"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-blue-600 blur-sm opacity-50 rounded-xl"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600"></div>
          <div className="relative z-10">
            <h2 id="qrModalTitle" className="text-2xl font-bold text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-100">
              {t('scanToParticipate')}
            </h2>
            <div className="p-3 bg-white rounded-lg shadow-inner mb-4">
              <QRCode
                value="https://iazarate.com"
                size={200}
                className="mx-auto"
              />
            </div>
            <p className="mt-4 text-blue-100 font-medium flex items-center justify-center">
              <span className="mr-2">iazarate.com</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center text-white relative z-10">
          <div className="mb-8 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="absolute -inset-8 bg-blue-500/20 blur-xl rounded-full animate-pulse-slow"></div>
              <img
                src="/escudo.png"
                alt={t('appLogoDescription')}
                className="h-36 mb-4 drop-shadow-2xl animate-fadeIn relative z-10"
              />
            </div>
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-r from-blue-500/20 to-blue-500/10 blur-xl rounded-full"></div>
              <h1 className="text-5xl font-bold mb-3 relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">{t('interactiveQuiz')}</h1>
              <div className="h-1 w-32 mx-auto bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mb-3"></div>
              <p className="text-xl text-blue-100 relative z-10 font-medium">{t('getReadyToParticipate')}</p>
            </div>
          </div>

          <div className="mb-10 relative">
            <div className="absolute -inset-4 bg-blue-500/10 blur-lg rounded-xl"></div>
            <div className="bg-blue-700/5 dark:bg-blue-700/10 backdrop-blur-sm border border-blue-600/30 rounded-xl p-6 relative z-10 shadow-xl">
              <h2 className="text-2xl font-semibold text-white animate-fadeIn">
                {t('waitingForPresenter')}
              </h2>

              <div className="mt-6 flex justify-center space-x-4">
                <div className="animate-bounce delay-100 h-4 w-4 bg-blue-500 rounded-full shadow-lg shadow-blue-500/30"></div>
                <div className="animate-bounce delay-300 h-4 w-4 bg-blue-500/80 rounded-full shadow-lg shadow-blue-500/30"></div>
                <div className="animate-bounce delay-500 h-4 w-4 bg-blue-500/60 rounded-full shadow-lg shadow-blue-500/30"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitingScreen;
