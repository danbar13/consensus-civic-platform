import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '..', 'consensus.db');

let rawDb = null;
let isSqlJs = false;

// If deployed on Vercel, serverless containers cannot compile native C++ modules
// and disk is ephemeral/read-only, so we use sql.js (pure WebAssembly SQLite).
// On local dev and standard servers, we use better-sqlite3 for disk persistence.
const isVercel = Boolean(process.env.VERCEL);

if (!isVercel) {
  try {
    const Database = (await import('better-sqlite3')).default;
    rawDb = new Database(dbPath);
    rawDb.pragma('journal_mode = WAL');
    rawDb.pragma('foreign_keys = ON');
  } catch (err) {
    console.warn('better-sqlite3 not available, falling back to sql.js:', err.message);
  }
}

if (!rawDb) {
  isSqlJs = true;
  // Use inline wasm bundle so no external .wasm asset file is needed on Vercel/serverless
  const initSqlJs = (await import('sql.js/dist/sql-wasm-inline.js')).default;
  const SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    try {
      const fileBuffer = fs.readFileSync(dbPath);
      rawDb = new SQL.Database(fileBuffer);
    } catch {
      rawDb = new SQL.Database();
    }
  } else {
    rawDb = new SQL.Database();
  }
}

function normalizeParams(params) {
  if (!params || params.length === 0) return null;
  if (params.length === 1 && typeof params[0] === 'object' && params[0] !== null && !Array.isArray(params[0])) {
    const obj = params[0];
    const normalized = {};
    for (const [k, v] of Object.entries(obj)) {
      normalized[k] = v;
      if (!k.startsWith('@') && !k.startsWith(':') && !k.startsWith('$')) {
        normalized[`@${k}`] = v;
        normalized[`:${k}`] = v;
        normalized[`$${k}`] = v;
      }
    }
    return normalized;
  }
  if (params.length === 1 && Array.isArray(params[0])) {
    return params[0];
  }
  return params;
}

