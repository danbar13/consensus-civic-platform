import type { Topic, Statement, TopicAnalytics } from './types';

export const DEFAULT_TOPIC: Topic = {
  id: 'eilat-parking',
  slug: 'eilat-parking',
  title: 'מצוקת החניה באילת: שכונות המגורים, אזורי המסחר והחונים לסיני',
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
  created_at: '2026-03-01T00:00:00.000Z'
};

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
    totalParticipants: 60,
    totalVotesCast: 420,
    totalStatements: 8,
    bridgingStatementsCount: 4,
    consensusIndex: 78,
    groupParticipantCounts: {
      residents: 25,
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
