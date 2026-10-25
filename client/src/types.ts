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
  created_at: string;
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
  status: 'approved' | 'pending' | 'rejected';
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
  reason?: string;
  suggestion?: string;
}
