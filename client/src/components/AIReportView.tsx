import React, { useState, useEffect } from 'react';
import type { Topic, TopicAnalytics } from '../types';
import { generateAIReport } from '../api';
import { 
  Sparkles, 
  Newspaper, 
  Scale, 
  Copy, 
  Check, 
  RefreshCw, 
  Printer, 
  Clock,
  ExternalLink
} from 'lucide-react';

interface AIReportViewProps {
  topic: Topic;
  analytics: TopicAnalytics;
  darkMode?: boolean;
}

export const AIReportView: React.FC<AIReportViewProps> = ({ topic, darkMode = false }) => {
  const [templateType, setTemplateType] = useState<'press' | 'mediation'>('press');
  const [loading, setLoading] = useState(false);
  const [reportText, setReportText] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string>('');

  const loadReport = async (type: 'press' | 'mediation') => {
    setLoading(true);
    try {
      const res = await generateAIReport(topic.id, type);
      setReportText(res.report);
      setGeneratedAt(new Date(res.generatedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(templateType);
  }, [topic.id, templateType]);

  const handleCopy = () => {
    if (!reportText) return;
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      
      {/* Top Banner / Template Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 shadow-xs">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                הכנת כתבה עיתונאית בלחיצת כפתור (AI Press Generator)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                הפקת טיוטת כתבה מוכנה לדפוס לגיליון יום חמישי ב"ערב ערב באילת" ולאתר yomyom.net מבוססת ניתוח נתוני ההצבעה החיים
              </p>
            </div>
          </div>

          <button
            onClick={() => loadReport(templateType)}
            disabled={loading}
            className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition disabled:opacity-50 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>הפקת כתבה מחדש (AI) ✍️</span>
          </button>
        </div>

        {/* Template Switcher Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setTemplateType('press')}
            className={`p-3.5 rounded-2xl border-2 text-right transition flex items-start gap-3 ${
              templateType === 'press'
                ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/30 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
            }`}
          >
            <div className={`p-2 rounded-xl mt-0.5 ${templateType === 'press' ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              <Newspaper className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 dark:text-white">תבנית כתבת סוף שבוע ("ערב ערב באילת")</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                כותרת עיתונאית, ניתוח נתונים, פתרונות הקונצנזוס ו-3 שאלות קשות לעירייה
              </div>
            </div>
          </button>

          <button
            onClick={() => setTemplateType('mediation')}
            className={`p-3.5 rounded-2xl border-2 text-right transition flex items-start gap-3 ${
              templateType === 'mediation'
                ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/30 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
            }`}
          >
            <div className={`p-2 rounded-xl mt-0.5 ${templateType === 'mediation' ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 dark:text-white">תבנית נייר עמדה לוועדה / גישור קהילתי</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                אבחון מרחב ההסכמה (ZOPA), פירוק אינטרסים מול עמדות, ומפת דרכים לפשרה
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Report Document Content Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-md border border-slate-200 dark:border-slate-800 space-y-6 relative transition-colors">
        
        {/* Flagship Newspaper Banner with YomYom Logo if Press Template */}
        {templateType === 'press' && (
          <div className="p-4 rounded-2xl bg-slate-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
            <div className="flex items-center gap-3">
              <a href="https://www.yomyom.net/" target="_blank" rel="noreferrer" className="block shrink-0">
                <img 
                  src="/images/yomyom-logo-white.png" 
                  alt="יום יום באילת | ערב ערב באילת" 
                  className="h-10 w-auto object-contain"
                />
              </a>
              <div className="border-r border-slate-800 pr-3">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">המצפן העירוני</div>
                <div className="text-xs text-slate-300 font-medium">פרויקט שיתוף הציבור ודמוקרטיה חישובית</div>
              </div>
            </div>
            <a 
              href="https://www.yomyom.net/" 
              target="_blank" 
              rel="noreferrer"
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition"
            >
              <span>לאתר החדשות yomyom.net</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Document Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 rounded-md border border-purple-200 dark:border-purple-800">
              {templateType === 'press' ? 'נוסח עיתונאי מוכן לפרסום' : 'נייר עמדה מקצועי'}
            </span>
            {generatedAt && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>עודכן ב-{generatedAt}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>הועתק ללוח!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>העתק טקסט מוכן</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
              title="הדפס או שמור כ-PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600 rounded-full animate-spin" />
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
              מנתח את תוצאות ההצבעה ומפיק את הדו"ח בעזרת AI...
            </div>
            <div className="text-xs text-slate-400">
              משקלל את הצהרות הגשר, סלעי המחלוקת ושיעורי התמיכה בכל קבוצה
            </div>
          </div>
        ) : (
          /* Rendered Report */
          <div className="prose prose-slate dark:prose-invert max-w-none text-slate-900 dark:text-slate-100 leading-relaxed font-sans text-right">
            {reportText.split('\n').map((line, idx) => {
              if (line.startsWith('# ')) {
                return (
                  <h1 key={idx} className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white mt-4 mb-2">
                    {line.replace('# ', '')}
                  </h1>
                );
              }
              if (line.startsWith('## ')) {
                return (
                  <h2 key={idx} className="text-lg sm:text-xl font-bold text-purple-900 dark:text-purple-300 mt-3 mb-4 leading-normal">
                    {line.replace('## ', '')}
                  </h2>
                );
              }
              if (line.startsWith('### ')) {
                return (
                  <h3 key={idx} className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-6 mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">
                    {line.replace('### ', '')}
                  </h3>
                );
              }
              if (line.startsWith('> ')) {
                return (
                  <blockquote key={idx} className="border-r-4 border-amber-400 bg-amber-50/60 dark:bg-amber-950/30 p-3 my-2 text-sm text-slate-800 dark:text-slate-200 rounded-r">
                    {line.replace('> ', '')}
                  </blockquote>
                );
              }
              if (line.startsWith('---')) {
                return <hr key={idx} className="my-4 border-slate-200 dark:border-slate-800" />;
              }
              if (line.trim().length === 0) {
                return <div key={idx} className="h-2" />;
              }
              return (
                <p key={idx} className="text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 my-1.5">
                  {line}
                </p>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
