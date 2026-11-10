import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  Trash2,
  Download,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import {
  StoredResumePdf,
  saveStoredResumePdf,
  deleteStoredResumePdf,
  getStoredResumePdf,
} from '../../utils/portfolioStorage';

interface ResumeUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (pdfInfo: StoredResumePdf | null) => void;
  currentPdf: StoredResumePdf | null;
}

export const ResumeUploaderModal: React.FC<ResumeUploaderModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  currentPdf,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('Please select a valid PDF document (.pdf).');
      return;
    }

    // Check size (max 8MB for localStorage safety)
    if (file.size > 8 * 1024 * 1024) {
      setError('PDF file is larger than 8MB. Please compress your PDF before uploading.');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        const saved = saveStoredResumePdf(dataUrl, file.name, file.size);
        setIsProcessing(false);
        onUploadSuccess(saved);
      } else {
        setIsProcessing(false);
        setError('Failed to read PDF file.');
      }
    };
    reader.onerror = () => {
      setIsProcessing(false);
      setError('Error reading file.');
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDelete = () => {
    if (confirm('Remove this custom resume PDF? Visitors will receive the generated portfolio summary until a new PDF is uploaded.')) {
      deleteStoredResumePdf();
      onUploadSuccess(null);
    }
  };

  const handleTestDownload = () => {
    if (!currentPdf) return;
    const a = document.createElement('a');
    a.href = currentPdf.dataUrl;
    a.download = currentPdf.filename || 'Avinash_Resume.pdf';
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-zinc-200"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleInputChange}
          accept="application/pdf,.pdf"
          className="hidden"
        />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-500">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-red-500 tracking-wider">RESUME MANAGEMENT</div>
              <h3 className="text-lg font-display font-bold text-zinc-100">
                Upload Resume PDF
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-400 mt-4 leading-relaxed">
          Upload your official resume PDF document. Whenever visitors click <strong>"Resume"</strong> in the
          navigation header or footer, their browser will automatically download this file.
        </p>

        {error && (
          <div className="mt-4 p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Current Upload Status */}
        {currentPdf ? (
          <div className="mt-5 p-4 bg-zinc-900/80 border border-red-500/30 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-zinc-100 font-mono truncate max-w-[260px]">
                    {currentPdf.filename}
                  </div>
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    {currentPdf.sizeBytes
                      ? `${(currentPdf.sizeBytes / 1024).toFixed(1)} KB · `
                      : ''}
                    Uploaded {new Date(currentPdf.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <span className="px-2 py-0.5 bg-red-950/60 text-red-400 border border-red-500/40 rounded text-[10px] font-mono">
                Active
              </span>
            </div>

            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-2">
              <button
                onClick={handleTestDownload}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-mono transition-colors flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Test Download</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium font-sans transition-colors shadow-sm shadow-red-600/30"
                >
                  Replace PDF
                </button>

                <button
                  onClick={handleDelete}
                  className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors"
                  title="Remove custom PDF"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Dropzone */
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-5 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-red-500 bg-red-500/10'
                : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40'
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-red-950/40 text-red-500 border border-red-800/60 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-xs font-medium text-zinc-200">
              {isProcessing ? 'Processing PDF document...' : 'Click to select or drag and drop your Resume PDF'}
            </div>
            <div className="text-[11px] text-zinc-500 font-mono mt-1">
              Supports standard .pdf documents up to 8MB
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500 font-mono">
          <span>Active in: Header & Footer tabs</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
