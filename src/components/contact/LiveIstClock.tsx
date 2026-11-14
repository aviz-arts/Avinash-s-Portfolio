import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Single rolling digit that smoothly animates downwards on change
const RollingDigit: React.FC<{ value: string }> = ({ value }) => {
  return (
    <div className="relative inline-flex items-center justify-center w-[0.62em] h-[1.15em] overflow-hidden leading-none select-none">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 flex items-center justify-center font-mono font-bold leading-none"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

export const LiveIstClock: React.FC = () => {
  const [time, setTime] = useState(() => getIstParts());

  useEffect(() => {
    // Initial sync
    setTime(getIstParts());

    // Update every second
    const interval = setInterval(() => {
      setTime(getIstParts());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center my-2">
      <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-5 px-5 py-2.5 sm:px-6 sm:py-3 bg-zinc-950/95 border border-zinc-800/90 rounded-2xl shadow-xl">
        {/* Label & Pulsing Beacon */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          </span>
          <span className="text-[11px] sm:text-xs font-mono font-bold tracking-widest text-zinc-300 uppercase">
            LIVE IST TIME
          </span>
          <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
            (UTC+05:30)
          </span>
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

        {/* Number Going Down Animated Clock */}
        <div className="flex items-center font-mono text-lg sm:text-2xl font-bold text-white tracking-tight leading-none">
          {/* Hours (2 digits) */}
          <div className="inline-flex items-center">
            <RollingDigit value={time.h1} />
            <RollingDigit value={time.h2} />
          </div>

          {/* Animated Blinking Colon */}
          <span className="text-red-500 mx-0.5 inline-flex items-center leading-none animate-pulse select-none">:</span>

          {/* Minutes (2 digits) */}
          <div className="inline-flex items-center">
            <RollingDigit value={time.m1} />
            <RollingDigit value={time.m2} />
          </div>

          {/* Animated Blinking Colon */}
          <span className="text-red-500 mx-0.5 inline-flex items-center leading-none animate-pulse select-none">:</span>

          {/* Seconds (2 digits) with red glowing emphasis */}
          <div className="inline-flex items-center text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]">
            <RollingDigit value={time.s1} />
            <RollingDigit value={time.s2} />
          </div>

          {/* AM / PM indicator */}
          <span className="ml-2 inline-flex items-center text-xs sm:text-sm font-mono font-bold text-zinc-400 leading-none select-none">
            {time.ampm}
          </span>
        </div>
      </div>
    </div>
  );
};

function getIstParts() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const parts = formatter.formatToParts(now);
  const hourRaw = parts.find((p) => p.type === 'hour')?.value || '12';
  const minuteRaw = parts.find((p) => p.type === 'minute')?.value || '00';
  const secondRaw = parts.find((p) => p.type === 'second')?.value || '00';
  const ampmRaw = parts.find((p) => p.type === 'dayPeriod')?.value?.toUpperCase() || 'AM';

  const hourPadded = hourRaw.padStart(2, '0');
  const minutePadded = minuteRaw.padStart(2, '0');
  const secondPadded = secondRaw.padStart(2, '0');

  return {
    h1: hourPadded[0],
    h2: hourPadded[1],
    m1: minutePadded[0],
    m2: minutePadded[1],
    s1: secondPadded[0],
    s2: secondPadded[1],
    ampm: ampmRaw,
  };
}
