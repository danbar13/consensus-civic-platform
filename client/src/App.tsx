import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Topic, Statement, TopicAnalytics } from './types';
import { fetchTopics, fetchAnalytics, fetchStatements, fetchUserVotes } from './api';
import { getOrCreateSessionId, getSavedGroup, saveGroup } from './session';
import { Header } from './components/Header';
import { VoteView } from './components/VoteView';
import { ConsensusDashboard } from './components/ConsensusDashboard';
import { AIReportView } from './components/AIReportView';
import { AdminView } from './components/AdminView';
import { EmbedModal } from './components/EmbedModal';
import { PitchDeckView } from './components/PitchDeckView';

export function App() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [activeTab, setActiveTab] = useState<'vote' | 'dashboard' | 'report' | 'admin' | 'pitch'>(() => {
    if (typeof window === 'undefined') return 'vote';
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab === 'dashboard' || tab === 'report' || tab === 'admin' || tab === 'vote') {
      return tab;
    }
    return 'vote';
  });
  const [analytics, setAnalytics] = useState<TopicAnalytics | null>(null);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [userVotes, setUserVotes] = useState<Record<number, { vote: number; group_id: string }>>({});
  const [currentGroup, setCurrentGroup] = useState<string>('residents');
  const [sessionId, setSessionId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [embedModalOpen, setEmbedModalOpen] = useState<boolean>(false);

  // Dark Mode State with URL parameter, LocalStorage persistence and system preference fallback
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const themeParam = urlParams.get('theme');
    if (themeParam === 'dark') return true;
    if (themeParam === 'light') return false;

    const saved = localStorage.getItem('consensus_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply dark mode class to <html> root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('consensus_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('consensus_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // Check URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const isEmbed = urlParams.get('embed') === 'true';
  const initialTopicSlug = urlParams.get('topic') || 'eilat-parking';
  const initialTabParam = urlParams.get('tab');
  const isPitchParam = urlParams.get('pitch') === 'true';

  // Check if arrived from pitch/landing page
  const [showReturnToPitch] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const p = new URLSearchParams(window.location.search);
    const fromParam = p.get('from');
    if (fromParam === 'pitch' || fromParam === 'landing') {
      try { sessionStorage.setItem('consensus_from_pitch', 'true'); } catch (e) {}
      return true;
    }
    if (document.referrer && (document.referrer.includes('/pitch') || document.referrer.includes('/landing'))) {
      try { sessionStorage.setItem('consensus_from_pitch', 'true'); } catch (e) {}
      return true;
    }
    if (document.referrer && !document.referrer.includes(window.location.host)) {
      try { sessionStorage.removeItem('consensus_from_pitch'); } catch (e) {}
      return false;
    }
    try {
      return sessionStorage.getItem('consensus_from_pitch') === 'true';
    } catch (e) {
      return false;
    }
  });

  // Initialize session and topics on mount
  useEffect(() => {
    const sid = getOrCreateSessionId();
    setSessionId(sid);

    if (isPitchParam || initialTabParam === 'pitch') {
      window.location.replace('/pitch.html');
      return;
    }

    // If visiting the root URL without specific parameters and not from pitch, redirect to the pitch landing page
    if (!urlParams.get('tab') && !urlParams.get('embed') && !urlParams.get('topic') && !urlParams.get('pitch') && urlParams.get('from') !== 'pitch') {
      window.location.replace('/pitch.html');
      return;
    }

    async function init() {
      try {
        const allTopics = await fetchTopics();
        setTopics(allTopics);

        // Find initial topic or fallback to first
        const selected = allTopics.find(t => t.id === initialTopicSlug || t.slug === initialTopicSlug) || allTopics[0];
        if (selected) {
          setCurrentTopic(selected);
          const savedGrp = getSavedGroup(selected.id, selected.groups[0]?.id || 'residents');
          setCurrentGroup(savedGrp);
          await loadTopicData(selected.id, sid);
        }
      } catch (err) {
        console.error('Error initializing app:', err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  const loadTopicData = async (topicId: string, sid: string) => {
    try {
      const [analyticsData, statementsData, votesData] = await Promise.all([
        fetchAnalytics(topicId),
        fetchStatements(topicId),
        fetchUserVotes(topicId, sid)
      ]);
      setAnalytics(analyticsData);
      setStatements(statementsData);
      setUserVotes(votesData);
    } catch (err) {
      console.error('Error loading topic data:', err);
    }
  };

  const handleSelectTopic = async (topicId: string) => {
    const t = topics.find(item => item.id === topicId);
    if (!t) return;
    setCurrentTopic(t);
    const grp = getSavedGroup(t.id, t.groups[0]?.id || 'residents');
    setCurrentGroup(grp);
    setLoading(true);
    await loadTopicData(t.id, sessionId);
    setLoading(false);

    // Update URL query without full reload
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('topic', t.id);
    window.history.pushState({}, '', newUrl.toString());
  };

  const handleChangeGroup = (groupId: string) => {
    if (!currentTopic) return;
    setCurrentGroup(groupId);
    saveGroup(currentTopic.id, groupId);
  };

  const handleVoteCast = async (statementId: number, voteVal: number) => {
    setUserVotes(prev => ({
      ...prev,
      [statementId]: { vote: voteVal, group_id: currentGroup }
    }));

    // Soft refresh analytics in background
    if (currentTopic) {
      fetchAnalytics(currentTopic.id).then(a => setAnalytics(a)).catch(console.error);
    }
  };

  const handleStatementAdded = (newSt: Statement) => {
    setStatements(prev => [...prev, newSt]);
    if (currentTopic) {
      fetchAnalytics(currentTopic.id).then(a => setAnalytics(a)).catch(console.error);
    }
  };

  if (loading && !currentTopic) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-slate-900 text-white">
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <div className="text-lg font-black tracking-wide">טוען את פלטפורמת הקונצנזוס...</div>
        <div className="text-xs text-slate-400">המצפן העירוני | ערב ערב באילת</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Global Header */}
      <Header
        currentTopic={currentTopic}
        topics={topics}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onSelectTopic={handleSelectTopic}
        onOpenNewTopic={() => setActiveTab('admin')}
        onOpenEmbed={() => setEmbedModalOpen(true)}
        isEmbed={isEmbed}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        showReturnToPitch={showReturnToPitch}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentTopic && analytics && (
          <>
            {activeTab === 'vote' && (
              <VoteView
                topic={currentTopic}
                statements={statements}
                userVotes={userVotes}
                currentGroup={currentGroup}
                sessionId={sessionId}
                onChangeGroup={handleChangeGroup}
                onVoteCast={handleVoteCast}
                onStatementAdded={handleStatementAdded}
                onNavigateToDashboard={() => setActiveTab('dashboard')}
                onReturnToPitch={showReturnToPitch ? () => setActiveTab('pitch') : undefined}
              />
            )}

            {activeTab === 'dashboard' && (
              <ConsensusDashboard
                analytics={analytics}
                onRefresh={() => currentTopic && loadTopicData(currentTopic.id, sessionId)}
                onNavigateToVote={() => setActiveTab('vote')}
                onNavigateToReport={() => setActiveTab('report')}
              />
            )}

            {activeTab === 'report' && (
              <AIReportView
                topic={currentTopic}
                analytics={analytics}
                darkMode={darkMode}
              />
            )}

            {activeTab === 'admin' && (
              <AdminView
                currentTopic={currentTopic}
                topics={topics}
                onTopicCreated={async newT => {
                  const all = await fetchTopics();
                  setTopics(all);
                  handleSelectTopic(newT.id);
                  setActiveTab('vote');
                }}
                onTopicUpdated={async updatedT => {
                  const all = await fetchTopics();
                  setTopics(all);
                  setCurrentTopic(updatedT);
                  if (sessionId) {
                    loadTopicData(updatedT.id, sessionId);
                  }
                }}
                onTopicDeleted={async deletedId => {
                  const all = await fetchTopics();
                  setTopics(all);
                  const remaining = all.filter(t => t.id !== deletedId);
                  if (remaining.length > 0) {
                    handleSelectTopic(remaining[0].id);
                  }
                }}
                onStatementsChanged={() => currentTopic && loadTopicData(currentTopic.id, sessionId)}
                onSelectTopic={handleSelectTopic}
                onReturnToPitch={showReturnToPitch ? () => setActiveTab('pitch') : undefined}
                onNavigateToReport={() => setActiveTab('report')}
              />
            )}

            {activeTab === 'pitch' && (
              <PitchDeckView
                onNavigateToAdmin={() => setActiveTab('admin')}
                onNavigateToWidget={() => setActiveTab('vote')}
                darkMode={darkMode}
              />
            )}
          </>
        )}
      </main>

      {/* Embed Code Modal */}
      <EmbedModal
        topic={currentTopic}
        isOpen={embedModalOpen}
        onClose={() => setEmbedModalOpen(false)}
        darkMode={darkMode}
      />

      {/* Footer */}
      {!isEmbed && (
        <footer className="bg-slate-900 dark:bg-slate-950 text-slate-400 text-xs py-10 border-t border-slate-800 transition-colors">
          <div className="max-w-7xl mx-auto px-4 text-center space-y-4">
            
            {/* YomYom Logo in Footer */}
            <div className="flex items-center justify-center gap-3">
              <a 
                href="https://www.yomyom.net/" 
                target="_blank" 
                rel="noreferrer"
                className="inline-block hover:opacity-90 transition"
              >
                <img 
                  src="/images/yomyom-logo-white.png" 
                  alt="יום יום באילת | ערב ערב באילת" 
                  className="h-9 w-auto object-contain mx-auto"
                />
              </a>
            </div>

            <div className="flex items-center justify-center gap-2 text-slate-300 font-bold flex-wrap">
              <span>קונצנזוס – מערכת משאלים, גישור ושיתוף ציבור חכם</span>
              <span>•</span>
              <span className="text-amber-400">המצפן העירוני | ערב ערב באילת (yomyom.net)</span>
            </div>

            <p className="text-slate-500 max-w-xl mx-auto leading-relaxed">
              פותח בהשראת עקרונות הדמוקרטיה החישובית של Polis ו-Talk to the City, בשילוב מנגנון גישור לשון הרע ומחולל דוחות מבוסס AI.
            </p>

            <div className="pt-1">
              <button
                onClick={() => setActiveTab('pitch')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition shadow-sm"
              >
                <span>הצעה אסטרטגית למערכת "ערב ערב באילת" 💼</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-600 pt-2">
              כל ההצבעות נשמרות באופן אנונימי מבוסס מזהה סשן בלבד, ללא מעקב אישי או מסירת פרטים מזהים.
            </div>
          </div>
        </footer>
      )}

    </div>
  );
}

export default App;
