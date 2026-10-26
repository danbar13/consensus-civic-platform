import React, { useEffect } from 'react';

export const PitchDeckView: React.FC<any> = () => {
  useEffect(() => {
    window.location.replace('/pitch.html');
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-4">
      <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
      <div className="text-base font-bold text-slate-900 dark:text-white">
        טוען את דף הנחיתה וההצעה האסטרטגית עבור "ערב ערב באילת"...
      </div>
      <a
        href="/pitch.html"
        className="text-xs text-amber-500 underline font-semibold"
      >
        לחץ כאן למעבר ישיר לדף הנחיתה
      </a>
    </div>
  );
};
