import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, ExternalLink, Copy, Check } from 'lucide-react';

interface QrModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
}

export const QrModal: React.FC<QrModalProps> = ({ isOpen, onClose, title, url }) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !url) return;
    QRCode.toDataURL(url, {
      width: 320,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((res) => setDataUrl(res))
      .catch((err) => console.error('Failed to generate QR', err));
  }, [isOpen, url]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center text-slate-100 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-lg font-bold text-white">{title}</h3>
        <p className="mt-1 text-xs text-slate-400 truncate max-w-[280px] mx-auto">{url}</p>

        <div className="mt-4 flex items-center justify-center rounded-2xl bg-white p-4 shadow-inner mx-auto w-64 h-64">
          {dataUrl ? (
            <img src={dataUrl} alt="QR Code" className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
              Generating QR Code...
            </div>
          )}
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Students can scan this from their seats with any phone camera
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
