import React from 'react';
import { X, ShieldCheck, Lock, Database, Sparkles, EyeOff, FileText, CheckCircle2 } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-title"
    >
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 text-slate-800 dark:text-slate-100 text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 id="privacy-title" className="text-xl sm:text-2xl font-black">מדיניות פרטיות ואבטחת מידע</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">עודכן לאחרונה: נובמבר 2026 | עפ"י חוק הגנת הפרטיות, התשמ"א-1981 ותיקון 13</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="סגור מדיניות פרטיות"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-6 space-y-6 text-sm leading-relaxed">
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
            <EyeOff className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm font-medium">
              <strong>השתתפות אנונימית מוחלטת:</strong> המערכת אינה דורשת הרשמה, אינה מבקשת שמות, כתובות דוא"ל, מספרי טלפון, תעודות זהות או מיקום מדויק. כל הצבעה היא אנונימית לחלוטין.
            </p>
          </div>

          <section>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">1. מהו המידע הנאסף בעת השימוש?</h3>
            <ul className="space-y-2 text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                <span><strong>מזהה סשן טכני (`session_id`):</strong> מחרוזת אקראית הנשמרת במכשירכם (באמצעות LocalStorage) לצורך מניעת הצבעה כפולה על אותו היגד בלבד, כדי שקולכם ייספר באופן הוגן.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                <span><strong>עמדות והצבעות:</strong> תיעוד בחירותיכם (מסכים, לא מסכים, נמנע) ושיוך לקבוצת הזיקה שבחרתם (למשל: תושב שכונות / בעל עסק), ללא כל שיוך לזהותכם האישית.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                <span><strong>כתובת IP ואבטחת רשת:</strong> כתובת ה-IP מעובדת בשרת באופן זמני אך ורק לצורכי אבטחת מידע, חסימת מתקפות סייבר ומניעת הצפות בוטים (Rate Limiting). כתובות ה-IP אינן מוצלבות עם זהויות ואינן נמכרות לצדדים שלישיים.</span>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">2. שימוש במודלי בינה מלאכותית (Google Gemini AI)</h3>
            <p className="text-slate-600 dark:text-slate-300">
              כאשר משתתף מציע היגד או פתרון חדש לדיון, הטקסט נבדק על ידי מודל שפה מתקדם (Google Gemini API). הבדיקה מיועדת <strong>אך ורק לסינון לשון הרע, קללות, השמצות אישיות וחשיפת שמות פרטיים</strong>, וכן לסיוע בניסוח מקרב קונצנזוס. אין העברה של פרטים מזהים למודל ה-AI, והמידע אינו משמש לאימון מודלים ציבוריים.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">3. אחסון והגנת מידע (Data Storage & Security)</h3>
            <p className="text-slate-600 dark:text-slate-300">
              הנתונים מאוחסנים בבסיס נתונים בענן (Supabase Cloud PostgreSQL) המוגן בפרוטוקולי הצפנה מחמירים (SSL/TLS בהעברה והצפנה במנוחה) ומנגנון הפרדת הרשאות (Row-Level Security). גישה לנתונים הגולמיים מוגבלת למנהלי המערכת המוסמכים בלבד.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">4. זכויות המשתמש ויצירת קשר</h3>
            <p className="text-slate-600 dark:text-slate-300">
              מאחר שההצבעה אנונימית, תוכלו לאפס את השתתפותכם בכל רגע ע"י מחיקת נתוני הגלישה (Clear Site Data / Cookies) בדפדפן. לכל שאלה, בירור או פנייה בנושא פרטיות ואבטחת מידע, ניתן לפנות לממונה האבטחה בדוא"ל: <strong>danbar.ai22@gmail.com</strong>.
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
