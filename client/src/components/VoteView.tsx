import React, { useState, useEffect } from 'react';
import type { Topic, Statement } from '../types';
import { submitVote, submitStatement } from '../api';
import { getDeviceFingerprint } from '../session';
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
  BarChart3
} from 'lucide-react';

interface VoteViewProps {
  topic: Topic;
  statements: Statement[];
  userVotes: Record<number, { vote: number; group_id: string }>;
  currentGroup: string;
  sessionId: string;
  onChangeGroup: (groupId: string) => void;
  onVoteCast: (statementId: number, voteVal: number, microInsight?: any) => void;
  onStatementAdded: (statement: Statement) => void;
  onNavigateToDashboard: () => void;
  onReturnToPitch?: () => void;
}

export const VoteView: React.FC<VoteViewProps> = ({
  topic,
  statements,
  userVotes,
  currentGroup,
  sessionId,
  onChangeGroup,
  onVoteCast,
  onStatementAdded,
  onNavigateToDashboard,
  onReturnToPitch
}) => {
  const [microInsight, setMicroInsight] = useState<{ text: string; percent: number } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

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

      {/* 0. PROMINENT POLL TOPIC BANNER */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-7 shadow-lg border border-blue-800/40 space-y-3 text-center sm:text-right">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="המצפן האילתי" className="w-5 h-5 rounded-md shadow-xs shrink-0" />
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-400 text-slate-950 shadow-xs">
              נושא המשאל
            </span>
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
            onClick={onNavigateToDashboard}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-sm transition whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5"
          >
            <span>צפה במפת ההסכמות 📊</span>
          </button>
        </div>
      )}

      {/* 1. STAKEHOLDER GROUP SELECTOR & ANONYMITY BADGE */}
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

      {/* 2. PROGRESS BAR & TIER INDICATOR */}
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

      {/* 3. TINDER / POLIS STYLE VOTING CARD */}
      {currentStatement ? (
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
              onClick={() => handleVote(currentStatement.id, 1)}
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
              onClick={() => handleVote(currentStatement.id, -1)}
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
              onClick={() => handleVote(currentStatement.id, 0)}
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
      ) : isSeedComplete && !viewingCommunityTier ? (
        /* Milestone Card: Completed Phase 1 (8 Iron Statements) */
        <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl border border-emerald-500/40 text-center space-y-6 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-400/40 shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <span className="bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider">
              יעד הברזל הושלם בהצלחה
            </span>
            <h3 className="text-2xl sm:text-3xl font-black mt-3">
              מעולה! עמדתך נקלטה במדד הקונצנזוס העירוני 🎉
            </h3>
            <p className="text-slate-300 mt-2 max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
              השלמת את כל 8 היגדי הברזל המחייבים. כעת תוכל לבחור: לעבור ישירות לצפייה במפת הקונצנזוס, או להמשיך לשלב הרשות ולהשפיע על רעיונות שהעלו תושבים אחרים.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onNavigateToDashboard}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-emerald-950/50 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <BarChart3 className="w-5 h-5" />
              <span>צפה במפת הקונצנזוס העירונית</span>
            </button>

            {communityStatements.length > 0 && (
              <button
                onClick={() => setViewingCommunityTier(true)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-purple-950/50 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-5 h-5" />
                <span>המשך לשלב 2: רעיונות התושבים ({unvotedCommunity.length} זמינים) 💡</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Final Completion State: Completed both or finished browsing */
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 shadow-md border border-slate-200 dark:border-slate-800 text-center space-y-5 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              כל הכבוד! סיימת את ההצבעה בזירה זו 🏆
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mt-2 max-w-lg mx-auto text-sm sm:text-base">
              עמדתך נקלטה כחלק מקבוצת <span className="font-bold text-slate-900 dark:text-white" style={{ color: activeGroupObj.color }}>{activeGroupObj.label}</span> ומסייעת לאלגוריתם לחשב את נקודות ההסכמה בעיר.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onNavigateToDashboard}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>צפה במפת הקונצנזוס העירונית</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 4. COLLAPSIBLE PREVIOUS VOTES (CHANGE VOTE ANYTIME) */}
      {totalVotedCount > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="w-full px-5 py-3.5 flex items-center justify-between text-right text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>ההצבעות שלי בזירה זו ({totalVotedCount} היגדים) – ניתן לשנות בכל עת</span>
            </div>
            {historyOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>

          {historyOpen && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 p-4 pt-1 max-h-80 overflow-y-auto space-y-2">
              {approvedStatements
                .filter(s => userVotes[s.id] !== undefined)
                .map(st => {
                  const voteRecord = userVotes[st.id];
                  const currentVote = voteRecord.vote;

                  return (
                    <div key={st.id} className="pt-3 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200 flex-1 pl-2">
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-bold ml-1.5">#{st.id}</span>
                        {st.text}
                      </div>

                      {/* Vote Buttons Mini */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleVote(st.id, 1)}
                          disabled={isClosed}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
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
                          onClick={() => handleVote(st.id, -1)}
                          disabled={isClosed}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
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
                          onClick={() => handleVote(st.id, 0)}
                          disabled={isClosed}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
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
          )}
        </div>
      )}

      {/* 5. ADD NEW STATEMENT WITH AI GUARDRAIL & MEDIATOR */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
            <MessageSquarePlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              יש לך רעיון או הצעת פתרון שלא הופיעה כאן?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              נסח/י משפט קצר ומעשי. מנוע ה-AI יבדוק כפילות מול היגדים קיימים ואי-פגיעה בכללי השיח, וההצעה תתווסף ישירות לשלב רעיונות התושבים (שלב 2).
            </p>
          </div>
        </div>

        {/* Requirement 5: 48-Hour Submission Window check */}
        {isSubmissionsClosed ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 text-xs sm:text-sm font-semibold flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <div className="font-bold text-sm sm:text-base">שלב הוספת ההצעות הסתיים — כעת מצביעים על המאגר הסופי לקראת סגירת הגיליון</div>
              <div className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                {submissionsClosingInfo?.formatted 
                  ? `חלון 48 השעות הראשונות נסגר ב-${submissionsClosingInfo.formatted}. כעת מתקיימת הצבעה מרוכזת על כל ההיגדים לקראת ירידת העיתון לדפוס.`
                  : 'חלון 48 השעות הראשונות להעלאת הצעות תושבים נסגר. כעת מתקיימת הצבעה מרוכזת על כל ההיגדים שהתגבשו לקראת ירידת העיתון לדפוס.'}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Input Box */}
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
                rows={3}
                className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-950/50 outline-none text-sm sm:text-base leading-relaxed resize-none transition"
              />
              <div className="absolute bottom-3 left-3 text-xs font-semibold text-slate-400 dark:text-slate-500">
                <span className={newText.length > 120 ? 'text-amber-600 dark:text-amber-400 font-bold' : ''}>
                  {newText.length}
                </span>
                /140 תווים
              </div>
            </div>

            {/* Requirement 2: Smart AI Funnel Feedback Alerts */}
            {moderationFeedback && (
              <div className="space-y-3">
                
                {/* 1. Deduplication: Offer immediate vote on existing statement */}
                {moderationFeedback.isDuplicate && (
                  <div className="p-4 sm:p-5 rounded-2xl border-2 bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 text-purple-950 dark:text-purple-200 space-y-3 animate-in fade-in">
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm sm:text-base font-black flex items-center gap-1.5">
                          <span>הצעה דומה כבר קיימת במשאל — הצבע עליה כדי לחזק אותה!</span>
                        </div>
                        <p className="text-xs sm:text-sm mt-1 leading-relaxed opacity-90">
                          {moderationFeedback.reason || 'המערכת זיהתה רעיון דומה שכבר קיים במשאל. אין צורך לפתוח היגד כפול — הצבעתך תשפיע ישירות על ההיגד הקיים:'}
                        </p>
                      </div>
                    </div>

                    {(moderationFeedback.matchedStatement || moderationFeedback.similarStatement) && (
                      <div className="bg-white/95 dark:bg-slate-900/95 p-4 rounded-xl border border-purple-200 dark:border-purple-800 space-y-3 shadow-xs">
                        <div className="text-xs font-bold text-purple-700 dark:text-purple-300">
                          ההיגד הקיים במשאל:
                        </div>
                        <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                          "{moderationFeedback.matchedStatement?.text || moderationFeedback.similarStatement}"
                        </div>
                        <div className="pt-1 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500">הצבע/י עליו עכשיו:</span>
                          {moderationFeedback.matchedStatement && (
                            <>
                              <button
                                onClick={() => {
                                  handleVote(moderationFeedback.matchedStatement!.id, 1);
                                  setModerationFeedback(null);
                                  setNewText('');
                                  setSubmitSuccessMsg('הצבעתך בעד ההיגד הקיים נקלטה בהצלחה! ✓');
                                }}
                                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                                <span>מסכים</span>
                              </button>
                              <button
                                onClick={() => {
                                  handleVote(moderationFeedback.matchedStatement!.id, -1);
                                  setModerationFeedback(null);
                                  setNewText('');
                                  setSubmitSuccessMsg('הצבעתך נגד ההיגד הקיים נקלטה בהצלחה! ✓');
                                }}
                                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                                <span>מתנגד</span>
                              </button>
                              <button
                                onClick={() => {
                                  handleVote(moderationFeedback.matchedStatement!.id, 0);
                                  setModerationFeedback(null);
                                  setNewText('');
                                }}
                                className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <SkipForward className="w-3.5 h-3.5" />
                                <span>מדלג</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Reframing: Constructive suggestion requiring voter confirmation */}
                {moderationFeedback.suggestion && !moderationFeedback.isDuplicate && (
                  <div className="p-4 sm:p-5 rounded-2xl border-2 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200 space-y-3 animate-in fade-in">
                    <div className="flex items-start gap-2.5">
                      <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm sm:text-base font-black flex items-center gap-1.5">
                          <span>ניסוח מגשר ענייני (Smart Reframing)</span>
                        </div>
                        <p className="text-xs sm:text-sm mt-1 leading-relaxed opacity-90">
                          {moderationFeedback.reason || 'המערכת זיהתה רעיון ענייני לצד שפה מתלהמת או פוגענית. לפני שליחה, אנא אשרו את הניסוח המגשר הענייני:'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white/90 dark:bg-slate-900/90 p-4 rounded-xl border border-amber-200 dark:border-amber-800 space-y-2.5 shadow-xs">
                      <div className="text-xs font-bold text-amber-800 dark:text-amber-300">
                        הניסוח המוצע להצבעת הציבור:
                      </div>
                      <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                        "{moderationFeedback.suggestion}"
                      </div>
                      <div className="pt-2 flex flex-wrap gap-2">
                        <button
                          onClick={() => handleAddStatementSubmit(moderationFeedback.suggestion, true)}
                          disabled={isEvaluatingAI}
                          className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>אשר ושלח ניסוח זה לבדיקה ✓</span>
                        </button>
                        <button
                          onClick={() => {
                            setNewText(moderationFeedback.suggestion || '');
                            setModerationFeedback(null);
                          }}
                          className="px-3.5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition"
                        >
                          העתק לתיבה וערוך בעצמי
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Direct blocking of noise/curses/defamation */}
                {!moderationFeedback.passed && !moderationFeedback.suggestion && !moderationFeedback.isDuplicate && (
                  <div className="p-4 rounded-2xl border-2 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-950 dark:text-rose-200 space-y-1.5 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span className="font-bold text-sm">ההצעה נחסמה בהתאם לכללי השיח</span>
                    </div>
                    <p className="text-xs sm:text-sm text-rose-800 dark:text-rose-300 leading-relaxed pr-7">
                      {moderationFeedback.reason || 'שפה פוגענית, קללות, השמצות או שמות פרטיים אינן מותרות במשאל. אנא נסח/י את הצעתך מחדש באופן ענייני ומכבד.'}
                    </p>
                  </div>
                )}

              </div>
            )}

            {/* Success Toast */}
            {submitSuccessMsg && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{submitSuccessMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-right">
                ההצעה תתווסף תחת קבוצת: <span className="font-bold text-slate-800 dark:text-slate-200">{activeGroupObj.label}</span>
              </div>
              <button
                onClick={() => handleAddStatementSubmit()}
                disabled={isEvaluatingAI || newText.trim().length < 5}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isEvaluatingAI ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>בודק ב-AI...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>בדיקת ניסוח ושליחה</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>

    </div>
  );
};
