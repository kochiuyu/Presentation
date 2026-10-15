import React from 'react';
import { Volume2, VolumeX, Maximize2, Keyboard, Download, Music, Sparkles } from 'lucide-react';
import { playChime } from '../utils/audio';
import { generateStandaloneHtml } from '../utils/exportHtml';

interface HeaderProps {
  courseTitle: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenProjector: () => void;
  onOpenShortcuts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  courseTitle,
  soundEnabled,
  onToggleSound,
  onOpenProjector,
  onOpenShortcuts,
}) => {
  const handleTestChime = () => {
    playChime();
  };

  const handleDownloadStandalone = () => {
    const htmlContent = generateStandaloneHtml();
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        {/* Branding & Course Info */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 font-extrabold text-white shadow-lg shadow-indigo-500/25">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base md:text-lg text-slate-100 tracking-tight leading-tight">
                {courseTitle || 'DOTE5110 Statistical Analysis'}
              </h1>
              <a
                href="#setup-section"
                className="hidden sm:inline-flex items-center gap-1 rounded-md border border-slate-700/80 bg-slate-800/90 px-2 py-0.5 text-[11px] font-medium text-indigo-300 hover:text-white hover:border-indigo-500 transition"
                title="Edit Course Name & Timings at the bottom"
              >
                <span>✏️ Change at bottom</span>
              </a>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LocalStorage Synced
              </span>
              <span>·</span>
              <span className="hidden sm:inline">Press <kbd className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[10px] text-slate-300 border border-slate-700">Space</kbd> Pres, <kbd className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[10px] text-slate-300 border border-slate-700">Q</kbd> Q&A, <kbd className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[10px] text-slate-300 border border-slate-700">A</kbd> Respondent, <kbd className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[10px] text-slate-300 border border-slate-700">N</kbd> Pick</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Sound Mute Toggle */}
          <button
            onClick={onToggleSound}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              soundEnabled
                ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                : 'border-rose-900/50 bg-rose-950/30 text-rose-300 hover:bg-rose-900/40'
            }`}
            title="Toggle sound chimes (M)"
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5 text-emerald-400" /> : <VolumeX className="h-3.5 w-3.5 text-rose-400" />}
            <span className="hidden md:inline">{soundEnabled ? 'Chime On' : 'Muted'}</span>
          </button>

          {/* Test Sound */}
          <button
            onClick={handleTestChime}
            className="hidden sm:flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
            title="Test sound in lecture hall"
          >
            <Music className="h-3.5 w-3.5 text-indigo-400" />
            <span>Test Bell</span>
          </button>

          {/* Download Standalone Single File index.html */}
          <button
            onClick={handleDownloadStandalone}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:border-indigo-500 hover:bg-slate-800 transition"
            title="Download standalone single-file index.html for GitHub Pages"
          >
            <Download className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden md:inline">Download HTML</span>
          </button>

          {/* Shortcuts Info */}
          <button
            onClick={onOpenShortcuts}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition"
            title="Keyboard shortcuts (?)"
            aria-label="Keyboard Shortcuts"
          >
            <Keyboard className="h-4 w-4" />
          </button>

          {/* Projector Mode */}
          <button
            onClick={onOpenProjector}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 active:scale-95 transition"
            title="Open Fullscreen Projector Mode (P)"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span>Projector [P]</span>
          </button>
        </div>
      </div>
    </header>
  );
};
