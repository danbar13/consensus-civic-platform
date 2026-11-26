import { Topic } from './types';

export type TopicLifecycleStatus = 'active' | 'scheduled' | 'draft' | 'closed';

export interface TopicLifecycleInfo {
  status: TopicLifecycleStatus;
  label: string;
  shortLabel: string;
  badgeClass: string;
  dotClass: string;
  headerBadgeClass: string;
  description: string;
  startsAtFormatted: string | null;
  submissionsCloseFormatted: string | null;
  closesAtFormatted: string | null;
  isWeekly: boolean;
  rank: number;
}

export function formatTopicDateTime(dateStr?: string | null, includeYear = false): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const datePart = d.toLocaleDateString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    ...(includeYear ? { year: 'numeric' } : {})
  });
  const timePart = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  return `${datePart} ${timePart}`;
}

export function getTopicLifecycle(t: Topic): TopicLifecycleInfo {
  const now = Date.now();
  const startsAtMs = t.starts_at ? new Date(t.starts_at).getTime() : null;
  const closesAtMs = t.closes_at ? new Date(t.closes_at).getTime() : null;
  const isWeekly = (t.topic_type === 'weekly' || !t.topic_type);

  // 1. Closed: closes_at exists and has passed
  if (closesAtMs && closesAtMs <= now) {
    return {
      status: 'closed',
      label: 'נסגרה',
      shortLabel: 'נסגרה',
      badgeClass: 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800',
      dotClass: 'bg-rose-500',
      headerBadgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      description: `המשאל הסתיים ב-${formatTopicDateTime(t.closes_at, true)}`,
      startsAtFormatted: formatTopicDateTime(t.starts_at),
      submissionsCloseFormatted: formatTopicDateTime(t.submissions_close_at),
      closesAtFormatted: formatTopicDateTime(t.closes_at, true),
      isWeekly,
      rank: 4
    };
  }

  // 2. Scheduled: starts_at exists and is in the future
  if (startsAtMs && startsAtMs > now) {
    return {
      status: 'scheduled',
      label: 'מתוזמנת',
      shortLabel: 'מתוזמנת',
      badgeClass: 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800',
      dotClass: 'bg-indigo-500 animate-pulse',
      headerBadgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      description: `תעלה לאוויר ב-${formatTopicDateTime(t.starts_at, true)}`,
      startsAtFormatted: formatTopicDateTime(t.starts_at, true),
      submissionsCloseFormatted: formatTopicDateTime(t.submissions_close_at),
      closesAtFormatted: formatTopicDateTime(t.closes_at, true),
      isWeekly,
      rank: 2
    };
  }

  // 3. Draft / Unscheduled in reservoir: neither starts_at nor closes_at is set
  if (!startsAtMs && !closesAtMs) {
    return {
      status: 'draft',
      label: 'ללא תזמון (במאגר)',
      shortLabel: 'במאגר',
      badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700',
      dotClass: 'bg-slate-400',
      headerBadgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
      description: 'במאגר – ללא תזמון',
      startsAtFormatted: null,
      submissionsCloseFormatted: null,
      closesAtFormatted: null,
      isWeekly,
      rank: 3
    };
  }

  // 4. Active (Live): starts_at has passed and closes_at is in the future
  return {
    status: 'active',
    label: 'פעילה באוויר',
    shortLabel: 'פעילה',
    badgeClass: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800',
    dotClass: 'bg-emerald-500 animate-pulse',
    headerBadgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description: closesAtMs ? `פתוחה להצבעות עד ${formatTopicDateTime(t.closes_at, true)}` : 'פתוחה להצבעות',
    startsAtFormatted: formatTopicDateTime(t.starts_at) || formatTopicDateTime(t.created_at) || 'פתוחה',
    submissionsCloseFormatted: formatTopicDateTime(t.submissions_close_at),
    closesAtFormatted: formatTopicDateTime(t.closes_at, true),
    isWeekly,
    rank: 1
  };
}

/**
 * Sorts topics in exact lifecycle order requested by user:
 * 1. Active (פעילה באוויר)
 * 2. Scheduled (מתוזמנת)
 * 3. Draft (פתוחה ללא תאריך)
 * 4. Closed (נסגרה)
 * Within the same rank, weekly topics come first, then sorted by most recent activity.
 */
export function sortTopicsByLifecycle(topics: Topic[]): Topic[] {
  return [...topics].sort((a, b) => {
    const lcA = getTopicLifecycle(a);
    const lcB = getTopicLifecycle(b);

    if (lcA.rank !== lcB.rank) {
      return lcA.rank - lcB.rank;
    }

    // Inside active rank: weekly first, then special
    if (lcA.status === 'active') {
      const isWeeklyA = a.topic_type === 'weekly' || !a.topic_type ? 0 : 1;
      const isWeeklyB = b.topic_type === 'weekly' || !b.topic_type ? 0 : 1;
      if (isWeeklyA !== isWeeklyB) return isWeeklyA - isWeeklyB;
    }

    // Inside scheduled: earliest upcoming launch first
    if (lcA.status === 'scheduled') {
      const startA = a.starts_at ? new Date(a.starts_at).getTime() : 0;
      const startB = b.starts_at ? new Date(b.starts_at).getTime() : 0;
      return startA - startB;
    }

    // Inside closed: latest closed first
    if (lcA.status === 'closed') {
      const closeA = a.closes_at ? new Date(a.closes_at).getTime() : 0;
      const closeB = b.closes_at ? new Date(b.closes_at).getTime() : 0;
      return closeB - closeA;
    }

    // Fallback: created_at descending
    const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return createdB - createdA;
  });
}

/**
 * Resolves default active topic for initial display:
 * Prioritizes live weekly topic, then any live topic, then first sorted topic.
 */
export function getDefaultTopic(topics: Topic[]): Topic | null {
  if (!topics || topics.length === 0) return null;
  const sorted = sortTopicsByLifecycle(topics);
  
  // 1. Live weekly topic
  const activeWeekly = sorted.find(t => {
    const lc = getTopicLifecycle(t);
    return lc.status === 'active' && (t.topic_type === 'weekly' || !t.topic_type);
  });
  if (activeWeekly) return activeWeekly;

  // 2. Any live topic
  const activeAny = sorted.find(t => getTopicLifecycle(t).status === 'active');
  if (activeAny) return activeAny;

  // 3. First sorted topic (scheduled or draft)
  return sorted[0];
}
