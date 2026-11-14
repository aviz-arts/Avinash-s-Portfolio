import React, { useState } from 'react';
import { X, Send, Mail, CheckCircle2, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import {
  buildGmailComposeUrl,
  buildMailtoUrl,
  resolveRecipientEmail,
  sendContactInquiry,
} from '../../utils/contactMailer';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  options?: string[];
  recipientEmail?: string;
}

export const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  options,
  recipientEmail,
}) => {
  const defaultOption =
    options && options.length > 0 ? options[0] : 'Game Design & Core Mechanics (Loops & Pacing)';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studio: '',
    service: defaultOption,
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitNotice, setSubmitNotice] = useState<{
    type: 'success' | 'activation' | 'error';
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  const targetEmail = resolveRecipientEmail(recipientEmail);
  const inquiryPayload = {
    recipientEmail: targetEmail,
    name: formData.name,
    email: formData.email,
    studio: formData.studio,
    projectType: formData.service,
    message: formData.message,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    setIsSubmitting(true);
    setSubmitNotice(null);

    const res = await sendContactInquiry(inquiryPayload);
    setIsSubmitting(false);

    if (res.ok) {
      setSubmitted(true);
      setSubmitNotice({
        type: res.needsActivation ? 'activation' : 'success',
        text: res.message,
      });
    } else {
      setSubmitNotice({
        type: 'error',
        text: res.message,
      });
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setSubmitNotice(null);
    setFormData({
      name: '',
      email: '',
      studio: '',
      service: defaultOption,
      message: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8"
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div>
            <div className="text-xs font-mono text-red-500">CONNECT &amp; COLLABORATE</div>
            <h3 className="text-xl font-display font-bold text-zinc-100">
              Get In Touch With Avinash
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-950/40 text-red-400 border border-red-800/60 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-semibold text-zinc-100">
              {submitNotice?.type === 'activation' ? 'Inquiry Queued for Gmail' : 'Message Sent to Gmail'}
            </h4>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
              {submitNotice?.text ||
                `Thank you for reaching out, ${formData.name}. Your inquiry has been dispatched to ${targetEmail}.`}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <a
                href={buildGmailComposeUrl(inquiryPayload)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-mono inline-flex items-center gap-1.5 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Open in Gmail</span>
              </a>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs font-medium transition-colors"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {submitNotice?.type === 'error' && (
              <div className="p-3 bg-red-950/50 border border-red-800/70 rounded-xl text-xs font-mono text-red-200 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{submitNotice.text}</span>
                </div>
                <div className="flex flex-wrap gap-2 pl-6">
                  <a
                    href={buildGmailComposeUrl(inquiryPayload)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg inline-flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" />
                    <span>Send via Gmail Web</span>
                  </a>
                  <a
                    href={buildMailtoUrl(inquiryPayload)}
                    className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg inline-flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Mail App</span>
                  </a>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Elena Rostova"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="elena@studio.com"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Studio / Company</label>
                <input
                  type="text"
                  value={formData.studio}
                  onChange={(e) => setFormData({ ...formData, studio: e.target.value })}
                  placeholder="e.g. Apex Games"
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-400 mb-1">Inquiry Focus</label>
                <select
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-red-500 transition-colors"
                >
                  {options && options.length > 0 ? (
                    options.map((opt, i) => (
                      <option key={i} value={opt} className="bg-zinc-900 text-zinc-100">
                        {opt}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Game Design & Core Mechanics (Loops & Pacing)">
                        Game Design &amp; Core Mechanics (Loops &amp; Pacing)
                      </option>
                      <option value="Level Design & 3D Arena Blockout">Level Design &amp; 3D Arena Blockout</option>
                      <option value="Unreal Engine 5 Lighting Art (Passion)">
                        Unreal Engine 5 Lighting Art (Passion)
                      </option>
                      <option value="Lead Role / Full-Time Studio Opportunity">
                        Lead Role / Full-Time Studio Opportunity
                      </option>
                      <option value="General Inquiry / Coffee Chat">General Inquiry / Coffee Chat</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-zinc-400 mb-1">Project Details</label>
              <textarea
                rows={4}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Briefly describe your game genre, target platform (PC, PS5), timeline, and engine (Unreal Engine 5)..."
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href={`mailto:${targetEmail}`}
                className="text-xs font-mono text-zinc-400 hover:text-red-400 transition-colors flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Direct: {targetEmail}</span>
              </a>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-sm shadow-red-600/30"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Inquiry</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
