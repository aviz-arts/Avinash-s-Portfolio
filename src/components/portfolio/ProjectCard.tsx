import React, { useRef, useEffect, useState } from 'react';
import { ProjectItem } from '../../types/portfolio';
import { drawProceduralScene, PassType } from '../../utils/canvasMedia';
import { Play, Eye, Compass, Layers, ArrowUpRight, Edit3, Trash2 } from 'lucide-react';

interface ProjectCardProps {
  project: ProjectItem;
  onSelect: (project: ProjectItem) => void;
  onOpenInStudio?: (sceneStyle: 'cyberpunk' | 'crypt' | 'turret') => void;
  isOwner?: boolean;
  onEdit?: (project: ProjectItem) => void;
  onDelete?: (projectId: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onSelect,
  onOpenInStudio,
  isOwner,
  onEdit,
  onDelete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activePass, setActivePass] = useState<PassType>('final');
  const [isHovered, setIsHovered] = useState(false);

  // Render thumbnail
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 640;
    canvas.height = 360;

    let animId = 0;
    let t = 0;

    const draw = () => {
      t += 0.02;
      drawProceduralScene(ctx, 640, 360, project.dummySceneStyle, activePass, isHovered ? t : 0.5);
      if (isHovered && project.heroType === 'video') {
        animId = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [project.dummySceneStyle, activePass, isHovered, project.heroType]);

  const studioSceneMap: Record<string, 'cyberpunk' | 'crypt' | 'turret'> = {
    cyberpunk: 'cyberpunk',
    crypt: 'crypt',
    turret: 'turret',
    scifi: 'cyberpunk',
    derelict: 'cyberpunk',
    ruins: 'crypt',
  };

  return (
    <article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-black/50"
    >
      {/* Media Container (16:9) */}
      <div
        onClick={() => onSelect(project)}
        className="relative w-full aspect-video bg-zinc-950 overflow-hidden cursor-pointer"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />

        {/* Media / Discipline Badge Overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-zinc-950/85 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono text-zinc-300 border border-zinc-800">
          {project.category === 'game-design' ? (
            <>
              <Compass className="w-3 h-3 text-red-500" />
              <span>Game Design & Mechanics</span>
            </>
          ) : project.category === 'both' ? (
            <>
              <Layers className="w-3 h-3 text-red-500" />
              <span>Game Design · Lighting (Passion)</span>
            </>
          ) : project.heroType === 'video' ? (
            <>
              <Play className="w-3 h-3 text-red-500 fill-current" />
              <span>Lighting Reel · {project.videoDuration}</span>
            </>
          ) : (
            <>
              <Compass className="w-3 h-3 text-zinc-200" />
              <span>Lighting & Look-Dev</span>
            </>
          )}
        </div>

        {/* Quick Pass Switcher Bar (Hover only) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-90 transition-opacity"
        >
          <div className="flex items-center gap-1 bg-zinc-950/90 backdrop-blur-md p-1 rounded-lg border border-zinc-800">
            {(['final', 'clay', 'normals'] as PassType[]).map((pass) => (
              <button
                key={pass}
                onClick={() => setActivePass(pass)}
                className={`px-2 py-0.5 text-[10px] font-mono rounded capitalize transition-colors ${
                  activePass === pass
                    ? 'bg-red-600 text-white font-bold shadow-sm shadow-red-600/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {pass === 'final' ? 'Lit' : pass}
              </button>
            ))}
          </div>

          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950/80 px-2 py-1 rounded border border-zinc-800">
            {project.engine.split('·')[0].trim()}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Unboxed Metadata with Typographic Separators (§1.A Zero-Pill Rule) */}
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono mb-2">
            <span>{project.role}</span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span>{project.year}</span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span className="text-zinc-300 font-semibold">{project.duration}</span>
          </div>

          {/* Title */}
          <h3
            onClick={() => onSelect(project)}
            className="text-lg font-display font-semibold text-zinc-100 group-hover:text-red-400 transition-colors cursor-pointer flex items-center justify-between"
          >
            <span>{project.title}</span>
            <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-red-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </h3>

          <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
            {project.subtitle} — {project.summary}
          </p>
        </div>

        {/* Card Footer: Metrics & Actions */}
        <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-between gap-2">
          {/* Key Metric */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-300">
            <span className="text-zinc-500">{project.metrics[0]?.label}:</span>
            <span className="text-white font-semibold">{project.metrics[0]?.value}</span>
          </div>

          <div className="flex items-center gap-1.5">
            {isOwner && onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(project);
                }}
                className="px-2 py-1 text-[11px] font-mono bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-800/60 rounded-lg transition-colors flex items-center gap-1"
                title="Edit this project"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            )}

            {isOwner && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete "${project.title}" from your portfolio?`)) {
                    onDelete(project.id);
                  }
                }}
                className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-900/60 rounded-lg transition-colors"
                title="Delete project"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            {onOpenInStudio && (
              <button
                onClick={() => onOpenInStudio(studioSceneMap[project.dummySceneStyle] || 'cyberpunk')}
                className="px-2.5 py-1 text-[11px] font-mono bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 rounded-lg border border-zinc-700/60 transition-colors flex items-center gap-1"
                title="Inspect in 3D Lighting Lab"
              >
                <Eye className="w-3 h-3 text-red-400" />
                <span>3D Lab</span>
              </button>
            )}

            <button
              onClick={() => onSelect(project)}
              className="px-3 py-1 text-xs font-medium bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-200 rounded-lg transition-colors"
            >
              Case Study
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
