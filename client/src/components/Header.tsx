import React, { useState } from 'react';
import type { Topic } from '../types';
import { 
  Compass, 
  BarChart3, 
  Vote, 
  Sparkles, 
  Settings2, 
  ChevronDown, 
  PlusCircle, 
  Code2, 
  Scale, 
  Building2, 
  GraduationCap, 
  Briefcase,
  Moon,
  Sun,
  ExternalLink,
  Clock
} from 'lucide-react';

interface HeaderProps {
  currentTopic: Topic | null;
  topics: Topic[];
  activeTab: 'vote' | 'dashboard' | 'report' | 'admin' | 'pitch';
  onSelectTab: (tab: 'vote' | 'dashboard' | 'report' | 'admin' | 'pitch') => void;
  onSelectTopic: (topicId: string) => void;
  onOpenNewTopic: () => void;
  onOpenEmbed: () => void;
  isEmbed?: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  showReturnToPitch?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTopic,
  topics,
  activeTab,
  onSelectTab,
  onSelectTopic,
  onOpenNewTopic,
  onOpenEmbed,
  isEmbed = false,
  darkMode,
  onToggleDarkMode,
  showReturnToPitch = false
}) => {
  const [topicDropdownOpen, setTopicDropdownOpen] = useState(false);

  // Check if topic is Eilat flagship
  const isEilatTopic = currentTopic?.id === 'eilat-parking' || currentTopic?.organization.includes('אילת');

  if (isEmbed) {
    return (
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* YomYom Eilat logo in embed */}
          <a href="https://www.yomyom.net/" target="_blank" rel="noreferrer" className="block shrink-0">
            <img 
              src={darkMode ? "/images/yomyom-logo-white.png" : "/images/yomyom-logo.png"} 
              alt="יום יום באילת" 
              className="h-7 w-auto object-contain"
              onError={(e) => {
                // Fallback to text if image fails to load
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </a>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 uppercase tracking-tight">
                המצפן העירוני
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold truncate hidden sm:inline">
                ערב ערב באילת
              </span>
              {currentTopic?.closes_at && (() => {
                const isPast = new Date(currentTopic.closes_at).getTime() < Date.now();
                const d = new Date(currentTopic.closes_at);
                const shortDate = `${d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
                return (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold flex items-center gap-1 ${
                    isPast 
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300' 
                      : 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300'
                  }`}>
                    <Clock className="w-2.5 h-2.5" />
                    <span>{isPast ? 'נסגר' : `עד ${shortDate}`}</span>
                  </span>
                );
              })()}
            </div>
            <div className="text-xs sm:text-sm md:text-base font-black text-slate-900 dark:text-white truncate" title={currentTopic?.title}>
              {currentTopic?.title}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {showReturnToPitch && (
            <a
              href="/pitch.html"
              target="_top"
              className="px-2 py-1 rounded-md text-amber-500 dark:text-amber-400 hover:underline font-bold transition"
              title="חזרה לדף הנחיתה וההצעה למקבלי החלטות"
            >
              חזור לדף הנחיתה ↩
            </a>
          )}
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
            title={darkMode ? 'מצב יום' : 'מצב לילה'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
          <button
            onClick={() => onSelectTab('vote')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              activeTab === 'vote' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            הצבעה
          </button>
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              activeTab === 'dashboard' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            מפת תוצאות
          </button>
        </div>
      </header>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'municipal':
        return <Compass className="w-4 h-4 text-sky-500" />;
      case 'mediation':
        return <Scale className="w-4 h-4 text-emerald-500" />;
      case 'committee':
        return <GraduationCap className="w-4 h-4 text-purple-500" />;
      case 'consulting':
        return <Briefcase className="w-4 h-4 text-amber-500" />;
      default:
        return <Building2 className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <header className="bg-slate-900 dark:bg-slate-950 text-white shadow-xl sticky top-0 z-40 border-b border-slate-800 dark:border-slate-800/80 transition-colors duration-200">
      {/* Top Banner & YomYom Branding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2.5 border-b border-slate-800 flex-wrap gap-2">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            {/* YomYom Eilat Official Logo */}
            <a 
              href="https://www.yomyom.net/" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center bg-slate-950/70 hover:bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 transition group"
              title="בחסות עיתון 'יום יום באילת / ערב ערב באילת' – לחץ לפתיחת האתר"
            >
              <img 
                src="/images/yomyom-logo-white.png" 
                alt="יום יום באילת | ערב ערב באילת" 
                className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-105"
                onError={(e) => {
                  // Fallback to remote if local image fails
                  const img = e.target as HTMLImageElement;
                  if (img.src.includes('/images/')) {
                    img.src = 'https://www.yomyom.net/images/yomyom-logo-white.png';
                  }
                }}
              />
            </a>

            <div className="h-6 w-px bg-slate-800 hidden sm:block" />

            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white">קונצנזוס</span>
                <span className="text-xs bg-amber-400/20 text-amber-300 font-semibold px-2 py-0.5 rounded-full border border-amber-400/30">
                  Polis + AI
                </span>
                <span className="text-xs text-slate-400 hidden lg:inline">| מערכת משאלים, גישור ושיתוף ציבור חכם</span>
              </div>
              <div className="text-xs text-slate-300 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-slate-400">זירה פעילה:</span>
                <span className="text-amber-300 font-bold">{currentTopic?.organization || 'המצפן העירוני'}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Dark Mode Toggle */}
          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle Button */}
            <button
              onClick={onToggleDarkMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title={darkMode ? 'מעבר לתצוגה בהירה' : 'מעבר לתצוגה כהה'}
            >
              {darkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">תצוגה בהירה</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-sky-300" />
                  <span className="hidden sm:inline">תצוגה כהה</span>
                </>
              )}
            </button>

            {/* Embed Code Button */}
            <button
              onClick={onOpenEmbed}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="קוד להטמעה בכתבה באתר"
            >
              <Code2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">הטמעה באתר</span>
            </button>

            {/* New Topic Button */}
            <button
              onClick={onOpenNewTopic}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>פתח זירה</span>
            </button>
          </div>
        </div>

        {/* Topic Selector & Nav Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pt-3 pb-2 gap-3">
          {/* Topic Dropdown Switcher */}
          <div className="relative">
            <button
              onClick={() => setTopicDropdownOpen(!topicDropdownOpen)}
              className="w-full sm:w-auto flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-right text-sm text-slate-100 transition shadow-inner"
            >
              <div className="flex items-center gap-2 truncate">
                {currentTopic && getCategoryIcon(currentTopic.category)}
                <span className="font-bold truncate max-w-[260px] sm:max-w-md">
                  {currentTopic?.title || 'בחר זירת דיון'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${topicDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {topicDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setTopicDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-96 max-w-[90vw] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-40 overflow-hidden divide-y divide-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-2.5 bg-slate-950/80 text-xs font-semibold text-slate-400 flex items-center justify-between">
                    <span>זירות דיון ומשאלים זמינים:</span>
                    <span className="text-[11px] text-amber-400">{topics.length} זירות</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {topics.map(t => {
                      const isSelected = currentTopic?.id === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            onSelectTopic(t.id);
                            setTopicDropdownOpen(false);
                          }}
                          className={`w-full text-right p-3 hover:bg-slate-800/80 transition flex items-start gap-3 ${
                            isSelected ? 'bg-slate-800/90 border-r-4 border-amber-400' : ''
                          }`}
                        >
                          <div className="mt-0.5 p-1.5 rounded-lg bg-slate-800">
                            {getCategoryIcon(t.category)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-amber-400/90 mb-0.5">{t.organization}</div>
                            <div className="text-sm font-bold text-white line-clamp-2 leading-snug">{t.title}</div>
                            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                              <span>{t.stats?.participants || 0} משתתפים</span>
                              <span>•</span>
                              <span>{t.stats?.statementsCount || 0} היגדים</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => onSelectTab('vote')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === 'vote'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Vote className="w-4 h-4" />
              <span>הצבעה והשתתפות</span>
            </button>

            <button
              onClick={() => onSelectTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>מפת הקונצנזוס</span>
            </button>

            <button
              onClick={() => onSelectTab('report')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === 'report'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-purple-200" />
              <span>דו"ח עיתונאי ו-AI</span>
            </button>

            <button
              onClick={() => onSelectTab('admin')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === 'admin'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-900/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Settings2 className="w-4 h-4" />
              <span>ניהול וסינון</span>
            </button>

            {showReturnToPitch && (
              <a
                href="/pitch.html"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border text-amber-300 border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/25 hover:text-amber-200"
                title="חזרה לדף הנחיתה וההצעה העסקית"
              >
                <Briefcase className="w-4 h-4 text-amber-400" />
                <span>חזור לדף הנחיתה ↩️</span>
              </a>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
