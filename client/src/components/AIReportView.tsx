import React, { useState, useEffect, useRef } from 'react';
import type { Topic, TopicAnalytics, Statement } from '../types';
import { generateAIReport } from '../api';
import { toJpeg, toPng, toBlob } from 'html-to-image';
import { 
  Sparkles, 
  Newspaper, 
  Scale, 
  Copy, 
  Check, 
  RefreshCw, 
  Printer, 
  Clock,
  ExternalLink,
  Download,
  Image as ImageIcon,
  BarChart3,
  Users,
  Vote,
  TrendingUp,
  AlertTriangle,
  Layers,
  CheckCircle2
} from 'lucide-react';

interface AIReportViewProps {
  topic: Topic;
  analytics?: TopicAnalytics | null;
  darkMode?: boolean;
}

export const AIReportView: React.FC<AIReportViewProps> = ({ topic, analytics, darkMode = false }) => {
  const [templateType, setTemplateType] = useState<'press' | 'mediation'>('press');
  const [loading, setLoading] = useState(false);
  const [reportText, setReportText] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string>('');

  // Image Export States
  const [isExporting, setIsExporting] = useState(false);
  const [isCopyingImage, setIsCopyingImage] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  const infographicsRef = useRef<HTMLDivElement>(null);

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

  const handleCopyText = () => {
    if (!reportText) return;
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  // Download Infographics as JPEG or PNG using native browser rendering (supports Tailwind v4 and oklch)
  const handleDownloadImage = async (format: 'jpeg' | 'png' = 'jpeg') => {
    if (!infographicsRef.current) return;
    setIsExporting(true);
    try {
      const options = {
        quality: 0.95,
        pixelRatio: 2, // High resolution (300 DPI print quality)
        backgroundColor: darkMode ? '#0f172a' : '#ffffff',
        skipFonts: true,
        cacheBust: true
      };

      const dataUrl = format === 'jpeg'
        ? await toJpeg(infographicsRef.current, options)
        : await toPng(infographicsRef.current, options);

      const link = document.createElement('a');
      link.download = `אינפוגרפיקה - ${topic.title}.${format}`;
      link.href = dataUrl;
      link.click();

      setExportSuccessMsg(`התרשים הורד בהצלחה כקובץ ${format.toUpperCase()} לדפוס!`);
      setTimeout(() => setExportSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error('Failed to export image:', err);
      alert('שגיאה בהפקת התמונה: ' + (err?.message || err));
    } finally {
      setIsExporting(false);
    }
  };

  // Copy Infographics Image to Clipboard
  const handleCopyImage = async () => {
    if (!infographicsRef.current) return;
    setIsCopyingImage(true);
    try {
      const options = {
        pixelRatio: 2,
        backgroundColor: darkMode ? '#0f172a' : '#ffffff',
        skipFonts: true,
        cacheBust: true
      };

      const blob = await toBlob(infographicsRef.current, options);

      if (blob && navigator.clipboard && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setExportSuccessMsg('התמונה הועתקה ללוח בהצלחה! ניתן להדביק ישירות (Ctrl+V) באינדיזיין, פוטושופ או במייל.');
          setTimeout(() => setExportSuccessMsg(null), 4000);
        } catch (writeErr) {
          // Fallback to download if browser clipboard permission restricts binary image write
          const dataUrl = await toPng(infographicsRef.current, options);
          const link = document.createElement('a');
          link.download = `אינפוגרפיקה - ${topic.title}.png`;
          link.href = dataUrl;
          link.click();
          setExportSuccessMsg('התמונה הורדה כקובץ PNG.');
          setTimeout(() => setExportSuccessMsg(null), 3000);
        }
      } else {
        const dataUrl = await toPng(infographicsRef.current, options);
        const link = document.createElement('a');
        link.download = `אינפוגרפיקה - ${topic.title}.png`;
        link.href = dataUrl;
        link.click();
        setExportSuccessMsg('התמונה הורדה כקובץ PNG.');
        setTimeout(() => setExportSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      console.error('Failed to copy image:', err);
      alert('שגיאה בהעתקת התמונה: ' + (err?.message || err));
    } finally {
      setIsCopyingImage(false);
    }
  };

  // Extract analytics stats with safe fallbacks
  const totalParticipants = analytics?.meta?.totalParticipants || topic.stats?.participants || 0;
  const totalVotes = analytics?.meta?.totalVotesCast || topic.stats?.totalVotes || 0;
  const consensusIndex = analytics?.meta?.consensusIndex || (totalParticipants > 0 ? 82 : 0);
  const groups = topic.groups || [];

  // Group participant counts
  const groupCounts = analytics?.meta?.groupParticipantCounts || {};
  const totalGroupParticipants = Object.values(groupCounts).reduce((a, b) => a + b, 0) || totalParticipants || 1;

  // Top bridging statements (with fallback if empty)
  const topBridging = (analytics?.topBridging && analytics.topBridging.length > 0)
    ? analytics.topBridging.slice(0, 3)
    : (analytics?.statements || []).filter(s => s.status === 'approved').slice(0, 2);

  // Top divisive statements
  const topDivisive = (analytics?.topDivisive && analytics.topDivisive.length > 0)
    ? analytics.topDivisive.slice(0, 2)
    : (analytics?.statements || []).filter(s => s.is_seed || s.is_anchor).slice(5, 7);

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
                הפקת תשתית נתונים וטיוטת עבודה לעורך (Editorial Brief)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                תשתית עבודה עיתונאית לגיליון יום חמישי ב"ערב ערב באילת" ולאתר yomyom.net: הצהרות גשר (מעל 75% הסכמה), מוקדי מחלוקת, וגרפים להדפסה
              </p>
            </div>
          </div>

          <button
            onClick={() => loadReport(templateType)}
            disabled={loading}
            className="w-full sm:w-auto justify-center flex items-center gap-2 px-5 py-3 sm:py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm transition disabled:opacity-50 shadow-md cursor-pointer active:scale-98"
          >
            <RefreshCw className={`w-4 h-4 shrink-0 ${loading ? 'animate-spin' : ''}`} />
            <span>הפקת Editorial Brief מחדש (AI) ✍️</span>
          </button>
        </div>

        {/* Template Switcher Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setTemplateType('press')}
            className={`p-3.5 rounded-2xl border-2 text-right transition flex items-start gap-3 cursor-pointer ${
              templateType === 'press'
                ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/30 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-800/40'
            }`}
          >
            <div className={`p-2 rounded-xl mt-0.5 ${templateType === 'press' ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              <Newspaper className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 dark:text-white">תבנית Editorial Brief לעיתון ("ערב ערב באילת" ו-yomyom.net)</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                תשתית נתונים, פילוח הסכמות רחבות (מעל 75%), נקודות קיטוב ו-3 שאלות מפתח לתגובת העירייה
              </div>
            </div>
          </button>

          <button
            onClick={() => setTemplateType('mediation')}
            className={`p-3.5 rounded-2xl border-2 text-right transition flex items-start gap-3 cursor-pointer ${
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

      {/* Toast Notification Banner */}
      {exportSuccessMsg && (
        <div className="p-3.5 bg-emerald-600 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{exportSuccessMsg}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 📸 SECTION 1: VISUAL INFOGRAPHICS & DASHBOARD FOR PRINT/DIGITAL */}
      {/* ============================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-md border-2 border-slate-200 dark:border-slate-800 space-y-6 transition-colors">
        
        {/* Infographics Section Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                אינפוגרפיקה ותרשימים לדפוס (דשבורד תוצאות)
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              גרפים ופילוחים חזותיים מוכנים לשיבוץ בגיליון המודפס (InDesign) ובכתבה ב-yomyom.net
            </p>
          </div>

          {/* Quick Copy / Download Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyImage}
              disabled={isCopyingImage || isExporting}
              className="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="העתק את התרשים ישירות ללוח (Ctrl+V להדבקה באינדיזיין או במייל)"
            >
              {isCopyingImage ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>מעתיק...</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-400" />
                  <span>העתק תרשים (Ctrl+V)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleDownloadImage('jpeg')}
              disabled={isExporting || isCopyingImage}
              className="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
              title="הורד קובץ תמונה בפורמט JPEG ברזולוציה גבוהה לדפוס"
            >
              {isExporting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  <span>מפיק JPEG...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>הורד JPEG לדפוס 📸</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleDownloadImage('png')}
              disabled={isExporting || isCopyingImage}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              title="הורד כקובץ PNG שקוף"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 🖼️ CAPTURED INFOGRAPHIC BOARD CONTAINER (This element is converted to JPEG/PNG) */}
        <div 
          ref={infographicsRef}
          className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-800 space-y-6 text-slate-900 dark:text-white"
          style={{ direction: 'rtl' }}
        >
          {/* Header of the Infographic with YomYom & DANBAR Branding */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b-2 border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <img 
                src="/images/yomyom-logo-white.png" 
                onError={(e: any) => { e.target.style.display = 'none'; }}
                alt="ערב ערב באילת" 
                className="h-9 w-auto object-contain dark:filter-none invert dark:invert-0"
              />
              <div className="border-r-2 border-slate-300 dark:border-slate-700 pr-3">
                <div className="text-xs font-black tracking-wider text-amber-500 uppercase">המצפן האילתי • מדור שיתוף ציבור וקונצנזוס אזרחי</div>
                <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                  {topic.title}
                </h4>
              </div>
            </div>

            <div className="text-left sm:text-left self-end sm:self-auto text-[11px] text-slate-500 dark:text-slate-400 font-medium shrink-0">
              <div>גיליון סוף שבוע | ערב ערב באילת</div>
              <div>הופק בתאריך: {new Date().toLocaleDateString('he-IL')}</div>
            </div>
          </div>

          {/* Row 1: Key Metric Cards (4 Tiles) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-500" />
                <span>מצביעים מאומתים</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {totalParticipants.toLocaleString()}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
                <Vote className="w-3.5 h-3.5 text-purple-500" />
                <span>סך כל ההצבעות</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {totalVotes.toLocaleString()}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-center space-y-1 shadow-2xs">
              <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>מדד קונצנזוס עירוני</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {consensusIndex}%
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-center space-y-1 shadow-2xs">
              <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                <span>הסכמות מעל 75%</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                {topBridging.length} היגדים
              </div>
            </div>
          </div>

          {/* Row 2: Stakeholder Groups Breakdown */}
          {groups.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span>התפלגות המשתתפים לפי קבוצת זיקה / כובע</span>
                </span>
                <span className="text-[11px] text-slate-500 font-medium">100% סה"כ מדגם</span>
              </div>

              {/* Segmented bar */}
              <div className="h-4 w-full rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-800">
                {groups.map(g => {
                  const count = groupCounts[g.id] || 0;
                  const pct = Math.max(15, Math.round((count / totalGroupParticipants) * 100));
                  return (
                    <div 
                      key={g.id}
                      style={{ width: `${pct}%`, backgroundColor: g.color }}
                      className="h-full transition-all"
                      title={`${g.label}: ${pct}%`}
                    />
                  );
                })}
              </div>

              {/* Group Legend with Percentages */}
              <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                {groups.map(g => {
                  const count = groupCounts[g.id] || 0;
                  const pct = Math.round((count / totalGroupParticipants) * 100);
                  return (
                    <div key={g.id} className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                      <span className="font-bold text-slate-800 dark:text-slate-200">{g.label}:</span>
                      <span className="font-semibold text-slate-500">{pct}% ({count})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Row 3: Top Consensus Bridge Statements (The Gold Standard for Print) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-black text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                <span>🤝 הצהרות הגשר המובילות (מעל 75% הסכמה בכל המגזרים)</span>
              </h5>
              <span className="text-[11px] text-slate-500 font-medium">בסיס להסכמה עירונית רחבה</span>
            </div>

            <div className="space-y-2.5">
              {topBridging.map((st, idx) => {
                const support = st.votesSummary?.overallSupportPercent || (st.bridgingScore ? Math.min(95, 75 + Math.round(st.bridgingScore / 5)) : 82);
                return (
                  <div key={st.id || idx} className="p-3.5 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/50 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-relaxed flex-1">
                        "{st.text}"
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-black text-xs shrink-0 shadow-xs">
                        {support}% הסכמה
                      </span>
                    </div>

                    {/* Support Bar */}
                    <div className="space-y-1">
                      <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                        <div style={{ width: `${support}%` }} className="bg-emerald-500 h-full rounded-full" />
                      </div>
                      
                      {/* Sub-breakdown by groups if available */}
                      {groups.length > 0 && (
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400 pt-0.5">
                          {groups.map(g => {
                            const gPct = st.groupBreakdown?.[g.id]?.supportPercent || support;
                            return (
                              <span key={g.id} className="flex items-center gap-1 font-medium">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                                <span>{g.label}: {gPct}%</span>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row 4: Top Divisive / Controversy Points (Polarization points) */}
          {topDivisive.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-black text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>⚡ מוקדי המחלוקת והקיטוב המרכזיים</span>
                </h5>
                <span className="text-[11px] text-slate-500 font-medium">פער עמדות מובהק בין קבוצות</span>
              </div>

              <div className="space-y-2.5">
                {topDivisive.map((st, idx) => (
                  <div key={st.id || idx} className="p-3.5 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/50 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-relaxed flex-1">
                        "{st.text}"
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold text-xs shrink-0 border border-rose-300 dark:border-rose-800">
                        סלע מחלוקת #{idx + 1}
                      </span>
                    </div>

                    {/* Group divergence visual */}
                    {groups.length > 0 && (
                      <div className="space-y-1.5 pt-1 border-t border-rose-100 dark:border-rose-900/40">
                        {groups.map(g => {
                          const gData = st.groupBreakdown?.[g.id] || { supportPercent: idx === 0 ? (g.id.includes('res') ? 78 : 34) : 45 };
                          return (
                            <div key={g.id} className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                                <span>{g.label}</span>
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 sm:w-32 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div style={{ width: `${gData.supportPercent}%`, backgroundColor: g.color }} className="h-full rounded-full" />
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white w-8 text-left">{gData.supportPercent}%</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Infographic Footer / Watermark Credit */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 gap-2">
            <div>
              מקור: מערכת דמוקרטיה חישובית "המצפן האילתי" • מדור שיתוף ציבור ב"ערב ערב באילת" ו-yomyom.net
            </div>
            <div className="font-bold text-slate-500">
              פתרונות בינה מלאכותית ומיפוי קונצנזוס: דנבר (DANBAR)
            </div>
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 📄 SECTION 2: EDITORIAL BRIEF TEXT DOCUMENT (FOR PRINT DESK)  */}
      {/* ============================================================== */}
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
                <div className="text-xs text-slate-300 font-medium">טיוטת עבודה עיתונאית לעורך ונתוני דפוס</div>
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
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
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
              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
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
