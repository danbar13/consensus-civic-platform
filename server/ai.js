import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

/**
 * AI Statement Guardrail & Mediator
 * Checks for defamation (לשון הרע), PII (personal names), toxic phrasing, and ranting.
 * Generates constructive, neutral Hebrew rephrasings <= 140 chars that can win cross-group consensus.
 */
export async function moderateStatement({ text, topicTitle = '', topicCategory = '' }) {
  const trimmed = text.trim();

  // Try live Gemini if API key is provided
  if (GEMINI_API_KEY) {
    try {
      const response = await callGeminiModeration(trimmed, topicTitle);
      if (response) return response;
    } catch (err) {
      console.warn('⚠️ Gemini API call failed, using high-fidelity fallback mediator:', err.message);
    }
  }

  // Fallback high-fidelity heuristic Hebrew mediator
  return simulatedHebrewModeration(trimmed);
}

/**
 * AI Consensus Report Generator
 * Generates publication-ready newspaper articles or mediation briefs based on live poll data.
 */
export async function generateConsensusReport({ topic, analytics, templateType = 'press' }) {
  if (GEMINI_API_KEY) {
    try {
      const response = await callGeminiReport(topic, analytics, templateType);
      if (response) return response;
    } catch (err) {
      console.warn('⚠️ Gemini report call failed, using high-fidelity fallback generator:', err.message);
    }
  }

  return simulatedHebrewReport(topic, analytics, templateType);
}

/**
 * AI & Template Statement Suggester for New Topics
 * Generates 6-8 balanced Hebrew statements tailored to the topic and category
 */
export async function suggestTopicStatements({ title, category = 'municipal', organization = '' }) {
  if (GEMINI_API_KEY && title && title.trim().length > 3) {
    try {
      const live = await callGeminiSuggestStatements(title, category, organization);
      if (Array.isArray(live) && live.length >= 5) return live;
    } catch (err) {
      console.warn('⚠️ Gemini statement suggestion failed, using curated bank:', err.message);
    }
  }

  return getCuratedSuggestedStatements(title, category);
}

// -------------------------------------------------------------
// Live Gemini API calls
// -------------------------------------------------------------

async function callGeminiSuggestStatements(title, category, organization) {
  const prompt = `
אתה מומחה דמוקרטיה חישובית ויועץ גישור בכיר במערכת דמוי Polis / Talk to the City.
משתמש מקים זירת דיון ציבורית חדשה:
כותרת: "${title}"
קטגוריה: "${category}"
ארגון יוזם: "${organization || 'שיתוף ציבור'}"

עליך להציע 6 עד 8 היגדי פתיחה מאוזנים בעברית (עד 140 תווים כל אחד) שיוצגו להצבעת הציבור.
ההיגדים צריכים לכלול:
1. 3-4 היגדי פתרון מעשיים בעלי פוטנציאל להפוך ל"הצהרות גשר" (Bridging Statements) – מאוזנים, בוני אמון, המשלבים אינטרסים של צדדים שונים.
2. 2-3 היגדים המייצגים את "סלעי המחלוקת" (Divisive / Dilemmas) – דילמות עמוקות וחדות שמעסיקות את הציבור.

החזר אך ורק מערך JSON תקין של מחרוזות (ללא שום טקסט נוסף מסביב, ללא markdown code block):
["היגד ראשון", "היגד שני", "היגד שלישי", "היגד רביעי", "היגד חמישי", "היגד שישי"]
`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });

  if (!res.ok) throw new Error(`Gemini status ${res.status}`);
  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (rawText) {
    const parsed = JSON.parse(rawText);
    if (Array.isArray(parsed)) return parsed;
  }
  return null;
}