export const db = isSqlJs ? {
  pragma(str) {
    try { rawDb.run(`PRAGMA ${str}`); } catch {}
  },
  exec(sql) {
    rawDb.run(sql);
  },
  prepare(sql) {
    return {
      all(...params) {
        const stmt = rawDb.prepare(sql);
        try {
          const norm = normalizeParams(params);
          if (norm) stmt.bind(norm);
          const rows = [];
          while (stmt.step()) {
            rows.push(stmt.getAsObject());
          }
          return rows;
        } finally {
          stmt.free();
        }
      },
      get(...params) {
        const rows = this.all(...params);
        return rows.length > 0 ? rows[0] : undefined;
      },
      run(...params) {
        const stmt = rawDb.prepare(sql);
        try {
          const norm = normalizeParams(params);
          if (norm) stmt.bind(norm);
          stmt.step();
          const lastIdRes = rawDb.exec('SELECT last_insert_rowid() as id');
          const lastId = lastIdRes[0]?.values[0]?.[0] || 0;
          const changesRes = rawDb.exec('SELECT changes() as c');
          const changes = changesRes[0]?.values[0]?.[0] || 0;
          return { lastInsertRowid: lastId, changes };
        } finally {
          stmt.free();
        }
      }
    };
  }
} : rawDb;

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      slug TEXT,
      title TEXT NOT NULL,
      subtitle TEXT,
      organization TEXT NOT NULL,
      category TEXT NOT NULL,
      groups_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS statements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id TEXT NOT NULL,
      text TEXT NOT NULL,
      author_group TEXT,
      is_seed INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'approved',
      created_at TEXT NOT NULL,
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic_id TEXT NOT NULL,
      statement_id INTEGER NOT NULL,
      session_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      vote INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(statement_id, session_id),
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
      FOREIGN KEY (statement_id) REFERENCES statements(id) ON DELETE CASCADE
    );
  `);

  seedDataIfEmpty();
}

function seedDataIfEmpty() {
  const countTopics = db.prepare('SELECT COUNT(*) as count FROM topics').get().count;
  if (countTopics > 0) {
    return; // Already seeded
  }

  console.log('🌱 Seeding initial topics, statements, and votes for Civic Consensus Platform...');

  const insertTopic = db.prepare(`
    INSERT INTO topics (id, slug, title, subtitle, organization, category, groups_json, created_at)
    VALUES (@id, @slug, @title, @subtitle, @organization, @category, @groups_json, @created_at)
  `);

  const insertStatement = db.prepare(`
    INSERT INTO statements (id, topic_id, text, author_group, is_seed, status, created_at)
    VALUES (@id, @topic_id, @text, @author_group, @is_seed, @status, @created_at)
  `);

  const insertVote = db.prepare(`
    INSERT INTO votes (topic_id, statement_id, session_id, group_id, vote, created_at)
    VALUES (@topic_id, @statement_id, @session_id, @group_id, @vote, @created_at)
  `);

  const now = new Date().toISOString();

  // 1. TOPIC: eilat-parking (Flagship)
  const eilatParkingGroups = [
    { id: 'residents', label: 'תושבי שכונות המגורים', color: '#2563eb' },
    { id: 'business', label: 'בעלי עסקים ועובדי אזור התעשייה', color: '#d97706' },
    { id: 'tourism', label: 'ענף התיירות ומבקרים', color: '#059669' }
  ];

  insertTopic.run({
    id: 'eilat-parking',
    slug: 'eilat-parking',
    title: 'מצוקת החניה באילת: שכונות המגורים, אזורי המסחר והחונים לסיני',
    subtitle: 'משאל עמדות אנונימי לאיתור פתרונות מוסכמים ומניעת חיכוכים בין תושבים, בעלי עסקים ותיירים לקראת עונת השיא',
    organization: 'ערב ערב באילת – המצפן העירוני',
    category: 'municipal',
    groups_json: JSON.stringify(eilatParkingGroups),
    created_at: now
  });

  const eilatStatements = [
    {
      id: 1,
      text: 'הקמת חניון "חנה וסע" מוסדר בתשלום לנופשים לסיני (למשל בשטח שדה התעופה הישן או בכניסה לעיר) עם שאטל ישיר למעבר טאבה, ואכיפה מוגברת בשכונות.',
      group: 'residents'
    },
    {
      id: 2,
      text: 'צביעת כל ההכנסות מאכיפת חניה ומחניוני תיירים לקרן עירונית שקופה להצללת מדרכות, תחבורה ציבורית ושיפור החניה בשכונות.',
      group: 'residents'
    },
    {
      id: 3,
      text: 'הגבלת החניה באזור התעשייה ובמרכזי המסחר ל-3 שעות לתחלופת לקוחות, עם שעתיים ראשונות חינם לבעלי "תו תושב אילתי".',
      group: 'business'
    },
    {
      id: 4,
      text: 'הכשרת מגרשי חניה ייעודיים וחינמיים לעובדי אזור התעשייה ולרכבים מסחריים כתנאי מקדים לאכיפה באזור.',
      group: 'business'
    },
    {
      id: 5,
      text: 'איסור מוחלט על חניית רכבים ללא "תו תושב אילתי" בתוך שכונות המגורים בתקופות שיא (חגים וקיץ) או מעל 24 שעות רצופות.',
      group: 'residents'
    },
    {
      id: 6,
      text: 'הימנעות מקנסות וגרירות קשוחות לתיירים ישראלים שיורדים לסיני, כדי לא לפגוע בתדמית התיירותית של אילת ובעסקים שהם מפרנסים בדרך.',
      group: 'tourism'
    },
    {
      id: 7,
      text: 'מתן אפשרות לבעלי דירות נופש (Airbnb) בשכונות להנפיק עד 2 תווי חניה זמניים לאורחים רשומים.',
      group: 'tourism'
    },
    {
      id: 8,
      text: 'הפעלת קו מיניבוסים חשמלי וחינמי בתדירות של כל 10 דקות בין השכונות, אזור התעשייה והטיילת כדי לצמצם תלות ברכב פרטי.',
      group: 'residents'
    }
  ];

  for (const st of eilatStatements) {
    insertStatement.run({
      id: st.id,
      topic_id: 'eilat-parking',
      text: st.text,
      author_group: st.group,
      is_seed: 1,
      status: 'approved',
      created_at: now
    });
  }

  // Pre-seed 60 simulated participants (25 residents, 20 business, 15 tourism)
  // Designed so #1, #2, #3, #4 are strong Bridging Statements (high support across all 3 groups)
  // And #5, #6, #7 are Divisive Statements (polarizing differences)
  const seedVotesForEilat = () => {
    const participants = [];
    for (let i = 1; i <= 25; i++) participants.push({ session: `seed_res_${i}`, group: 'residents' });
    for (let i = 1; i <= 20; i++) participants.push({ session: `seed_biz_${i}`, group: 'business' });
    for (let i = 1; i <= 15; i++) participants.push({ session: `seed_tour_${i}`, group: 'tourism' });

    // Target probabilities for agreement: [agreeProb_residents, agreeProb_biz, agreeProb_tourism]
    const probabilities = {
      1: [0.92, 0.85, 0.80], // Strong Bridge: Park & Ride for Sinai
      2: [0.96, 0.80, 0.87], // Strong Bridge: Earmarked transparent fund
      3: [0.80, 0.90, 0.73], // Broad Bridge: 3hr limit in commercial zone with 2hr free for locals
      4: [0.88, 0.95, 0.80], // Strong Bridge: Dedicated free parking for workers before enforcement
      5: [0.92, 0.60, 0.20], // Polarizing/Divisive: Total ban on non-locals in neighborhoods
      6: [0.12, 0.35, 0.87], // Polarizing/Divisive: No fines/towing on Sinai tourists
      7: [0.24, 0.40, 0.80], // Polarizing/Divisive: Airbnb parking permits
      8: [0.84, 0.70, 0.73]  // Good Consensus: Electric shuttle bus
    };

    for (const p of participants) {
      for (const stId of [1, 2, 3, 4, 5, 6, 7, 8]) {
        const probs = probabilities[stId];
        const gIdx = p.group === 'residents' ? 0 : p.group === 'business' ? 1 : 2;
        const agreeChance = probs[gIdx];

        let voteVal = 1;
        const rand = Math.random();
        if (rand < agreeChance) {
          voteVal = 1; // Agree
        } else if (rand < agreeChance + (1 - agreeChance) * 0.8) {
          voteVal = -1; // Disagree
        } else {
          voteVal = 0; // Pass
        }

        insertVote.run({
          topic_id: 'eilat-parking',
          statement_id: stId,
          session_id: p.session,
          group_id: p.group,
          vote: voteVal,
          created_at: now
        });
      }
    }
  };

  seedVotesForEilat();

  // 2. TOPIC: eilat-airbnb (Mediation)
  const airbnbGroups = [
    { id: 'neighbors', label: 'שכנים ותושבים קבועים', color: '#2563eb' },
    { id: 'hosts', label: 'מפעילי דירות אירוח ונופש', color: '#d97706' },
    { id: 'merchants', label: 'עסקים מקומיים ומסעדות', color: '#059669' }
  ];

  insertTopic.run({
    id: 'eilat-airbnb',
    slug: 'eilat-airbnb',
    title: 'גישור קהילתי: איזון בין דירות נופש (Airbnb) לאיכות החיים בשכונות הוותיקות',
    subtitle: 'מיפוי עמדות למציאת אמנה קהילתית מחייבת שתשמור על השקט בשכונות לצד פרנסת המארחים',
    organization: 'מרכז הגישור והקהילה אילת',
    category: 'mediation',
    groups_json: JSON.stringify(airbnbGroups),
    created_at: now
  });

  const airbnbStatements = [
    {
      id: 9,
      text: 'חיוב כל בעל דירת נופש להתקין מד רעש דיגיטלי שמזהיר אוטומטית את האורחים ומדווח למארח בעת חריגת רעש אחרי 23:00.',
      group: 'neighbors'
    },
    {
      id: 10,
      text: 'פרסום מספר טלפון ישיר של איש קשר זמין 24/7 לכל דירת נופש שפועלת בבניין משותף, לטיפול מיידי במטרדים.',
      group: 'neighbors'
    },
    {
      id: 11,
      text: 'הגבלת מספר דירות הנופש בבניין משותף ללא יותר מ-20% מכלל הדירות כדי לשמור על אופי הקהילה.',
      group: 'neighbors'
    },
    {
      id: 12,
      text: 'השתתפות של בעלי דירות הנופש בתשלום ועד בית מוגדל (דמי שימוש כפולים) בגין שחיקה מוגברת של המעליות והשטחים המשותפים.',
      group: 'hosts'
    },
    {
      id: 13,
      text: 'איסור מוחלט על השכרת דירות נופש בבנייני מגורים ללא הסכמה מראש של 75% מדיירי הבניין.',
      group: 'neighbors'
    }
  ];

  for (const st of airbnbStatements) {
    insertStatement.run({
      id: st.id,
      topic_id: 'eilat-airbnb',
      text: st.text,
      author_group: st.group,
      is_seed: 1,
      status: 'approved',
      created_at: now
    });
  }

  // Pre-seed 35 votes for topic 2
  const seedVotesForAirbnb = () => {
    const participants = [];
    for (let i = 1; i <= 15; i++) participants.push({ session: `airbnb_res_${i}`, group: 'neighbors' });
    for (let i = 1; i <= 10; i++) participants.push({ session: `airbnb_host_${i}`, group: 'hosts' });
    for (let i = 1; i <= 10; i++) participants.push({ session: `airbnb_merch_${i}`, group: 'merchants' });

    const probs = {
      9: [0.93, 0.80, 0.85],  // Bridge: Noise decibel meter
      10: [0.95, 0.85, 0.90], // Bridge: 24/7 contact number
      11: [0.85, 0.30, 0.60], // Polarizing: 20% quota
      12: [0.90, 0.70, 0.75], // Solid Compromise: Higher HOA fee
      13: [0.85, 0.10, 0.40]  // Polarizing: 75% HOA consent requirement
    };

    for (const p of participants) {
      for (const stId of [9, 10, 11, 12, 13]) {
        const pList = probs[stId];
        const gIdx = p.group === 'neighbors' ? 0 : p.group === 'hosts' ? 1 : 2;
        const agreeChance = pList[gIdx];

        const rand = Math.random();
        const voteVal = rand < agreeChance ? 1 : (rand < agreeChance + (1 - agreeChance) * 0.85 ? -1 : 0);

        insertVote.run({
          topic_id: 'eilat-airbnb',
          statement_id: stId,
          session_id: p.session,
          group_id: p.group,
          vote: voteVal,
          created_at: now
        });
      }
    }
  };
  seedVotesForAirbnb();

  // 3. TOPIC: scholarship-criteria (Committee / Consulting)
  const scholarshipGroups = [
    { id: 'students', label: 'סטודנטים וצעירים', color: '#2563eb' },
    { id: 'committee', label: 'הנהלה וועדה מקצועית', color: '#7c3aed' },
    { id: 'community', label: 'נציגי עמותות ורווחה', color: '#059669' }
  ];

  insertTopic.run({
    id: 'scholarship-criteria',
    slug: 'scholarship-criteria',
    title: 'גיבוש סדרי עדיפויות וקריטריונים לחלוקת מלגות ותמיכות קהילתיות',
    subtitle: 'דיון מובנה לקביעת מודל חלוקת מלגות הוגן, שקוף ומעודד מעורבות אזרחית',
    organization: 'ועדת מלגות וקרן אילת',
    category: 'committee',
    groups_json: JSON.stringify(scholarshipGroups),
    created_at: now
  });

  const scholarshipStatements = [
    {
      id: 14,
      text: 'התניית כל מלגת לימודים בהתנדבות קהילתית משמעותית של לפחות 60 שעות שנתיות בעיר אילת.',
      group: 'committee'
    },
    {
      id: 15,
      text: 'מתן עדיפות מוגברת (בונוס ניקוד) למקצועות לימוד נדרשים בעיר: רפואה וסיעוד, הוראה, והנדסה ימית וסביבתית.',
      group: 'committee'
    },
    {
      id: 16,
      text: 'הקצאת לפחות 40% מתקציב המלגות על בסיס מצב סוציו-אקונומי בלבד, ללא תלות בממוצע ציונים.',
      group: 'community'
    },
    {
      id: 17,
      text: 'אפשרות להמיר חלק משעות ההתנדבות בפרויקטים יזמיים, חונכות אקדמית מקוונת או סיוע לחיילי מילואים.',
      group: 'students'
    },
    {
      id: 18,
      text: 'התחייבות מראש של מקבלי המלגות למגורים ועבודה באילת למשך שנתיים לפחות לאחר סיום התואר כתנאי לקבלת המענק המלא.',
      group: 'committee'
    }
  ];

  for (const st of scholarshipStatements) {
    insertStatement.run({
      id: st.id,
      topic_id: 'scholarship-criteria',
      text: st.text,
      author_group: st.group,
      is_seed: 1,
      status: 'approved',
      created_at: now
    });
  }

  // Pre-seed 30 votes for topic 3
  const seedVotesForScholarship = () => {
    const participants = [];
    for (let i = 1; i <= 12; i++) participants.push({ session: `schol_stud_${i}`, group: 'students' });
    for (let i = 1; i <= 8; i++) participants.push({ session: `schol_comm_${i}`, group: 'committee' });
    for (let i = 1; i <= 10; i++) participants.push({ session: `schol_welf_${i}`, group: 'community' });

    const probs = {
      14: [0.75, 0.95, 0.90], // Bridge: 60hr volunteering
      15: [0.82, 0.92, 0.88], // Strong Bridge: Priority for required professions
      16: [0.85, 0.65, 0.95], // Broad consensus: 40% socio-economic
      17: [0.95, 0.85, 0.80], // Strong Bridge: Flexible volunteering tracks
      18: [0.35, 0.85, 0.60]  // Polarizing: 2-year mandatory commitment
    };

    for (const p of participants) {
      for (const stId of [14, 15, 16, 17, 18]) {
        const pList = probs[stId];
        const gIdx = p.group === 'students' ? 0 : p.group === 'committee' ? 1 : 2;
        const agreeChance = pList[gIdx];

        const rand = Math.random();
        const voteVal = rand < agreeChance ? 1 : (rand < agreeChance + (1 - agreeChance) * 0.8 ? -1 : 0);

        insertVote.run({
          topic_id: 'scholarship-criteria',
          statement_id: stId,
          session_id: p.session,
          group_id: p.group,
          vote: voteVal,
          created_at: now
        });
      }
    }
  };
  seedVotesForScholarship();

  console.log('✅ Seed completed successfully with 3 rich civic topics, 18 statements, and 125+ authentic votes.');
}
