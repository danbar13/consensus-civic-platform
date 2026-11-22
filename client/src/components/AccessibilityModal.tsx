import React from 'react';
import { X, Accessibility, CheckCircle2, Mail, Phone, ExternalLink } from 'lucide-react';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-title"
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 text-slate-800 dark:text-slate-100 text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Accessibility className="w-6 h-6" />
            </div>
            <div>
              <h2 id="accessibility-title" className="text-xl sm:text-2xl font-black">הצהרת נגישות</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">עודכן לאחרונה: נובמבר 2026 | עמידה בתקן ת"י 5568 ו-WCAG 2.1 AA</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="סגור הצהרת נגישות"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-6 space-y-6 text-sm leading-relaxed">
          <section>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">מחויבות לנגישות דיגיטלית</h3>
            <p className="text-slate-600 dark:text-slate-300">
              מערכת <strong>"קונצנזוס – המצפן העירוני"</strong> (בשיתוף "ערב ערב באילת" ו-DANBAR) מחויבת להבטחת שוויון הזדמנויות מלא באינטרנט לכלל האוכלוסייה, לרבות אנשים עם מוגבלויות. אנו פועלים בהתאם לחוק שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), תשע"ג-2013 ולהנחיות התקן הישראלי ת"י 5568 ברמת AA.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-3">התאמות הנגישות שבוצעו במערכת</h3>
            <ul className="space-y-2 text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                <span><strong>ניווט מקלדת מלא:</strong> ניתן לבצע הצבעה באמצעות מקשי החצים (ימין = מסכים, שמאל = לא מסכים, מטה = נמנע) או מקשי המספרים (1, 2, 3), ללא צורך בעכבר.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                <span><strong>תמיכה בקוראי מסך:</strong> מבנה סמנטי של כותרות, תגיות ARIA, וכפתורים עם תיאור ברור עבור טכנולוגיות מסייעות (NVDA, JAWS, VoiceOver).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                <span><strong>יחס ניגודיות חזותי:</strong> עמידה ביחסי ניגודיות מחמירים בין טקסט לרקע (גם במצב יום וגם במצב כהה / Dark Mode).</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                <span><strong>התאמה רספונסיבית:</strong> תמיכה מלאה בכל גודלי המסכים (מובייל, טאבלט ודסקטופ) וזום של עד 200% ללא פגיעה בחוויית השימוש.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                <span><strong>כלי נגישות ייעודיים:</strong> תפריט נגישות אינטראקטיבי המאפשר שינוי גודל גופן, הדגשת קישורים, גווני אפור וביטול אנימציות.</span>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">סביבות נבדקות</h3>
            <p className="text-slate-600 dark:text-slate-300">
              הנגישות נבדקה בדפדפנים המובילים בגרסאותיהם העדכניות ביותר: Google Chrome, Mozilla Firefox, Apple Safari ו-Microsoft Edge, במערכות הפעלה Windows, iOS ו-Android.
            </p>
          </section>

          <section className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200 dark:border-amber-800/60">
            <h3 className="font-bold text-base text-amber-900 dark:text-amber-200 mb-2">רכז נגישות ופניות הציבור</h3>
            <p className="text-amber-800 dark:text-amber-300 text-xs sm:text-sm mb-3">
              אם נתקלתם בקושי בגלישה או שיש לכם הצעה לשיפור הנגישות, נשמח לעמוד לרשותכם ולתקן בהקדם:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-amber-900 dark:text-amber-200 font-medium">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>דוא"ל: danbar.ai22@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>מערכת "ערב ערב באילת" (yomyom.net)</span>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-bold text-sm hover:opacity-90 transition shadow-sm"
          >
            הבנתי, תודה
          </button>
        </div>
      </div>
    </div>
  );
};
