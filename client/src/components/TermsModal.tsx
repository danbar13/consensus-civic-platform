import React from 'react';
import { X, Scale, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-title"
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 text-slate-800 dark:text-slate-100 text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h2 id="terms-title" className="text-xl sm:text-2xl font-black">תנאי שימוש והשתתפות</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">פלטפורמת קונצנזוס | המצפן העירוני – ערב ערב באילת ו-DANBAR</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="סגור תנאי שימוש"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-6 space-y-5 text-sm leading-relaxed">
          <section>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">1. מטרת הפלטפורמה</h3>
            <p className="text-slate-600 dark:text-slate-300">
              מערכת "קונצנזוס" נועדה לאפשר שיתוף ציבור דמוקרטי, איתור הסכמות רחבות וגישור במחלוקות קהילתיות ועירוניות. השימוש במערכת מהווה הסכמה מלאה לתנאים אלו.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">2. כללי הגשת היגדים והצעות פתרון</h3>
            <ul className="space-y-2 text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-1" />
                <span><strong>איסור לשון הרע והכפשות:</strong> חל איסור מוחלט על שימוש בשמות פרטיים של אזרחים, עובדי ציבור או נבחרי ציבור, או העלאת האשמות אישיות.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-1" />
                <span><strong>שפה נקייה ומכבדת:</strong> היגדים הכוללים קללות, איומים, גזענות או הסתה ייפסלו לאלתר על ידי מסנן ה-AI ומנהלי המערכת.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-1" />
                <span><strong>זכות עריכה וסינון:</strong> מערכת "ערב ערב באילת" ומנהלי הפלטפורמה שומרים לעצמם את הזכות הבלעדית לאשר, לדחות או להציע ניסוח מחדש של היגדים בהתאם לכללי הקהילה.</span>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">3. איסור הונאה והטיית תוצאות (Anti-Abuse)</h3>
            <p className="text-slate-600 dark:text-slate-300">
              חל איסור מוחלט על הפעלת סקריפטים אוטומטיים, בוטים, חוות הצבעה או ניסיונות מלאכותיים להטיית מדדי הקונצנזוס. המערכת מנטרת דפוסי הצבעה חריגים ושומרת את הזכות לפסול הצבעות בלתי אמינות.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">4. קניין רוחני ושימוש בנתונים</h3>
            <p className="text-slate-600 dark:text-slate-300">
              הנתונים הסטטיסטיים המצטברים במשאלים עשויים לשמש לצורך פרסום כתבות עיתונאיות ב"ערב ערב באילת", דוחות מדיניות ציבורית ומחקרים אקדמיים/ייעוציים של DANBAR, תוך שמירה מוחלטת על אנונימיות המשתתפים.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-bold text-sm hover:opacity-90 transition shadow-sm"
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};
