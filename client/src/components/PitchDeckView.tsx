import React from 'react';
import { 
  Vote, 
  Settings2, 
  ExternalLink
} from 'lucide-react';

interface PitchDeckViewProps {
  onNavigateToAdmin: () => void;
  onNavigateToWidget: () => void;
  darkMode: boolean;
}

export const PitchDeckView: React.FC<PitchDeckViewProps> = ({
  onNavigateToAdmin,
  onNavigateToWidget
}) => {
  return (
    <div className="w-full flex flex-col space-y-3">
      {/* Quick Action Navigation Bar */}
      <div className="max-w-7xl mx-auto w-full px-4 pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 dark:text-slate-200">
            המצפן האילתי | דף הנחיתה וההצעה האסטרטגית עבור "ערב ערב באילת"
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
            גרסת Gemini Spark
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToWidget}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-xs"
          >
            <Vote className="w-3.5 h-3.5" />
            <span>לווידג'ט ההצבעה החי</span>
          </button>
          <button
            onClick={onNavigateToAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition shadow-xs"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>לממשק הניהול</span>
          </button>
          <a
            href="/pitch.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition shadow-xs"
          >
            <span>פתח בחלון מלא</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Embedded Full Interactive Pitch Page */}
      <div className="w-full h-[calc(100vh-130px)] min-h-[850px] border-t border-slate-200 dark:border-slate-800 shadow-inner">
        <iframe
          src="/pitch.html"
          title="המצפן האילתי - דף נחיתה והצעה למערכת ערב ערב באילת"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  );
};
