import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, ExternalLink, Copy, Check } from 'lucide-react';
import { useDialogFocus } from '../utils/useDialogFocus';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  description?: string;
}

export const QrModal: React.FC<QrModalProps> = ({ isOpen, onClose, title, url, description }) => {
  const dialogRef = useDialogFocus(isOpen);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !url) return;
    let current = true;
    setDataUrl('');
    QRCode.toDataURL(url, {
      width: 640,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((res) => { if (current) setDataUrl(res); })
      .catch((err) => console.error('Failed to generate QR', err));
    return () => { current = false; };
  }, [isOpen, url]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="qr-dialog-title" tabIndex={-1} className="relative max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-5 text-center text-slate-100 shadow-2xl sm:p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 id="qr-dialog-title" className="text-lg font-bold text-white">{title}</h3>
        <p className="mx-auto mt-1 break-all text-xs text-slate-400">{url}</p>

        <div className="mx-auto mt-4 flex aspect-square w-[min(78vw,56vh,420px)] items-center justify-center rounded-2xl bg-white p-3 shadow-inner sm:p-4">
          {dataUrl ? (
            <img src={dataUrl} alt={`Scan to open ${title}`} className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
              Generating QR Code...
            </div>
          )}
        </div>

        <p className="mt-3 text-xs text-slate-400">
          {description || 'Students can scan this from their seats with any phone camera.'}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied Link' : 'Copy Link'}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition"
          >
            <span>Open Tab</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
