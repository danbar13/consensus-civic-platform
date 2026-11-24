export interface StakeholderGroup {
  id: string;
  label: string;
  color: string;
}

export interface Topic {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  organization: string;
  category: 'municipal' | 'mediation' | 'committee' | 'consulting';
  groups_json: string;
  groups: StakeholderGroup[];
  moderation_mode?: 'batch_approval' | 'auto_publish' | 'instant_publish';
  created_at: string;
  submissions_close_at?: string | null;
  closes_at?: string | null;
  stats?: {
    statementsCount: number;
    totalVotes: number;
    participants: number;
  };
}

export interface Statement {
  id: number;
  topic_id: string;
  text: string;
  author_group: string;
  is_seed: boolean | number;
  is_anchor?: boolean;
  status: 'approved' | 'pending' | 'pending_approval' | 'rejected' | 'scheduled_auto';
  auto_publish_at?: string | null;
  session_id?: string | null;
  device_fingerprint?: string | null;
  created_at: string;
  votesSummary?: {
    total: number;
    agree: number;
    disagree: number;
    pass: number;
    decisiveTotal: number;
    overallSupportPercent: number;
  };
  groupBreakdown?: Record<string, {
    agree: number;
    disagree: number;
    pass: number;
    total: number;
    supportPercent: number;
  }>;
  bridgingScore?: number;
  divisiveScore?: number;
  isBridging?: boolean;
  isDivisive?: boolean;
}

export interface TopicAnalytics {
  topic: Topic;
  meta: {
    totalParticipants: number;
    totalVotesCast: number;
    totalStatements: number;
    bridgingStatementsCount: number;
    consensusIndex: number;
    groupParticipantCounts: Record<string, number>;
  };
  statements: Statement[];
  topBridging: Statement[];
  topDivisive: Statement[];
}

export interface ModerationResult {
  passed: boolean;
  isRant?: boolean;
  isDuplicate?: boolean;
  similarStatement?: string | null;
  matchedStatement?: Statement | null;
  needsConfirmation?: boolean;
  reason?: string;
  suggestion?: string;
}

export interface AILogEntry {
  id: number;
  created_at: string;
  action: string;
  model: string;
  duration_ms: number;
  prompt_tokens: number;
  candidates_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  success: number;
  error: string | null;
}

export interface AIStats {
  totalCalls: number;
  successCount: number;
  failedCount: number;
  successRatePercent: number;
  avgDurationMs: number;
  tokens: {
    prompt: number;
    candidates: number;
    total: number;
  };
  cost: {
    usd: number;
    ils: number;
    usdFormatted: string;
    ilsFormatted: string;
  };
  recentLogs: AILogEntry[];
}
