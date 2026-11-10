import React, { useState, useRef, useEffect, useCallback } from 'react';
import { drawProceduralScene, SceneStyle, PassType } from '../../utils/canvasMedia';

interface LightingComparisonSliderProps {
  style: SceneStyle;
  leftPass?: PassType;
  rightPass?: PassType;
  leftLabel?: string;
  rightLabel?: string;
  className?: string;
}

export const LightingComparisonSlider: React.FC<LightingComparisonSliderProps> = ({
  style,
  leftPass = 'clay',
  rightPass = 'final',
  leftLabel = 'Lighting Only (Clay)',
  rightLabel = 'Final Lit (Lumen GI)',
  className = '',
}) => {
  const [sliderPos, setSliderPos] = useState(50); // percentage 0-100
  const containerRef = useRef<HTMLDivElement>(null);
  const leftCanvasRef = useRef<HTMLCanvasElement>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef(false);

  // Render both canvas passes
  useEffect(() => {
    const render = () => {
      const w = 960;
      const h = 540;

      if (leftCanvasRef.current) {
        leftCanvasRef.current.width = w;
        leftCanvasRef.current.height = h;
        const ctxL = leftCanvasRef.current.getContext('2d');
        if (ctxL) drawProceduralScene(ctxL, w, h, style, leftPass, 0.5);
      }

      if (rightCanvasRef.current) {
        rightCanvasRef.current.width = w;
        rightCanvasRef.current.height = h;
        const ctxR = rightCanvasRef.current.getContext('2d');
        if (ctxR) drawProceduralScene(ctxR, w, h, style, rightPass, 0.5);
      }
    };

    render();
  }, [style, leftPass, rightPass]);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    updatePosition(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className={`relative w-full aspect-video select-none overflow-hidden rounded-xl bg-zinc-950 border border-zinc-800 cursor-ew-resize ${className}`}
    >
      {/* Right Canvas (Base background) */}
      <canvas
        ref={rightCanvasRef}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Left Canvas (Clipped by slider position) */}
      <div
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${sliderPos}%` }}
      >
        <div
          className="relative h-full"
          style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%' }}
        >
          <canvas
            ref={leftCanvasRef}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Split Dividing Line & Drag Handle */}
      <div
        className="absolute inset-y-0 w-0.5 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-zinc-950 border-2 border-red-500 flex items-center justify-center shadow-xl">
          <div className="flex items-center gap-0.5 text-red-400 text-[10px] font-bold">
            <span>‹</span>
            <span>›</span>
          </div>
        </div>
      </div>

      {/* Labels for both sides */}
      <div className="absolute top-3 left-3 pointer-events-none bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 rounded text-xs font-mono text-zinc-300 border border-zinc-800">
        {leftLabel}
      </div>

      <div className="absolute top-3 right-3 pointer-events-none bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 rounded text-xs font-mono text-red-400 border border-zinc-800">
        {rightLabel}
      </div>
    </div>
  );
};