function getCuratedSuggestedStatements(title, category) {
  const lower = (title || '').toLowerCase();

  if (category === 'mediation' || lower.includes('גישור') || lower.includes('שכנ') || lower.includes('airbnb')) {
    return [
      'קביעת אמנת שקט מחייבת בבניין עם שעות מוגדרות לפעילויות רועשות ועבודות שיפוץ.',
      'חובת הודעה מראש של 48 שעות בקבוצת הדיירים לפני קיום אירוע פרטי או שיפוץ חריג.',
      'הקמת קרן תחזוקה משותפת לשיפור מתקני הבניין והמעליות בניהול שקוף הנגיש לכל הדיירים.',
      'הסדרת שימוש הוגן במחסנים ובשטחים המשותפים עם הגרלת מקומות חניה פעם בשנה.',
      'מינוי נציגות גישור פנימית בת שני דיירים בלתי תלויים ליישוב מחלוקות לפני פנייה לעורכי דין.',
      'איסור על השארת חפצים וציוד אישי בחדר המדרגות והלובי מטעמי בטיחות ונגישות.'
    ];
  }

  if (category === 'committee' || lower.includes('מלג') || lower.includes('ועד') || lower.includes('תקציב')) {
    return [
      'פרסום פומבי ושקוף של כלל הקריטריונים וטבלת הניקוד באתר האינטרנט של הוועדה.',
      'הקצאת לפחות 35% מהמשאבים למקרים סוציאליים מובהקים ללא תלות בקריטריונים תחרותיים.',
      'התניית קבלת תמיכה או מלגה בהתנדבות קהילתית משמעותית לטובת אוכלוסיות מוחלשות.',
      'מתן עדיפות לפרויקטים ויוזמות בעלי אימפקט חברתי ישיר המשרתים את הקהילה המקומית.',
      'רוטציה תקופתית של חברי ועדת השיפוט אחת לשנתיים למניעת ניגודי עניינים.',
      'הקמת מנגנון ערעורים עצמאי עם מענה מנומק תוך 21 ימי עבודה ממועד קבלת ההחלטה.'
    ];
  }

  if (category === 'consulting' || lower.includes('ארגונ') || lower.includes('עובד') || lower.includes('הנהל')) {
    return [
      'מתן גמישות לעבודה היברידית של עד יומיים בשבוע תוך התמקדות בתפוקות ויעדים מוגדרים.',
      'קיום שיחות משוב והתפתחות אישית רבעוניות מבוססות הקשבה הדדית ולא רק הערכות ביצוע שנתיות.',
      'הבטחת ערוץ דיווח אנונימי ובטוח להנהלה הבכירה על בעיות תפעוליות, עומסים או חיכוכים.',
      'שיתוף נציגי עובדים מכל הדרגים בדיונים מקדימים לפני הטמעת מערכות טכנולוגיות חדשות.',
      'תגמול והוקרה לצוותים המציגים שיתוף פעולה חוצה-מחלקות ופתרונות חדשניים לייעול.',
      'הגדרת זמני מענה מוסכמים לדוא"ל והודעות כדי לשמור על איזון בין עבודה לחיים אישיים.'
    ];
  }

  // Default: Municipal / Civic participation
  return [
    'הפעלת שאטלים ותחבורה ציבורית ייעודית בשעות העומס וסופי השבוע להפחתת פקקים ומצוקת חניה.',
    'הקמת מוקד פניות ופיקוח עירוני שקוף עם התחייבות לזמן מענה קצוב לכל מפגע שכונתי.',
    'שמירה על השטחים הציבוריים, הפארקים והחופים כמרחב פתוח ונקי ללא מסחור יתר.',
    'מתן הנחות והטבות בארנונה לעסקים מקומיים המעסיקים תושבים ומחזקים את הכלכלה העירונית.',
    'שיתוף נציגי תושבים נבחרים מכל שכונה בדיוני התכנון והבנייה בטרם אישור פרויקטים גדולים.',
    'הקצאת תקציב עירוני ייעודי להצללה, נטיעת עצים ושיפור מדרכות להקלת ההליכה בעיר.',
    'הטלת קנסות מוגברים ואכיפה בלתי מתפשרת על השלכת פסולת מסחרית וגזם ברחובות.'
  ];
}

