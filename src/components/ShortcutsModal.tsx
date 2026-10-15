import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Start or Pause the Presentation countdown timer' },
    { key: 'Q', desc: 'Start or Pause the Q&A Discussion timer' },
    { key: 'N', desc: 'Draw next random student group (resets timers for new group)' },
    { key: 'P', desc: 'Toggle Fullscreen / Lecture Hall Projector Mode' },
    { key: 'R', desc: 'Reset Presentation timer to original duration' },
    { key: 'Shift + R', desc: 'Reset Q&A timer to original duration' },
    { key: 'M', desc: 'Toggle audio sound chime / mute' },
    { key: 'Esc', desc: 'Exit Projector mode or close active popups' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Keyboard className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Keyboard Shortcuts</h3>
            <p className="text-xs text-slate-400">Control your classroom session hands-free</p>
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="flex items-center justify-between rounded-xl bg-slate-950/80 px-3.5 py-2.5 border border-slate-800"
            >
              <span className="text-sm text-slate-300">{sc.desc}</span>
              <kbd className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 font-mono text-xs font-bold text-indigo-300 shadow-inner">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
