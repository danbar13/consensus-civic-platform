import { db } from './db.js';

export function computeTopicAnalytics(topicId) {
  const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(topicId);
  if (!topic) return null;

  const groups = JSON.parse(topic.groups_json);
  const groupIds = groups.map(g => g.id);

  // Fetch approved statements for this topic
  const statements = db.prepare(`
    SELECT * FROM statements 
    WHERE topic_id = ? AND status = 'approved'
    ORDER BY id ASC
  `).all(topicId);

  // Fetch all votes for this topic
  const votes = db.prepare(`
    SELECT * FROM votes 
    WHERE topic_id = ?
  `).all(topicId);

  // Distinct participants
  const participantSessions = new Set(votes.map(v => v.session_id));
  const totalParticipants = participantSessions.size;
  const totalVotesCast = votes.length;

  // Breakdown of participants by group
  const participantGroupMap = new Map();
  for (const v of votes) {
    if (!participantGroupMap.has(v.session_id)) {
      participantGroupMap.set(v.session_id, v.group_id);
    }
  }

  const groupParticipantCounts = {};
  for (const gId of groupIds) {
    groupParticipantCounts[gId] = 0;
  }
  for (const [, gId] of participantGroupMap.entries()) {
    if (groupParticipantCounts[gId] !== undefined) {
      groupParticipantCounts[gId]++;
    }
  }

  // Analyze each statement
  const analyzedStatements = statements.map(st => {
    const stVotes = votes.filter(v => v.statement_id === st.id);
    
    let agrees = 0;
    let disagrees = 0;
    let passes = 0;

    const groupVotes = {};
    for (const g of groups) {
      groupVotes[g.id] = { agree: 0, disagree: 0, pass: 0, total: 0, supportPercent: 0 };
    }

    for (const v of stVotes) {
      if (v.vote === 1) agrees++;
      else if (v.vote === -1) disagrees++;
      else if (v.vote === 0) passes++;

      if (groupVotes[v.group_id]) {
        groupVotes[v.group_id].total++;
        if (v.vote === 1) groupVotes[v.group_id].agree++;
        else if (v.vote === -1) groupVotes[v.group_id].disagree++;
        else if (v.vote === 0) groupVotes[v.group_id].pass++;
      }
    }

    const decisiveTotal = agrees + disagrees;
    const overallSupport = decisiveTotal > 0 ? Math.round((agrees / decisiveTotal) * 100) : 0;

    // Calculate support % per group
    const activeGroupSupports = [];
    for (const g of groups) {
      const gv = groupVotes[g.id];
      const gDecisive = gv.agree + gv.disagree;
      gv.supportPercent = gDecisive > 0 ? Math.round((gv.agree / gDecisive) * 100) : 0;
      if (gv.total > 0) {
        activeGroupSupports.push(gv.supportPercent);
      }
    }

    let bridgingScore = 0;
    let divisiveScore = 0;
    let isBridging = false;
    let isDivisive = false;

    if (activeGroupSupports.length > 0) {
      const minSupport = Math.min(...activeGroupSupports);
      const maxSupport = Math.max(...activeGroupSupports);
      const spread = maxSupport - minSupport; // in percentage points 0..100

      // Bridging formula from PRD:
      // min(groupSupportPercentages) * (1 - (maxGroupSupport - minGroupSupport) * 0.5)
      // Normalizing spread to fraction (0..1)
      const spreadRatio = spread / 100;
      bridgingScore = Math.round(minSupport * (1 - spreadRatio * 0.5));
      divisiveScore = Math.round(spread);

      // Criteria from PRD:
      // Bridging if every active group has >= 60% agreement AND overall agreement is >= 65%
      const allGroupsHigh = activeGroupSupports.every(p => p >= 60);
      if (allGroupsHigh && overallSupport >= 65) {
        isBridging = true;
      }

      // Divisive if divisiveScore >= 35%
      if (divisiveScore >= 35) {
        isDivisive = true;
      }
    }

    return {
      id: st.id,
      text: st.text,
      author_group: st.author_group,
      is_seed: Boolean(st.is_seed),
      status: st.status,
      created_at: st.created_at,
      votesSummary: {
        total: stVotes.length,
        agree: agrees,
        disagree: disagrees,
        pass: passes,
        decisiveTotal,
        overallSupportPercent: overallSupport
      },
      groupBreakdown: groupVotes,
      bridgingScore,
      divisiveScore,
      isBridging,
      isDivisive
    };
  });

  // Sort statements for special views
  const topBridging = [...analyzedStatements]
    .sort((a, b) => b.bridgingScore - a.bridgingScore);

  const topDivisive = [...analyzedStatements]
    .filter(s => s.isDivisive || s.divisiveScore >= 30)
    .sort((a, b) => b.divisiveScore - a.divisiveScore);

  // Overall Consensus Index
  const bridgingCount = analyzedStatements.filter(s => s.isBridging).length;
  const avgBridging = analyzedStatements.length > 0
    ? Math.round(analyzedStatements.reduce((acc, s) => acc + s.bridgingScore, 0) / analyzedStatements.length)
    : 0;

  return {
    topic: {
      id: topic.id,
      slug: topic.slug,
      title: topic.title,
      subtitle: topic.subtitle,
      organization: topic.organization,
      category: topic.category,
      groups,
      created_at: topic.created_at
    },
    meta: {
      totalParticipants,
      totalVotesCast,
      totalStatements: analyzedStatements.length,
      bridgingStatementsCount: bridgingCount,
      consensusIndex: avgBridging,
      groupParticipantCounts
    },
    statements: analyzedStatements,
    topBridging,
    topDivisive
  };
}
