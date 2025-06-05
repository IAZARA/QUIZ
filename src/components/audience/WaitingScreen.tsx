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
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-tertiary flex flex-col items-center justify-center relative overflow-hidden">
      {/* Elementos decorativos de fondo minimalistas */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-accent/5 blur-2xl rounded-full animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-accent/8 blur-2xl rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/3 blur-3xl rounded-full animate-pulse-subtle"></div>
      
      {/* Patrón geométrico sutil */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" className="text-text-primary" />
        </svg>
      </div>

      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setShowQR(!showQR)}
          className="bg-bg-secondary/80 backdrop-blur-sm border border-border-light hover:bg-bg-secondary hover:border-accent/30 p-3 rounded-xl transition-all duration-normal ease-out shadow-md hover:shadow-lg micro-scale group"
        >
          {showQR ? (
            <X className="h-5 w-5 text-text-primary group-hover:text-accent transition-colors duration-normal" />
          ) : (
            <QrCode className="h-5 w-5 text-text-primary group-hover:text-accent transition-colors duration-normal" />
          )}
        </button>
      </div>

      {showQR ? (
        <div
          className="text-center bg-bg-secondary/95 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-border-light relative overflow-hidden z-10 animate-fadeInScale max-w-sm mx-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="qrModalTitle"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-accent-purple rounded-t-2xl"></div>
          <div className="relative z-10">
            <h2 id="qrModalTitle" className="text-xl font-semibold text-text-primary mb-6">
              {t('scanToParticipate')}
            </h2>
            <div className="p-4 bg-white rounded-xl shadow-sm mb-6 micro-hover">
              <QRCode
                value="https://iazarate.com"
                size={180}
                className="mx-auto"
              />
            </div>
            <div className="flex items-center justify-center text-text-secondary text-sm">
              <span className="mr-2 font-medium">iazarate.com</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center relative z-10 max-w-2xl mx-auto px-6">
          <div className="mb-12 flex flex-col items-center justify-center">
            <div className="relative mb-8">
              <div className="absolute -inset-6 bg-accent/10 blur-2xl rounded-full animate-breathe"></div>
              <img
                src="/escudo.png"
                alt={t('appLogoDescription')}
                className="h-32 drop-shadow-lg animate-fadeIn relative z-10 micro-hover"
              />
            </div>
            <div className="relative">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary animate-fadeInUp">
                {t('interactiveQuiz')}
              </h1>
              <div className="h-0.5 w-24 mx-auto bg-gradient-to-r from-accent to-accent-purple rounded-full mb-4 animate-slideInRight"></div>
              <p className="text-lg text-text-secondary font-medium animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
                {t('getReadyToParticipate')}
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="card micro-hover animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
              <h2 className="text-xl font-semibold text-text-primary mb-6">
                {t('waitingForPresenter')}
              </h2>

              <div className="flex justify-center space-x-3 mb-4">
                <div className="animate-bounce h-3 w-3 bg-accent rounded-full shadow-sm" style={{ animationDelay: '0ms' }}></div>
                <div className="animate-bounce h-3 w-3 bg-accent/80 rounded-full shadow-sm" style={{ animationDelay: '150ms' }}></div>
                <div className="animate-bounce h-3 w-3 bg-accent/60 rounded-full shadow-sm" style={{ animationDelay: '300ms' }}></div>
              </div>
              
              <p className="text-sm text-text-muted">
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
