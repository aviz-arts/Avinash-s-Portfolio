import React, { useState, useRef, useEffect } from 'react';
import { drawProceduralScene, SceneStyle, PassType } from '../../utils/canvasMedia';
import { Play, Pause, RotateCcw, Maximize, Volume2, VolumeX, Eye } from 'lucide-react';

interface CinematicVideoPlayerProps {
  style: SceneStyle;
  title: string;
  duration?: string;
  autoPlay?: boolean;
  className?: string;
  videoUrl?: string;
  posterUrl?: string;
}

export const CinematicVideoPlayer: React.FC<CinematicVideoPlayerProps> = ({
  style,
  title,
  duration = '0:42',
  autoPlay = false,
  className = '',
  videoUrl,
  posterUrl,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(42);
  const [selectedPass, setSelectedPass] = useState<PassType>('final');
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 0.5>(1);
  const [isMuted, setIsMuted] = useState(true);
  const isPlayingRef = useRef(isPlaying);
  const timeRef = useRef(0);
  const speedRef = useRef(playbackSpeed);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    if (videoUrl && videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, videoUrl]);

  useEffect(() => {
    speedRef.current = playbackSpeed;
    if (videoUrl && videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, videoUrl]);

  // Video reel animation loop for procedural canvas (when videoUrl is NOT provided)
  useEffect(() => {
    if (videoUrl) return; // skip procedural loop if real uploaded video is active

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 960;
    canvas.height = 540;

    let animId = 0;
    let lastTs = performance.now();

    const loop = (ts: number) => {
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      if (isPlayingRef.current) {
        timeRef.current += dt * speedRef.current;
        if (timeRef.current > 42) timeRef.current = 0; // loop reel at 42s
        setCurrentTime(timeRef.current);
      }

      drawProceduralScene(ctx, 960, 540, style, selectedPass, timeRef.current);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [style, selectedPass, videoUrl]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    timeRef.current = val;
    setCurrentTime(val);
    if (videoUrl && videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
        setVideoDuration(videoRef.current.duration);
      }
    }
  };

  return (
    <div className={`relative group w-full aspect-video rounded-xl overflow-hidden bg-black border border-zinc-800 ${className}`}>
      {/* Real HTML5 Uploaded Video OR Procedural Canvas Surface */}
      {videoUrl ? (
        <video
          ref={videoRef}
          src={videoUrl}
          poster={posterUrl}
          playsInline
          muted={isMuted}
          loop
          onTimeUpdate={handleVideoTimeUpdate}
          onLoadedMetadata={() => {
            if (videoRef.current && videoRef.current.duration) {
              setVideoDuration(videoRef.current.duration);
            }
          }}
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-full h-full object-cover cursor-pointer"
        />
      ) : (
        <canvas
          ref={canvasRef}
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-full h-full object-cover cursor-pointer"
        />
      )}

      {/* Top Bar Video Reel Metadata */}
      <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-xs font-mono text-zinc-200 border border-white/10">
          <span className="text-red-500 font-semibold">{videoUrl ? 'UPLOADED REEL' : 'CINEMATIC REEL'}</span>
          <span className="text-zinc-600">·</span>
          <span>{title}</span>
        </div>

        {/* Live pass selector directly on reel (available for procedural scenes) */}
        {!videoUrl && (
          <div className="pointer-events-auto flex items-center gap-1 bg-black/70 backdrop-blur-md p-1 rounded-lg border border-white/10">
            {(['final', 'clay', 'normals', 'roughness'] as PassType[]).map((pass) => (
              <button
                key={pass}
                onClick={() => setSelectedPass(pass)}
                className={`px-2 py-0.5 text-[10px] font-mono rounded capitalize transition-colors ${
                  selectedPass === pass
                    ? 'bg-red-600 text-white font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {pass}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Center Play Overlay on Pause */}
      {!isPlaying && (
        <button
          onClick={() => setIsPlaying(true)}
          className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-[0_0_24px_rgba(239,68,68,0.4)] hover:scale-105 hover:bg-red-500 transition-all z-20"
          aria-label="Play Reel"
        >
          <Play className="w-7 h-7 fill-current ml-1" />
        </button>
      )}

      {/* Bottom Player Scrub Bar & Controls */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-6 flex flex-col gap-2 transition-opacity z-20">
        {/* Scrubber slider */}
        <input
          type="range"
          min="0"
          max={videoDuration}
          step="0.1"
          value={currentTime}
          onChange={handleScrub}
          className="w-full h-1.5 bg-zinc-700/80 rounded-lg appearance-none cursor-pointer accent-red-500"
        />

        <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1 hover:text-red-400 transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              onClick={() => {
                timeRef.current = 0;
                setCurrentTime(0);
                if (videoUrl && videoRef.current) {
                  videoRef.current.currentTime = 0;
                }
              }}
              className="p-1 hover:text-red-400 transition-colors"
              aria-label="Replay"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {videoUrl && (
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1 hover:text-red-400 transition-colors"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-zinc-400" /> : <Volume2 className="w-4 h-4 text-red-400" />}
              </button>
            )}

            <span className="tabular-nums">
              {formatTime(currentTime)} / {formatTime(videoDuration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 0.5 : 1)}
              className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300"
            >
              {playbackSpeed}x Speed
            </button>
            <span className="text-zinc-500">|</span>
            <span className="text-[11px] text-zinc-400">{videoUrl ? 'Custom Video MP4' : 'UE5 4K Pro-Res'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
