import React from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft, 
  Printer, 
  ExternalLink,
  Settings2,
  Vote,
  Compass,
  FileText,
  BarChart3,
  HelpCircle
} from 'lucide-react';

interface PitchDeckViewProps {
  onNavigateToAdmin: () => void;
  onNavigateToWidget: () => void;
  darkMode: boolean;
}

export const PitchDeckView: React.FC<PitchDeckViewProps> = ({
  onNavigateToAdmin,
  onNavigateToWidget,
  darkMode
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-4 pb-16 print:py-0 print:space-y-6">
      
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <a href="https://www.yomyom.net/" target="_blank" rel="noreferrer" className="block">
            <img 
              src={darkMode ? "/images/yomyom-logo-white.png" : "/images/yomyom-logo.png"} 
              alt="ערב ערב באילת" 
              className="h-8 w-auto object-contain"
            />
          </a>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
            הצעה אסטרטגית למקבלי ההחלטות
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://www.yomyom.net/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
          >
            <span>אתר yomyom.net</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>הדפסה / PDF</span>
          </button>
        </div>
      </div>

      {/* 1. HERO: WHAT THE PLATFORM DOES & ITS SIGNIFICANCE */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-blue-900/40 space-y-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>המצפן העירוני – ערב ערב באילת</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            להפוך טוקבקים מתלהמים לתחקיר עיתונאי ולקונצנזוס אילתי
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-3xl font-normal">
            <strong>"המצפן העירוני"</strong> היא פלטפורמת דמוקרטיה חישובית ובינה מלאכותית (בהשראת Polis העולמית), 
            המיועדת להטמעה ישירה באתר <strong>yomyom.net</strong> ובעיתון <strong>"ערב ערב באילת"</strong>. 
            המערכת ממפה עמדות תושבים, סוחרים ותיירים בסוגיות מקומיות בוערות ומבודדת את <strong>"היגדי הגשר"</strong> — 
            הפתרונות המעשיים שזוכים להסכמה חוצת-מגזרים רחבה, ללא סכנת לשון הרע ועם כותרות עיתונאיות בלעדיות.
          </p>
        </div>

        {/* The 2 Primary Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <button
            onClick={onNavigateToWidget}
            className="flex-1 flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/20 text-base transition transform hover:-translate-y-0.5"
          >
            <Vote className="w-5 h-5 text-slate-950" />
            <span>התנסות בווידג'ט ההצבעה</span>
            <ArrowLeft className="w-4 h-4 mr-1" />
          </button>

          <button
            onClick={onNavigateToAdmin}
            className="flex-1 flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-base transition transform hover:-translate-y-0.5"
          >
            <Settings2 className="w-5 h-5 text-amber-400" />
            <span>מעבר למערכת הניהול</span>
            <ArrowLeft className="w-4 h-4 mr-1" />
          </button>
        </div>
      </section>

      {/* 2. PROS & CONS (BENEFITS VS TRADITIONAL COMMENTS) */}
      <section className="space-y-4">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            למה זה נחוץ לעיתון?
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            טוקבקים ורשתות חברתיות מול "המצפן העירוני"
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* Cons: Traditional Social & Comments */}
          <div className="bg-red-50/80 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
              <h3 className="font-bold text-red-950 dark:text-red-200 text-base">
                החסרונות בשיח הקיים (פייסבוק וטוקבקים)
              </h3>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✕</span>
                <span><strong>חשיפה לתביעות לשון הרע:</strong> השמצות וקללות של גולשים אנונימיים שמסכנות את המערכת.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✕</span>
                <span><strong>עיוות המציאות ע"י מיעוט קולני:</strong> המגיבים הקיצוניים שולטים בשיח ומייצרים קיטוב מדומה.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✕</span>
                <span><strong>אפס ערך עיתונאי:</strong> אי אפשר להוציא כתבה מבוססת מתוך בליל תגובות אקראי.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✕</span>
                <span><strong>התעלמות מצד מקבלי ההחלטות:</strong> העירייה מתייחסת לטוקבקים כאל רעש שאינו מחייב מענה.</span>
              </li>
            </ul>
          </div>

          {/* Pros: The Compass Platform */}
          <div className="bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-2xl p-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <h3 className="font-bold text-emerald-950 dark:text-emerald-200 text-base">
                היתרונות ב"המצפן העירוני"
              </h3>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                <span><strong>הגנת AI מלשון הרע:</strong> מודל בינה מלאכותית מונע PII והשמצות, ומציע ניסוח ענייני בונה.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                <span><strong>איתור הסכמות רחבות:</strong> בידוד פתרונות הזוכים ליותר מ-60% תמיכה בכל המגזרים (תושבים וסוחרים).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                <span><strong>תחקיר וכותרות סוף שבוע בלחיצת כפתור:</strong> מחולל AI שמייצר כתבת עומק מלאה עם גרפים ושאלות לעירייה.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
                <span><strong>מעורבות שיא באתר yomyom.net:</strong> זמן שהייה ממוצע של קוראים מזנק פי 4 בזכות חוויית ההצבעה.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS IN 3 SIMPLE STEPS */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="text-center space-y-1">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            פשטות הפעלה
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            איך המערכת עובדת בפועל?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-sm flex items-center justify-center">
              1
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">פתיחת זירה והיגדים</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              העיתון מגדיר סוגיה אילתית בוערת (חניה, דירות נופש, חופים), ובוחר 5 היגדים ראשונים מתוך מאגר ההצעות של ה-AI.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black text-sm flex items-center justify-center">
              2
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">הצבעה קלה בווידג'ט</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              הקוראים באתר yomyom.net בוחרים כובע זיקה (תושב / בעל עסק / תייר), מצביעים אנונימית על ההיגדים ויכולים להציע פתרונות חדשים.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white font-black text-sm flex items-center justify-center">
              3
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">הפקת תחקיר עיתונאי</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              המנוע מחשב את נקודות ההסכמה ומפיק בדקה כתבת סוף שבוע מקיפה עם נתונים, גרפים ו-3 שאלות קשות להנהלת העירייה.
            </p>
          </div>
        </div>
      </section>

      {/* 4. COLLABORATION PROPOSAL */}
      <section className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg space-y-5 border border-blue-800/50">
        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
            הצעת התקשרות
          </div>
          <h2 className="text-2xl font-black">
            תוכנית פיילוט ל-3 משאלים ראשונים — ללא עלות התחלתית
          </h2>
          <p className="text-slate-200 text-sm leading-relaxed max-w-2xl">
            אנו מציעים למערכת "ערב ערב באילת" להשיק פיילוט משותף ל-3 סוגיות מפתח (מצוקת החניה, איזון דירות נופש Airbnb, ורצועת החוף), 
            הכולל הטמעה מלאה ב-yomyom.net וליווי מקצועי:
          </p>
        </div>

        <div className="bg-slate-950/60 rounded-2xl p-5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-right">
            <div className="font-bold text-white text-base">דני ברקאי – DANBAR Consulting & AI</div>
            <div className="text-xs text-slate-300">גישור, דיאלוג ציבורי וטכנולוגיות דמוקרטיה חישובית</div>
            <div className="text-xs text-amber-300 font-mono">הטמעה מהירה תוך 24 שעות</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>הדפסת הצעה זו</span>
            </button>
          </div>
        </div>

        {/* The 2 Primary Action Buttons at the Bottom */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <button
            onClick={onNavigateToWidget}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md text-sm transition"
          >
            <Vote className="w-4 h-4 text-slate-950" />
            <span>התנסות בווידג'ט ההצבעה</span>
            <ArrowLeft className="w-4 h-4 mr-1" />
          </button>

          <button
            onClick={onNavigateToAdmin}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-sm transition"
          >
            <Settings2 className="w-4 h-4 text-amber-400" />
            <span>מעבר למערכת הניהול</span>
            <ArrowLeft className="w-4 h-4 mr-1" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800 pt-6">
        <div>המצפן העירוני | מותאם בלעדית עבור "ערב ערב באילת" ו-yomyom.net • כל הזכויות שמורות © DANBAR AI</div>
      </footer>

    </div>
  );
};
