# מסמך איפיון מוצר (PRD) ופרומפט פיתוח ל-Antigravity: פלטפורמת קונצנזוס ושיתוף ציבור חכמה (Polis + AI)

מסמך זה כולל שני חלקים מרכזיים:
1. **איפיון מערכת מלא (PRD):** ארכיטקטורה, לוגיקה אלגוריתמית, מודל נתונים, מנגנון הגנה מלשון הרע מבוסס AI, ונתוני פתיחה (Seed Data) עבור משאל החניה של המקומון [ערב ערב באילת](https://www.yomyom.net/about.asp) לצד תמיכה רב-תחומית (גישור, ועדות וייעוץ ארגוני).
2. **פרומפט הרצה מלא ל-Antigravity (Master Prompt):** בלוק הנחיות מובנה ומוכן להעתקה והדבקה ישירות לתוך Antigravity להקמת מערכת ה-Full-Stack מקצה לקצה.

## חלק א': איפיון המערכת (PRD)

### 1. חזון המוצר וגמישות רב-תחומית (Multi-Domain Architecture)

המערכת היא פלטפורמת ווב (Full-Stack) בעברית מלאה (RTL), המבוססת על עקרונות הדמוקרטיה החישובית של [Polis](https://github.com/compdemocracy/polis) וסינתזת הנתונים של [Talk to the City](https://www.google.com/search?q=https://github.com/AIObjectives/tttc-light-js). המערכת נועדה להחליף שיח מקוטב ורועש ברשתות החברתיות בתהליך מובנה שממפה מחנות דעה ומאתר **"הצהרות גשר" (Bridging Statements)** — פתרונות שזוכים להסכמה רחבה מכל צידי המתרס.

המערכת מתוכננת כמנוע **Multi-Topic (רב-זירתי)**, כך שניתן לפתוח בה זירות דיון נפרדות עם מיתוג מותאם לכל שימוש:

| תחום יישום | שם מותג / מסגרת לדוגמה | מטרת הזירה | קבוצות זיקה (Clusters / Personas) |
| :--- | :--- | :--- | :--- |
| **עיתונות מקומית ושיתוף ציבור** | המצפן העירוני – ערב ערב באילת | מיפוי עמדות תושבים בסוגיות עירוניות בוערות והפקת כתבות נתונים | תושבי השכונות, בעלי עסקים ומסחר, תיירות ומבקרים |
| **גישור ויישוב סכסוכים** | מרכז גישור קהילתי / ועדי בתים | מיפוי מוקדם של נקודות הסכמה ומחלוקת לפני כניסה לחדר הגישור | צד א' במחלוקת, צד ב' במחלוקת, בעלי עניין נוספים |
| **ועדות ציבוריות והנהלות** | ועדות עירוניות / ועדת מלגות | זיקוק קריטריונים, סדרי עדיפויות וחלוקת משאבים ללא דיונים מעגליים | נציגי ציבור, הנהלה מקצועית, מוטבים/קהילה |
| **ייעוץ ארגוני וניהולי** | DANBAR Consulting | אבחון פנים-ארגוני אנונימי סביב תהליכי שינוי, טכנולוגיה ופרטיות | הנהלה, עובדי שטח/תפעול, מטה וטכנולוגיה |

### 2. חוויית המשתמש וזרימת המסכים (User Flow)

1. **מסך בחירת זירה או כניסה ישירה לזירה פעילה:**
   * המערכת נפתחת כברירת מחדל בזירה הפעילה הראשית: **"המצפן האילתי (ערב ערב באילת): מצוקת החניה בשכונות, באזורי המסחר והחונים לסיני"**.
   * סרגל עליון מאפשר מעבר בין זירות נוספות או יצירת זירה חדשה (למנהל המערכת).
2. **שלב ההזדהות האנונימית (Micro-Onboarding):**
   * המשתתף אינו נדרש להירשם עם שם או אימייל. הוא בוחר רק את "כובע הזיקה" שלו לסוגיה (למשל בסוגיית החניה: `תושב/ת שכונת מגורים`, `בעל/ת עסק או עובד/ת באזור התעשייה והמסחר`, `עובד/ת בענף התיירות`, או `תושב/ת כללי`).
   * הבחירה נשמרת מול מזהה סשן אנונימי (`session_id` ב-LocalStorage ובשרת) למניעת הצבעות כפולות.
3. **כרטיסיית ההצבעה המהירה (Tinder-style / Card Stack):**
   * הצגת היגד אחד בכל פעם בפונט ברור וקריא במובייל ובדסקטופ.
   * שלושה כפתורי פעולה בולטים: **מסכים (ירוק)**, **לא מסכים (אדום)**, **מדלג / ניטרלי (אפור)**.
   * מד התקדמות שמציג כמה היגדים נותרו להצבעה (למשל: `הצבעת על 4 מתוך 8 היגדים`).
4. **הוספת הצעת פתרון חדשה עם שער AI (Smart Statement Submission):**
   * תיבת טקסט מוגבלת ל-140 תווים: *"יש לך הצעה מעשית שלא הופיעה כאן? נסח/י אותה במשפט אחד ברור"*.
   * **בדיקת AI בזמן אמת (Gemini Guardrail):** לפני שההיגד נשמר, השרת שולח אותו ל-Gemini API לבדיקה משולשת:
     * **הגנה מלשון הרע ופרטיות:** חסימת שמות פרטיים של אנשים, השמצות אישיות, קללות או האשמות פליליות.
     * **בדיקת בהירות ומיקוד:** וידוא שמדובר בהצעה או עמדה שניתן להצביע עליה "מסכים/לא מסכים".
     * **ניסוח מגשר אוטומטי (AI Reframing):** אם המשתתף כתב משפט מתלהם אך בעל גרעין ענייני (למשל: *"כל החוצפנים שמשאירים רכב בשחמון ויורדים לסיני גונבים לנו את החניה, צריך לגרור אותם מיד!"*), ה-AI מציע למשתתף חלופה עניינית בלחיצת כפתור: *"הצעה לניסוח ממוקד שיזכה לתמיכה רחבה יותר: להטיל קנסות מוגברים וגרירה לרכבים ללא תו תושב החונים בשכונות המגורים מעל 24 שעות בתקופות שיא"*.
5. **דשבורד התוצאות החי ("מפת הקונצנזוס והצהרות הגשר"):**
   * **הצהרות הגשר המובילות (Top Bridging Statements):** כרטיסיות בולטות בראש הדשבורד המציגות את ההיגדים שזכו לתמיכה גבוהה מכל הקבוצות גם יחד (עם פירוט אחוזי התמיכה בכל קבוצה בנפרד).
   * **נקודות המחלוקת (Divisive Statements):** היגדים שבהם קבוצה אחת תומכת ברובה וקבוצה אחרת מתנגדת ברובה (מזהה בדיוק היכן נדרש גישור או פתרון מאזן).
   * **מפת מחנות ויזואלית (Opinion Landscape):** תרשים פיזור או השוואת מחנות אינטראקטיבי הממחיש את המרחק והקרבה בין הקבוצות.
   * **מחולל כתבה / דו"ח גישור ב-AI:** כפתור שמנתח את כל ההצבעות הנוכחיות ומפיק תקציר מנהלים עיתונאי (עבור "ערב ערב באילת") או מסמך נקודות פתיחה לגישור.
6. **ממשק ניהול לעורך / מגשר (Admin & Editor Panel):**
   * אישור או דחייה של היגדי גולשים הממתינים בתור (Moderation Queue).
   * יצירת זירת דיון חדשה (כותרת, תיאור, הגדרת קבוצות זיקה והזנת היגדי פתיחה).
   * קבלת קוד הטמעה (`<iframe>` עם `?embed=true`) לשילוב ישיר בתוך כתבה באתר העיתון.

### 3. האלגוריתם לחישוב "ציון גשר" (Bridging Score Formula)

כדי להבדיל בין סתם "הצעה פופולרית במחנה אחד" לבין **"הצהרת גשר אמיתית"**, השרת מחשב עבור כל היגד $s$ את אחוז התמיכה בכל קבוצת זיקה/מחנה $g \in G$:

$$\text{Support}(s, g) = \frac{\text{Agrees}_{s,g}}{\text{Agrees}_{s,g} + \text{Disagrees}_{s,g}}$$

ציון הגשר ($\text{BridgingScore}$) מוגדר לפי **עקרון החוליה החלשה ביותר (Min-Max Consensus)** בשילוב היקף ההשתתפות:
* **ציון גשר (`bridging_score`):** הערך המינימלי של $\text{Support}(s, g)$ מבין כל הקבוצות $g$, מוכפל במקדם אמינות מבוסס מספר הצבעות. היגד ייחשב ל"הצהרת גשר" מובילה אם **בכל אחת מהקבוצות בנפרד** יש לו לפחות 60% תמיכה, והפער בין הקבוצה התומכת ביותר לפחות תומכת קטן מ-25%.
* **ציון קיטוב (`divisive_score`):** ההפרש המקסימלי בין אחוז התמיכה בקבוצה התומכת ביותר לבין אחוז התמיכה בקבוצה המתנגדת ביותר ($\max_g \text{Support}(s,g) - \min_g \text{Support}(s,g)$).

### 4. נתוני פתיחה מובנים למקרה המבחן הראשון (Seed Data: מצוקת החניה באילת)

המערכת תיטען מראש עם זירת הדיון של **"ערב ערב באילת – מצוקת החניה בשכונות, באזורי המסחר והחונים לסיני"** הכוללת 8 היגדי פתיחה מאוזנים ונתוני הצבעות התחלתיים:

| מס' | טקסט ההיגד | זווית / מטרה | אופי ההיגד צפוי |
| :--- | :--- | :--- | :--- |
| **1** | יש להכשיר חניון "חנה וסע" מוסדר בתשלום לנופשים לסיני (למשל בשטח שדה התעופה הישן או בכניסה לעיר) עם שאטל ישיר למעבר טאבה, ולאכוף קנסות בשכונות. | פתרון מערכתי משולב | הצהרת גשר מובהקת |
| **2** | כל ההכנסות מאכיפת חניה ומחניוני תיירים צריכות להיות צבועות בקרן עירונית ייעודית להצללת מדרכות, תחבורה ציבורית ושיפור החניה בשכונות. | שקיפות ותועלת לתושב | הצהרת גשר מובהקת |
| **3** | באזור התעשייה ובמרכזי המסחר יש להגביל את החניה ל-3 שעות כדי לאפשר תחלופת לקוחות, כאשר לתושבי אילת (בעלי תו תושב) יינתנו שעתיים ראשונות חינם. | איזון מסחר-תושבים | הצהרת גשר רחבה |
| **4** | לפני שמגבילים חניה או מחלקים דוחות באזור התעשייה, חובה על העירייה להכשיר מגרשי חניה ייעודיים וחינמיים לעובדי האזור ולרכבים מסחריים. | הגנה על עובדים ועסקים | הסכמה גבוהה |
| **5** | יש לאסור לחלוטין חניית רכבים ללא "תו תושב אילתי" בתוך רחובות שכונות המגורים בתקופות שיא (חגים וקיץ) או מעל 24 שעות רצופות. | הגנה קשיחה על השכונות | תמיכה גבוהה בשכונות, התנגדות בתיירות |
| **6** | אילת מתפרנסת מתיירות — אסור להבריח מבקרים ישראלים עם גרירות וקנסות חניה קשוחים, גם אם הם יורדים לסיני ועוצרים בעיר רק לקניות ותדלוק. | גישה פרו-תיירותית | היגד מקטב / מחלוקת |
| **7** | יש להתיר לבעלי דירות נופש (Airbnb) בשכונות המגורים להנפיק עד שני "תווי חניה זמניים" לאורחים שלהם כדי למנוע חיכוכים עם השכנים. | דירות נופש בשכונות | היגד מקטב / מחלוקת |
| **8** | הפעלת קו מיניבוסים חשמלי וחינמי בתדירות של כל 10 דקות בין השכונות, אזור התעשייה ואזור התיירות תצמצם משמעותית את הצורך להוציא רכב פרטי. | תחבורה חלופית | הסכמה בינונית-גבוהה |

## חלק ב': הפרומפט המלא להדבקה ב-Antigravity

העתק את כל הבלוק הבא והדבק אותו כפרומפט הפתיחה בפרויקט חדש ב-Antigravity:

```markdown
Build a complete, production-ready, Full-Stack Hebrew (RTL) Civic Consensus & Deliberation Platform inspired by Polis and Talk to the City, called **"קונצנזוס – מערכת משאלים, גישור ושיתוף ציבור חכם"** (with flagship branding for **"המצפן העירוני – ערב ערב באילת"** and multi-topic support for community mediation, municipal committees, and organizational consulting).

### 1. CORE ARCHITECTURE & TECH STACK
- **Frontend**: React 18+, TypeScript, Tailwind CSS, Lucide React icons, Recharts (for consensus & cluster visualizations).
- **RTL & Typography**: Full Hebrew Right-to-Left (`dir="rtl"`) layout across all screens. Load Google Font `'Rubik'` or `'Assistant'` in `index.html`.
- **Backend & Persistence**: Node.js + Express (or integrated Vite/Express server) with **SQLite (`better-sqlite3`)** so data persists reliably out-of-the-box in a local file (`consensus.db`) without requiring external DB setup.
- **AI Integration (`@google/genai`)**: Use `process.env.GEMINI_API_KEY` on the server (with graceful fallback simulation if the API key is not configured yet) to power two features:
  1. **AI Statement Guardrail & Mediator (`POST /api/ai/moderate`)**: Checks user-submitted statements for defamation (לשון הרע), personal names (PII), or toxic phrasing. If toxic/ranting, returns a polite explanation and a suggested constructive, neutral Hebrew rephrasing under 140 characters that can win cross-group consensus.
  2. **AI Consensus Report Generator (`POST /api/ai/report`)**: Analyzes a topic's statements, group support percentages, bridging statements, and divisive points to generate a structured executive summary suitable for a newspaper article ("ערב ערב באילת") or mediation session brief.

### 2. DATABASE SCHEMA & SEED DATA (`consensus.db`)
Create and auto-seed the following SQLite tables on server startup if empty:

1. **`topics`**:
   - `id` (TEXT PRIMARY KEY)
   - `slug` (TEXT)
   - `title` (TEXT)
   - `subtitle` (TEXT)
   - `organization` (TEXT) — e.g., `"ערב ערב באילת - המצפן העירוני"`, `"מרכז הגישור הקהילתי"`, `"DANBAR Consulting"`
   - `category` (TEXT) — `'municipal' | 'mediation' | 'committee' | 'consulting'`
   - `groups_json` (TEXT) — JSON array of stakeholder groups, e.g.:
     `[{"id": "residents", "label": "תושבי שכונות המגורים", "color": "#2563eb"}, {"id": "business", "label": "בעלי עסקים ואזור התעשייה", "color": "#d97706"}, {"id": "tourism", "label": "תיירות ומבקרים", "color": "#059669"}]`
   - `created_at` (TEXT)

2. **`statements`**:
   - `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
   - `topic_id` (TEXT)
   - `text` (TEXT)
   - `author_group` (TEXT)
   - `is_seed` (INTEGER) — 1 for initial seed statements, 0 for user-submitted
   - `status` (TEXT) — `'approved' | 'pending' | 'rejected'`
   - `created_at` (TEXT)

3. **`votes`**:
   - `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
   - `topic_id` (TEXT)
   - `statement_id` (INTEGER)
   - `session_id` (TEXT)
   - `group_id` (TEXT)
   - `vote` (INTEGER) — `1` (Agree / מסכים), `-1` (Disagree / לא מסכים), `0` (Pass / מדלג)
   - `created_at` (TEXT)
   - UNIQUE(`statement_id`, `session_id`)

**MANDATORY INITIAL SEED DATA**:
Pre-populate 3 rich topics so the platform immediately showcases its multi-domain power:
- **Topic 1 (Default Active)**: `"eilat-parking"` — **"מצוקת החניה באילת: שכונות המגורים, אזורי המסחר והחונים לסיני"** under organization `"ערב ערב באילת – המצפן העירוני"`.
  - Groups: `residents` ("תושבי השכונות"), `business` ("בעלי עסקים ועובדי אזור התעשייה"), `tourism` ("ענף התיירות ותושבים כלליים").
  - Seed with the 8 realistic Hebrew statements covering:
    1. הקמת חניון "חנה וסע" מוסדר בתשלום לנופשים לסיני (למשל בשטח שדה התעופה הישן או בכניסה לעיר) עם שאטל ישיר למעבר טאבה, ואכיפה מוגברת בשכונות.
    2. צביעת כל ההכנסות מאכיפת חניה ומחניוני תיירים לקרן עירונית שקופה להצללת מדרכות, תחבורה ציבורית ושיפור החניה בשכונות.
    3. הגבלת החניה באזור התעשייה ובמרכזי המסחר ל-3 שעות לתחלופת לקוחות, עם שעתיים ראשונות חינם לבעלי "תו תושב אילתי".
    4. הכשרת מגרשי חניה ייעודיים וחינמיים לעובדי אזור התעשייה ולרכבים מסחריים כתנאי מקדים לאכיפה באזור.
    5. איסור מוחלט על חניית רכבים ללא "תו תושב אילתי" בתוך שכונות המגורים בתקופות שיא (חגים וקיץ) או מעל 24 שעות רצופות.
    6. הימנעות מקנסות וגרירות קשוחות לתיירים ישראלים שיורדים לסיני, כדי לא לפגוע בתדמית התיירותית של אילת ובעסקים שהם מפרנסים בדרך.
    7. מתן אפשרות לבעלי דירות נופש (Airbnb) בשכונות להנפיק עד 2 תווי חניה זמניים לאורחים רשומים.
    8. הפעלת קו מיניבוסים חשמלי וחינמי בתדירות של כל 10 דקות בין השכונות, אזור התעשייה והטיילת כדי לצמצם תלות ברכב פרטי.
  - **Pre-seed 60 realistic simulated votes** across the 3 groups (`residents`, `business`, `tourism`) so that Statements #1, #2, #3, and #4 mathematically emerge as strong **Bridging Statements** (high support across all 3 groups), while Statements #5, #6, and #7 emerge as **Divisive Statements** (high support in one group, strong opposition in another).
- **Topic 2**: `"eilat-airbnb"` — **"גישור קהילתי: איזון בין דירות נופש (Airbnb) לאיכות החיים בשכונות הוותיקות"** (Category: `'mediation'`, Organization: `"מרכז הגישור והקהילה אילת"`), with 5 seed statements and simulated votes.
- **Topic 3**: `"scholarship-criteria"` — **"גיבוש סדרי עדיפויות וקריטריונים לחלוקת מלגות ותמיכות קהילתיות"** (Category: `'committee'`, Organization: `"ועדת מלגות וקרן אילת"`), with 5 seed statements and simulated votes.

### 3. ALGORITHMIC CONSENSUS & BRIDGING ENGINE (Backend Analytics)
Create an endpoint `GET /api/topics/:id/analytics` that computes in real time for every approved statement:
- Total votes (`agree`, `disagree`, `pass`, `total`).
- Overall agreement percentage: `agree / (agree + disagree)`.
- Per-group agreement percentage for each group defined in `groups_json`.
- **`bridgingScore` (0 to 100)**:
  - Calculated as `min(groupSupportPercentages) * (1 - (maxGroupSupport - minGroupSupport) * 0.5)`.
  - Mark a statement as `isBridging = true` if every active group has `>= 60%` agreement AND overall agreement is `>= 65%`.
- **`divisiveScore` (0 to 100)**:
  - Calculated as `maxGroupSupport - minGroupSupport`.
  - Mark a statement as `isDivisive = true` if `divisiveScore >= 35%`.

### 4. KEY USER INTERFACE SCREENS & COMPONENTS
Design a clean, modern, authoritative Israeli civic-tech & media interface (deep navy, warm amber/coral accents, crisp white cards, emerald for consensus, rose for disagreement):

1. **Header & Topic Switcher**:
   - Displays current topic's organization badge (e.g., `"ערב ערב באילת | המצפן העירוני"`), topic selector dropdown, and quick navigation tabs:
     - **הצבעה והשתתפות (Vote & Propose)**
     - **מפת הקונצנזוס והצהרות הגשר (Live Consensus Dashboard)**
     - **דו"ח עיתונאי / סיכום AI (AI Synthesis & Article Draft)**
     - **ניהול, סינון והטמעה (Editor & Admin Panel)**
   - Support URL parameter `?embed=true` which hides the top global switcher and renders a compact widget ready to embed inside a newspaper article.

2. **Tab 1: Interactive Voting & AI-Assisted Proposal (`VoteView`)**:
   - **Group Selector Pill Bar**: Lets the user select/change their stakeholder group (`תושב/ת שכונת מגורים`, `בעל/ת עסק באזור התעשייה`, `ענף התיירות / כללי`).
   - **Voting Card Stack**:
     - Shows one statement at a time with large, accessible buttons: `מסכים 👍`, `לא מסכים 👎`, `מדלג / ניטרלי ⏭️`.
     - After voting on a card, briefly show an instant micro-insight: *"78% מהמשתתפים עד כה הסכימו עם היגד זה"* before advancing to the next unvoted statement.
     - Allow reviewing/changing previous votes in a collapsible list below.
   - **"הוסף הצעת פתרון משלך" (Add Statement Box with AI Guardrail)**:
     - 140-character counter.
     - Button: `"בדיקת ניסוח ושליחה"`.
     - Calls `/api/ai/moderate`. If the text contains personal attacks, names, or ranting tone, displays an interactive **"הצעת המגשר החכם (AI)"** card showing the refined, constructive version and allowing the user to submit the refined version with one click.

3. **Tab 2: Live Consensus & Bridging Dashboard (`ConsensusDashboard`)**:
   - **KPI Summary Cards**: Total Participants, Total Votes Cast, Number of Bridging Statements Found, Consensus Index (%).
   - **Section A – "הצהרות הגשר המובילות" (Top Bridging Statements)**:
     - Highlighted with a gold/emerald badge (`גשר חוצה-מחנות`).
     - For each statement, display horizontal multi-group progress bars showing side-by-side support across each group (e.g., תושבי השכונות: 86%, בעלי עסקים: 79%, תיירות: 74%) so anyone can visually see why this statement unites the city.
   - **Section B – "סלעי המחלוקת" (Divisive / Polarizing Statements)**:
     - Highlighted with an amber/red split badge, showing where groups sharply diverge (explaining *why* mediation or policy trade-offs are needed).
   - **Section C – Group Comparison Chart**:
     - Interactive Recharts bar or radar/scatter visualization comparing group support across all statements.

4. **Tab 3: AI Newspaper Report & Mediation Brief (`AIReportView`)**:
   - Lets the editor or mediator generate a ready-to-publish Hebrew summary in two selectable templates:
     1. **תבנית כתבת סוף שבוע ("ערב ערב באילת"):** Journalistic summary with headline, key data findings, top 3 citizen-supported solutions, and questions for the municipality.
     2. **תבנית נייר עמדה לוועדה / גישור:** Structured brief mapping common ground (75%+ agreement), core friction points, and actionable compromise recommendations.
   - Includes a `"העתק טקסט מוכן לפרסום"` button.

5. **Tab 4: Editor & Admin Panel (`AdminView`)**:
   - **Moderation Queue**: Approve, edit, or reject pending user statements.
   - **Create New Topic Modal/Form**: Easily create a new deliberation topic for any domain (title, subtitle, organization name, custom stakeholder groups, and initial seed statements).
   - **Embed Code Generator**: Shows the ready-to-copy `<iframe src="...?topic=eilat-parking&embed=true" ...>` snippet for embedding in `yomyom.net` or client websites.

Ensure all buttons, forms, API calls, and state updates work end-to-end with zero placeholder stubs.
```

## חלק ג': הוראות שימוש מהירות

1. פתח פרויקט חדש ב-**Antigravity**.
2. העתק את כל בלוק הפרומפט שמופיע תחת **חלק ב'** והדבק אותו בחלון ההנחיות.
3. להפעלת סינון ה-AI החי ומחולל הכתבות של Gemini, ודא שמשתנה הסביבה `GEMINI_API_KEY` מוגדר בהגדרות הפרויקט (גם בלעדיו המערכת תרוץ במלואה עם מנגנון סימולציה חכם מובנה).
4. לאחר שהאפליקציה עולה, תוכל:
   * להתנסות מיד במשאל החניה של "ערב ערב באילת" ולהחליף בין כובעי התושבים, בעלי העסקים והתיירות.
   * לבדוק את מנגנון הגנת לשון הרע על ידי כתיבת תגובה מתלהמת ולראות איך המערכת מציעה ניסוח מגשר.
   * לעבור ללשונית **ניהול והטמעה** כדי לפתוח זירות חדשות (לגישור, לוועדות או לייעוץ).
