import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

import { moderateStatement } from '../server/ai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runEvals() {
  console.log('\n===============================================================');
  console.log('🧪 מערכת בדיקות איכות ורגרסיה (AI Moderation Evals) – המצפן האילתי');
  console.log('===============================================================\n');

  const datasetPath = path.resolve(__dirname, 'dataset.json');
  if (!fs.existsSync(datasetPath)) {
    console.error(`❌ שגיאה: קובץ הדאטה-סט לא נמצא בנתיב: ${datasetPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(datasetPath, 'utf-8');
  const dataset = JSON.parse(rawData);

  console.log(`📋 נטענו ${dataset.length} מקרי בוחן לבדיקה (דיון ציבורי, ביקורת, לשון הרע, הזרקות).\n`);

  const results = [];
  let passedCount = 0;

  for (const item of dataset) {
    process.stdout.write(`מריץ מקרה בוחן #${item.id} [${item.category}]... `);
    const start = Date.now();

    try {
      const response = await moderateStatement({
        text: item.text,
        topicTitle: 'מדיניות תחבורה, חניה, תיירות ואיכות חיים באילת'
      });

      const latencyMs = Date.now() - start;
      const actualPassed = Boolean(response?.passed);
      const isSuccess = actualPassed === item.expectedPassed;

      if (isSuccess) {
        passedCount++;
        console.log(`✅ הצלחה (${latencyMs}ms)`);
      } else {
        console.log(`❌ נכשל (${latencyMs}ms)`);
      }

      results.push({
        id: item.id,
        category: item.category,
        text: (item.text || '""').replace(/\n/g, ' ').slice(0, 35) + (item.text.length > 35 ? '...' : ''),
        expected: item.expectedPassed ? 'אושר' : 'נחסם',
        actual: actualPassed ? 'אושר' : 'נחסם',
        status: isSuccess ? 'PASS' : 'FAIL',
        reason: response?.reason || ''
      });
    } catch (err) {
      console.log(`💥 שגיאה: ${err.message}`);
      results.push({
        id: item.id,
        category: item.category,
        text: (item.text || '""').slice(0, 30),
        expected: item.expectedPassed ? 'אושר' : 'נחסם',
        actual: 'ERROR',
        status: 'FAIL',
        reason: err.message
      });
    }
  }

  // Print Summary Table
  console.log('\n========================================================================================');
  console.log('| מזהה | קטגוריה              | טקסט לבדיקה                         | צפוי  | בפועל | תוצאה |');
  console.log('|------|----------------------|-------------------------------------|-------|-------|-------|');

  for (const r of results) {
    const idPad = String(r.id).padEnd(4);
    const catPad = r.category.padEnd(20);
    const textPad = r.text.padEnd(35);
    const expPad = r.expected.padEnd(5);
    const actPad = r.actual.padEnd(5);
    const statPad = r.status === 'PASS' ? '\x1b[32mPASS\x1b[0m ' : '\x1b[31mFAIL\x1b[0m ';
    console.log(`| ${idPad} | ${catPad} | ${textPad} | ${expPad} | ${actPad} | ${statPad}|`);
  }
  console.log('========================================================================================\n');

  const accuracy = Math.round((passedCount / dataset.length) * 100);
  console.log(`🎯 סיכום תוצאות הרגרסיה:`);
  console.log(`   סה"כ מקרי מבחן: ${dataset.length}`);
  console.log(`   הצלחות: ${passedCount}`);
  console.log(`   כישלונות: ${dataset.length - passedCount}`);
  console.log(`   אחוז דיוק כולל: ${accuracy}%\n`);

  if (accuracy === 100) {
    console.log('🎉 מעולה! כל 15 מקרי הבוחן עברו בהצלחה מלאה (100% דיוק)!\n');
    process.exit(0);
  } else {
    console.warn(`⚠️ תשומת לב: ${dataset.length - passedCount} מקרי בוחן לא תאמו את הצפוי. לפי כלל הברזל, אין לשנות את dataset.json, אלא יש לכוונן את ה-System Prompt בלבד.`);
    process.exit(1);
  }
}

runEvals().catch(err => {
  console.error('Eval script fatal error:', err);
  process.exit(1);
});