async function callGeminiModeration(text, topicTitle) {
  const prompt = `
אתה מגשר קהילתי ועורך תוכן בכיר במערכת דמוקרטיה חישובית וקונצנזוס אזרחי (דמוי Polis / Talk to the City).
סוגיית הדיון הנוכחית: "${topicTitle}".
משתמש הציע את ההיגד הבא להצבעת הציבור (מוגבל ל-140 תווים):
"${text}"

תפקידך לבחון את ההיגד לפי 3 קריטריונים:
1. האם יש בו לשון הרע, שמות אנשים פרטיים (PII), קללות, השמצות אישיות, או נימה מתלהמת ומשתלחת?
2. האם הוא מנוסח בצורה שאינה מאפשרת הסכמה חוצת-קבוצות (לעומתי, חד-צדדי, תוקפני)?
3. האם ניתן לזקק ממנו רעיון ענייני, מעשי ומגשר שיכול לזכות בקונצנזוס רחב?

החזר תשובה אך ורק בפורמט JSON תקין (ללא שום תווים נוספים מסביב, ללא markdown code block):
{
  "passed": boolean (true אם ההיגד תקין, מכבד, ענייני ולא מתלהם; false אם יש צורך בניסוח מגשר או אם יש פסילה),
  "isRant": boolean (true אם מדובר בהתלהמות/כעס/האשמה),
  "reason": "הסבר מנומס ומעצים בעברית מדוע הניסוח דורש שינוי (למשל: כולל נימה מאשימה או שמות פרטיים)",
  "suggestion": "ניסוח חלופי ענייני, מגשר, קונסטרוקטיבי וקצר בעברית עד 140 תווים שמתמקד בפתרון ולא באשמים"
}
`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!res.ok) {
      throw new Error(`Gemini status ${res.status}`);
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawText) {
      return JSON.parse(rawText);
    }
  } catch (err) {
    throw err;
  }
}

async function callGeminiReport(topic, analytics, templateType) {
  const topB = analytics.topBridging.slice(0, 3).map((s, idx) => 
    `${idx + 1}. "${s.text}" (ציון גשר: ${s.bridgingScore}%, תמיכה כללית: ${s.votesSummary.overallSupportPercent}%)`
  ).join('\n');

  const topD = analytics.topDivisive.slice(0, 3).map((s, idx) => 
    `${idx + 1}. "${s.text}" (ציון קיטוב: ${s.divisiveScore}%, פער בין קבוצות)`
  ).join('\n');

  const isPress = templateType === 'press';
  const rolePrompt = isPress
    ? `אתה עיתונאי חוקר ומנתח נתונים בכיר במקומון "ערב ערב באילת". עליך לכתוב כתבת עומק תמציתית, חדה ומרתקת המנתחת את תוצאות משאל הקונצנזוס העירוני.`
    : `אתה מגשר בכיר ויועץ אסטרטגי במרכז הגישור והוועדות הציבוריות. עליך לכתוב נייר עמדה מקצועי (Mediation Brief) המנתח את תוצאות המשאל ומתווה מפת דרכים לפשרה מעשית.`;

  const prompt = `
${rolePrompt}

נושא הדיון: ${topic.title}
ארגון יוזם: ${topic.organization}
נתוני השתתפות: ${analytics.meta.totalParticipants} משתתפים ייחודיים, ${analytics.meta.totalVotesCast} הצבעות שנרשמו. מדד קונצנזוס כללי: ${analytics.meta.consensusIndex}%.

הצהרות הגשר שזכו להסכמה רחבה מכל הקבוצות:
${topB}

סלעי המחלוקת (היגדים מקטבים בעלי פער עמדות עמוק):
${topD}

כתוב מסמך מקצועי בעברית עשירה וקולחת במבנה הבא (החזר טקסט מעוצב במרקדאון):
${isPress ? `
# [כותרת עיתונאית חדה ומסקרנת]
## [כותרת משנה הכוללת את תמצית הממצא הראשי]

### 📊 המפה המלאה במספרים
[פסקה קצרה על היקף ההשתתפות והמגמה הבולטת]

### 🤝 פתרונות הקונצנזוס: מה שמאחד את התושבים, העסקים והתיירות
[ניתוח מעמיק של 2-3 הצהרות הגשר המובילות וההשלכות המעשיות שלהן]

### ⚡ סלעי המחלוקת: היכן העיר נחצית לשניים?
[פירוט של נקודות החיכוך המרכזיות והחששות של כל צד]

### ❓ שלוש שאלות פתוחות להנהגת העירייה
1. ...
2. ...
3. ...
` : `
# נייר עמדה ודו"ח גישור אסטרטגי: ${topic.title}
**גוף מנחה:** ${topic.organization} | **תאריך:** ${new Date().toLocaleDateString('he-IL')}

## 1. תמצית מנהלים ומפת הדינמיקה הקבוצתית
[ניתוח מצב תמציתי ומדדי אמון]

## 2. אזורי ההסכמה הרחבה (Common Ground)
[פירוט עקרונות הפתרון המוסכמים המהווים בסיס לאמנה מחייבת]

## 3. מוקדי החיכוך וניתוח אינטרסים עמוקים
[פירוק המחלוקות לעמדות מול אינטרסים]

## 4. מפת דרכים ליישום והצעת פשרה מאוזנת
[3-4 צעדים מוגדרים ליישום מיידי]
`}
`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!res.ok) throw new Error(`Gemini status ${res.status}`);
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text;
  } catch (err) {
    throw err;
  }
}

