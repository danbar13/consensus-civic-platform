import React, { useState } from 'react';
import type { Topic } from '../types';
import { Code2, Copy, Check, X, ExternalLink } from 'lucide-react';

interface EmbedModalProps {
  topic: Topic | null;
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
}

export const EmbedModal: React.FC<EmbedModalProps> = ({ topic, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [embedTheme, setEmbedTheme] = useState<'auto' | 'dark' | 'light'>('auto');

  if (!isOpen || !topic) return null;

  const themeQuery = embedTheme === 'auto' ? '' : `&theme=${embedTheme}`;
  const embedUrl = `${window.location.origin}/?topic=${topic.id}&embed=true${themeQuery}`;
  const borderColor = embedTheme === 'dark' ? '#334155' : '#e2e8f0';
  const iframeSnippet = `<iframe src="${embedUrl}" width="100%" height="720" frameborder="0" style="border: 1px solid ${borderColor}; border-radius: 16px; overflow: hidden;" allow="clipboard-write"></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(iframeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                קוד הטמעה בווב (Embed Widget)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                הטמע את המשאל של "{topic.title}" בתוך אתר "ערב ערב באילת" או אתר חיצוני
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">ערכת נושא לווידג'ט:</span>
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setEmbedTheme('auto')}
              className={`px-3 py-1.5 rounded-lg transition ${
                embedTheme === 'auto'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              אוטומטי
            </button>
            <button
              type="button"
              onClick={() => setEmbedTheme('dark')}
              className={`px-3 py-1.5 rounded-lg transition ${
                embedTheme === 'dark'
                  ? 'bg-slate-950 text-amber-300 shadow-xs ring-1 ring-amber-400/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🌙 מצב כהה קבוע
            </button>
            <button
              type="button"
              onClick={() => setEmbedTheme('light')}
              className={`px-3 py-1.5 rounded-lg transition ${
                embedTheme === 'light'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ☀️ מצב בהיר קבוע
            </button>
          </div>
        </div>

        {/* Snippet Card */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
            <span>קוד HTML להדבקה במערכת ניהול התוכן (CMS / WordPress):</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-bold"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>הועתק ללוח!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>העתק קוד</span>
                </>
              )}
            </button>
          </div>
          <div className="p-3.5 bg-slate-950 text-amber-300 font-mono text-xs rounded-xl overflow-x-auto text-left border border-slate-800" dir="ltr">
            {iframeSnippet}
          </div>
        </div>

        {/* Live Preview Toggle */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5"
          >
            <span>{previewMode ? 'הסתר תצוגה מקדימה' : 'הצג תצוגה מקדימה של הווידג\'ט'}</span>
          </button>

          <a
            href={embedUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>פתח חלון הטמעה ישיר</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {previewMode && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden h-72">
            <iframe src={embedUrl} className="w-full h-full border-0" title="Embed Preview" />
          </div>
        )}
      </div>
    </div>
  );
};
