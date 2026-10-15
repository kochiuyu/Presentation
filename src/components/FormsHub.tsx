import React, { useState } from 'react';
import { ExternalLink, QrCode, Star, Copy, Check } from 'lucide-react';

interface FormsHubProps {
  peerEvalUrl: string;
  onOpenQr: (title: string, url: string) => void;
}

export const FormsHub: React.FC<FormsHubProps> = ({ peerEvalUrl, onOpenQr }) => {
  const [copied, setCopied] = useState(false);

  const handleOpenLink = () => {
    if (!peerEvalUrl || peerEvalUrl.trim() === '') {
      alert('Please configure the Peer Evaluation Form URL in the setup panel below.');
      return;
    }
    window.open(peerEvalUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = async () => {
    if (!peerEvalUrl) return;
    try {
      await navigator.clipboard.writeText(peerEvalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <section className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900 p-5 md:p-6 shadow-xl h-full">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Star className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Class Evaluation</span>
              <h2 className="text-lg font-bold text-white">Peer Evaluation Form</h2>
            </div>
          </div>
          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
            Active Form
          </span>
        </div>

        <p className="mt-3 text-xs text-slate-400 leading-relaxed">
          Students and audience members use this form to grade each presentation and submit peer evaluations during class.
        </p>

        {/* Dedicated Peer Evaluation Form Showcase Card */}
        <div className="mt-4 rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-950 to-slate-950 p-4 transition shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                <Star className="h-5 w-5 fill-current" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  <span>Student Peer Evaluation Form</span>
                </h4>
                <a
                  href={peerEvalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-300 hover:text-indigo-200 underline truncate block max-w-[220px] sm:max-w-xs font-mono mt-0.5"
                  title="Open URL"
                >
                  {peerEvalUrl}
                </a>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleOpenLink}
              disabled={!peerEvalUrl}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition active:scale-[0.99] disabled:opacity-40"
            >
              <span>Open Form in Tab</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={() => onOpenQr('Student Peer Evaluation Form', peerEvalUrl)}
              disabled={!peerEvalUrl}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-bold text-slate-100 transition active:scale-[0.99] disabled:opacity-40"
              title="Show enlarged QR code for classroom mobile scanning"
            >
              <QrCode className="h-4 w-4 text-indigo-400" />
              <span>Project QR Code</span>
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5">
            <span className="flex items-center gap-1 text-slate-500">
              <span>Mobile-ready Google Form</span>
            </span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 transition"
              title="Copy link to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-slate-950/60 border border-slate-800/80 p-3 text-[11px] text-slate-400 flex items-center gap-2">
        <span className="text-base">💡</span>
        <span>
          Tip: Click <strong>Project QR Code</strong> or press <kbd className="px-1 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-slate-300 border border-slate-700">P</kbd> in Projector View to project the QR code onto the hall screen.
        </span>
      </div>
    </section>
  );
};
