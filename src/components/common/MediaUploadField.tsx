import React, { useState, useRef } from 'react';
import { Upload, Link2, X, Image as ImageIcon, Film, Check, AlertCircle, Loader2 } from 'lucide-react';
import { compressImageFile, readFileAsDataUrl, formatFileSize } from '../../utils/mediaUploader';

interface MediaUploadFieldProps {
  label: string;
  value?: string;
  onChange: (newValue: string) => void;
  mediaType: 'image' | 'video' | 'both';
  hint?: string;
  aspectRatio?: 'video' | 'square' | 'wide' | 'avatar' | 'portrait';
  placeholder?: string;
}

export const MediaUploadField: React.FC<MediaUploadFieldProps> = ({
  label,
  value = '',
  onChange,
  mediaType,
  hint,
  aspectRatio = 'video',
  placeholder = 'Paste image or video URL or upload file...',
}) => {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(value);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isVideo =
    value?.startsWith('data:video/') ||
    /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(value);

  const acceptTypes =
    mediaType === 'image'
      ? 'image/jpeg,image/png,image/webp,image/gif'
      : mediaType === 'video'
      ? 'video/mp4,video/webm,video/ogg,video/quicktime'
      : 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg';

  const handleProcessFile = async (file: File) => {
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      if (file.type.startsWith('image/')) {
        // Compress image to ensure it fits comfortably in browser storage
        const compressed = await compressImageFile(file, 1920, 1080, 0.85);
        onChange(compressed);
        setUrlInput(compressed);
      } else if (file.type.startsWith('video/')) {
        // Warn if video is very large (over 25MB)
        if (file.size > 25 * 1024 * 1024) {
          setErrorMsg(
            `Video is ${formatFileSize(file.size)}. For smooth browser performance, videos under 25MB or hosted video URLs are recommended.`
          );
        }
        const dataUrl = await readFileAsDataUrl(file);
        onChange(dataUrl);
        setUrlInput(dataUrl);
      } else {
        setErrorMsg('Unsupported file format. Please upload a standard image or video file.');
      }
    } catch (err: any) {
      console.error('Upload processing error:', err);
      setErrorMsg(err?.message || 'Failed to process and upload media file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    // reset input so same file can be re-selected if needed
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
    }
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
    setErrorMsg(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-mono text-zinc-300 font-semibold flex items-center gap-1.5">
          {mediaType === 'video' ? (
            <Film className="w-3.5 h-3.5 text-red-500" />
          ) : (
            <ImageIcon className="w-3.5 h-3.5 text-red-500" />
          )}
          <span>{label}</span>
        </label>

        {/* Tab toggle: File Upload vs Web URL */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-[11px] font-mono">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              mode === 'upload' ? 'bg-red-600 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Upload className="w-3 h-3" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 ${
              mode === 'url' ? 'bg-red-600 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Link2 className="w-3 h-3" />
            <span>External URL</span>
          </button>
        </div>
      </div>

      {hint && <p className="text-[11px] text-zinc-500 font-sans">{hint}</p>}

      {errorMsg && (
        <div className="p-2.5 bg-red-950/60 border border-red-800/70 rounded-lg text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={acceptTypes}
        className="hidden"
      />

      {/* Mode A: Direct Drag & Drop File Upload */}
      {mode === 'upload' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
            isDragging
              ? 'border-red-500 bg-red-950/20'
              : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-900/90'
          }`}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="w-6 h-6 text-red-500 animate-spin" />
              <span className="text-xs font-mono text-zinc-300">
                Processing & optimizing media file...
              </span>
            </div>
          ) : (
            <>
              <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 group-hover:text-white">
                <Upload className="w-4 h-4 text-red-400" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-sans text-zinc-200 font-medium">
                  Click to select file or drag & drop here
                </div>
                <div className="text-[10px] font-mono text-zinc-500">
                  {mediaType === 'image'
                    ? 'JPG, PNG, WebP (auto-optimized)'
                    : mediaType === 'video'
                    ? 'MP4, WebM (under 25MB recommended)'
                    : 'Image or Video files'}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Mode B: Direct URL Input */}
      {mode === 'url' && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onBlur={handleApplyUrl}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
          />
          <button
            type="button"
            onClick={handleApplyUrl}
            className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-mono transition-colors shrink-0"
          >
            Apply
          </button>
        </div>
      )}

      {/* Live Preview & Active Media Card */}
      {value && (
        <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-black group/preview">
          <div
            className={`w-full ${
              aspectRatio === 'square'
                ? 'aspect-square max-h-48'
                : aspectRatio === 'avatar'
                ? 'aspect-square max-w-[120px] mx-auto rounded-full overflow-hidden my-2 border-2 border-red-500'
                : aspectRatio === 'portrait'
                ? 'aspect-[4/5] max-h-56'
                : 'aspect-video max-h-52'
            } flex items-center justify-center bg-zinc-950 overflow-hidden`}
          >
            {isVideo ? (
              <video
                src={value}
                controls
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={value}
                alt="Uploaded preview"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Top-right overlay bar */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
            <span className="px-2 py-0.5 rounded bg-zinc-950/85 backdrop-blur-md border border-zinc-800 text-[10px] font-mono text-zinc-300">
              {isVideo ? 'VIDEO LOADED' : 'IMAGE LOADED'}
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 rounded-lg bg-zinc-950/90 text-zinc-400 hover:text-white hover:bg-red-600 transition-colors border border-zinc-800"
              title="Remove media"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
