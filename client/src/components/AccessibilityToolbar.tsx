import React, { useState, useEffect } from 'react';
import { 
  Accessibility, 
  X, 
  ZoomIn, 
  ZoomOut, 
  SunMedium, 
  Contrast, 
  Link2, 
  Type, 
  RotateCcw, 
  FileText 
} from 'lucide-react';

interface AccessibilityToolbarProps {
  onOpenStatement: () => void;
}

export const AccessibilityToolbar: React.FC<AccessibilityToolbarProps> = ({ onOpenStatement }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Accessibility preferences state
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(0); // -1, 0, 1, 2
  const [grayscale, setGrayscale] = useState(false);
  const [highlightLinks, setHighlightLinks] = useState(false);
  const [readableFont, setReadableFont] = useState(false);
  const [stopAnimations, setStopAnimations] = useState(false);

  // Apply styles directly to root / body
  useEffect(() => {
    const root = document.documentElement;
    
    // Font scale
    if (fontSizeLevel === 1) {
      root.style.fontSize = '112%';
    } else if (fontSizeLevel === 2) {
      root.style.fontSize = '125%';
    } else if (fontSizeLevel === -1) {
      root.style.fontSize = '90%';
    } else {
      root.style.fontSize = '';
    }

    // Grayscale
    if (grayscale) {
      root.classList.add('a11y-grayscale');
    } else {
      root.classList.remove('a11y-grayscale');
    }

    // Highlight links
    if (highlightLinks) {
      root.classList.add('a11y-highlight-links');
    } else {
      root.classList.remove('a11y-highlight-links');
    }

    // Readable font
    if (readableFont) {
      root.classList.add('a11y-readable-font');
    } else {
      root.classList.remove('a11y-readable-font');
    }

    // Stop animations
    if (stopAnimations) {
      root.classList.add('a11y-stop-animations');
    } else {
      root.classList.remove('a11y-stop-animations');
    }
  }, [fontSizeLevel, grayscale, highlightLinks, readableFont, stopAnimations]);

  const resetAll = () => {
    setFontSizeLevel(0);
    setGrayscale(false);
    setHighlightLinks(false);
    setReadableFont(false);
    setStopAnimations(false);
  };

  const hasActiveModifiers = fontSizeLevel !== 0 || grayscale || highlightLinks || readableFont || stopAnimations;

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 left-5 z-40 p-3.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xl border-2 border-white dark:border-slate-800 focus:outline-hidden focus:ring-4 focus:ring-amber-300 dark:focus:ring-amber-600 transition-transform hover:scale-105 active:scale-95"
        aria-label="תפריט נגישות"
        title="תפריט נגישות והתאמות קריאה"
      >
        <Accessibility className="w-6 h-6 stroke-[2.5]" />
        {hasActiveModifiers && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white" />
        )}
      </button>

      {/* Floating Accessibility Panel */}
      {isOpen && (
        <div 
          className="fixed bottom-20 left-5 z-40 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 text-slate-800 dark:text-slate-100 animate-in slide-in-from-bottom-5 duration-200"
          dir="rtl"
          role="region"
          aria-label="התאמות נגישות"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Accessibility className="w-5 h-5 text-amber-500" />
              <span className="font-bold text-sm">התאמות נגישות (ת"י 5568)</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="סגור תפריט נגישות"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Actions Grid */}
          <div className="py-3 space-y-2 text-xs">
            {/* Font size */}
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl">
              <span className="font-semibold">גודל טקסט:</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setFontSizeLevel(prev => Math.max(-1, prev - 1))}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 border border-slate-200 dark:border-slate-600"
                  aria-label="הקטן טקסט"
                  title="הקטן טקסט"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 font-mono font-bold">
                  {fontSizeLevel === 0 ? 'רגיל' : fontSizeLevel > 0 ? `+${fontSizeLevel}` : `${fontSizeLevel}`}
                </span>
                <button
                  onClick={() => setFontSizeLevel(prev => Math.min(2, prev + 1))}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 border border-slate-200 dark:border-slate-600"
                  aria-label="הגדל טקסט"
                  title="הגדל טקסט"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Grayscale Toggle */}
            <button
              onClick={() => setGrayscale(!grayscale)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition ${
                grayscale 
                  ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300 font-bold' 
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Contrast className="w-4 h-4" />
                <span>גווני אפור (מונוכרום)</span>
              </div>
              <span className="text-[11px] font-mono">{grayscale ? 'פעיל' : 'כבוי'}</span>
            </button>

            {/* Highlight Links */}
            <button
              onClick={() => setHighlightLinks(!highlightLinks)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition ${
                highlightLinks 
                  ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300 font-bold' 
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                <span>הדגשת קישורים</span>
              </div>
              <span className="text-[11px] font-mono">{highlightLinks ? 'פעיל' : 'כבוי'}</span>
            </button>

            {/* Readable Font */}
            <button
              onClick={() => setReadableFont(!readableFont)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition ${
                readableFont 
                  ? 'bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300 font-bold' 
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                <span>גופן קריא מודגש</span>
              </div>
              <span className="text-[11px] font-mono">{readableFont ? 'פעיל' : 'כבוי'}</span>
            </button>
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <button
              onClick={resetAll}
              disabled={!hasActiveModifiers}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 disabled:opacity-40 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>איפוס</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenStatement();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>הצהרת נגישות</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
