import type { Topic, Statement, TopicAnalytics } from './types';

export const DEFAULT_TOPICS: Topic[] = [
  {
    id: 'eilat-parking',
    slug: 'eilat-parking',
    title: 'שבוע 1: מצוקת החניה בשכונות, באזורי המסחר והחונים לסיני',
    subtitle: 'משאל עמדות אנונימי לאיתור פתרונות מוסכמים ומניעת חיכוכים בין תושבים, בעלי עסקים ותיירים לקראת עונת השיא',
    organization: 'ערב ערב באילת – המצפן העירוני',
    category: 'municipal',
    groups_json: JSON.stringify([
      { id: 'residents', label: 'תושבי שכונות המגורים', color: '#2563eb' },
      { id: 'business', label: 'בעלי עסקים ועובדי אזור התעשייה', color: '#d97706' },
      { id: 'tourism', label: 'ענף התיירות ומבקרים', color: '#059669' }
    ]),
    groups: [
      { id: 'residents', label: 'תושבי שכונות המגורים', color: '#2563eb' },
      { id: 'business', label: 'בעלי עסקים ועובדי אזור התעשייה', color: '#d97706' },
      { id: 'tourism', label: 'ענף התיירות ומבקרים', color: '#059669' }
    ],
    topic_type: 'weekly',
    moderation_mode: 'batch_approval',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    starts_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    submissions_close_at: new Date(Date.now() + 46 * 60 * 60 * 1000).toISOString(),
    closes_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    stats: {
      statementsCount: 8,
      totalVotes: 717,
      participants: 65
    }
  },
  {
    id: 'eilat-airbnb',
    slug: 'eilat-airbnb',
    title: 'שבוע 2: הסדרת דירות ה-Airbnb בשכונות הוותיקות מול איכות חיי השכנים',
    subtitle: 'מיפוי עמדות למציאת אמנה קהילתית מחייבת שתשמור על השקט בשכונות לצד פרנסת המארחים',
    organization: 'ערב ערב באילת – המצפן העירוני',
    category: 'mediation',
    groups_json: JSON.stringify([
      { id: 'neighbors', label: 'שכנים ותושבים קבועים בבניינים', color: '#2563eb' },
      { id: 'hosts', label: 'מפעילי ובעלי דירות נופש', color: '#d97706' },
      { id: 'merchants', label: 'עסקים מקומיים ונותני שירותים', color: '#059669' }
    ]),
    groups: [
      { id: 'neighbors', label: 'שכנים ותושבים קבועים בבניינים', color: '#2563eb' },
      { id: 'hosts', label: 'מפעילי ובעלי דירות נופש', color: '#d97706' },
      { id: 'merchants', label: 'עסקים מקומיים ונותני שירותים', color: '#059669' }
    ],
    topic_type: 'weekly',
    moderation_mode: 'batch_approval',
    created_at: new Date().toISOString(),
    starts_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    submissions_close_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    closes_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    stats: {
      statementsCount: 8,
      totalVotes: 375,
      participants: 40
    }
  },
  {
    id: 'eilat-old-airport',
    slug: 'eilat-old-airport',
    title: 'שבוע 3: עתיד שטח שדה התעופה הישן: תמהיל מגורים לצעירים, פארק ותיירות',
    subtitle: 'איזה אופי יקבל הלב העירוני החדש של אילת: תמהיל שימושים, דיור בר-השגה וריאות ירוקות',
    organization: 'ערב ערב באילת – המצפן העירוני',
    category: 'municipal',
    groups_json: JSON.stringify([
      { id: 'young_families', label: 'צעירים ומשפחות צעירות', color: '#2563eb' },
      { id: 'planners_env', label: 'פעילי סביבה ותכנון עירוני', color: '#059669' },
      { id: 'commerce_tourism', label: 'יזמים, מלונאים ועסקים', color: '#d97706' }
    ]),
    groups: [
      { id: 'young_families', label: 'צעירים ומשפחות צעירות', color: '#2563eb' },
      { id: 'planners_env', label: 'פעילי סביבה ותכנון עירוני', color: '#059669' },
      { id: 'commerce_tourism', label: 'יזמים, מלונאים ועסקים', color: '#d97706' }
    ],
    topic_type: 'weekly',
    moderation_mode: 'batch_approval',
    created_at: new Date().toISOString(),
    starts_at: null,
    submissions_close_at: null,
    closes_at: null,
    stats: {
      statementsCount: 8,
      totalVotes: 200,
      participants: 25
    }
  },
  {
    id: 'eilat-clean-transit',
    slug: 'eilat-clean-transit',
    title: 'שבוע 4: ניקיון, הצללה ותחבורה ציבורית משכונות המגורים לחופים',
    subtitle: 'איך מייצרים עיר נקייה, מוצלת ונגישה: פתרונות תחבורה, ניקיון המרחב הציבורי והורדת עומסי חום',
    organization: 'ערב ערב באילת – המצפן העירוני',
    category: 'municipal',
    groups_json: JSON.stringify([
      { id: 'veteran_residents', label: 'תושבי השכונות והגיל השלישי', color: '#2563eb' },
      { id: 'youth_commuters', label: 'בני נוער, חיילים ומשתמשי תח"צ', color: '#7c3aed' },
      { id: 'beach_businesses', label: 'מפעילי חופים ומסחר סובב', color: '#059669' }
    ]),
    groups: [
      { id: 'veteran_residents', label: 'תושבי השכונות והגיל השלישי', color: '#2563eb' },
      { id: 'youth_commuters', label: 'בני נוער, חיילים ומשתמשי תח"צ', color: '#7c3aed' },
      { id: 'beach_businesses', label: 'מפעילי חופים ומסחר סובב', color: '#059669' }
    ],
    topic_type: 'weekly',
    moderation_mode: 'batch_approval',
    created_at: new Date().toISOString(),
    starts_at: null,
    submissions_close_at: null,
    closes_at: null,
    stats: {
      statementsCount: 8,
      totalVotes: 200,
      participants: 25
    }
  },
  {
    id: 'eilat-cost-of-living',
    slug: 'eilat-cost-of-living',
    title: 'שבוע 5: יוקר המחיה והמחירים ברשתות המזון, הצריכה והפנאי באילת',
    subtitle: 'איפה באמת נעלם הפטור ממע"מ? גיבוש מהלכים עירוניים ואזרחיים להוזלת סל הקניות והשירותים',
    organization: 'ערב ערב באילת – המצפן העירוני',
    category: 'municipal',
    groups_json: JSON.stringify([
      { id: 'consumers', label: 'משפחות וצרכנים אילתיים', color: '#2563eb' },
      { id: 'local_retailers', label: 'סוחרים ורשתות מזון מקומיות', color: '#d97706' },
      { id: 'service_providers', label: 'בעלי מסעדות ומקומות בילוי', color: '#059669' }
    ]),
    groups: [
      { id: 'consumers', label: 'משפחות וצרכנים אילתיים', color: '#2563eb' },
      { id: 'local_retailers', label: 'סוחרים ורשתות מזון מקומיות', color: '#d97706' },
      { id: 'service_providers', label: 'בעלי מסעדות ומקומות בילוי', color: '#059669' }
    ],
    topic_type: 'weekly',
    moderation_mode: 'batch_approval',
    created_at: new Date().toISOString(),
    starts_at: null,
    submissions_close_at: null,
    closes_at: null,
    stats: {
      statementsCount: 8,
      totalVotes: 200,
      participants: 25
    }
  },
  {
    id: 'eilat-young-talent',
    slug: 'eilat-young-talent',
    title: 'שבוע 6: תעסוקת צעירים, השכלה גבוהה ושימור הון אנושי בעיר',
    subtitle: 'איך עוצרים את עזיבת הצעירים? מסלולי תעסוקה איכותיים, אקדמיה, יזמות ומענקי דיור',
    organization: 'ערב ערב באילת – המצפן העירוני',
    category: 'committee',
    groups_json: JSON.stringify([
      { id: 'young_academics', label: 'צעירים, סטודנטים ואקדמאים', color: '#2563eb' },
      { id: 'employers', label: 'מעסיקים, הייטק ומנהלי ארגונים', color: '#d97706' },
      { id: 'public_sector', label: 'הנהגת העירייה ומוסדות חינוך', color: '#7c3aed' }
    ]),
    groups: [
      { id: 'young_academics', label: 'צעירים, סטודנטים ואקדמאים', color: '#2563eb' },
      { id: 'employers', label: 'מעסיקים, הייטק ומנהלי ארגונים', color: '#d97706' },
      { id: 'public_sector', label: 'הנהגת העירייה ומוסדות חינוך', color: '#7c3aed' }
    ],
    topic_type: 'weekly',
    moderation_mode: 'batch_approval',
    created_at: new Date().toISOString(),
    starts_at: null,
    submissions_close_at: null,
    closes_at: null,
    stats: {
      statementsCount: 8,
      totalVotes: 200,
      participants: 25
    }
  },
  {
    id: 'eilat-north-beach',
    slug: 'eilat-north-beach',
    title: 'שבוע 7: פיתוח רצועת החוף הצפונית מול שמירה על ערכי הטבע והשונית',
    subtitle: 'איזון בין מלונאות, טיילת ומסחר לבין שימור משאב הטבע החשוב ביותר של העיר אילת',
    organization: 'ערב ערב באילת – המצפן העירוני',
    category: 'municipal',
    groups_json: JSON.stringify([
      { id: 'green_orgs', label: 'פעילי סביבה, צוללים ושומרי טבע', color: '#059669' },
      { id: 'tourism_dev', label: 'יזמי תיירות, מלונאים ועסקי חוף', color: '#d97706' },
      { id: 'city_residents', label: 'תושבי העיר ומשתמשי החוף', color: '#2563eb' }
    ]),
    groups: [
      { id: 'green_orgs', label: 'פעילי סביבה, צוללים ושומרי טבע', color: '#059669' },
      { id: 'tourism_dev', label: 'יזמי תיירות, מלונאים ועסקי חוף', color: '#d97706' },
      { id: 'city_residents', label: 'תושבי העיר ומשתמשי החוף', color: '#2563eb' }
    ],
    topic_type: 'weekly',
    moderation_mode: 'batch_approval',
    created_at: new Date().toISOString(),
    starts_at: null,
    submissions_close_at: null,
    closes_at: null,
    stats: {
      statementsCount: 8,
      totalVotes: 200,
      participants: 25
    }
  },
  {
    id: 'eilat-health-services',
    slug: 'eilat-health-services',
    title: 'שבוע 8: שירותי הרפואה והמומחים באילת: סדרי עדיפויות לקידום מול הממשלה',
    subtitle: 'איך פותרים את המרחק והמחסור ברפואה דחופה ומקצועית: דרישות העיר אילת לקראת תקציב המדינה',
    organization: 'ערב ערב באילת – המצפן העירוני',
    category: 'committee',
    groups_json: JSON.stringify([
      { id: 'patients_families', label: 'מטופלים, חולים כרוניים ובני משפחה', color: '#2563eb' },
      { id: 'medical_staff', label: 'רופאים, אחיות ועובדי מערכת הבריאות', color: '#059669' },
      { id: 'city_leadership', label: 'נציגי ציבור והנהלת בית חולים יוספטל', color: '#dc2626' }
    ]),
    groups: [
      { id: 'patients_families', label: 'מטופלים, חולים כרוניים ובני משפחה', color: '#2563eb' },
      { id: 'medical_staff', label: 'רופאים, אחיות ועובדי מערכת הבריאות', color: '#059669' },
      { id: 'city_leadership', label: 'נציגי ציבור והנהלת בית חולים יוספטל', color: '#dc2626' }
    ],
    topic_type: 'weekly',
    moderation_mode: 'batch_approval',
    created_at: new Date().toISOString(),
    starts_at: null,
    submissions_close_at: null,
    closes_at: null,
    stats: {
      statementsCount: 8,
      totalVotes: 200,
      participants: 25
    }
  }
];