// -------------------------------------------------------------
// High-Fidelity Heuristic Fallbacks (when Gemini API is not configured)
// -------------------------------------------------------------

function simulatedHebrewModeration(text) {
  const lower = text.toLowerCase();

  // 1. Detect PII / Personal Names or offensive insults
  const toxicKeywords = [
    'חוצפנים', 'גנבים', 'מושחתים', 'אידיוטים', 'מנוולים', 'נבלות', 'טיפשים', 
    'זבל', 'חרא', 'לגרור מיד', 'להעיף אותם', 'חלאות', 'שקרנים', 'משטרת',
    'ראש העיר מושחת', 'פושעים', 'לכלוא', 'דופקים אותנו'
  ];

  const namePatterns = /(יוסי|משה|אבי|יצחק|רונן|דני|שרית|מירי|אלי|ינקו|לנקרי|בוזגלו)\s+(כהן|לוי|ביטון|אוחיון|ברקאי|פרץ|אזולאי)/i;

  const foundToxic = toxicKeywords.find(kw => lower.includes(kw));
  const hasName = namePatterns.test(text);

  if (hasName) {
    return {
      passed: false,
      isRant: true,
      reason: 'ההיגד כולל שמות של אנשים פרטיים או התייחסות פרסונלית. לפי כללי הפלטפורמה, הדיון מתמקד במדיניות ופתרונות ולא באנשים.',
      suggestion: 'להגביר את האכיפה והפיקוח על חניה לא חוקית ברחובות השכונתיים באמצעות סיורים תכופים ומוקד עירוני זמין.'
    };
  }

  if (foundToxic || text.includes('!') && text.length < 50 && (text.includes('לגרור') || text.includes('קנס'))) {
    // Generate context-aware reframing
    let suggestion = '';
    if (lower.includes('סיני') || lower.includes('לגרור') || lower.includes('חוצפנים')) {
      suggestion = 'להטיל קנסות מוגברים וגרירה לרכבים ללא תו תושב החונים בשכונות המגורים מעל 24 שעות בתקופות שיא.';
    } else if (lower.includes('airbnb') || lower.includes('נופש')) {
      suggestion = 'להגביל רעש בדירות נופש בשכונות באמצעות תקנון עירוני מחייב ומוקד דיווח ואכיפה 24/7.';
    } else if (lower.includes('עסקים') || lower.includes('תעשייה') || lower.includes('חניה')) {
      suggestion = 'להקצות מקומות חניה מוסדרים ומוגבלים בזמן לפריקה וטעינה ולתחלופת לקוחות באזורי המסחר.';
    } else {
      suggestion = 'לקבוע מדיניות פיקוח שקופה וברורה המשלבת שמירה על איכות חיי התושבים לצד התחשבות בצרכי המסחר.';
    }

    return {
      passed: false,
      isRant: true,
      reason: `ההיגד נוסח בנימה מתלהמת וכולל ביטויים מעוררי התנגדות ("${foundToxic || 'סגנון לעומתי'}"). ניסוח מגשר יסייע להצעה שלך לקבל תמיכה גם מבעלי דעות אחרות.`,
      suggestion
    };
  }

  // If text is too short or doesn't look like a clear policy statement
  if (text.length < 15) {
    return {
      passed: false,
      isRant: false,
      reason: 'ההיגד קצר מדי. כדאי לנסח משפט שלם שמציע פעולה או עמדה קונקרטית שניתן להצביע עליה.',
      suggestion: `${text} – לקדם פתרון מוסדר בשיתוף נציגי התושבים והגורמים העירוניים.`
    };
  }

  // Clean, constructive statement
  return {
    passed: true,
    isRant: false,
    reason: 'ההיגד מנוסח בצורה עניינית ומכבדת, ועומד בכללי האתיקה והשיח הציבורי.',
    suggestion: text
  };
}

