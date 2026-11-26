import React, { useState, useEffect } from 'react';
import type { Topic, Statement } from '../types';
import { getDefaultTopic } from '../topicLifecycle';
import { submitVote, submitStatement } from '../api';
import { getDeviceFingerprint, getSavedUserVotes } from '../session';
import { 
  ThumbsUp, 
  ThumbsDown, 
  SkipForward, 
  CheckCircle2, 
  Sparkles, 
  Info, 
  Send, 
  RotateCcw, 
  MessageSquarePlus, 
  ChevronDown, 
  ChevronUp, 
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  Clock,
  Lock,
  BarChart3,
  Compass
} from 'lucide-react';

interface VoteViewProps {
  topic: Topic;
  topics?: Topic[];
  statements: Statement[];
  userVotes: Record<number, { vote: number; group_id: string }>;
  currentGroup: string;
  sessionId: string;
  onChangeGroup: (groupId: string) => void;
  onVoteCast: (statementId: number, voteVal: number, microInsight?: any) => void;
  onStatementAdded: (statement: Statement) => void;
  onNavigateToDashboard: () => void;
  onSelectTopic?: (topicId: string) => void;
  onReturnToPitch?: () => void;
}

export const VoteView: React.FC<VoteViewProps> = ({
  topic,
  topics = [],
  statements,
  userVotes,
  currentGroup,
  sessionId,
  onChangeGroup,
  onVoteCast,
  onStatementAdded,
  onNavigateToDashboard,
  onSelectTopic,
  onReturnToPitch
}) => {
  const [microInsight, setMicroInsight] = useState<{ text: string; percent: number } | null>(null);
  const [votesAccordionOpen, setVotesAccordionOpen] = useState(false);
  const [topicsAccordionOpen, setTopicsAccordionOpen] = useState(false);
  const liveActiveTopic = getDefaultTopic(topics);

  // New statement submission state
  const [newText, setNewText] = useState('');
  const [isEvaluatingAI, setIsEvaluatingAI] = useState(false);
  const [viewingCommunityTier, setViewingCommunityTier] = useState(false);
  const [moderationFeedback, setModerationFeedback] = useState<{
    passed: boolean;
    isRant?: boolean;
    isDuplicate?: boolean;
    similarStatement?: string | null;
    matchedStatement?: Statement | null;
    needsConfirmation?: boolean;
    reason?: string;
    suggestion?: string;
  } | null>(null);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  // Requirement 1: Tier 1 (Exactly 8 Iron Core statements) vs Tier 2 (Up to 7 Community Dynamic statements)
  const approvedStatements = statements.filter(s => s.status === 'approved');
  // 8 Iron Anchor statements
  const seedStatements = approvedStatements.filter(s => s.is_seed || s.is_anchor).slice(0, 8);
  // Community statements: up to 7 leading statements
  const allCommunityStatements = approvedStatements.filter(s => !seedStatements.some(seed => seed.id === s.id));
  const communityStatements = allCommunityStatements.slice(0, 7);

  const unvotedSeed = seedStatements.filter(s => userVotes[s.id] === undefined);
  const unvotedCommunity = communityStatements.filter(s => userVotes[s.id] === undefined);

  const isSeedComplete = seedStatements.length > 0 && unvotedSeed.length === 0;
  const isCompletedVoter = isSeedComplete && (!viewingCommunityTier || unvotedCommunity.length === 0);

  const formatShortTopicTitle = (fullTitle: string) => {
    if (fullTitle.includes(':')) {
      const parts = fullTitle.split(':');
      const prefix = parts[0].trim();
      const rest = parts.slice(1).join(':').trim();
      const shortRest = rest.split(/[,—–]/)[0].trim();
      return `${prefix}: ${shortRest}`;
    }
    return fullTitle.split(/[,—–]/)[0].trim();
  };

  const shortTopicTitle = formatShortTopicTitle(topic.title);

  // Determine current statement to display
  let currentStatement: Statement | null = null;
  let isCurrentTierSeed = true;

  if (!isSeedComplete) {
    currentStatement = unvotedSeed[0] || null;
    isCurrentTierSeed = true;
  } else if (viewingCommunityTier && unvotedCommunity.length > 0) {
    currentStatement = unvotedCommunity[0] || null;
    isCurrentTierSeed = false;
  } else {
    currentStatement = null;
  }

  const seedTotal = seedStatements.length || 8;
  const seedVotedCount = seedStatements.filter(s => userVotes[s.id] !== undefined).length;
  const seedProgressPercent = seedTotal > 0 ? Math.round((seedVotedCount / seedTotal) * 100) : 0;

  const communityTotal = communityStatements.length;
  const communityVotedCount = communityStatements.filter(s => userVotes[s.id] !== undefined).length;
  const totalVotedCount = seedVotedCount + communityVotedCount;

  const isClosed = Boolean(topic.closes_at && new Date(topic.closes_at).getTime() < Date.now());
  const isSubmissionsClosed = Boolean(
    isClosed || (topic.submissions_close_at && new Date(topic.submissions_close_at).getTime() < Date.now())
  );
  const isGroupLocked = totalVotedCount > 0;

  const getClosingDetails = (closesAt?: string | null) => {
    if (!closesAt) return null;
    const d = new Date(closesAt);
    if (isNaN(d.getTime())) return null;
    const isPast = d.getTime() < Date.now();
    const dateStr = d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    return { isPast, formatted: `${dateStr} בשעה ${timeStr}` };
  };

  const closingInfo = getClosingDetails(topic.closes_at);
  const submissionsClosingInfo = getClosingDetails(topic.submissions_close_at);

  // Handle single vote with instantaneous Optimistic UI (0ms perceived lag) + Anti-Spam device fingerprinting
  const handleVote = (statementId: number, voteVal: number) => {
    if (isClosed) return;

    // 1. Immediately advance to next statement or complete state in 0 milliseconds
    onVoteCast(statementId, voteVal);

    // 2. Submit vote to server/cloud asynchronously in background with device fingerprint
    submitVote({
      topic_id: topic.id,
      statement_id: statementId,
      session_id: sessionId,
      group_id: currentGroup,
      vote: voteVal,
      device_fingerprint: getDeviceFingerprint()
    })
      .then(res => {
        if (res?.microInsight) {
          setMicroInsight({
            text: res.microInsight.text,
            percent: res.microInsight.supportPercent
          });
          setTimeout(() => {
            setMicroInsight(null);
          }, 2400);
        }
      })
      .catch(err => {
        console.error('Error submitting vote in background:', err);
      });
  };

  // Keyboard navigation for voting (Instant response with arrow keys or 1/2/3)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (!currentStatement || isClosed) return;

      if (e.key === 'ArrowRight' || e.key === '1') {
        e.preventDefault();
        handleVote(currentStatement.id, 1);
      } else if (e.key === 'ArrowLeft' || e.key === '2') {
        e.preventDefault();
        handleVote(currentStatement.id, -1);
      } else if (e.key === 'ArrowDown' || e.key === ' ' || e.key === '3') {
        e.preventDefault();
        handleVote(currentStatement.id, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStatement, currentGroup, isClosed]);

  // Handle submitting a new statement with Smart AI Funnel, Reframing & Deduplication
  const handleAddStatementSubmit = async (textToSubmit?: string, isConfirmedReframing = false) => {
    const targetText = (textToSubmit || newText).trim();
    if (!targetText) return;

    setIsEvaluatingAI(true);
    setModerationFeedback(null);
    setSubmitSuccessMsg(null);

    try {
      // Server performs rate limit, 2-proposal limit, 48h limit, AI moderation, and deduplication
      const res = await submitStatement(topic.id, {
        text: targetText,
        author_group: currentGroup,
        session_id: sessionId,
        device_fingerprint: getDeviceFingerprint(),
        user_confirmed_reframing: isConfirmedReframing
      });

      // Requirement 2: Deduplication facing voter
      if (res.isDuplicate || res.moderation?.isDuplicate) {
        setModerationFeedback({
          ...res.moderation,
          isDuplicate: true,
          matchedStatement: res.matchedStatement || null
        });
        setIsEvaluatingAI(false);
        return;
      }

      // Requirement 2: Reframing confirmation
      if (res.needsConfirmation || (res.moderation?.isRant && res.moderation?.suggestion && !isConfirmedReframing)) {
        setModerationFeedback({
          ...res.moderation,
          needsConfirmation: true
        });
        setIsEvaluatingAI(false);
        return;
      }

      // Requirement 2: Direct blocking of noise/defamation
      if (!res.moderation?.passed && !isConfirmedReframing) {
        setModerationFeedback(res.moderation);
        setIsEvaluatingAI(false);
        return;
      }

      if (res.statement) {
        onStatementAdded(res.statement);
        if (res.statement.status === 'approved') {
          handleVote(res.statement.id, 1);
        }
        setNewText('');
        setModerationFeedback(null);

        const statusMsg = res.statement.status === 'approved'
          ? 'רעיונך נבדק ואושר ע"י ה-AI והתווסף לשלב רעיונות התושבים! 🎉'
          : res.statement.status === 'scheduled_auto'
          ? 'הצעתך אושרה ע"י ה-AI ונכנסה לפרסום אוטומטי (Auto-Publish) בעוד 3 שעות! ⏱️'
          : 'הצעתך עברה סינון AI מוקפד והועברה לאישור מהיר של עורך העיתון בקליק אחד (One-Click Approval). תודה!';

        setSubmitSuccessMsg(statusMsg);
      }

      setTimeout(() => setSubmitSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('Error submitting statement:', err);
      setModerationFeedback({
        passed: false,
        reason: err?.message || 'שגיאה בשליחת ההצעה. נסו שוב.'
      });
    } finally {
      setIsEvaluatingAI(false);
    }
  };

  const activeGroupObj = topic.groups.find(g => g.id === currentGroup) || topic.groups[0];

  // Active topics calculation for Arena Switcher
  const nowMs = Date.now();
  const isTopicLive = (t: Topic) => {
    // 1. If closes_at exists and is in the past -> closed (not live)
    if (t.closes_at && new Date(t.closes_at).getTime() <= nowMs) return false;
    // 2. If starts_at exists and is in the future -> scheduled (not live yet)
    if (t.starts_at && new Date(t.starts_at).getTime() > nowMs) return false;
    // 3. If neither starts_at nor closes_at is set -> draft / unscheduled in bank (not live)
    if (!t.starts_at && !t.closes_at) return false;
    return true;
  };

  const liveTopics = (topics || []).filter(isTopicLive);
  const activeWeeklyTopic = liveTopics.find((t: Topic) => (t.topic_type === 'weekly' || !t.topic_type));
  const activeSpecialTopics = liveTopics.filter((t: Topic) => t.topic_type === 'special');
  const hasMultipleLiveTopics = liveTopics.length > 1;
  const hasParallelSpecial = activeSpecialTopics.length > 0;

  // Historical topics in which the current user actually participated/voted (closed only, never future or unvoted)
  const historicalVotedTopics = (topics || []).filter(t => {
    // Exclude current topic (already viewed and voted on in the current screen)
    if (t.id === topic.id) return false;
    // Must be past/closed topic - NEVER future (scheduled or draft)
    const isPastClosed = Boolean(t.closes_at && new Date(t.closes_at).getTime() <= nowMs);
    if (!isPastClosed) return false;
    // The resident must have actually voted in this topic
    const saved = getSavedUserVotes(t.id);
    return Boolean(saved && Object.keys(saved).length > 0);
  });

  // Render Helpers for Clean Modular Layout
  const renderVotesList = () => {
    // Show all approved statements (both voted statements and newly approved community statements)
    // Sort unvoted community statements to the top so the user immediately sees what is awaiting their vote
    const displayStatements = [...approvedStatements].sort((a, b) => {
      const aVoted = userVotes[a.id] !== undefined;
      const bVoted = userVotes[b.id] !== undefined;
      if (!aVoted && bVoted) return -1;
      if (aVoted && !bVoted) return 1;
      return a.id - b.id;
    });

    if (displayStatements.length === 0) {
      return (
        <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
          טרם נרשמו או אושרו היגדים בזירה זו.
        </div>
      );
    }

    return (
      <div className="divide-y divide-slate-100 dark:divide-slate-800 p-4 pt-1 max-h-96 overflow-y-auto space-y-2">
        {displayStatements.map(st => {
          const voteRecord = userVotes[st.id];
          const hasVoted = voteRecord !== undefined;
          const currentVote = hasVoted ? voteRecord.vote : undefined;
          const isSeed = st.is_seed || st.is_anchor;

          return (
            <div 
              key={st.id} 
              className={`pt-3 pb-2.5 px-2 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                !hasVoted 
                  ? 'bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/90 dark:border-purple-800/80 shadow-2xs' 
                  : ''
              }`}
            >
              <div className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 flex-1 pl-2">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-bold">#{st.id}</span>
                  {isSeed ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                      8 היגדי ברזל
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                      היגד קהילה
                    </span>
                  )}

                  {!hasVoted ? (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1 animate-pulse shadow-2xs">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>היגד חדש • טרם הצבעת</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded">
                      הצבעתך נקלטה ✓
                    </span>
                  )}
                </div>
                <div className={!hasVoted ? 'font-bold text-slate-900 dark:text-white' : ''}>
                  {st.text}
                </div>
              </div>

              {/* Vote Buttons Mini */}
              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleVote(st.id, 1)}
                  disabled={isClosed}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    isClosed ? 'opacity-50 cursor-not-allowed ' : ''
                  }${
                    currentVote === 1
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span>מסכים</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleVote(st.id, -1)}
                  disabled={isClosed}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    isClosed ? 'opacity-50 cursor-not-allowed ' : ''
                  }${
                    currentVote === -1
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <ThumbsDown className="w-3 h-3" />
                  <span>מתנגד</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleVote(st.id, 0)}
                  disabled={isClosed}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                    isClosed ? 'opacity-50 cursor-not-allowed ' : ''
                  }${
                    currentVote === 0
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <SkipForward className="w-3 h-3" />
                  <span>דילוג</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderHistoricalTopicsList = () => {
    return (
      <div className="p-3 sm:p-4 pt-2 space-y-2.5 max-h-96 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {historicalVotedTopics.map(t => {
            const savedVotes = getSavedUserVotes(t.id);
            const votedCount = savedVotes ? Object.keys(savedVotes).length : 0;

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  if (onSelectTopic) {
                    onSelectTopic(t.id);
                  }
                }}
                className="p-3 rounded-xl border text-right transition-all flex flex-col justify-between text-xs bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer opacity-90 hover:opacity-100"
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      🔒 משאל שהסתיים
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 hover:text-blue-500">
                      צפה בתוצאות ↗
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    {t.title}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-2 pt-1.5 border-t border-slate-200/50 dark:border-slate-800/80 flex items-center justify-between">
                  <span>הצבעת על {votedCount} היגדים</span>
                  <span>{t.stats?.totalVotes || 0} סה"כ הצבעות</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSuggestionBox = () => (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 dark:border-slate-800 space-y-3 transition-colors">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 shrink-0">
          <MessageSquarePlus className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug">
            יש לך רעיון או הצעת פתרון שלא הופיעה כאן?
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            הזינו הצעת מדיניות קצרה (עד 140 תווים) — ה-AI יסנן כפילויות ולשון הרע
          </p>
        </div>
      </div>

      {isSubmissionsClosed ? (
        <div className="p-3.5 rounded-xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 text-xs font-semibold flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <div className="font-bold">שלב הוספת ההצעות הסתיים</div>
            <div className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
              {submissionsClosingInfo?.formatted 
                ? `חלון 48 השעות נסגר ב-${submissionsClosingInfo.formatted}. כעת מתקיימת הצבעה על המאגר הסופי לקראת סגירת הגיליון.`
                : 'חלון 48 השעות הראשונות להעלאת הצעות תושבים נסגר. כעת מתקיימת הצבעה על המאגר הסופי.'}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="relative">
            <textarea
              value={newText}
              onChange={e => {
                if (e.target.value.length <= 140) {
                  setNewText(e.target.value);
                  setModerationFeedback(null);
                }
              }}
              placeholder="לדוגמה: להקצות מקומות חניה מוסדרים לטווח קצר עם תו תושב..."
              rows={2}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-950/50 outline-none text-xs sm:text-sm leading-relaxed resize-none transition"
            />
            <div className="absolute bottom-2.5 left-2.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
              <span className={newText.length > 120 ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}>
                {newText.length}
              </span>
              /140 תווים
            </div>
          </div>

          {/* AI Moderation & Deduplication Feedback */}
          {moderationFeedback && (
            <div className="space-y-2.5">
              {/* 1. Deduplication */}
              {moderationFeedback.isDuplicate && (
                <div className="p-3.5 rounded-xl border-2 bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 text-purple-950 dark:text-purple-200 space-y-2.5 animate-in fade-in">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs sm:text-sm font-black">
                        הצעה דומה כבר קיימת במשאל — הצבע עליה כדי לחזק אותה!
                      </div>
                      <p className="text-[11px] sm:text-xs mt-0.5 leading-relaxed opacity-90">
                        {moderationFeedback.reason || 'המערכת זיהתה רעיון דומה שכבר קיים במשאל. הצבעתך תשפיע ישירות על ההיגד הקיים:'}
                      </p>
                    </div>
                  </div>

                  {(moderationFeedback.matchedStatement || moderationFeedback.similarStatement) && (
                    <div className="bg-white/95 dark:bg-slate-900/95 p-3 rounded-lg border border-purple-200 dark:border-purple-800 space-y-2 shadow-2xs">
                      <div className="text-[11px] font-bold text-purple-700 dark:text-purple-300">
                        ההיגד הקיים במשאל:
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        "{moderationFeedback.matchedStatement?.text || moderationFeedback.similarStatement}"
                      </div>
                      <div className="pt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-slate-500">הצבע עליו:</span>
                        {moderationFeedback.matchedStatement && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                handleVote(moderationFeedback.matchedStatement!.id, 1);
                                setModerationFeedback(null);
                                setNewText('');
                                setSubmitSuccessMsg('הצבעתך בעד ההיגד הקיים נקלטה בהצלחה! ✓');
                              }}
                              className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>מסכים</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleVote(moderationFeedback.matchedStatement!.id, -1);
                                setModerationFeedback(null);
                                setNewText('');
                                setSubmitSuccessMsg('הצבעתך נגד ההיגד הקיים נקלטה בהצלחה! ✓');
                              }}
                              className="px-2.5 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <ThumbsDown className="w-3 h-3" />
                              <span>מתנגד</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleVote(moderationFeedback.matchedStatement!.id, 0);
                                setModerationFeedback(null);
                                setNewText('');
                              }}
                              className="px-2.5 py-1 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <SkipForward className="w-3 h-3" />
                              <span>מדלג</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Reframing */}
              {moderationFeedback.suggestion && !moderationFeedback.isDuplicate && (
                <div className="p-3.5 rounded-xl border-2 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200 space-y-2.5 animate-in fade-in">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs sm:text-sm font-black">
                        ניסוח מגשר ענייני (Smart Reframing)
                      </div>
                      <p className="text-[11px] sm:text-xs mt-0.5 leading-relaxed opacity-90">
                        {moderationFeedback.reason || 'המערכת זיהתה רעיון ענייני לצד שפה מתלהמת. לפני שליחה, אנא אשרו את הניסוח המגשר הענייני:'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/90 dark:bg-slate-900/90 p-3 rounded-lg border border-amber-200 dark:border-amber-800 space-y-2 shadow-2xs">
                    <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                      הניסוח המוצע להצבעת הציבור:
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      "{moderationFeedback.suggestion}"
                    </div>
                    <div className="pt-1.5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddStatementSubmit(moderationFeedback.suggestion, true)}
                        disabled={isEvaluatingAI}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>אשר ושלח ניסוח זה לבדיקה ✓</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewText(moderationFeedback.suggestion || '');
                          setModerationFeedback(null);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition"
                      >
                        העתק לתיבה וערוך בעצמי
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Direct Blocking */}
              {!moderationFeedback.passed && !moderationFeedback.suggestion && !moderationFeedback.isDuplicate && (
                <div className="p-3 rounded-xl border-2 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-950 dark:text-rose-200 space-y-1 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span className="font-bold text-xs sm:text-sm">ההצעה נחסמה בהתאם לכללי השיח</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-rose-800 dark:text-rose-300 leading-relaxed pr-6">
                    {moderationFeedback.reason || 'שפה פוגענית, קללות, השמצות או שמות פרטיים אינן מותרות במשאל. אנא נסח/י את הצעתך מחדש באופן ענייני ומכבד.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Success Toast */}
          {submitSuccessMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{submitSuccessMsg}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-0.5">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center sm:text-right">
              ההצעה תתווסף תחת קבוצת: <span className="font-bold text-slate-800 dark:text-slate-200">{activeGroupObj.label}</span>
            </div>
            <button
              type="button"
              onClick={() => handleAddStatementSubmit()}
              disabled={isEvaluatingAI || newText.trim().length < 5}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isEvaluatingAI ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>בודק ב-AI...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>בדיקת ניסוח ושליחה</span>
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );

  // =========================================================================
  // 1. RETURNING / COMPLETED VOTER STATE (70% Shorter Mobile View, Above the fold)
  // =========================================================================
  if (isCompletedVoter) {
    return (
      <div className="max-w-4xl mx-auto px-3.5 sm:px-4 py-4 sm:py-6 space-y-3.5 sm:space-y-4">
        {/* Back to Pitch Deck button if launched from pitch */}
        {onReturnToPitch && (
          <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 shadow-xs">
            <div className="text-xs font-bold text-amber-950 dark:text-amber-200">
              אתה צופה בווידג'ט ההצבעה החי של "המצפן העירוני"
            </div>
            <a
              href="/pitch.html"
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs shadow-xs transition"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>חזור לדף הנחיתה ↩️</span>
            </a>
          </div>
        )}

        {/* Real-time Confirmation Toast / Micro-Insight */}
        {microInsight && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150 shadow-xs">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>ההצבעה נקלטה בהצלחה! {microInsight.text}</span>
          </div>
        )}

        {/* HERO STATUS CARD (Above the Fold) */}
        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-blue-500/30 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3 transition-all text-right">
          {/* Tag pill: Active topic + selected hat */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-blue-500/15 text-blue-200 border border-blue-400/25 max-w-full">
              <span className="truncate">{shortTopicTitle}</span>
              <span className="opacity-60">•</span>
              <span className="shrink-0 flex items-center gap-1 text-emerald-400 font-bold">
                <span>כובע: {activeGroupObj.label}</span>
                <CheckCircle2 className="w-3.5 h-3.5 inline text-emerald-400" />
              </span>
            </div>
            {isClosed && (
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>המשאל נסגר</span>
              </span>
            )}
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h1 className="text-base sm:text-xl md:text-2xl font-black text-white leading-snug">
              מעולה! עמדתך נקלטה במדד הקונצנזוס העירוני 🎉
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              השלמת את שאלון הליבה ({seedStatements.length} היגדי ברזל). עמדתך משוקללת בזמן אמת במפת ההסכמות והמחלוקות העירונית.
            </p>
          </div>

          {/* Primary & Conditional Secondary CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            {/* Primary CTA */}
            <button
              type="button"
              onClick={onNavigateToDashboard}
              className="flex-1 py-2.5 sm:py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-950/40 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>צפה במפת הקונצנזוס העירונית</span>
            </button>

            {/* Conditional Secondary CTA: Visible ONLY if unvotedCommunity.length > 0 */}
            {unvotedCommunity.length > 0 && (
              <button
                type="button"
                onClick={() => setViewingCommunityTier(true)}
                className="flex-1 py-2.5 sm:py-3 px-4 rounded-xl bg-purple-600/90 hover:bg-purple-600 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer border border-purple-400/30"
              >
                <Sparkles className="w-4 h-4 text-purple-200 shrink-0" />
                <span>המשך להצבעה על רעיונות תושבים ({unvotedCommunity.length} חדשים)</span>
              </button>
            )}
          </div>
        </div>

        {/* PROPOSAL BOX: Positioned immediately under Hero Status Card */}
        {renderSuggestionBox()}

        {/* COLLAPSED ACCORDIONS AT BOTTOM */}
        {/* Accordion 1: My Votes */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
          <button
            type="button"
            onClick={() => setVotesAccordionOpen(!votesAccordionOpen)}
            className="w-full px-4 sm:px-5 py-3 flex items-center justify-between text-right text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <RotateCcw className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="truncate">ההצבעות וההיגדים בזירה זו ({approvedStatements.length} היגדים)</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {unvotedCommunity.length > 0 && (
                <span className="text-[10px] sm:text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded-full animate-pulse border border-purple-300 dark:border-purple-800">
                  {unvotedCommunity.length} חדשים להצבעה
                </span>
              )}
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                הצבעת על {totalVotedCount} מתוך {approvedStatements.length}
              </span>
              {votesAccordionOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </button>

          {votesAccordionOpen && renderVotesList()}
        </div>

        {/* Accordion 2: Only show historical arenas IF the resident actually voted in them */}
        {historicalVotedTopics.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
            <button
              type="button"
              onClick={() => setTopicsAccordionOpen(!topicsAccordionOpen)}
              className="w-full px-4 sm:px-5 py-3 flex items-center justify-between text-right text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <RotateCcw className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="truncate">זירות היסטוריות שהצבעת בהן</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {historicalVotedTopics.length} זירות
                </span>
                {topicsAccordionOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>

            {topicsAccordionOpen && renderHistoricalTopicsList()}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 2. ACTIVE VOTER STATE (Core Voting or Dynamic Community Card Voting)
  // =========================================================================
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      
      {/* Back to Pitch Deck button if launched from pitch */}
      {onReturnToPitch && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 shadow-xs">
          <div className="text-xs font-bold text-amber-950 dark:text-amber-200">
            אתה צופה בווידג'ט ההצבעה החי של "המצפן העירוני"
          </div>
          <a
            href="/pitch.html"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs shadow-xs transition"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>חזור לדף הנחיתה ↩️</span>
          </a>
        </div>
      )}

      {/* Community Tier Voting Return Header */}
      {viewingCommunityTier && unvotedCommunity.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-950 dark:text-purple-200">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>שלב רעיונות התושבים (היגד {communityVotedCount + 1} מתוך {communityTotal})</span>
          </div>
          <button
            type="button"
            onClick={() => setViewingCommunityTier(false)}
            className="flex items-center gap-1 px-3 py-1 rounded-xl font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs shadow-2xs border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <span>חזרה לסיכום</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ARENA SWITCHER: Only visible when there are MULTIPLE live topics and not viewing community tier */}
      {!viewingCommunityTier && hasMultipleLiveTopics && onSelectTopic && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                <Compass className="w-4 h-4" />
              </span>
              <h2 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                זירות דיון ומשאלי עמדות פעילים באילת
              </h2>
            </div>
            {hasParallelSpecial && (
              <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800 flex items-center gap-1 animate-pulse">
                <span>⚡ משאל בזק שלא מן המניין פועל במקביל!</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Weekly Topic Card */}
            {activeWeeklyTopic && (
              <button
                type="button"
                onClick={() => onSelectTopic(activeWeeklyTopic.id)}
                className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  topic.id === activeWeeklyTopic.id
                    ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-500 shadow-md ring-2 ring-blue-400/50'
                    : 'bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 opacity-80 hover:opacity-100'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                      <span>📅 המשאל השבועי המרכזי</span>
                    </span>
                    {topic.id === activeWeeklyTopic.id ? (
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full shadow-2xs border border-blue-200 dark:border-blue-800">
                        מוצג כעת ✓
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 hover:text-blue-600">
                        לחץ להצבעה ↗
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    {activeWeeklyTopic.title}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
                  <span>{activeWeeklyTopic.organization}</span>
                  <span>{activeWeeklyTopic.stats?.totalVotes || 0} הצבעות</span>
                </div>
              </button>
            )}

            {/* 2. Special Topics Cards */}
            {activeSpecialTopics.map(spec => (
              <button
                key={spec.id}
                type="button"
                onClick={() => onSelectTopic(spec.id)}
                className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  topic.id === spec.id
                    ? 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-500 shadow-md ring-2 ring-purple-400/50'
                    : 'bg-purple-50/30 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/60 hover:border-purple-300 opacity-85 hover:opacity-100'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-800 flex items-center gap-1">
                      <span>⚡ משאל שלא מן המניין (בזק)</span>
                    </span>
                    {topic.id === spec.id ? (
                      <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full shadow-2xs border border-purple-200 dark:border-purple-800">
                        מוצג כעת ✓
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-purple-600 hover:underline">
                        הצבע במשאל זה ↗
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    {spec.title}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-medium flex items-center justify-between pt-2 border-t border-purple-100 dark:border-purple-950">
                  <span>{spec.organization}</span>
                  <span>{spec.stats?.totalVotes || 0} הצבעות</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PROMINENT POLL TOPIC BANNER: Visible for core voters */}
      {!viewingCommunityTier && (
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-7 shadow-lg border border-blue-800/40 space-y-3 text-center sm:text-right">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <img src="/favicon.svg" alt="המצפן האילתי" className="w-5 h-5 rounded-md shadow-xs shrink-0" />
              {topic.topic_type === 'special' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-purple-400 text-slate-950 shadow-xs flex items-center gap-1">
                  <span>⚡ משאל שלא מן המניין</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-400 text-slate-950 shadow-xs flex items-center gap-1">
                  <span>📅 המשאל השבועי המרכזי</span>
                </span>
              )}
              <span className="text-xs text-blue-200 font-bold">
                {topic.organization}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {closingInfo && (
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-xs ${
                  isClosed
                    ? 'bg-rose-500 text-white'
                    : 'bg-white/15 text-slate-200 backdrop-blur-xs'
                }`}>
                  <Clock className="w-3 h-3 text-amber-300" />
                  <span>{isClosed ? `המשאל נסגר (${closingInfo.formatted})` : `מועד סגירה: ${closingInfo.formatted}`}</span>
                </span>
              )}
              <span className="text-[11px] text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                {statements.length} היגדים להצבעה
              </span>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-tight tracking-tight pt-1">
            {topic.title}
          </h1>

          {topic.subtitle && (
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal pt-0.5 max-w-3xl mx-auto sm:mx-0">
              {topic.subtitle}
            </p>
          )}
        </div>
      )}

      {/* Closed Poll Alert Banner */}
      {isClosed && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-900/70 text-rose-950 dark:text-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-200 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-sm sm:text-base text-rose-950 dark:text-rose-200">
                משאל זה נסגר להצבעות
              </div>
              <div className="text-xs sm:text-sm text-rose-800 dark:text-rose-300/90 mt-0.5">
                מועד סגירת המשאל חלף ({closingInfo?.formatted}). לא ניתן להוסיף הצבעות או להגיש היגדים חדשים.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onNavigateToDashboard}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-sm transition whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5 cursor-pointer"
          >
            <span>צפה במפת ההסכמות 📊</span>
          </button>
        </div>
      )}

      {/* STAKEHOLDER GROUP SELECTOR & ANONYMITY BADGE: Visible for core voters */}
      {!viewingCommunityTier && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                ההשתתפות אנונימית • בחר/י את נקודת המבט שלך בסוגיה:
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                באיזה כובע את/ה מצביע/ה בדיון זה?
              </h2>
            </div>
            {isGroupLocked ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-full text-xs font-semibold self-start sm:self-auto border border-amber-200 dark:border-amber-800">
                <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>כובע מגזרי נעול (הצבעתך החלה)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-full text-xs font-semibold self-start sm:self-auto border border-blue-100 dark:border-blue-900/60">
                <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>ללא צורך בהרשמה</span>
              </div>
            )}
          </div>

          {/* Group Pill Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {topic.groups.map(g => {
              const isSelected = g.id === currentGroup;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    if (isGroupLocked && g.id !== currentGroup) {
                      alert('הכובע המגזרי נעול עבור משאל זה לאחר תחילת ההצבעה, כדי להבטיח את אמינות המדד הסטטיסטי.');
                      return;
                    }
                    onChangeGroup(g.id);
                  }}
                  disabled={isGroupLocked && !isSelected}
                  className={`p-3 rounded-xl border-2 text-right transition-all flex items-center justify-between ${
                    isSelected 
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 shadow-sm ring-2 ring-blue-100 dark:ring-blue-900/50' 
                      : isGroupLocked 
                      ? 'border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/30 text-slate-400 opacity-60 cursor-not-allowed'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span 
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs" 
                      style={{ backgroundColor: g.color }}
                    />
                    <span className={`text-sm ${isSelected ? 'font-black text-blue-950 dark:text-blue-200' : 'font-medium'}`}>
                      {g.label}
                    </span>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* PROGRESS BAR & TIER INDICATOR */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1.5">
          <div className="flex items-center gap-2 font-bold">
            {!isSeedComplete ? (
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 flex items-center gap-1 border border-blue-200 dark:border-blue-800">
                <span>שאלון ליבה מחייב:</span>
                <span>היגד {Math.min(seedVotedCount + 1, 8)} מתוך 8 היגדי ברזל</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 flex items-center gap-1 border border-purple-200 dark:border-purple-800">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>שלב 2: עד 7 היגדי קהילה מובילים (רשות - ניתן לסיים בכל עת)</span>
              </span>
            )}
          </div>
          <div className="font-semibold text-slate-500 dark:text-slate-400">
            {!isSeedComplete ? (
              <span>הצבעת על {seedVotedCount} מתוך {seedTotal} היגדי ליבה ({seedProgressPercent}%)</span>
            ) : (
              <span>הצבעת על {communityVotedCount} מתוך {communityTotal} היגדי קהילה נבחרים</span>
            )}
          </div>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ease-out ${
              !isSeedComplete 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600' 
                : 'bg-gradient-to-r from-purple-600 to-emerald-500'
            }`}
            style={{ 
              width: `${!isSeedComplete 
                ? seedProgressPercent 
                : (communityTotal > 0 ? Math.round((communityVotedCount / communityTotal) * 100) : 100)}%` 
            }}
          />
        </div>
      </div>

      {/* Real-time Confirmation Toast / Micro-Insight */}
      {microInsight && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150 shadow-xs">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>ההצבעה נקלטה בהצלחה! {microInsight.text}</span>
        </div>
      )}

      {/* TINDER / POLIS STYLE VOTING CARD */}
      {currentStatement && (
        <div 
          key={currentStatement.id} 
          className={`bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-md border relative overflow-hidden transition-all animate-in fade-in slide-in-from-right-3 duration-150 ${
            isCurrentTierSeed 
              ? 'border-slate-200 dark:border-slate-800' 
              : 'border-purple-200 dark:border-purple-900/60 ring-2 ring-purple-100 dark:ring-purple-950/40'
          }`}
        >
          {/* Card Top Pill */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-5">
            {isCurrentTierSeed ? (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-lg font-black border border-blue-200 dark:border-blue-800/60 flex items-center gap-1">
                  <span>🔒 היגד {seedVotedCount + 1} מתוך 8 (שאלון ליבה)</span>
                </span>
                <span className="text-slate-400 font-medium hidden sm:inline">(כ-60 שניות סה"כ)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 rounded-lg font-black border border-purple-200 dark:border-purple-800/60 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>היגד קהילה {communityVotedCount + 1} מתוך {communityTotal}</span>
                </span>
                <span className="text-purple-600 dark:text-purple-400 font-bold hidden sm:inline">(שלב 2: רשות)</span>
              </div>
            )}

            <div>
              {isCurrentTierSeed ? (
                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium">
                  נותרו עוד {unvotedSeed.length} שאלות ברזל
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onNavigateToDashboard}
                  className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <span>סיום ומעבר לתוצאות 📊</span>
                </button>
              )}
            </div>
          </div>

          {/* Statement Text */}
          <div className="min-h-[140px] flex items-center justify-center text-center px-2 py-4">
            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 leading-relaxed max-w-2xl">
              "{currentStatement.text}"
            </p>
          </div>

          {/* Action Buttons: Agree, Disagree, Pass */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3.5 border-t border-slate-100 dark:border-slate-800">
            {/* Agree Button */}
            <button
              type="button"
              onClick={() => handleVote(currentStatement!.id, 1)}
              disabled={isClosed}
              className={`flex flex-col sm:flex-row items-center justify-center text-center gap-1.5 sm:gap-2 py-3.5 sm:py-4 px-1.5 sm:px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-base shadow-md shadow-emerald-700/20 transition cursor-pointer select-none group ${isClosed ? 'opacity-40 cursor-not-allowed' : ''}`}
              title={isClosed ? 'המשאל נסגר להצבעות' : ''}
            >
              <ThumbsUp className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" />
              <span className="leading-tight">מסכים</span>
              <span className="hidden lg:inline text-[11px] opacity-75 font-normal mr-1">
                (חץ ימין)
              </span>
            </button>

            {/* Disagree Button */}
            <button
              type="button"
              onClick={() => handleVote(currentStatement!.id, -1)}
              disabled={isClosed}
              className={`flex flex-col sm:flex-row items-center justify-center text-center gap-1.5 sm:gap-2 py-3.5 sm:py-4 px-1.5 sm:px-3 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs sm:text-base shadow-md shadow-rose-700/20 transition cursor-pointer select-none group ${isClosed ? 'opacity-40 cursor-not-allowed' : ''}`}
              title={isClosed ? 'המשאל נסגר להצבעות' : ''}
            >
              <ThumbsDown className="w-5 h-5 group-hover:scale-110 transition-transform shrink-0" />
              <span className="leading-tight">לא מסכים</span>
              <span className="hidden lg:inline text-[11px] opacity-75 font-normal mr-1">
                (חץ שמאל)
              </span>
            </button>

            {/* Pass / Neutral Button */}
            <button
              type="button"
              onClick={() => handleVote(currentStatement!.id, 0)}
              disabled={isClosed}
              className={`flex flex-col sm:flex-row items-center justify-center text-center gap-1.5 sm:gap-2 py-3.5 sm:py-4 px-1.5 sm:px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-base transition cursor-pointer select-none group ${isClosed ? 'opacity-40 cursor-not-allowed' : ''}`}
              title={isClosed ? 'המשאל נסגר להצבעות' : ''}
            >
              <SkipForward className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:scale-110 transition-transform shrink-0" />
              <span className="leading-tight">מדלג / ניטרלי</span>
              <span className="hidden lg:inline text-[11px] text-slate-400 dark:text-slate-500 font-normal mr-1">
                (רווח)
              </span>
            </button>
          </div>
        </div>
      )}

      {/* COLLAPSIBLE PREVIOUS VOTES (CHANGE VOTE ANYTIME) */}
      {(totalVotedCount > 0 || approvedStatements.length > 0) && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
          <button
            type="button"
            onClick={() => setVotesAccordionOpen(!votesAccordionOpen)}
            className="w-full px-5 py-3.5 flex items-center justify-between text-right text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <RotateCcw className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="truncate">ההצבעות וההיגדים בזירה זו ({approvedStatements.length} היגדים)</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {unvotedCommunity.length > 0 && (
                <span className="text-[10px] sm:text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950 px-2 py-0.5 rounded-full animate-pulse border border-purple-300 dark:border-purple-800">
                  {unvotedCommunity.length} חדשים להצבעה
                </span>
              )}
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                הצבעת על {totalVotedCount} מתוך {approvedStatements.length}
              </span>
              {votesAccordionOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
          </button>

          {votesAccordionOpen && renderVotesList()}
        </div>
      )}

      {/* ADD NEW STATEMENT WITH AI GUARDRAIL */}
      {renderSuggestionBox()}

    </div>
  );
};
