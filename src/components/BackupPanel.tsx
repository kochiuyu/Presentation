import { useEffect, useRef, useState } from 'react';
import { Download, Upload, X } from 'lucide-react';
import { parseBackup, type SessionBackup } from '../utils/backup';
import { useDialogFocus } from '../utils/useDialogFocus';

interface BackupPanelProps {
  onExport: () => string;
  onRestore: (backup: SessionBackup) => void;
}

export function BackupPanel({ onExport, onRestore }: BackupPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<SessionBackup | null>(null);
  const [error, setError] = useState('');
  const [restored, setRestored] = useState(false);
  const dialogRef = useDialogFocus(Boolean(preview));

  useEffect(() => {
    if (!preview) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreview(null);
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [preview]);

  const download = () => {
    const blob = new Blob([onExport()], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `presentation-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const readFile = async (file?: File) => {
    if (!file) return;
    if (fileRef.current) fileRef.current.value = '';
    setError('');
    setRestored(false);
    if (file.size > 2_000_000) {
      setError('The backup file is too large.');
      return;
    }
    try {
      setPreview(parseBackup(await file.text()));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not read this backup.');
    }
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 md:p-6 shadow-xl" aria-labelledby="backup-heading">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="backup-heading" className="text-lg font-bold text-white">Session backup</h2>
          <p className="mt-1 text-xs text-slate-400">Save a copy of your roster, progress, settings, and timer values. The file stays on your device.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={download} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500">
            <Download className="h-4 w-4" /> Download backup
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-100 hover:bg-slate-700">
            <Upload className="h-4 w-4" /> Restore backup
          </button>
          <input ref={fileRef} type="file" accept=".json,application/json" className="sr-only" aria-label="Choose presentation backup file" onChange={(event) => void readFile(event.target.files?.[0])} />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">Download HTML creates a blank reusable page; use this backup to move your session to another browser.</p>
      {error && <p role="alert" className="mt-3 text-xs font-semibold text-rose-300">{error}</p>}
      {restored && <p role="status" className="mt-3 text-xs font-semibold text-emerald-300">Session restored in this browser.</p>}

      {preview && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4">
          <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="restore-heading" tabIndex={-1} className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <h3 id="restore-heading" className="text-lg font-bold">Restore this session?</h3>
              <button type="button" onClick={() => setPreview(null)} aria-label="Close restore preview" className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-slate-400">Session</dt><dd className="font-semibold break-words">{preview.session.courseTitle || 'Presentation Session'}</dd></div>
              <div><dt className="text-slate-400">Saved</dt><dd className="font-semibold">{new Date(preview.exportedAt).toLocaleString()}</dd></div>
              <div><dt className="text-slate-400">Waiting groups</dt><dd className="font-semibold">{preview.session.pendingGroups.length}</dd></div>
              <div><dt className="text-slate-400">Presented groups</dt><dd className="font-semibold">{preview.session.presentedGroups.length}</dd></div>
              <div className="col-span-2"><dt className="text-slate-400">Current group</dt><dd className="font-semibold break-words">{preview.session.currentGroup?.name || 'None'}</dd></div>
            </dl>
            <p className="mt-4 text-xs text-amber-200">Restoring replaces this browser's current session. Both timers will be paused at their saved values.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPreview(null)} className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold hover:bg-slate-700">Cancel</button>
              <button type="button" onClick={() => { onRestore(preview); setPreview(null); setRestored(true); }} className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold hover:bg-indigo-500">Restore session</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
