import React, { useState } from 'react';
import type { TopicAnalytics } from '../types';
import { 
  Users, 
  Vote, 
  GitMerge, 
  TrendingUp, 
  Sparkles, 
  AlertTriangle, 
  BarChart2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';

interface ConsensusDashboardProps {
  analytics: TopicAnalytics;
  onRefresh: () => void;
  onNavigateToVote: () => void;
  onNavigateToReport?: () => void;
}

export const ConsensusDashboard: React.FC<ConsensusDashboardProps> = ({
  analytics,
  onNavigateToReport
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'bridging' | 'divisive'>('all');
  const [searchQuery] = useState('');

  const { topic, meta, statements, topBridging, topDivisive } = analytics;
  const groups = topic.groups || [];

  // Filter statements according to tab and search
  const filteredStatements = statements.filter(st => {
    if (filterMode === 'bridging' && !st.isBridging) return false;
    if (filterMode === 'divisive' && !st.isDivisive) return false;
    if (searchQuery.trim() && !st.text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Prepare data for Recharts multi-group comparison
  const chartData = statements.slice(0, 8).map(st => {
    const item: any = {
      name: `היגד #${st.id}`,
      fullText: st.text,
      overall: st.votesSummary?.overallSupportPercent || 0
    };

    if (st.groupBreakdown) {
      for (const g of groups) {
        item[g.label] = st.groupBreakdown[g.id]?.supportPercent || 0;
      }
    }
    return item;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
      
      {/* 1. KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Participants */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs sm:text-sm font-bold">משתתפים ייחודיים</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {meta.totalParticipants}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">מכלל קבוצות הזיקה</div>
        </div>

        {/* Total Votes */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs sm:text-sm font-bold">סך הצבעות שנקלטו</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Vote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {meta.totalVotesCast}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">ממוצע {(meta.totalVotesCast / (meta.totalParticipants || 1)).toFixed(1)} לאדם</div>
        </div>

        {/* Bridging Statements Found */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs sm:text-sm font-bold">הצהרות גשר (קונצנזוס)</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <GitMerge className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {meta.bridgingStatementsCount}
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">פתרונות מוסכמים חוצי-מחנות</div>
        </div>

        {/* Consensus Index */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs sm:text-sm font-bold">מדד קונצנזוס כללי</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {meta.consensusIndex}%
          </div>
          <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">מדד התלכדות הסכמות</div>
        </div>
      </div>

      {/* 2. SECTION A: TOP BRIDGING STATEMENTS (הצהרות הגשר המובילות) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                הצהרות הגשר המובילות (Top Bridging Statements)
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                פתרונות שזכו לתמיכה גבוהה בכל הקבוצות בנפרד (מעל 60% הסכמה בכל מחנה עם פער קטן)
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {topBridging.slice(0, 3).map((st, idx) => (
            <div 
              key={st.id} 
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 shadow-sm border-2 border-emerald-500/40 dark:border-emerald-500/50 hover:border-emerald-500 transition space-y-4 relative overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 font-black text-xs">
                    גשר #{idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">היגד #{st.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                    ציון גשר: {st.bridgingScore}%
                  </span>
                  <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold">
                    תמיכה כוללת: {st.votesSummary?.overallSupportPercent}%
                  </span>
                </div>
              </div>

              {/* Statement Text */}
              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                "{st.text}"
              </p>

              {/* Multi-Group Horizontal Breakdown Bars */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  שיעור התמיכה לפי קבוצות זיקה:
                </div>
                {groups.map(g => {
                  const gData = st.groupBreakdown?.[g.id] || { agree: 0, disagree: 0, pass: 0, supportPercent: 0 };
                  const supportPct = gData.supportPercent || 0;
                  return (
                    <div key={g.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                          <span>{g.label}</span>
                        </div>
                        <span className="font-black text-slate-900 dark:text-white">{supportPct}% תמיכה</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${supportPct}%`,
                            backgroundColor: g.color 
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. SECTION B: DIVISIVE / POLARIZING STATEMENTS (סלעי המחלוקת) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              סלעי המחלוקת (Divisive Statements)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              היגדים שבהם נרשמו פערי עמדות חדים בין הקבוצות — מוקדי החיכוך שדורשים גישור ומדיניות מאוזנת
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topDivisive.slice(0, 2).map((st, idx) => (
            <div 
              key={st.id} 
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-amber-300 dark:border-amber-700/60 hover:border-amber-400 transition space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 font-bold">
                  סלע מחלוקת #{idx + 1}
                </span>
                <span className="font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-900/60">
                  מדד קיטוב: {st.divisiveScore}%
                </span>
              </div>

              <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug">
                "{st.text}"
              </p>

              {/* Group diverging visual */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {groups.map(g => {
                  const gData = st.groupBreakdown?.[g.id] || { supportPercent: 0 };
                  return (
                    <div key={g.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                        <span>{g.label}</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">{gData.supportPercent}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. SECTION C: MULTI-GROUP OPINION LANDSCAPE CHART */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              השוואת עמדות הקבוצות בכל ההיגדים (Opinion Landscape)
            </h3>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            אחוז תמיכה בכל היגד לפי קבוצת זיקה
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.25} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} unit="%" />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 dark:bg-slate-950 text-white p-3.5 rounded-xl shadow-xl text-xs max-w-xs space-y-1.5 border border-slate-800">
                        <div className="font-bold text-amber-300">{label}</div>
                        <div className="text-slate-300 font-medium line-clamp-2">"{data.fullText}"</div>
                        <div className="pt-1.5 border-t border-slate-800 space-y-1">
                          {payload.map((entry: any, i: number) => (
                            <div key={i} className="flex justify-between gap-4">
                              <span style={{ color: entry.color }}>{entry.name}:</span>
                              <span className="font-bold">{entry.value}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              {groups.map(g => (
                <Bar key={g.id} dataKey={g.label} fill={g.color} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 5. ALL STATEMENTS TABLE / LIST WITH FILTER & SEARCH */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              כלל ההיגדים וההצעות בזירה ({filteredStatements.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">פירוט מלא של כל ההיגדים, נתוני ההצבעה וציוני ההסכמה</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto text-xs font-bold">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterMode === 'all' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              הכל ({statements.length})
            </button>
            <button
              onClick={() => setFilterMode('bridging')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterMode === 'bridging' 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              הצהרות גשר ({statements.filter(s => s.isBridging).length})
            </button>
            <button
              onClick={() => setFilterMode('divisive')}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterMode === 'divisive' 
                  ? 'bg-amber-600 text-white shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              סלעי מחלוקת ({statements.filter(s => s.isDivisive).length})
            </button>
          </div>
        </div>

        {/* Statements List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800 space-y-3">
          {filteredStatements.map(st => (
            <div key={st.id} className="pt-3 pb-2 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-400 dark:text-slate-500">#{st.id}</span>
                  {st.isBridging && (
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      הצהרת גשר
                    </span>
                  )}
                  {st.isDivisive && (
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      סלע מחלוקת
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-3">
                  <span>תמיכה כללית: {st.votesSummary?.overallSupportPercent}%</span>
                  <span>סך קולות: {st.votesSummary?.total}</span>
                </div>
              </div>

              <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 leading-snug">
                {st.text}
              </p>

              {/* Support Percent Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs text-slate-600 dark:text-slate-400">
                {groups.map(g => {
                  const gPct = st.groupBreakdown?.[g.id]?.supportPercent || 0;
                  return (
                    <div key={g.id} className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                        <span className="truncate">{g.label}</span>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white shrink-0">{gPct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action: Generate Press Article Banner (At the bottom after all statements) */}
      {onNavigateToReport && (
        <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-950 border border-purple-500/40 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-right">
            <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-300 text-xl shrink-0">
              📰
            </div>
            <div>
              <div className="text-sm sm:text-base font-black text-white flex items-center gap-2 justify-center sm:justify-start">
                <span>מעוניינים לפרסם את ממצאי הקונצנזוס בעיתון?</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200">AI Draft</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">הפיקו טיוטת כתבה עיתונאית מלאה עם כותרת, ניתוח נתונים ופתרונות מוסכמים בלחיצת כפתור אחת.</p>
            </div>
          </div>
          <button
            onClick={onNavigateToReport}
            className="shrink-0 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>הכנת כתבה בלחיצת כפתור 📰</span>
            <span>←</span>
          </button>
        </div>
      )}

    </div>
  );
};
