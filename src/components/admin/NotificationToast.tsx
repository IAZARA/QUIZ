import React from 'react';
import { Check, AlertCircle, Info } from 'lucide-react';

interface NotificationToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ message, type, onClose }) => {
  const bgColor = 
    type === 'success' ? 'bg-green-50 border-green-500' :
    type === 'error' ? 'bg-red-50 border-red-500' :
    'bg-blue-50 border-blue-500';
  
  const textColor = 
    type === 'success' ? 'text-green-800' :
    type === 'error' ? 'text-red-800' :
    'text-blue-800';
  
  const icon = 
    type === 'success' ? <Check className="h-5 w-5 text-green-500" /> :
    type === 'error' ? <AlertCircle className="h-5 w-5 text-red-500" /> :
    <Info className="h-5 w-5 text-blue-500" />;

  return (
    <div className={`fixed top-4 right-4 max-w-md p-4 rounded-md shadow-lg border-l-4 ${bgColor} animate-fadeIn z-50`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${textColor}`}>{message}</p>
        </div>
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={onClose}
            className={`inline-flex ${textColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            <span className="sr-only">Cerrar</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;
