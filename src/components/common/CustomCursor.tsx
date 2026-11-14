import React, { useEffect, useRef, useState } from 'react';

const INTERACTIVE_SELECTOR =
  'a, button, input, textarea, select, canvas, video, [role="button"], label, .interactive-hover';

export const CustomCursor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [hasMouse, setHasMouse] = useState(false);

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const animFrameId = useRef<number | null>(null);
  const visibleRef = useRef(false);
  const hoveredRef = useRef(false);
  const lastTargetRef = useRef<EventTarget | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (isTouch) return;

    setHasMouse(true);
    document.documentElement.classList.add('custom-cursor-active');

    let isDisposed = false;

    const tick = () => {
      if (isDisposed) return;

      const dx = mousePos.current.x - ringPos.current.x;
      const dy = mousePos.current.y - ringPos.current.y;

      if (Math.abs(dx) < 0.2 && Math.abs(dy) < 0.2) {
        ringPos.current.x = mousePos.current.x;
        ringPos.current.y = mousePos.current.y;
        if (ringRef.current) {
          ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
        }
        // Sleep when settled so idle cursor uses 0% CPU/GPU
        animFrameId.current = null;
        return;
      }

      const lerp = 0.22;
      ringPos.current.x += dx * lerp;
      ringPos.current.y += dy * lerp;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
      }

      animFrameId.current = requestAnimationFrame(tick);
    };

    const ensureLoopRunning = () => {
      if (animFrameId.current === null && !isDisposed) {
        animFrameId.current = requestAnimationFrame(tick);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      const firstMove = !visibleRef.current;
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;

      if (firstMove) {
        ringPos.current.x = e.clientX;
        ringPos.current.y = e.clientY;
        visibleRef.current = true;
        setIsVisible(true);
        if (ringRef.current) {
          ringRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
        }
      }

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      if (e.target !== lastTargetRef.current) {
        lastTargetRef.current = e.target;
        const target = e.target as HTMLElement | null;
        const nextHovered = Boolean(target && target.closest(INTERACTIVE_SELECTOR));
        if (nextHovered !== hoveredRef.current) {
          hoveredRef.current = nextHovered;
          setIsHovered(nextHovered);
        }
      }

      ensureLoopRunning();
    };

    const onMouseDown = () => setIsClicking(true);
    const onMouseUp = () => setIsClicking(false);
    const onMouseLeave = () => {
      if (visibleRef.current) {
        visibleRef.current = false;
        setIsVisible(false);
      }
    };
    const onMouseEnter = () => {
      if (!visibleRef.current) {
        visibleRef.current = true;
        setIsVisible(true);
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    return () => {
      isDisposed = true;
      document.documentElement.classList.remove('custom-cursor-active');
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      if (animFrameId.current !== null) cancelAnimationFrame(animFrameId.current);
    };
  }, []);

  if (!hasMouse) return null;

  return (
    <>
      {/* 1. Pinpoint Sharp Center Red Dot */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className={`pointer-events-none fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 z-[9999] transition-opacity duration-150 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ willChange: 'transform' }}
      >
        <div
          className={`w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)] transition-transform duration-150 ${
            isClicking ? 'scale-75' : isHovered ? 'scale-150 bg-red-400' : 'scale-100'
          }`}
        />
      </div>

      {/* 2. Trailing Smooth Atmospheric Ring with Red Ambient Glow */}
      <div
        ref={ringRef}
        aria-hidden="true"
        className={`pointer-events-none fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 z-[9998] transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ willChange: 'transform' }}
      >
        <div
          className={`rounded-full transition-[width,height,border-color,background-color] duration-200 ease-out border ${
            isHovered
              ? 'w-12 h-12 border-red-500 bg-red-500/15 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
              : isClicking
              ? 'w-7 h-7 border-red-400 bg-red-500/25 shadow-[0_0_12px_rgba(239,68,68,0.55)]'
              : 'w-8 h-8 border-red-500/50 bg-red-500/5 shadow-[0_0_10px_rgba(239,68,68,0.18)]'
          }`}
        />
      </div>
    </>
  );
};
