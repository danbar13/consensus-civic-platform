/**
 * Privacy-preserving anonymous session and device identification
 * Does NOT collect personal info (no name, email, phone, or exact location)
 */

export function getDeviceFingerprint(): string {
  try {
    const nav = typeof window !== 'undefined' ? window.navigator : ({} as any);
    const screen = typeof window !== 'undefined' ? window.screen : ({} as any);
    const parts = [
      nav.userAgent || '',
      nav.language || '',
      (nav.languages || []).join(','),
      screen.width || 0,
      screen.height || 0,
      screen.colorDepth || 0,
      Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      nav.hardwareConcurrency || 1,
      screen.pixelDepth || 0
    ];
    const str = parts.join('###');
    
    // Fast non-cryptographic hash for anonymous anti-spoofing
    let h1 = 0xdeadbeef, h2 = 0x41c64e6d;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 'df_' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  } catch {
    return 'df_unknown';
  }
}

export function getOrCreateSessionId(): string {
  const STORAGE_KEY = 'consensus_session_id';
  let sessionId: string | null = null;

  if (typeof window !== 'undefined') {
    sessionId = localStorage.getItem(STORAGE_KEY);
    
    // Cookie backup check
    if (!sessionId && document.cookie) {
      const match = document.cookie.match(new RegExp('(^|; )' + STORAGE_KEY + '=([^;]+)'));
      if (match) {
        sessionId = match[2];
        localStorage.setItem(STORAGE_KEY, sessionId);
      }
    }

    if (!sessionId) {
      sessionId = 'user_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem(STORAGE_KEY, sessionId);
      // Set backup cookie valid for 180 days
      try {
        document.cookie = `${STORAGE_KEY}=${sessionId}; path=/; max-age=${180 * 24 * 60 * 60}; SameSite=Lax`;
      } catch {}
    }
  }

  return sessionId || 'user_anonymous';
}

export function getSavedGroup(topicId: string, defaultGroupId: string): string {
  if (typeof window === 'undefined') return defaultGroupId;
  const key = `consensus_group_${topicId}`;
  return localStorage.getItem(key) || defaultGroupId;
}

export function saveGroup(topicId: string, groupId: string): void {
  if (typeof window === 'undefined') return;
  const key = `consensus_group_${topicId}`;
  localStorage.setItem(key, groupId);
}

export function getSavedUserVotes(topicId: string): Record<number, { vote: number; group_id: string }> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`consensus_user_votes_${topicId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUserVotes(topicId: string, votes: Record<number, { vote: number; group_id: string }>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`consensus_user_votes_${topicId}`, JSON.stringify(votes));
  } catch {}
}
