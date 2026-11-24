import type { Topic, Statement, TopicAnalytics, ModerationResult, AIStats } from './types';

const API_BASE = '/api';

// Admin Session Token Management
const ADMIN_TOKEN_KEY = 'consensus_admin_token';

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  }
}

export function clearAdminToken(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export function checkAuthResponse(res: Response): void {
  if (res.status === 401) {
    clearAdminToken();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('admin_auth_revoked'));
    }
  }
}

export async function verifyAdminPassword(password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  const res = await fetch(`${API_BASE}/admin/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });

  const data = await res.json().catch(() => ({}));
  if (res.ok && data.success && data.token) {
    setAdminToken(data.token);
    return { success: true, token: data.token };
  }

  return { success: false, error: data.error || 'סיסמה שגויה' };
}

export async function fetchAIStats(): Promise<AIStats> {
  const res = await fetch(`${API_BASE}/admin/ai-stats`, {
    headers: getAuthHeaders()
  });
  checkAuthResponse(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to fetch AI statistics');
  }
  return res.json();
}

export async function fetchTopics(): Promise<Topic[]> {
  const res = await fetch(`${API_BASE}/topics`);
  if (!res.ok) throw new Error('Failed to fetch topics');
  return res.json();
}

export async function fetchTopic(id: string): Promise<Topic> {
  const res = await fetch(`${API_BASE}/topics/${id}`);
  if (!res.ok) throw new Error('Failed to fetch topic');
  return res.json();
}

export async function fetchAnalytics(topicId: string): Promise<TopicAnalytics> {
  const res = await fetch(`${API_BASE}/topics/${topicId}/analytics`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function fetchStatements(topicId: string, status?: string): Promise<Statement[]> {
  const url = status 
    ? `${API_BASE}/topics/${topicId}/statements?status=${status}`
    : `${API_BASE}/topics/${topicId}/statements`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch statements');
  return res.json();
}

export async function fetchUserVotes(topicId: string, sessionId: string): Promise<Record<number, { vote: number; group_id: string }>> {
  const res = await fetch(`${API_BASE}/topics/${topicId}/user-votes?session_id=${encodeURIComponent(sessionId)}`);
  if (!res.ok) throw new Error('Failed to fetch user votes');
  return res.json();
}

export async function submitVote(data: {
  topic_id: string;
  statement_id: number;
  session_id: string;
  group_id: string;
  vote: number;
  device_fingerprint?: string;
}): Promise<{
  success: boolean;
  statementId: number;
  vote: number;
  microInsight: {
    totalVotes: number;
    supportPercent: number;
    text: string;
  };
}> {
  const res = await fetch(`${API_BASE}/votes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to submit vote');
  return res.json();
}

export async function checkModeration(data: {
  text: string;
  topicTitle?: string;
  topicCategory?: string;
  topicId?: string;
  existingStatements?: string[];
}): Promise<ModerationResult> {
  const res = await fetch(`${API_BASE}/ai/moderate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to moderate statement');
  return res.json();
}

export async function submitStatement(topicId: string, data: {
  text: string;
  author_group: string;
  session_id: string;
  device_fingerprint?: string;
  user_confirmed_reframing?: boolean;
}): Promise<{ 
  statement: Statement | null; 
  moderation: ModerationResult; 
  isDuplicate?: boolean; 
  needsConfirmation?: boolean;
  matchedStatement?: Statement | null;
  mode?: string;
  initialStatus?: string;
}> {
  const res = await fetch(`${API_BASE}/topics/${topicId}/statements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit statement');
  }
  return res.json();
}

export async function updateStatement(id: number, data: {
  status?: 'approved' | 'rejected' | 'pending' | 'pending_approval' | 'scheduled_auto';
  text?: string;
}): Promise<Statement> {
  const res = await fetch(`${API_BASE}/statements/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  checkAuthResponse(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update statement');
  }
  return res.json();
}

export async function batchApproveStatements(ids: number[]): Promise<{ success: boolean; count: number; updated: Statement[] }> {
  const res = await fetch(`${API_BASE}/statements/batch-approve`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ids })
  });
  checkAuthResponse(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to batch approve statements');
  }
  return res.json();
}

export async function deleteStatement(id: number): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/statements/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  checkAuthResponse(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete statement');
  }
  return res.json();
}

export async function createTopic(data: {
  id?: string;
  title: string;
  subtitle?: string;
  organization: string;
  category: string;
  groups: { id: string; label: string; color: string }[];
  initialStatements: string[];
  topic_type?: 'weekly' | 'special';
  moderation_mode?: 'batch_approval' | 'auto_publish' | 'instant_publish';
  submissions_close_at?: string | null;
  closes_at?: string | null;
  close_previous_weekly?: boolean;
}): Promise<Topic> {
  const res = await fetch(`${API_BASE}/topics`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  checkAuthResponse(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create topic');
  }
  return res.json();
}

export async function updateTopic(id: string, data: {
  title?: string;
  subtitle?: string;
  organization?: string;
  category?: string;
  groups?: { id: string; label: string; color: string }[];
  topic_type?: 'weekly' | 'special';
  moderation_mode?: 'batch_approval' | 'auto_publish' | 'instant_publish';
  submissions_close_at?: string | null;
  closes_at?: string | null;
}): Promise<Topic> {
  const res = await fetch(`${API_BASE}/topics/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  checkAuthResponse(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update topic');
  }
  return res.json();
}

export async function deleteTopic(id: string): Promise<{ success: boolean; deletedId: string }> {
  const res = await fetch(`${API_BASE}/topics/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  checkAuthResponse(res);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete topic');
  }
  return res.json();
}

export async function generateAIReport(topicId: string, templateType: 'press' | 'mediation'): Promise<{
  report: string;
  templateType: string;
  generatedAt: string;
}> {
  const res = await fetch(`${API_BASE}/ai/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topicId, templateType })
  });
  if (!res.ok) throw new Error('Failed to generate AI report');
  return res.json();
}

export async function fetchSuggestedStatements(data: {
  title: string;
  category: string;
  organization?: string;
}): Promise<string[]> {
  const res = await fetch(`${API_BASE}/ai/suggest-statements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to fetch suggested statements');
  const json = await res.json();
  return json.statements || [];
}
