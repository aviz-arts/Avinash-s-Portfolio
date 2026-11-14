import React, { useRef, useEffect, useState } from 'react';
import { ProjectItem } from '../../types/portfolio';
import { drawProceduralScene } from '../../utils/canvasMedia';
import { Compass, Zap, ArrowUpRight, Edit3, Trash2 } from 'lucide-react';

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
  isOwner,
  onEdit,
  onDelete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
      drawProceduralScene(ctx, 640, 360, project.dummySceneStyle, 'final', isHovered ? t : 0.5);
      if (isHovered && project.heroType === 'video') {
        animId = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [project.dummySceneStyle, isHovered, project.heroType]);

  const primaryDiscipline =
    project.category === 'lighting'
      ? 'lighting'
      : project.category === 'game-design'
      ? 'game-design'
      : project.heroType === 'video' || project.dummySceneStyle === 'turret'
      ? 'lighting'
      : 'game-design';

  return (
    <article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col h-full bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-black/50"
    >
      {/* Media Container (16:9) */}
      <div
        onClick={() => onSelect(project)}
        className="relative w-full aspect-video bg-zinc-950 overflow-hidden cursor-pointer"
      >
        {project.customVideoUrl ? (
          <video
            src={project.customVideoUrl}
            poster={project.customImageUrl}
            preload="none"
            muted
            playsInline
            loop
            autoPlay={isHovered}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : project.customImageUrl ? (
          <img
            src={project.customImageUrl}
            alt={project.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        )}

        {/* Single Discipline Badge Overlay (Lighting OR Game Designs) */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-zinc-950/92 px-2.5 py-1 rounded-md text-[11px] font-mono text-zinc-300 border border-zinc-800">
          {primaryDiscipline === 'lighting' ? (
            <>
              <Zap className="w-3 h-3 text-red-500" />
              <span>Lighting</span>
            </>
          ) : (
            <>
              <Compass className="w-3 h-3 text-red-500" />
              <span>Game Designs</span>
            </>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Unboxed Metadata with Typographic Separators */}
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

          <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 text-justify leading-relaxed">
            {project.subtitle} — {project.summary}
          </p>
        </div>

        {/* Card Footer: Case Study Action (plus Owner Edit/Delete when signed in) */}
        <div className="pt-4 mt-4 border-t border-zinc-800/80 flex items-center justify-end gap-2">
          {isOwner && onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
              className="px-2 py-1 text-[11px] font-mono bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-800/60 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
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
              className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-900/60 rounded-lg transition-colors cursor-pointer"
              title="Delete project"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onSelect(project)}
            className="px-3.5 py-1.5 text-xs font-medium bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-200 rounded-lg transition-colors cursor-pointer"
          >
            Case Study
          </button>
        </div>
      </div>
    </article>
  );
};