export const DEFAULT_TOPIC: Topic = DEFAULT_TOPICS[0];

export const DEFAULT_STATEMENTS: Statement[] = [
  {
    id: 1,
    topic_id: 'eilat-parking',
    text: 'הקמת חניון "חנה וסע" מוסדר בתשלום לנופשים לסיני (למשל בשטח שדה התעופה הישן או בכניסה לעיר) עם שאטל ישיר למעבר טאבה, ואכיפה מוגברת בשכונות.',
    author_group: 'residents',
    is_seed: true,
    status: 'approved',
    created_at: '2026-03-01T00:00:00.000Z'
  },
  {
    id: 2,
    topic_id: 'eilat-parking',
    text: 'צביעת כל ההכנסות מאכיפת חניה ומחניוני תיירים לקרן עירונית שקופה להצללת מדרכות, תחבורה ציבורית ושיפור החניה בשכונות.',
    author_group: 'residents',
    is_seed: true,
    status: 'approved',
    created_at: '2026-03-01T00:00:00.000Z'
  },
  {
    id: 3,
    topic_id: 'eilat-parking',
    text: 'הגבלת החניה באזור התעשייה ובמרכזי המסחר ל-3 שעות לתחלופת לקוחות, עם שעתיים ראשונות חינם לבעלי "תו תושב אילתי".',
    author_group: 'business',
    is_seed: true,
    status: 'approved',
    created_at: '2026-03-01T00:00:00.000Z'
  },
  {
    id: 4,
    topic_id: 'eilat-parking',
    text: 'הכשרת מגרשי חניה ייעודיים וחינמיים לעובדי אזור התעשייה ולרכבים מסחריים כתנאי מקדים לאכיפה באזור.',
    author_group: 'business',
    is_seed: true,
    status: 'approved',
    created_at: '2026-03-01T00:00:00.000Z'
  },
  {
    id: 5,
    topic_id: 'eilat-parking',
    text: 'איסור מוחלט על חניית רכבים ללא "תו תושב אילתי" בתוך שכונות המגורים בתקופות שיא (חגים וקיץ) או מעל 24 שעות רצופות.',
    author_group: 'residents',
    is_seed: true,
    status: 'approved',
    created_at: '2026-03-01T00:00:00.000Z'
  },
  {
    id: 6,
    topic_id: 'eilat-parking',
    text: 'הימנעות מקנסות וגרירות קשוחות לתיירים ישראלים שיורדים לסיני, כדי לא לפגוע בתדמית התיירותית של אילת ובעסקים שהם מפרנסים בדרך.',
    author_group: 'tourism',
    is_seed: true,
    status: 'approved',
    created_at: '2026-03-01T00:00:00.000Z'
  },
  {
    id: 7,
    topic_id: 'eilat-parking',
    text: 'מתן אפשרות לבעלי דירות נופש (Airbnb) בשכונות להנפיק עד 2 תווי חניה זמניים לאורחים רשומים.',
    author_group: 'tourism',
    is_seed: true,
    status: 'approved',
    created_at: '2026-03-01T00:00:00.000Z'
  },
  {
    id: 8,
    topic_id: 'eilat-parking',
    text: 'הפעלת קו מיניבוסים חשמלי וחינמי בתדירות של כל 10 דקות בין השכונות, אזור התעשייה והטיילת כדי לצמצם תלות ברכב פרטי.',
    author_group: 'residents',
    is_seed: true,
    status: 'approved',
    created_at: '2026-03-01T00:00:00.000Z'
  }
];

