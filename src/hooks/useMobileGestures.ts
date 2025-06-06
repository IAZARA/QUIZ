import { useRef, useEffect } from 'react';

interface GestureHandlers {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
}

export const useMobileGestures = (handlers: GestureHandlers) => {
  const elementRef = useRef<HTMLElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };

      // Iniciar timer para long press
      if (handlers.onLongPress) {
        longPressTimerRef.current = setTimeout(() => {
          handlers.onLongPress?.();
        }, 500);
      }
    };

    const handleTouchMove = () => {
      // Cancelar long press si hay movimiento
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Cancelar long press
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Detectar swipes (movimiento rápido y significativo)
      const minSwipeDistance = 50;
      const maxSwipeTime = 300;

      if (deltaTime < maxSwipeTime && Math.abs(deltaY) > minSwipeDistance && Math.abs(deltaY) > Math.abs(deltaX)) {
        if (deltaY < 0 && handlers.onSwipeUp) {
          e.preventDefault();
          handlers.onSwipeUp();
        } else if (deltaY > 0 && handlers.onSwipeDown) {
          e.preventDefault();
          handlers.onSwipeDown();
        }
      }

      // Detectar double tap
      if (handlers.onDoubleTap && deltaTime < 200 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
          handlers.onDoubleTap();
        }
        lastTapRef.current = now;
      }

      touchStartRef.current = null;
    };

    // Añadir event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, [handlers]);

  return elementRef;
};