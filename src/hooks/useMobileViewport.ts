import { useEffect, useState } from 'react';

interface ViewportInfo {
  width: number;
  height: number;
  isMobile: boolean;
  isLandscape: boolean;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export const useMobileViewport = (): ViewportInfo => {
  const [viewport, setViewport] = useState<ViewportInfo>({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth <= 768,
    isLandscape: window.innerWidth > window.innerHeight,
    safeAreaInsets: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    }
  });

  useEffect(() => {
    const updateViewport = () => {
      // Obtener safe area insets si están disponibles
      const computedStyle = getComputedStyle(document.documentElement);
      const safeAreaTop = parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0');
      const safeAreaBottom = parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0');
      const safeAreaLeft = parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0');
      const safeAreaRight = parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0');

      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth <= 768,
        isLandscape: window.innerWidth > window.innerHeight,
        safeAreaInsets: {
          top: safeAreaTop,
          bottom: safeAreaBottom,
          left: safeAreaLeft,
          right: safeAreaRight
        }
      });
    };

    // Actualizar al cargar
    updateViewport();

    // Escuchar cambios de viewport
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', () => {
      // Delay para permitir que el viewport se actualice después del cambio de orientación
      setTimeout(updateViewport, 100);
    });

    // Escuchar cambios de viewport height en móviles (teclado virtual)
    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        updateViewport();
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    }

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      }
    };
  }, []);

  return viewport;
};

// Hook para detectar si el teclado virtual está abierto
export const useVirtualKeyboard = () => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const viewport = useMobileViewport();

  useEffect(() => {
    if (!viewport.isMobile) return;

    const initialHeight = window.innerHeight;
    
    const checkKeyboard = () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialHeight - currentHeight;
      
      // Si la altura se reduce significativamente, probablemente el teclado está abierto
      setIsKeyboardOpen(heightDifference > 150);
    };

    window.addEventListener('resize', checkKeyboard);
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', checkKeyboard);
    }

    return () => {
      window.removeEventListener('resize', checkKeyboard);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', checkKeyboard);
      }
    };
  }, [viewport.isMobile]);

  return isKeyboardOpen;
};