export const DEFAULT_ANALYTICS: TopicAnalytics = {
  topic: DEFAULT_TOPIC,
  meta: {
    totalParticipants: 65,
    totalVotesCast: 717,
    totalStatements: 8,
    bridgingStatementsCount: 4,
    consensusIndex: 78,
    groupParticipantCounts: {
      residents: 30,
      business: 20,
      tourism: 15
    }
  },
  statements: DEFAULT_STATEMENTS,
  topBridging: DEFAULT_STATEMENTS.slice(0, 4),
  topDivisive: DEFAULT_STATEMENTS.slice(4, 7)
};

// Local storage caching helpers for instantaneous 0ms rendering
export function getCachedTopic(slug?: string): Topic | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('consensus_cache_topic_' + (slug || 'default'));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCachedTopic(topic: Topic): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('consensus_cache_topic_default', JSON.stringify(topic));
    localStorage.setItem('consensus_cache_topic_' + topic.id, JSON.stringify(topic));
    if (topic.slug) {
      localStorage.setItem('consensus_cache_topic_' + topic.slug, JSON.stringify(topic));
    }
  } catch {}
}

export function getCachedTopics(): Topic[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('consensus_cache_topics_all');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCachedTopics(topics: Topic[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('consensus_cache_topics_all', JSON.stringify(topics));
  } catch {}
}

export function getCachedStatements(topicId: string): Statement[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('consensus_cache_statements_' + topicId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCachedStatements(topicId: string, statements: Statement[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('consensus_cache_statements_' + topicId, JSON.stringify(statements));
  } catch {}
}

export function getCachedAnalytics(topicId: string): TopicAnalytics | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('consensus_cache_analytics_' + topicId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCachedAnalytics(topicId: string, analytics: TopicAnalytics): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('consensus_cache_analytics_' + topicId, JSON.stringify(analytics));
  } catch {}
}
