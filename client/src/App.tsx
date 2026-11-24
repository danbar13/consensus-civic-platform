import { useState, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import type { Topic, Statement, TopicAnalytics } from './types';
import { fetchTopics, fetchAnalytics, fetchStatements, fetchUserVotes, clearAdminToken } from './api';
import { getOrCreateSessionId, getSavedGroup, saveGroup } from './session';
import { getTopicLifecycle, sortTopicsByLifecycle, getDefaultTopic } from './topicLifecycle';
import { 
  DEFAULT_TOPIC, 
  DEFAULT_STATEMENTS, 
  DEFAULT_ANALYTICS,
  getCachedTopic,
  setCachedTopic,
  getCachedTopics,
  setCachedTopics,
  getCachedStatements,
  setCachedStatements,
  getCachedAnalytics,
  setCachedAnalytics
} from './defaultData';
import { Header } from './components/Header';
import { VoteView } from './components/VoteView';
import { ConsensusDashboard } from './components/ConsensusDashboard';
import { AIReportView } from './components/AIReportView';
import { AdminView } from './components/AdminView';
import { EmbedModal } from './components/EmbedModal';
import { PitchDeckView } from './components/PitchDeckView';
import { AccessibilityModal } from './components/AccessibilityModal';
import { AccessibilityToolbar } from './components/AccessibilityToolbar';
import { PrivacyModal } from './components/PrivacyModal';
import { TermsModal } from './components/TermsModal';

export function App() {
  // Check URL parameters
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const isEmbed = urlParams.get('embed') === 'true';
  const explicitTopicSlug = urlParams.get('topic');
  const initialTabParam = urlParams.get('tab');
  const isPitchParam = urlParams.get('pitch') === 'true';

  const cachedTopics = getCachedTopics();
  const sortedCachedTopics = cachedTopics ? sortTopicsByLifecycle(cachedTopics) : null;
  const initialDefaultTopic = sortedCachedTopics ? (getDefaultTopic(sortedCachedTopics) || sortedCachedTopics[0]) : DEFAULT_TOPIC;
  const initialTopic = (explicitTopicSlug ? (sortedCachedTopics?.find(t => t.id === explicitTopicSlug || t.slug === explicitTopicSlug) || getCachedTopic(explicitTopicSlug)) : null) || initialDefaultTopic || DEFAULT_TOPIC;

  const [topics, setTopics] = useState<Topic[]>(() => sortedCachedTopics || [DEFAULT_TOPIC]);
  const [currentTopic, setCurrentTopic] = useState<Topic>(() => initialTopic);
  const [activeTab, setActiveTab] = useState<'vote' | 'dashboard' | 'report' | 'admin' | 'pitch'>(() => {
    if (typeof window === 'undefined') return 'vote';
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab === 'dashboard' || tab === 'report' || tab === 'admin' || tab === 'vote') {
      return tab;
    }
    return 'vote';
  });
  const [analytics, setAnalytics] = useState<TopicAnalytics | null>(() => getCachedAnalytics(initialTopic.id) || DEFAULT_ANALYTICS);
  const [statements, setStatements] = useState<Statement[]>(() => getCachedStatements(initialTopic.id) || DEFAULT_STATEMENTS);
  const [userVotes, setUserVotes] = useState<Record<number, { vote: number; group_id: string }>>({});
  const [currentGroup, setCurrentGroup] = useState<string>(() => {
    return getSavedGroup(initialTopic.id, initialTopic.groups[0]?.id || 'residents');
  });
  const [sessionId, setSessionId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [embedModalOpen, setEmbedModalOpen] = useState<boolean>(false);
  const [accessibilityModalOpen, setAccessibilityModalOpen] = useState<boolean>(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState<boolean>(false);
  const [termsModalOpen, setTermsModalOpen] = useState<boolean>(false);

  // Scroll to top unconditionally on initial mount and when switching tabs or topics
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  useEffect(() => {
    // Only scroll to top when switching major tabs (not when updating topics inside admin)
    if (activeTab !== 'admin') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [activeTab]);

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

  const [triggerNewTopic, setTriggerNewTopic] = useState(false);

  // Initialize session and topics on mount
  useEffect(() => {
    const sid = getOrCreateSessionId();
    setSessionId(sid);

    if (isPitchParam || initialTabParam === 'pitch') {
      window.location.replace('/pitch.html');
      return;
    }

    async function init() {
      try {
        const allTopics = await fetchTopics();
        if (allTopics && allTopics.length > 0) {
          const sortedTopics = sortTopicsByLifecycle(allTopics);
          setTopics(sortedTopics);
          setCachedTopics(sortedTopics);

          // Find initial topic: prioritize explicit URL param, or default to live active topic
          const urlTopic = urlParams.get('topic');
          let selected = urlTopic 
            ? sortedTopics.find(t => t.id === urlTopic || t.slug === urlTopic) 
            : null;

          if (!selected) {
            selected = getDefaultTopic(sortedTopics) || sortedTopics[0];
          }

          if (selected) {
            setCurrentTopic(selected);
            setCachedTopic(selected);
            const savedGrp = getSavedGroup(selected.id, selected.groups[0]?.id || 'residents');
            setCurrentGroup(savedGrp);
            await loadTopicData(selected.id, sid);
          }
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
      setCachedAnalytics(topicId, analyticsData);
      setCachedStatements(topicId, statementsData);
    } catch (err) {
      console.error('Error loading topic data:', err);
    }
  };

  const handleSelectTopic = async (topicId: string) => {
    const t = topics.find(item => item.id === topicId);
    if (!t) return;
    setCurrentTopic(t);
    setCachedTopic(t);
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

  const analyticsTimerRef = useRef<any>(null);

  const handleVoteCast = (statementId: number, voteVal: number) => {
    setUserVotes(prev => ({
      ...prev,
      [statementId]: { vote: voteVal, group_id: currentGroup }
    }));

    // Debounce background analytics reload by 1500ms so voting runs with zero network contention
    if (analyticsTimerRef.current) {
      clearTimeout(analyticsTimerRef.current);
    }
    analyticsTimerRef.current = setTimeout(() => {
      if (currentTopic) {
        fetchAnalytics(currentTopic.id).then(a => setAnalytics(a)).catch(console.error);
      }
    }, 1500);
  };

  const handleStatementAdded = (newSt: Statement) => {
    setStatements(prev => [...prev, newSt]);
    if (currentTopic) {
      fetchAnalytics(currentTopic.id).then(a => setAnalytics(a)).catch(console.error);
    }
  };

  const handleSelectTab = (tab: 'vote' | 'dashboard' | 'report' | 'admin' | 'pitch') => {
    if (tab === 'admin') {
      // ברירת המחדל בהצגת זירה בניהול היא הזירה שבאוויר כרגע
      const currentLc = currentTopic ? getTopicLifecycle(currentTopic) : null;
      if (!currentLc || currentLc.status !== 'active') {
        const liveTopic = getDefaultTopic(topics);
        if (liveTopic && liveTopic.id !== currentTopic?.id) {
          handleSelectTopic(liveTopic.id);
        }
      }
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Global Header */}
      <Header
        currentTopic={currentTopic}
        topics={topics}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onSelectTopic={handleSelectTopic}
        onOpenNewTopic={() => {
          handleSelectTab('admin');
          setTriggerNewTopic(true);
        }}
        onOpenEmbed={() => setEmbedModalOpen(true)}
        onAdminLogout={() => {
          clearAdminToken();
          window.dispatchEvent(new Event('admin_auth_revoked'));
        }}
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
                topics={topics}
                statements={statements}
                userVotes={userVotes}
                currentGroup={currentGroup}
                sessionId={sessionId}
                onChangeGroup={handleChangeGroup}
                onVoteCast={handleVoteCast}
                onStatementAdded={handleStatementAdded}
                onSelectTopic={handleSelectTopic}
                onNavigateToDashboard={() => {
                  setActiveTab('dashboard');
                  if (currentTopic) {
                    fetchAnalytics(currentTopic.id).then(a => setAnalytics(a)).catch(console.error);
                  }
                }}
                onReturnToPitch={showReturnToPitch ? () => setActiveTab('pitch') : undefined}
              />
            )}

            {activeTab === 'dashboard' && (
              <ConsensusDashboard
                analytics={analytics}
                onRefresh={() => currentTopic && loadTopicData(currentTopic.id, sessionId)}
                onNavigateToVote={() => setActiveTab('vote')}
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
                analytics={analytics}
                darkMode={darkMode}
                onTopicCreated={async newT => {
                  const all = await fetchTopics();
                  const sorted = sortTopicsByLifecycle(all);
                  setTopics(sorted);
                  setCachedTopics(sorted);
                  handleSelectTopic(newT.id);
                  handleSelectTab('admin');
                }}
                onTopicUpdated={updatedT => {
                  setTopics(prev => {
                    const merged = prev.map(t => t.id === updatedT.id ? updatedT : t);
                    return sortTopicsByLifecycle(merged);
                  });
                  if (currentTopic?.id === updatedT.id) {
                    setCurrentTopic(updatedT);
                  }
                  // Background sync to keep cache and full list consistent
                  fetchTopics().then(all => {
                    if (all && all.length > 0) {
                      const sorted = sortTopicsByLifecycle(all);
                      setTopics(sorted);
                      setCachedTopics(sorted);
                    }
                  }).catch(console.error);
                }}
                onTopicDeleted={async deletedId => {
                  const all = await fetchTopics();
                  const sorted = sortTopicsByLifecycle(all);
                  setTopics(sorted);
                  setCachedTopics(sorted);
                  const remaining = sorted.filter(t => t.id !== deletedId);
                  if (remaining.length > 0) {
                    const nextDef = getDefaultTopic(remaining) || remaining[0];
                    handleSelectTopic(nextDef.id);
                  }
                }}
                onStatementsChanged={() => currentTopic && loadTopicData(currentTopic.id, sessionId)}
                onSelectTopic={handleSelectTopic}
                onReturnToPitch={showReturnToPitch ? () => setActiveTab('pitch') : undefined}
                onNavigateToVote={() => setActiveTab('vote')}
                triggerNewTopicModal={triggerNewTopic}
                onResetTriggerNewTopic={() => setTriggerNewTopic(false)}
              />
            )}

            {activeTab === 'pitch' && (
              <PitchDeckView
                onNavigateToAdmin={() => handleSelectTab('admin')}
                onNavigateToWidget={() => handleSelectTab('vote')}
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

      {/* Accessibility Modal */}
      <AccessibilityModal
        isOpen={accessibilityModalOpen}
        onClose={() => setAccessibilityModalOpen(false)}
      />

      {/* Privacy Policy Modal */}
      <PrivacyModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
      />

      {/* Terms of Use Modal */}
      <TermsModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
      />

      {/* Floating Accessibility Toolbar */}
      <AccessibilityToolbar
        onOpenStatement={() => setAccessibilityModalOpen(true)}
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

            {/* Legal, Privacy & Accessibility Links */}
            <div className="flex items-center justify-center gap-4 text-xs font-medium text-slate-400 pt-3 border-t border-slate-800/80 flex-wrap">
              <button
                onClick={() => setAccessibilityModalOpen(true)}
                className="hover:text-amber-400 underline underline-offset-2 transition"
              >
                הצהרת נגישות (ת"י 5568)
              </button>
              <span>•</span>
              <button
                onClick={() => setPrivacyModalOpen(true)}
                className="hover:text-amber-400 underline underline-offset-2 transition"
              >
                מדיניות פרטיות ואבטחת מידע
              </button>
              <span>•</span>
              <button
                onClick={() => setTermsModalOpen(true)}
                className="hover:text-amber-400 underline underline-offset-2 transition"
              >
                תנאי שימוש
              </button>
            </div>

            {/* Discreet Editorial / Admin Login Link */}
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => handleSelectTab('admin')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:text-amber-400 bg-slate-800/40 hover:bg-slate-800 transition text-xs font-semibold cursor-pointer border border-slate-800/80"
                title="כניסה מוגנת בסיסמה למערכת העורכים ומנהלי המשאל"
              >
                <span>כניסת עורכים ומנהלים 🔐</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 pt-1">
              כל ההצבעות נשמרות באופן אנונימי מבוסס מזהה סשן בלבד, ללא מעקב אישי או מסירת פרטים מזהים.
            </div>
          </div>
        </footer>
      )}

    </div>
  );
}

export default App;
