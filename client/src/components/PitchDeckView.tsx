import React from 'react';
import { 
  Compass, 
  Sparkles, 
  ShieldCheck, 
  TrendingUp, 
  Share2, 
  Award, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Building2, 
  Scale, 
  Newspaper, 
  Layers, 
  Printer, 
  Eye, 
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import type { Topic } from '../types';

interface PitchDeckViewProps {
  currentTopic: Topic | null;
  onNavigateToVote: () => void;
  onNavigateToReport: () => void;
  onNavigateToDashboard: () => void;
  darkMode: boolean;
}

export const PitchDeckView: React.FC<PitchDeckViewProps> = ({
  onNavigateToVote,
  onNavigateToReport,
  onNavigateToDashboard,
  darkMode
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-16 print:py-0 print:space-y-6">
      
      {/* Top Banner / Breadcrumb / Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 print:hidden">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>הצעה אסטרטגית בלעדית</span>
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="text-blue-600 dark:text-blue-400 font-bold">מערכת "ערב ערב באילת" ו-yomyom.net</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>הדפס / שמור כ-PDF</span>
          </button>
          <button
            onClick={onNavigateToVote}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition"
          >
            <span>צפה במערכת החיה</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-8 sm:p-12 shadow-2xl border border-blue-900/50">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 shadow-sm flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              הצעה אסטרטגית לעורך הראשי ולהנהלת המערכת
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-slate-200 backdrop-blur-sm">
              טכנולוגיית Civic Consensus 2026
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-4 max-w-3xl">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                להפוך טוקבקים מתלהמים <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-amber-300 via-sky-300 to-emerald-300 bg-clip-text text-transparent">
                  לתחקיר עיתונאי ולקונצנזוס אילתי
                </span>
              </h1>
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-normal">
                הפעלת <strong>"המצפן העירוני"</strong> על גבי אתר <strong>yomyom.net</strong> והעיתון <strong>"ערב ערב באילת"</strong>: 
                מנוע דמוקרטיה חישובית ובינה מלאכותית שמזהה את פתרונות ההסכמה הרחבה בין תושבים, עסקים ותיירים — 
                ללא סכנת לשון הרע, עם זינוק בזמן השהייה באתר, ותוכן בלעדי לכותרות סוף השבוע.
              </p>
            </div>

            {/* YomYom Logo Showcase */}
            <div className="shrink-0 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-center space-y-3 hidden lg:block">
              <img 
                src="/images/yomyom-logo-white.png" 
                alt="ערב ערב באילת" 
                className="h-12 w-auto mx-auto object-contain drop-shadow"
              />
              <div className="text-xs text-amber-300 font-bold">המצפן העירוני – מנוע קונצנזוס</div>
              <div className="text-[11px] text-slate-300">בשיתוף DANBAR AI</div>
            </div>
          </div>

          {/* Key Value Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-4">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-3.5 rounded-xl">
              <div className="text-2xl sm:text-3xl font-black text-amber-400">0%</div>
              <div className="text-xs text-slate-300 mt-1">חשיפה לתביעות דיבה (סינון AI פעיל)</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-3.5 rounded-xl">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400">x4.2</div>
              <div className="text-xs text-slate-300 mt-1">זמן שהייה ממוצע של קוראים בכתבה</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-3.5 rounded-xl">
              <div className="text-2xl sm:text-3xl font-black text-sky-400">100%</div>
              <div className="text-xs text-slate-300 mt-1">מבוסס דאטה אלגוריתמית אמינה</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-3.5 rounded-xl">
              <div className="text-2xl sm:text-3xl font-black text-purple-400">&lt; 1 דקה</div>
              <div className="text-xs text-slate-300 mt-1">הפקת כתבת עומק מוכנה לדפוס ע"י AI</div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2 print:hidden">
            <button
              onClick={onNavigateToVote}
              className="px-6 py-3 rounded-xl font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/20 transition flex items-center gap-2"
            >
              <span>התנסה במשאל לדוגמה (מצוקת החניה)</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNavigateToReport}
              className="px-5 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-purple-300" />
              <span>צפה בדו"ח עיתונאי מוכן לפרסום</span>
            </button>
            <button
              onClick={onNavigateToDashboard}
              className="px-5 py-3 rounded-xl font-semibold bg-transparent hover:bg-white/5 text-slate-300 transition flex items-center gap-2"
            >
              <Eye className="w-4 h-4 text-emerald-300" />
              <span>מפת תוצאות וקיטוב</span>
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 1: THE PAIN VS THE SOLUTION */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">האתגר של העיתונות המקומית ב-2026</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            למה מערכת התגובות המסורתית והרשתות החברתיות פוגעות בעיתון?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            כלי התקשורת המובילים בעולם (כמו ה-New York Times, הטייוואנים ו-Polis) כבר הבינו שטוקבקים חופשיים מייצרים רעש, אך לא מייצרים ערך עיתונאי.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Current Reality */}
          <div className="bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-red-600 dark:text-red-400 font-bold">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-red-950 dark:text-red-200 text-lg">המצב הקיים: קבוצות פייסבוק וטוקבקים</h3>
                <div className="text-xs text-red-700 dark:text-red-400">שיח הרסני שאינו מייצר כותרות עיתונאיות</div>
              </div>
            </div>

            <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold mt-0.5">✕</span>
                <span><strong>חשיפה משפטית מתמדת:</strong> סכנת תביעות לשון הרע על פי חוק בעקבות הכפשות של גולשים אנונימיים בתגובות.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold mt-0.5">✕</span>
                <span><strong>מיעוט קולני מעוות את המציאות:</strong> 5% מהמגיבים הקיצוניים שולטים בשיח ומייצרים רושם מוטעה של מלחמה בין תושבים לעירייה.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold mt-0.5">✕</span>
                <span><strong>אפס תובנות מערכתיות:</strong> אי אפשר להוציא כתבת עומק רצינית מ-300 קללות וריבים בפוסט פייסבוק.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold mt-0.5">✕</span>
                <span><strong>נטישת קוראים איכותיים:</strong> קוראים שקולים נמנעים מלהגיב ומאבדים עניין באזור התגובות.</span>
              </li>
            </ul>
          </div>

          {/* Card: With Compass Platform */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-emerald-950 dark:text-emerald-200 text-lg">עם "המצפן העירוני": דמוקרטיה חישובית</h3>
                <div className="text-xs text-emerald-700 dark:text-emerald-400">תשתית שיתוף ציבור אינטליגנטית מבית ערב ערב</div>
              </div>
            </div>

            <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">✓</span>
                <span><strong>שער AI מגן מלשון הרע:</strong> מודל בינה מלאכותית מזהה שמות פרטיים והשמצות, ומנחה את הגולש לניסוח ענייני ומכבד.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">✓</span>
                <span><strong>איתור "היגדי גשר" (Bridging Consensus):</strong> האלגוריתם מבודד את הפתרונות שזוכים להסכמה חוצת-מחנות (תושבים + סוחרים).</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">✓</span>
                <span><strong>מחולל תחקירים אוטומטי:</strong> לחיצה אחת מפיקה כתבת סוף שבוע מלאה עם כותרת, נתונים, גרפים ו-3 שאלות קשות לעירייה.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">✓</span>
                <span><strong>מעורבות שיא והטמעה מושלמת:</strong> ווידג'ט מעוצב הנטמע בכתבות באתר yomyom.net תוך שמירה על נאמנות קוראים.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 2: 4 STRATEGIC PILLARS FOR THE EDITORIAL BOARD */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">למה דווקא עכשיו?</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            4 תועלות מרכזיות להנהלת "ערב ערב באילת"
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pillar 1 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 hover:border-blue-500/50 transition">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Newspaper className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">1. מפעל כותרות ותחקירים בלעדיים</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              במקום להמתין להודעות דוברות העירייה, "ערב ערב" יוצר את סדר היום! 
              כל שבוע ניתן להעלות משאל על סוגיה בוערת (חניה, דירות נופש, מחירי הטיסות, תקציב התיירות), 
              ובתוך 48 שעות להחזיק בנתוני אמת של מאות תושבים — עם כותרת ראשית מוכחת: 
              <span className="block mt-1.5 p-2 bg-slate-50 dark:bg-slate-800/80 rounded-lg text-xs font-semibold text-blue-800 dark:text-blue-300 italic">
                "משאל המצפן העירוני של ערב ערב חושף: 88% מתושבי השכונות וסוחרי העיר דורשים שאטלים וחניון בכניסה לעיר כתנאי לאכיפה"
              </span>
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 hover:border-amber-500/50 transition">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">2. אפס חשיפה משפטית לתביעות לשון הרע</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              העורך הראשי ומחלקת התוכן ישנים בשקט. מנוע ה-AI שלנו (מבוסס Google Gemini 3.5 Flash) בודק בזמן אמת כל היגד שמוצע על ידי הגולשים:
              מזהה שמות של פקידי עירייה, אנשי עסקים, קללות או השמצות, חוסם אותם, 
              ומציג לגולש הצעת ניסוח קונסטרוקטיבית ומגשרת. 
              <strong> אף היגד בעייתי אינו מתפרסם ללא אישור עורך!</strong>
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 hover:border-emerald-500/50 transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">3. הטמעה חלקה באתר yomyom.net ב-5 דקות</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              אין צורך בפיתוח יקר או בשינוי אתר האינטרנט. המערכת מייצרת קוד <code>&lt;iframe&gt;</code> קל-משקל, 
              רספונסיבי לחלוטין לכל סמארטפון, התומך במצב כהה (Dark Mode) ומציג את הלוגו הרשמי של "יום יום באילת". 
              הכתב או העורך רק מדביקים את הקוד בכתבה — והקוראים מצביעים ישירות מתוך הכתבה.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 hover:border-purple-500/50 transition">
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">4. מיצוב מנהיגותי ומנוע הכנסות ושיתופי פעולה</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              העיתון מפסיק להיות רק "מדווח מהצד" והופך ל<strong>שחקן המרכזי שמוביל את הפתרונות בעיר</strong>. 
              הנהלת העירייה, חברי מועצת העיר, תאגיד התיירות ואיגוד המלונות יהיו חייבים להתייחס לתוצאות "המצפן העירוני". 
              בנוסף, המערכת פותחת דלת לחסויות מסחריות יוקרתיות ולתקציבי שיתוף ציבור עירוניים.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 3: LIVE SIMULATION SHOWCASE */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">הוכחת היתכנות חיה (Live Proof)</span>
            <h3 className="text-2xl font-black">זירת הדגל: "מצוקת החניה באילת"</h3>
            <p className="text-slate-400 text-sm">
              המשאל הפעיל המדגים כיצד האלגוריתם מוצא הסכמה בין 3 קבוצות אינטרס מנוגדות.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToVote}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition flex items-center gap-1.5"
            >
              <span>הצבע כעת כמו קורא</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onNavigateToReport}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>צפה בתחקיר ה-AI המופק</span>
            </button>
          </div>
        </div>

        {/* Real Data Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">היגד הגשר המוביל #1</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">89% הסכמה חוצת-קבוצות</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              "הקמת חניון 'חנה וסע' מוסדר בתשלום לנופשים לסיני בשטח שדה התעופה הישן עם שאטל ישיר לטאבה, לצד אכיפה בשכונות."
            </p>
            <div className="text-[11px] text-slate-400">
              תמיכה: תושבים 92% | עסקים 85% | תיירות 80%
            </div>
          </div>

          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">היגד הגשר המוביל #2</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">86% הסכמה חוצת-קבוצות</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              "צביעת כל ההכנסות מאכיפת חניה לקרן עירונית שקופה להצללת מדרכות, שאטלים חינם ושיפור החניה בשכונות."
            </p>
            <div className="text-[11px] text-slate-400">
              תמיכה: תושבים 88% | עסקים 85% | תיירות 86%
            </div>
          </div>

          <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-400">סלע המחלוקת (היגד מקטב)</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">פער של 65% בעמדות</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              "איסור מוחלט על חניית רכבים ללא 'תו תושב אילתי' בשכונות המגורים בתקופות שיא או מעל 24 שעות."
            </p>
            <div className="text-[11px] text-slate-400">
              תושבים תומכים 80% לעומת תיירות ועסקים רק 15-20%
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-blue-950/50 border border-blue-900/60 text-xs text-blue-200 flex items-center justify-between flex-wrap gap-2">
          <span>💡 <strong>תובנה עיתונאית לעורך:</strong> הציבור האילתי לא רוצה 'מלחמות קנסות' – הוא דורש פתרון תשתיתי של חניון ושאטל, שמוסכם על כל הצדדים!</span>
          <button
            onClick={onNavigateToDashboard}
            className="text-amber-300 hover:text-amber-200 font-bold underline shrink-0"
          >
            פתח את תרשים הפיזור והאנליטיקה המלא
          </button>
        </div>
      </section>

      {/* SECTION 4: COMPARISON TABLE */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">השוואה השוואתית ישירה</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            טוקבקים מסורתיים לעומת "המצפן העירוני"
          </h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">פרמטר</th>
                <th className="p-4 text-red-600 dark:text-red-400">טוקבקים רגילים (וואטסאפ / פייסבוק)</th>
                <th className="p-4 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">המצפן העירוני של ערב ערב</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300">
              <tr>
                <td className="p-4 font-bold text-slate-900 dark:text-white">אחריות משפטית ולשון הרע</td>
                <td className="p-4 text-red-600 dark:text-red-400">סיכון מתמיד לתביעות דיבה עקב קללות והשמצות</td>
                <td className="p-4 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">הגנת AI וסינון PII בזמן אמת, אפס חשיפה משפטית</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900 dark:text-white">ערך עיתונאי לכתבות</td>
                <td className="p-4 text-red-600 dark:text-red-400">אפס – רעש אקראי ללא סטטיסטיקה מוסמכת</td>
                <td className="p-4 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">דו"ח עיתונאי מבוסס AI, כותרות סוף שבוע ושאלות קשות לעירייה</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900 dark:text-white">זמן שהיית גולשים באתר</td>
                <td className="p-4">30-45 שניות בממוצע</td>
                <td className="p-4 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">3-5 דקות (הצבעה על עשרות היגדים ועיון במפה)</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900 dark:text-white">מיפוי עמדות לפי אוכלוסיות</td>
                <td className="p-4 text-red-600 dark:text-red-400">אי אפשר לדעת מיהו תושב, סוחר או תייר</td>
                <td className="p-4 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">הפרדה חכמה בכובעי זיקה: תושבי שכונות, בעלי עסקים ותיירות</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900 dark:text-white">השפעה על החלטות העירייה</td>
                <td className="p-4">קברניטי העירייה מתעלמים מהטוקבקים כ"רעש"</td>
                <td className="p-4 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">מסמך עמדה שמחייב את ראש העירייה והמועצה להשיב עניינית</td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-slate-900 dark:text-white">חוויית משתמש ומיתוג</td>
                <td className="p-4">טופס תגובות מיושן ומעייף</td>
                <td className="p-4 font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">ממשק כרטיסיות מתקדם דמוי טינדר/פוליס עם תמיכה מלאה במצב כהה</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 5: IMPLEMENTATION PROPOSAL & NEXT STEPS */}
      <section className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl space-y-6">
        <div className="space-y-3 max-w-3xl">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950 inline-block">
            הצעה מעשית לשיתוף פעולה מיידי
          </span>
          <h2 className="text-2xl sm:text-3xl font-black">
            תוכנית פיילוט ל-3 משאלים ראשונים — ללא עלות התחלתית
          </h2>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
            אנו מציעים למערכת "ערב ערב באילת" להשיק יחד איתנו פיילוט ייעודי של <strong>3 סוגיות מפתח</strong> שמעסיקות את תושבי אילת בימים אלה:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 space-y-2">
            <div className="text-amber-300 font-bold text-sm">משאל פיילוט #1</div>
            <div className="font-extrabold text-base">מצוקת החניה ושדה התעופה הישן</div>
            <div className="text-xs text-slate-300 leading-relaxed">
              הסדרי חניה, שאטלים לטאבה, ואכיפה בשכונות המגורים לקראת החגים.
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 space-y-2">
            <div className="text-amber-300 font-bold text-sm">משאל פיילוט #2</div>
            <div className="font-extrabold text-base">איזון דירות נופש (Airbnb) בשכונות</div>
            <div className="text-xs text-slate-300 leading-relaxed">
              שמירה על השקט ואיכות חיי התושבים מול פרנסת בעלי הדירות והתיירות.
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 space-y-2">
            <div className="text-amber-300 font-bold text-sm">משאל פיילוט #3</div>
            <div className="font-extrabold text-base">עתיד רצועת החוף ופיתוח המלונאות</div>
            <div className="text-xs text-slate-300 leading-relaxed">
              הנגשת חופים חופשיים לתושבים מול משיכת רשתות מלונאות בינלאומיות.
            </div>
          </div>
        </div>

        {/* Contact Danny Barkai Box */}
        <div className="bg-slate-950/60 p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-right">
            <div className="text-lg font-bold text-white">דני ברקאי – DANBAR Consulting & AI</div>
            <div className="text-xs text-slate-300">מומחה לגישור, דיאלוג ציבורי ופתרונות בינה מלאכותית ארגוניים</div>
            <div className="text-xs text-amber-400 font-mono mt-1">מערכת קונצנזוס אילתית | מוכנה להפעלה מיידית</div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>הדפס הצעה זו</span>
            </button>
            <button
              onClick={onNavigateToVote}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md transition flex items-center gap-1.5"
            >
              <span>התחל סימולציה חיה של המערכת</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER NOTE */}
      <footer className="text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-6 space-y-1">
        <div>קונצנזוס – המצפן העירוני | מותאם בלעדית עבור "ערב ערב באילת" ו-yomyom.net</div>
        <div className="text-[11px] text-slate-400 dark:text-slate-500">
          כל הזכויות שמורות © DANBAR AI. בהשראת פלטפורמות הדמוקרטיה החישובית Polis ו-Talk to the City.
        </div>
      </footer>

    </div>
  );
};
