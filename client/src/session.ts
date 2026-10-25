export function getOrCreateSessionId(): string {
  const STORAGE_KEY = 'consensus_session_id';
  let sessionId = localStorage.getItem(STORAGE_KEY);
  if (!sessionId) {
    sessionId = 'user_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEY, sessionId);
  }
  return sessionId;
}

export function getSavedGroup(topicId: string, defaultGroupId: string): string {
  const key = `consensus_group_${topicId}`;
  return localStorage.getItem(key) || defaultGroupId;
}

export function saveGroup(topicId: string, groupId: string): void {
  const key = `consensus_group_${topicId}`;
  localStorage.setItem(key, groupId);
}