function simulatedHebrewReport(topic, analytics, templateType) {
  const isPress = templateType === 'press';
  const topBridging = analytics.topBridging.slice(0, 3);
  const topDivisive = analytics.topDivisive.slice(0, 2);

  const b1 = topBridging[0] || { text: 'הקמת חניון חנה וסע', bridgingScore: 85, votesSummary: { overallSupportPercent: 88 } };
  const b2 = topBridging[1] || { text: 'צביעת הכנסות לקרן ייעודית', bridgingScore: 82, votesSummary: { overallSupportPercent: 86 } };
  const d1 = topDivisive[0] || { text: 'איסור מוחלט על חניה ללא תו תושב', divisiveScore: 68 };

  if (isPress) {
    return `# המצפן האילתי: חנה-וסע וצביעת הכנסות – ההסכמות שמפתיעות את כולם בסוגיית החניה
## ניתוח נתוני עומק של "ערב ערב באילת" חושף: למרות הטונים הצורמים ברשתות, ${analytics.meta.totalParticipants} משתתפים שירטטו את מתווה הפתרון לעונת השיא הבאה

### 📊 הנתונים שמאחורי ההכרעה
בשבועות האחרונים הובילה מערכת "ערב ערב באילת" באמצעות פלטפורמת הקונצנזוס החכמה משאל עמדות אנונימי חוצה-מגזרים. בסך הכל נקלטו **${analytics.meta.totalVotesCast} הצבעות** מקרב **${analytics.meta.totalParticipants} תושבים, בעלי עסקים ונציגי תיירות**. 

מדד הקונצנזוס הכללי עומד על **${analytics.meta.consensusIndex}%**, נתון המוכיח כי מעבר לוויכוחים היומיומיים קיים בסיס מוצק למדיניות עירונית מוסכמת.

---

### 🤝 שלושת פתרונות הגשר שזכו לתמיכה מקיר לקיר
בניגוד לתפיסה הרווחת של מאבק "תושבים מול עסקים ותיירים", האלגוריתם של הפלטפורמה זיהה שורה של **הצהרות גשר (Bridging Statements)** שזכו לתמיכה גורפת מכלל הקבוצות:

1. **חניון "חנה וסע" עם שאטלים (תמיכה כוללת של ${b1.votesSummary?.overallSupportPercent || 88}%, ציון גשר: ${b1.bridgingScore}%):**
   *"${b1.text}"*
   > **המשמעות העירונית:** הציבור האילתי – על כל מרכיביו – מבין שאי אפשר להשאיר את ואקום החניה בשכונות ללא חלופה מערכתית בכניסה לעיר.

2. **שקיפות וצביעת כספי האכיפה (תמיכה כוללת של ${b2.votesSummary?.overallSupportPercent || 85}%, ציון גשר: ${b2.bridgingScore}%):**
   *"${b2.text}"*
   > **המשמעות העירונית:** התושבים מוכנים לקבל אכיפה מוגברת, אך ורק בתנאי שכל שקל שייגבה יוחזר ישירות לשכונות להצללה, שיפור מדרכות והסדרי חניה.

---

### ⚡ סלע המחלוקת: היכן העיר מתפצלת?
ההיגד המקטב ביותר במשאל עסק באיסור גורף:
> **"${d1.text}"** (מדד קיטוב של ${d1.divisiveScore}%)
בעוד שבקרב תושבי השכונות נרשמה תמיכה סוחפת של מעל 85%, בקרב ענפי המסחר והתיירות נרשמה התנגדות חריפה מתוך חשש לפגיעה ישירה בפעילות הכלכלית.

---

### ❓ 3 שאלות נוקבות להנהלת עיריית אילת
1. **למה ממתינים עם פרויקט "חנה וסע"?** כאשר הציבור מכל המגזרים מצביע בעד ברוב של מעל 85%, מדוע שטח שדה התעופה הישן או הכניסה לעיר אינם מוכשרים לקראת החגים הקרובים?
2. **האם העירייה מוכנה להתחייב על "קרן חניה סגורה"?** תושבי השכונות דורשים לראות את כספי הדוחות מושקעים ישירות ברווחת הרחוב שלהם.
3. **האם ייקבע מתווה הידברות לפני הטלת איסורים גורפים?** הפערים בין בעלי העסקים לשכונות דורשים פתרון מדורג ולא צווי איסור חד-צדדיים.

*פורסם על ידי מערכת "ערב ערב באילת – המצפן העירוני" בשיתוף פלטפורמת קונצנזוס.*`;
  }

  // Mediation Brief template
  return `# נייר עמדה אסטרטגי ומפת דרכים ליישוב סכסוך: ${topic.title}
**גוף מוביל:** ${topic.organization} | **תאריך:** ${new Date().toLocaleDateString('he-IL')}
**מסמך רקע לעבודת שולחן עגול וועדת גישור קהילתית**

---

## 1. תמונת מצב ואבחון הדינמיקה הקבוצתית
ניתוח ${analytics.meta.totalVotesCast} הצבעות של ${analytics.meta.totalParticipants} משתתפים מעלה כי הסכסוך אינו משחק סכום-אפס.
קיים **מדד קונצנזוס של ${analytics.meta.consensusIndex}%**, המצביע על מרחב הסכמה רחב (ZOPA – Zone of Possible Agreement) שטרם תורגם להחלטות אופרטיביות.

## 2. עוגני ההסכמה (Common Ground) המהווים בסיס לאמנה מחייבת
הקבוצות השונות הגיעו להסכמה פה-אחד על העקרונות הבאים:
* **פתרון תשתיתי מקדים קודם לסנקציות:** כל הצדדים מסכימים כי יש להעמיד חלופה מוסדרת ונגישה בטרם החמרת הקנסות והגרירה.
* **עקרון ההדדיות והשקיפות:** ההכנסות מכל מנגנון הסדרה ינותבו לרווחת המרחב הציבורי המשותף.

## 3. מיפוי נקודות החיכוך ואינטרסים מנחים
* **אינטרס השכנים:** שקט, ביטחון אישי, ונגישות לחניה סמוך לבית ללא חיפוש ממושך.
* **אינטרס בעלי העסקים והתיירות:** משיכת קהל, אפשרות פריקה וטעינה, ומניעת תחושת ניכור כלפי מבקרים.
* **מוקד הפיצוץ הפוטנציאלי:** צעדי אכיפה בינאריים ("שחור/לבן") ללא תקופת הסתגלות.

## 4. מפת דרכים ליישום מיידי (Roadmap for Compromise)
1. **שלב א' (מיידי):** הקמת צוות יישום משותף של נציגי השכונות, נציגי המסחר והעירייה.
2. **שלב ב' (פיילוט 90 יום):** הפעלת מתחם חניה ייעודי בכניסה לעיר עם שאטלים ממונעים, תוך הגבלת זמני חניה מבוקרים באזורי החיכוך.
3. **שלב ג' (הערכה ועדכון):** מדידה חוזרת בפלטפורמת הקונצנזוס לקבלת משוב הציבור ובחינת השפעת הפיילוט בשטח.`;
}
