import React, { useState, useEffect } from 'react';
import type { Topic, Statement, AIStats, TopicAnalytics } from '../types';
import { getTopicLifecycle, sortTopicsByLifecycle, formatTopicDateTime as formatDateTime } from '../topicLifecycle';
import { getCachedStatements, setCachedStatements } from '../defaultData';
import { AIReportView } from './AIReportView';
import { ConsensusDashboard } from './ConsensusDashboard';
import { 
  fetchStatements, 
  updateStatement, 
  deleteStatement, 
  batchApproveStatements,
  createTopic, 
  updateTopic,
  deleteTopic,
  fetchSuggestedStatements,
  verifyAdminPassword,
  fetchAIStats,
  getAdminToken,
  clearAdminToken
} from '../api';
import { 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Trash2, 
  PlusCircle, 
  Code2, 
  Copy, 
  Check, 
  Save, 
  X,
  Sparkles,
  Plus,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Lock,
  Unlock,
  Settings,
  Layers,
  ArrowRight,
  Clock,
  CalendarClock,
  Activity,
  DollarSign,
  Zap,
  RefreshCw,
  LogOut,
  KeyRound,
  Download,
  Database,
  Eye,
  BarChart3,
  BarChart2,
  AlertTriangle,
  Compass,
  Info,
  Calendar,
  Search,
  Filter,
  Play,
  Square,
  Users,
  Radio,
  FileText
} from 'lucide-react';

interface AdminViewProps {
  currentTopic: Topic;
  topics: Topic[];
  analytics?: TopicAnalytics | null;
  darkMode?: boolean;
  onTopicCreated: (newTopic: Topic) => void;
  onTopicUpdated: (updatedTopic: Topic) => void;
  onTopicDeleted: (deletedId: string) => void;
  onStatementsChanged: () => void;
  onSelectTopic: (topicId: string) => void;
  onReturnToPitch?: () => void;
  onNavigateToVote?: () => void;
  onNavigateToReport?: () => void;
  triggerNewTopicModal?: boolean;
  onResetTriggerNewTopic?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  currentTopic,
  topics,
  analytics,
  darkMode = false,
  onTopicCreated,
  onTopicUpdated,
  onTopicDeleted,
  onStatementsChanged,
  onSelectTopic,
  onReturnToPitch,
  onNavigateToVote,
  onNavigateToReport,
  triggerNewTopicModal,
  onResetTriggerNewTopic
}) => {
  const [adminSubTab, setAdminSubTab] = useState<'moderation' | 'report' | 'results' | 'topics' | 'observability' | 'embed'>('moderation');
  const [statements, setStatements] = useState<Statement[]>([]);
  const [allStatements, setAllStatements] = useState<Statement[]>([]);
  const [statusFilter, setStatusFilter] = useState<'approved' | 'rejected' | 'queue'>('approved');
  const [selectedQueueIds, setSelectedQueueIds] = useState<number[]>([]);
  const [batchApproving, setBatchApproving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [adminEmbedTheme, setAdminEmbedTheme] = useState<'auto' | 'dark' | 'light'>('auto');
  const [showExitWarningModal, setShowExitWarningModal] = useState(false);

  const handleRequestNavigateToVote = () => {
    setShowExitWarningModal(true);
  };

  // New topic modal form state
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicSubtitle, setNewTopicSubtitle] = useState('');
  const [newTopicOrg, setNewTopicOrg] = useState('ערב ערב באילת – המצפן העירוני');
  const [newTopicType, setNewTopicType] = useState<'weekly' | 'special'>('weekly');
  const [closePreviousWeekly, setClosePreviousWeekly] = useState(false);
  const [newTopicCategory, setNewTopicCategory] = useState<'municipal' | 'mediation' | 'committee' | 'consulting'>('municipal');
  const [newTopicModerationMode, setNewTopicModerationMode] = useState<'batch_approval' | 'auto_publish' | 'instant_publish'>('batch_approval');
  const [newTopicSubmissionsCloseAt, setNewTopicSubmissionsCloseAt] = useState<string>('');
  const [newTopicClosesAt, setNewTopicClosesAt] = useState<string>('');
  const [newTopicGroups, setNewTopicGroups] = useState([
    { id: 'group1', label: 'תושבי העיר', color: '#2563eb' },
    { id: 'group2', label: 'בעלי עסקים ומסחר', color: '#d97706' },
    { id: 'group3', label: 'מבקרים ותיירות', color: '#059669' }
  ]);
  const [selectedStatements, setSelectedStatements] = useState<string[]>([]);
  const [customStatementInput, setCustomStatementInput] = useState('');
  const [suggestedStatements, setSuggestedStatements] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [creatingTopic, setCreatingTopic] = useState(false);

  // Edit topic modal state
  const [showEditTopicModal, setShowEditTopicModal] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState('');
  const [editingTopicVotes, setEditingTopicVotes] = useState(0);
  const [editTopicTitle, setEditTopicTitle] = useState('');
  const [editTopicSubtitle, setEditTopicSubtitle] = useState('');
  const [editTopicOrg, setEditTopicOrg] = useState('');
  const [editTopicType, setEditTopicType] = useState<'weekly' | 'special'>('weekly');
  const [editTopicCategory, setEditTopicCategory] = useState<'municipal' | 'mediation' | 'committee' | 'consulting'>('municipal');
  const [editTopicModerationMode, setEditTopicModerationMode] = useState<'batch_approval' | 'auto_publish' | 'instant_publish'>('batch_approval');
  const [editTopicSubmissionsCloseAt, setEditTopicSubmissionsCloseAt] = useState<string>('');
  const [editTopicClosesAt, setEditTopicClosesAt] = useState<string>('');
  const [editTopicGroups, setEditTopicGroups] = useState<{ id: string; label: string; color: string }[]>([]);
  const [updatingTopic, setUpdatingTopic] = useState(false);
  const [editErrorMessage, setEditErrorMessage] = useState<string | null>(null);

  // Action feedback message
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Master Topics Table filter & lifecycle scheduling state
  const [topicFilter, setTopicFilter] = useState<'all' | 'active' | 'scheduled' | 'draft' | 'closed'>('all');
  const [topicSearchQuery, setTopicSearchQuery] = useState('');
  const [managingTopic, setManagingTopic] = useState<Topic | null>(null);
  const [scheduleLaunchAt, setScheduleLaunchAt] = useState<string>('');
  const [scheduleDurationDays, setScheduleDurationDays] = useState<number>(5);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Admin password authentication gate
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return Boolean(getAdminToken());
  });
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Observability & AI Tracing State
  const [aiStats, setAiStats] = useState<AIStats | null>(null);
  const [loadingAiStats, setLoadingAiStats] = useState(false);
  const [aiStatsError, setAiStatsError] = useState<string | null>(null);

  const loadAiStats = async () => {
    setLoadingAiStats(true);
    setAiStatsError(null);
    try {
      const stats = await fetchAIStats();
      setAiStats(stats);
    } catch (err: any) {
      setAiStatsError(err.message || 'שגיאה בטעינת נתוני מעקב AI');
    } finally {
      setLoadingAiStats(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      loadAiStats();
    }
  }, [isAdminAuthenticated]);

  useEffect(() => {
    const handleAuthRevoked = () => {
      setIsAdminAuthenticated(false);
      setAuthError('פג תוקף חיבור המנהל. אנא הזן סיסמה מחדש.');
    };
    window.addEventListener('admin_auth_revoked', handleAuthRevoked);
    return () => window.removeEventListener('admin_auth_revoked', handleAuthRevoked);
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      const res = await verifyAdminPassword(adminPasswordInput);
      if (res.success) {
        setIsAdminAuthenticated(true);
        setAdminPasswordInput('');
      } else {
        setAuthError(res.error || 'סיסמת מנהל שגויה. נסה שוב.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'שגיאה באימות הסיסמה');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleAdminLogout = () => {
    clearAdminToken();
    setIsAdminAuthenticated(false);
  };

  const loadStatements = async () => {
    try {
      // Immediate 0ms rendering from local cache
      const cached = getCachedStatements(currentTopic.id);
      if (cached && cached.length > 0) {
        setAllStatements(cached);
        if (statusFilter === 'approved') {
          setStatements(cached.filter(s => s.status === 'approved'));
        } else if (statusFilter === 'rejected') {
          setStatements(cached.filter(s => s.status === 'rejected'));
        } else {
          setStatements(cached.filter(s => s.status === 'pending' || s.status === 'pending_approval' || s.status === 'scheduled_auto'));
        }
      }

      const all = await fetchStatements(currentTopic.id);
      setAllStatements(all);
      setCachedStatements(currentTopic.id, all);
      if (statusFilter === 'approved') {
        setStatements(all.filter(s => s.status === 'approved'));
      } else if (statusFilter === 'rejected') {
        setStatements(all.filter(s => s.status === 'rejected'));
      } else {
        setStatements(all.filter(s => s.status === 'pending' || s.status === 'pending_approval' || s.status === 'scheduled_auto'));
      }
    } catch (err) {
      console.error('Error fetching statements:', err);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedQueueIds.length === 0) return;
    setBatchApproving(true);
    try {
      await batchApproveStatements(selectedQueueIds);
      setActionSuccess(`אושרו בהצלחה ${selectedQueueIds.length} היגדים! הם פתוחים כעת להצבעת הציבור.`);
      setSelectedQueueIds([]);
      loadStatements();
      onStatementsChanged();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'שגיאה באישור היגדים בבאץ');
    } finally {
      setBatchApproving(false);
    }
  };

  const handleUpdateModerationMode = async (mode: 'batch_approval' | 'auto_publish' | 'instant_publish') => {
    try {
      const updated = await updateTopic(currentTopic.id, { moderation_mode: mode });
      onTopicUpdated(updated);
      const modeNames = {
        batch_approval: 'אישור עורך בבאץ (ברירת מחדל)',
        auto_publish: 'טייס אוטומטי מבוקר (Auto-Publish עם זכות וטו של 3 שעות)',
        instant_publish: 'פרסום מיידי לאחר סינון AI'
      };
      setActionSuccess(`מצב הסינון עודכן ל-${modeNames[mode]}`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'שגיאה בעדכון מצב סינון');
    }
  };

  useEffect(() => {
    loadStatements();
  }, [currentTopic.id, statusFilter, adminSubTab]);

  // Handle external trigger to open new topic modal (e.g. from top header button)
  useEffect(() => {
    if (triggerNewTopicModal) {
      setAdminSubTab('topics');
      setShowNewTopicModal(true);
      setErrorMessage(null);
      if (suggestedStatements.length === 0) {
        loadSuggestions(newTopicCategory, newTopicTitle);
      }
      if (onResetTriggerNewTopic) {
        onResetTriggerNewTopic();
      }
    }
  }, [triggerNewTopicModal]);

  // Load suggestions whenever modal opens or category changes
  const loadSuggestions = async (category: string, title?: string) => {
    setLoadingSuggestions(true);
    try {
      const list = await fetchSuggestedStatements({
        title: title || newTopicTitle,
        category,
        organization: newTopicOrg
      });
      setSuggestedStatements(list);
      // Auto pre-select first 5 suggestions so the creation button is immediately active and not locked
      setSelectedStatements(prev => prev.length === 0 ? list.slice(0, 5) : prev);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleOpenNewTopicModal = () => {
    setShowNewTopicModal(true);
    setErrorMessage(null);
    if (suggestedStatements.length === 0) {
      loadSuggestions(newTopicCategory, newTopicTitle);
    }
  };

  const handleOpenEditModal = (t: Topic) => {
    setEditingTopicId(t.id);
    setEditingTopicVotes(t.stats?.totalVotes || 0);
    setEditTopicTitle(t.title);
    setEditTopicSubtitle(t.subtitle || '');
    setEditTopicOrg(t.organization);
    setEditTopicType(t.topic_type || 'weekly');
    setEditTopicCategory(t.category);
    setEditTopicGroups(t.groups || []);
    setEditTopicModerationMode(t.moderation_mode || 'batch_approval');
    if (t.submissions_close_at) {
      const d = new Date(t.submissions_close_at);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setEditTopicSubmissionsCloseAt(d.toISOString().slice(0, 16));
    } else {
      setEditTopicSubmissionsCloseAt('');
    }
    if (t.closes_at) {
      const d = new Date(t.closes_at);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setEditTopicClosesAt(d.toISOString().slice(0, 16));
    } else {
      setEditTopicClosesAt('');
    }
    setEditErrorMessage(null);
    setShowEditTopicModal(true);
  };

  const handleUpdateTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditErrorMessage(null);

    const targetId = editingTopicId || currentTopic.id;

    if (!editTopicTitle.trim() || !editTopicOrg.trim()) {
      setEditErrorMessage('נא למלא כותרת ושם ארגון.');
      return;
    }

    setUpdatingTopic(true);
    try {
      const updated = await updateTopic(targetId, {
        title: editTopicTitle.trim(),
        subtitle: editTopicSubtitle.trim(),
        organization: editTopicOrg.trim(),
        category: editTopicCategory,
        groups: editTopicGroups,
        topic_type: editTopicType,
        moderation_mode: editTopicModerationMode,
        submissions_close_at: editTopicSubmissionsCloseAt ? new Date(editTopicSubmissionsCloseAt).toISOString() : null,
        closes_at: editTopicClosesAt ? new Date(editTopicClosesAt).toISOString() : null
      });

      setShowEditTopicModal(false);
      onTopicUpdated(updated);
      setActionSuccess('פרטי והגדרות זירת הדיון עודכנו בהצלחה!');
      setTimeout(() => setActionSuccess(null), 3500);
    } catch (err: any) {
      setEditErrorMessage(err.message || 'שגיאה בעדכון הזירה');
    } finally {
      setUpdatingTopic(false);
    }
  };

  const handleDeleteTopic = async (topicId: string, topicTitle: string) => {
    if (topics.length <= 1) {
      alert('לא ניתן למחוק את זירת הדיון היחידה שנותרה במערכת.');
      return;
    }

    const confirmed = window.confirm(
      `האם אתה בטוח לחלוטין שברצונך למחוק את זירת הדיון:\n"${topicTitle}"?\n\nכל ההיגדים, ההצבעות והניתוחים של זירה זו יימחקו לצמיתות.`
    );
    if (!confirmed) return;

    try {
      await deleteTopic(topicId);
      setActionSuccess(`הזירה "${topicTitle}" נמחקה בהצלחה.`);
      setTimeout(() => setActionSuccess(null), 3500);
      onTopicDeleted(topicId);
    } catch (err: any) {
      alert(err.message || 'שגיאה במחיקת הזירה');
    }
  };

  const handleOpenManageTopic = (t: Topic) => {
    setManagingTopic(t);
    if (t.starts_at && new Date(t.starts_at).getTime() > Date.now()) {
      const d = new Date(t.starts_at);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setScheduleLaunchAt(d.toISOString().slice(0, 16));
    } else {
      const target = new Date(Date.now() + 24 * 60 * 60 * 1000);
      target.setHours(8, 0, 0, 0);
      target.setMinutes(target.getMinutes() - target.getTimezoneOffset());
      setScheduleLaunchAt(target.toISOString().slice(0, 16));
    }
    setScheduleDurationDays(5);
  };

  const handleLaunchNow = async (targetTopic: Topic, durationDays = 5) => {
    const isWeekly = (targetTopic.topic_type === 'weekly' || !targetTopic.topic_type);
    if (isWeekly) {
      const activeWeekly = topics.find(other => 
        other.id !== targetTopic.id &&
        (other.topic_type === 'weekly' || !other.topic_type) && 
        (!other.closes_at || new Date(other.closes_at).getTime() > Date.now())
      );
      if (activeWeekly) {
        const confirmSwitch = window.confirm(
          `קיימת כבר זירה שבועית פעילה כעת ("${activeWeekly.title}").\nהאם לנעול אותה ולהעלות את הזירה "${targetTopic.title}" כמשאל השבועי המרכזי במקומה?`
        );
        if (!confirmSwitch) return;
        
        // Optimistically close previous weekly
        const closedPrev: Topic = {
          ...activeWeekly,
          closes_at: new Date().toISOString(),
          submissions_close_at: new Date().toISOString()
        };
        onTopicUpdated(closedPrev);
        updateTopic(activeWeekly.id, {
          closes_at: closedPrev.closes_at,
          submissions_close_at: closedPrev.submissions_close_at
        }).catch(console.error);
      }
    }

    const now = new Date();
    const startsAt = now.toISOString();
    const submissionsClose = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();
    const closesAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    // Optimistic instantaneous update (0ms!)
    const optimistic: Topic = {
      ...targetTopic,
      starts_at: startsAt,
      submissions_close_at: submissionsClose,
      closes_at: closesAt
    };
    onTopicUpdated(optimistic);
    setManagingTopic(null);
    setActionSuccess(`הזירה "${targetTopic.title}" עלתה לאוויר בהצלחה! 🚀 חלון ההיגדים פתוח ל-48 שעות והמשאל ל-${durationDays} ימים.`);
    setTimeout(() => setActionSuccess(null), 4000);

    // Sync in background
    updateTopic(targetTopic.id, {
      starts_at: startsAt,
      submissions_close_at: submissionsClose,
      closes_at: closesAt
    }).then(serverUpdated => {
      onTopicUpdated(serverUpdated);
    }).catch(err => {
      alert(err.message || 'שגיאה בהעלאת הזירה לאוויר');
      onTopicUpdated(targetTopic);
    });
  };

  const handleApplySchedule = async (targetTopic: Topic) => {
    if (!scheduleLaunchAt) {
      alert('נא לבחור תאריך ושעה להעלאה לאוויר.');
      return;
    }

    const launchDate = new Date(scheduleLaunchAt);
    if (isNaN(launchDate.getTime())) {
      alert('תאריך עלייה לאוויר אינו תקין.');
      return;
    }

    const startsAt = launchDate.toISOString();
    const submissionsClose = new Date(launchDate.getTime() + 48 * 60 * 60 * 1000).toISOString();
    const closesAt = new Date(launchDate.getTime() + scheduleDurationDays * 24 * 60 * 60 * 1000).toISOString();

    // Optimistic instantaneous update (0ms!)
    const optimistic: Topic = {
      ...targetTopic,
      starts_at: startsAt,
      submissions_close_at: submissionsClose,
      closes_at: closesAt
    };
    onTopicUpdated(optimistic);
    setManagingTopic(null);
    const formattedLaunch = launchDate.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    setActionSuccess(`התזמון נשמר בהצלחה! ⏳ הזירה מתוזמנת לעלות ב-${formattedLaunch}.`);
    setTimeout(() => setActionSuccess(null), 4000);

    updateTopic(targetTopic.id, {
      starts_at: startsAt,
      submissions_close_at: submissionsClose,
      closes_at: closesAt
    }).then(serverUpdated => {
      onTopicUpdated(serverUpdated);
    }).catch(err => {
      alert(err.message || 'שגיאה בקביעת תזמון הזירה');
      onTopicUpdated(targetTopic);
    });
  };

  const handleKeepAsDraft = async (targetTopic: Topic) => {
    // Optimistic instantaneous update (0ms!)
    const optimistic: Topic = {
      ...targetTopic,
      starts_at: null,
      submissions_close_at: null,
      closes_at: null
    };
    onTopicUpdated(optimistic);
    setManagingTopic(null);
    setActionSuccess(`הזירה "${targetTopic.title}" הועברה למאגר ללא תאריך. 📝`);
    setTimeout(() => setActionSuccess(null), 3500);

    updateTopic(targetTopic.id, {
      starts_at: null,
      submissions_close_at: null,
      closes_at: null
    }).then(serverUpdated => {
      onTopicUpdated(serverUpdated);
    }).catch(err => {
      alert(err.message || 'שגיאה בהעברת הזירה לטיוטה');
      onTopicUpdated(targetTopic);
    });
  };

  const handleUnpublishClose = async (targetTopic: Topic) => {
    const confirmed = window.confirm(`האם להוריד מהאוויר ולנעול כעת את המשאל:\n"${targetTopic.title}"?\n\nההצבעות יינעלו מיידית והמשאל יסומן כמשאל שהסתיים.`);
    if (!confirmed) return;

    const nowIso = new Date().toISOString();
    // Optimistic instantaneous update (0ms!)
    const optimistic: Topic = {
      ...targetTopic,
      closes_at: nowIso,
      submissions_close_at: nowIso
    };
    onTopicUpdated(optimistic);
    setManagingTopic(null);
    setActionSuccess(`המשאל "${targetTopic.title}" הורד מהאוויר וננעל בהצלחה! 🔒`);
    setTimeout(() => setActionSuccess(null), 3500);

    updateTopic(targetTopic.id, {
      closes_at: nowIso,
      submissions_close_at: nowIso
    }).then(serverUpdated => {
      onTopicUpdated(serverUpdated);
    }).catch(err => {
      alert(err.message || 'שגיאה בהורדת המשאל מהאוויר');
      onTopicUpdated(targetTopic);
    });
  };

  const handleLaunchAsWeekly = async (targetTopic: Topic) => {
    await handleLaunchNow(targetTopic, 5);
  };

  const handleToggleTopicType = async (t: Topic) => {
    const newType = t.topic_type === 'special' ? 'weekly' : 'special';
    const typeLabel = newType === 'special' ? 'זירה שלא מן המניין (בזק) ⚡' : 'זירה שבועית רגילה 📅';

    if (newType === 'weekly') {
      const activeWeekly = topics.find(other => 
        other.id !== t.id &&
        (other.topic_type === 'weekly' || !other.topic_type) && 
        (!other.closes_at || new Date(other.closes_at).getTime() > Date.now())
      );
      if (activeWeekly) {
        const confirmSwitch = window.confirm(
          `קיימת כבר זירה שבועית פעילה כעת ("${activeWeekly.title}").\nהאם לנעול אותה ולהפוך את הזירה "${t.title}" לזירה השבועית המרכזית במקומה?`
        );
        if (!confirmSwitch) return;

        const closedPrev: Topic = {
          ...activeWeekly,
          closes_at: new Date().toISOString(),
          submissions_close_at: new Date().toISOString()
        };
        onTopicUpdated(closedPrev);
        updateTopic(activeWeekly.id, {
          closes_at: closedPrev.closes_at,
          submissions_close_at: closedPrev.submissions_close_at
        }).catch(console.error);
      }
    }

    // Optimistic instantaneous update (0ms!)
    const optimistic: Topic = { ...t, topic_type: newType };
    onTopicUpdated(optimistic);
    if (managingTopic?.id === t.id) {
      setManagingTopic(optimistic);
    }
    setActionSuccess(`סטטוס הזירה "${t.title}" שונה ל-${typeLabel}!`);
    setTimeout(() => setActionSuccess(null), 3500);

    updateTopic(t.id, { topic_type: newType }).then(serverUpdated => {
      onTopicUpdated(serverUpdated);
      if (managingTopic?.id === t.id) setManagingTopic(serverUpdated);
    }).catch(err => {
      alert(err.message || 'שגיאה בשינוי סוג הזירה');
      onTopicUpdated(t);
      if (managingTopic?.id === t.id) setManagingTopic(t);
    });
  };

  const handleToggleTopicClosed = async (t: Topic) => {
    const closing = getClosingStatus(t.closes_at);
    const isCurrentlyClosed = closing?.isPast;

    if (isCurrentlyClosed) {
      const newClose = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const newSubClose = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      
      // Optimistic instantaneous update
      const optimistic: Topic = {
        ...t,
        closes_at: newClose,
        submissions_close_at: newSubClose
      };
      onTopicUpdated(optimistic);
      setActionSuccess(`המשאל "${t.title}" נפתח מחדש לשבוע הקרוב! 🔓`);
      setTimeout(() => setActionSuccess(null), 3500);

      updateTopic(t.id, { closes_at: newClose, submissions_close_at: newSubClose }).then(serverUpdated => {
        onTopicUpdated(serverUpdated);
      }).catch(err => {
        alert(err.message || 'שגיאה בפתיחת המשאל');
        onTopicUpdated(t);
      });
    } else {
      const confirmed = window.confirm(`האם לנעול ולסגור כעת את המשאל:\n"${t.title}"?\n\nלאחר הנעילה לא יתקבלו הצבעות נוספות והמשאל יוצג כמשאל שהסתיים.`);
      if (!confirmed) return;

      const nowIso = new Date().toISOString();
      // Optimistic instantaneous update
      const optimistic: Topic = {
        ...t,
        closes_at: nowIso,
        submissions_close_at: nowIso
      };
      onTopicUpdated(optimistic);
      setActionSuccess(`המשאל "${t.title}" ננעל ונסגר בהצלחה! 🔒`);
      setTimeout(() => setActionSuccess(null), 3500);

      updateTopic(t.id, { closes_at: nowIso, submissions_close_at: nowIso }).then(serverUpdated => {
        onTopicUpdated(serverUpdated);
      }).catch(err => {
        alert(err.message || 'שגיאה בנעילת המשאל');
        onTopicUpdated(t);
      });
    }
  };

  const handleCategoryChange = (cat: 'municipal' | 'mediation' | 'committee' | 'consulting') => {
    setNewTopicCategory(cat);
    loadSuggestions(cat, newTopicTitle);
  };

  const handleAddSuggestedStatement = (text: string) => {
    if (!selectedStatements.includes(text)) {
      setSelectedStatements(prev => [...prev, text]);
      setErrorMessage(null);
    }
  };

  const handleAddAllSuggestions = () => {
    const toAdd = suggestedStatements.filter(s => !selectedStatements.includes(s));
    setSelectedStatements(prev => [...prev, ...toAdd]);
    setErrorMessage(null);
  };

  const handleAddCustomStatement = () => {
    const trimmed = customStatementInput.trim();
    if (!trimmed) return;

    const lines = trimmed.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const newItems = lines.filter(l => !selectedStatements.includes(l));
    
    if (newItems.length > 0) {
      setSelectedStatements(prev => [...prev, ...newItems]);
      setCustomStatementInput('');
      setErrorMessage(null);
    }
  };

  const handleRemoveStatement = (index: number) => {
    setSelectedStatements(prev => prev.filter((_, i) => i !== index));
  };

  const handleStatusChange = async (id: number, newStatus: 'approved' | 'rejected' | 'pending') => {
    try {
      await updateStatement(id, { status: newStatus });
      loadStatements();
      onStatementsChanged();
    } catch (err) {
      console.error('Error updating statement status:', err);
    }
  };

  const handleSaveEdit = async (id: number) => {
    if (!editText.trim()) return;
    try {
      await updateStatement(id, { text: editText.trim() });
      setEditingId(null);
      loadStatements();
      onStatementsChanged();
    } catch (err) {
      console.error('Error saving edited statement:', err);
    }
  };

  const handleDeleteStatement = async (id: number) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק היגד זה? כל ההצבעות עליו יימחקו לצמיתות.')) return;
    try {
      await deleteStatement(id);
      loadStatements();
      onStatementsChanged();
    } catch (err) {
      console.error('Error deleting statement:', err);
    }
  };

  const handleCreateTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newTopicTitle.trim()) {
      setErrorMessage('נא להזין כותרת לזירת הדיון.');
      return;
    }

    if (selectedStatements.length < 5) {
      setErrorMessage(`חובה להגדיר לפחות 5 היגדי פתיחה (כרגע הוגדרו ${selectedStatements.length}). בחר מההיגדים המוצעים מטה או הקלד היגדים משלך.`);
      return;
    }

    const activeWeekly = topics.find(t => 
      (t.topic_type === 'weekly' || !t.topic_type) && 
      (!t.closes_at || new Date(t.closes_at).getTime() > Date.now())
    );

    if (newTopicType === 'weekly' && activeWeekly && !closePreviousWeekly) {
      setErrorMessage(`קיימת כבר זירה שבועית פעילה ("${activeWeekly.title}"). על פי הנוהל העיתונאי, לא ניתן לפתוח זירה שבועית נוספת במקביל. באפשרותך לסמן את תיבת הסגירה של הזירה הקודמת, או להגדיר זירה זו כ"זירה שלא מן המניין" (בזק/מיוחדת).`);
      return;
    }

    setCreatingTopic(true);
    try {
      const created = await createTopic({
        title: newTopicTitle.trim(),
        subtitle: newTopicSubtitle.trim(),
        organization: newTopicOrg.trim(),
        category: newTopicCategory,
        groups: newTopicGroups,
        initialStatements: selectedStatements,
        topic_type: newTopicType,
        moderation_mode: newTopicModerationMode,
        submissions_close_at: newTopicSubmissionsCloseAt ? new Date(newTopicSubmissionsCloseAt).toISOString() : null,
        closes_at: newTopicClosesAt ? new Date(newTopicClosesAt).toISOString() : null,
        close_previous_weekly: closePreviousWeekly
      });

      setShowNewTopicModal(false);
      setSelectedStatements([]);
      setNewTopicTitle('');
      setNewTopicSubtitle('');
      setNewTopicType('weekly');
      setClosePreviousWeekly(false);
      setNewTopicSubmissionsCloseAt('');
      setNewTopicClosesAt('');
      onTopicCreated(created);
    } catch (err: any) {
      console.error('Error creating topic:', err);
      setErrorMessage(err.message || 'שגיאה ביצירת הזירה');
    } finally {
      setCreatingTopic(false);
    }
  };

  const embedThemeQuery = adminEmbedTheme === 'auto' ? '' : `&theme=${adminEmbedTheme}`;
  const embedUrl = `${window.location.origin}/?topic=${currentTopic.id}&embed=true${embedThemeQuery}`;
  const embedBorder = adminEmbedTheme === 'dark' ? '#334155' : '#e2e8f0';
  const embedCode = `<iframe src="${embedUrl}" width="100%" height="720" frameborder="0" style="border: 1px solid ${embedBorder}; border-radius: 16px; overflow: hidden;" allow="clipboard-write"></iframe>`;

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2500);
  };

  const statementsCount = selectedStatements.length;
  const isMinimumMet = statementsCount >= 5;

  // Votes status for current topic (determine if editable)
  const currentVotesCount = currentTopic.stats?.totalVotes || 0;
  const isCurrentTopicEditable = currentVotesCount === 0;

  const getClosingStatus = (closesAt?: string | null) => {
    if (!closesAt) return null;
    const d = new Date(closesAt);
    if (isNaN(d.getTime())) return null;
    const isPast = d.getTime() < Date.now();
    const dateStr = d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    return {
      isPast,
      formatted: `${dateStr} בשעה ${timeStr}`,
      shortDate: `${d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })} ${timeStr}`
    };
  };

  const getPresetDateTime = (days: number) => {
    const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  // Password Lock Screen for Unauthenticated Admin Access
  if (!isAdminAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              כניסה מורשית לניהול
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              המצפן האילתי | קונצנזוס ציבורי<br />
              הגישה להגדרות זירות, סינון תוכן ומעקב עלויות AI מוגנת בסיסמה
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4 text-right">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                סיסמת מנהל מערכת (ADMIN_PASSWORD)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="הזן סיסמת מנהל..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition"
                  autoFocus
                />
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isAuthenticating || !adminPasswordInput.trim()}
              className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isAuthenticating ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>מאמת סיסמה...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>כניסה ללוח הניהול</span>
                </>
              )}
            </button>
          </form>

          {onReturnToPitch && (
            <button
              onClick={onReturnToPitch}
              className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition"
            >
              חזרה למצגת הפלטפורמה
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      
      {/* Editorial Navigation Tabs & Cloud Status Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setAdminSubTab('moderation')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              adminSubTab === 'moderation'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>מאגר היגדים</span>
          </button>

          <button
            onClick={() => setAdminSubTab('report')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              adminSubTab === 'report'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>הפקת Editorial Brief לעורך 📰</span>
          </button>

          <button
            onClick={() => setAdminSubTab('results')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              adminSubTab === 'results'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>מפת תוצאות וקונצנזוס</span>
          </button>

          <button
            onClick={() => setAdminSubTab('topics')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              adminSubTab === 'topics'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>ניהול זירות וסגירה</span>
          </button>

          <button
            onClick={() => setAdminSubTab('observability')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              adminSubTab === 'observability'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>מעקב עלויות AI ולוגים</span>
          </button>

          <button
            onClick={() => setAdminSubTab('embed')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition cursor-pointer ${
              adminSubTab === 'embed'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>קודי הטמעה</span>
          </button>
        </div>

        {/* Online Cloud Connection Indicator Badge */}
        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold text-xs shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span>סנכרון ענן פעיל</span>
          </span>
        </div>
      </div>

      {/* SUCCESS TOAST */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-sm font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* TAB 1: OBSERVABILITY & AI COST / PERFORMANCE TRACKING */}
      {adminSubTab === 'observability' && (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300">
                <Activity className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                מעקב עלויות וביצועי Gemini AI (Observability)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              מעקב חי אחר קריאות סינון, ניסוח מחדש, דוחות קונצנזוס, צריכת טוקנים ועלויות מצטברות
            </p>
          </div>

          <button
            onClick={loadAiStats}
            disabled={loadingAiStats}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-xs transition self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAiStats ? 'animate-spin' : ''}`} />
            <span>רענן נתונים</span>
          </button>
        </div>

        {loadingAiStats && !aiStats ? (
          <div className="py-8 text-center text-xs text-slate-400">טוען מדדי שימוש...</div>
        ) : aiStats ? (
          <div className="space-y-4">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  <span>סה"כ קריאות AI</span>
                  <Zap className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {aiStats.totalCalls}
                </div>
                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {aiStats.successRatePercent}% הצלחה
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  <span>עלות משוערת</span>
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {aiStats.cost.usdFormatted}
                </div>
                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                  כ-{aiStats.cost.ilsFormatted}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  <span>טוקנים שנצרכו</span>
                  <Sparkles className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {aiStats.tokens.total.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  In: {aiStats.tokens.prompt.toLocaleString()} | Out: {aiStats.tokens.candidates.toLocaleString()}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  <span>זמן תגובה ממוצע</span>
                  <Clock className="w-4 h-4 text-purple-500" />
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {(aiStats.avgDurationMs / 1000).toFixed(1)}s
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {aiStats.avgDurationMs}ms
                </div>
              </div>
            </div>

            {/* Recent Executions Table */}
            {aiStats.recentLogs.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                  תיעוד קריאות אחרונות בזמן אמת ({aiStats.recentLogs.length})
                </h4>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-2.5">מועד</th>
                        <th className="p-2.5">פעולה</th>
                        <th className="p-2.5">מודל</th>
                        <th className="p-2.5">משך</th>
                        <th className="p-2.5">טוקנים (In/Out)</th>
                        <th className="p-2.5">עלות ($)</th>
                        <th className="p-2.5">סטטוס</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                      {aiStats.recentLogs.slice(0, 10).map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="p-2.5 font-mono text-[11px]">
                            {new Date(log.created_at).toLocaleTimeString('he-IL')}
                          </td>
                          <td className="p-2.5 font-bold">
                            {log.action}
                          </td>
                          <td className="p-2.5 font-mono text-[11px] text-slate-500">
                            {log.model}
                          </td>
                          <td className="p-2.5 font-mono">
                            {log.duration_ms}ms
                          </td>
                          <td className="p-2.5 font-mono text-[11px]">
                            {log.prompt_tokens} / {log.candidates_tokens}
                          </td>
                          <td className="p-2.5 font-mono text-emerald-600 dark:text-emerald-400">
                            ${log.estimated_cost_usd.toFixed(6)}
                          </td>
                          <td className="p-2.5">
                            {log.success ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                                הצליח
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 text-[10px] font-bold" title={log.error || ''}>
                                נכשל
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
      )}

      {/* TAB 2: TOPIC CONTROL & MASTER TOPICS TABLE */}
      {adminSubTab === 'topics' && (
      <div className="space-y-6">
        {/* Header and Controls */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                  <Layers className="w-5 h-5" />
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  מרכז ניהול, בקרה ותזמון זירות דיון
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                טבלת שליטה מרכזית: תזמון מועדי פרסום, ספירת 48 שעות להיגדים ו-5 ימים להצבעות, וניהול הסטטוסים
              </p>
            </div>

            <button
              onClick={handleOpenNewTopicModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition self-start sm:self-auto cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>פתח זירה חדשה</span>
            </button>
          </div>

          {/* Current Focused Topic Banner in Tab 2 */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">זירה במוקד העורך כעת:</span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{currentTopic.title}</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    currentTopic.topic_type === 'special' 
                      ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800' 
                      : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                  }`}>
                    {currentTopic.topic_type === 'special' ? '⚡ שלא מן המניין' : '📅 שבועית רגילה'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ארגון: {currentTopic.organization} | נאספו {currentTopic.stats?.totalVotes || 0} הצבעות
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleOpenManageTopic(currentTopic)}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>ניהול ותזמון זירה זו</span>
              </button>
              <button
                onClick={() => setAdminSubTab('moderation')}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>עבור לאישור היגדים</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>
          </div>

          {/* Filter Bar and Live Counters */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
                {[
                  { key: 'all', label: 'כל הזירות', count: topics.length, icon: Layers },
                  { key: 'active', label: 'פעילות באוויר', count: topics.filter(t => getTopicLifecycle(t).status === 'active').length, icon: Radio, activeColor: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800' },
                  { key: 'scheduled', label: 'מתוזמנות', count: topics.filter(t => getTopicLifecycle(t).status === 'scheduled').length, icon: CalendarClock, activeColor: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800' },
                  { key: 'draft', label: 'פתוחות ללא תאריך', count: topics.filter(t => getTopicLifecycle(t).status === 'draft').length, icon: FileText, activeColor: 'text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700' },
                  { key: 'closed', label: 'זירות שנסגרו', count: topics.filter(t => getTopicLifecycle(t).status === 'closed').length, icon: Lock, activeColor: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800' }
                ].map(tab => {
                  const isSelected = topicFilter === tab.key;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setTopicFilter(tab.key as any)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border transition cursor-pointer whitespace-nowrap ${
                        isSelected 
                          ? tab.activeColor || 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-amber-400 dark:border-amber-700 shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{tab.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        isSelected 
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search Box */}
              <div className="relative w-full md:w-64">
                <input
                  type="text"
                  value={topicSearchQuery}
                  onChange={(e) => setTopicSearchQuery(e.target.value)}
                  placeholder="חיפוש לפי כותרת או ארגון..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400 transition"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                {topicSearchQuery && (
                  <button
                    onClick={() => setTopicSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* MASTER TOPICS TABLE */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <th className="py-3 px-4">כותרת הזירה וגוף מזמין</th>
                      <th className="py-3 px-3">סוג זירה</th>
                      <th className="py-3 px-3">סטטוס מחזור חיים</th>
                      <th className="py-3 px-3">לוח זמנים (עלייה ⟵ נעילת היגדים ⟵ סגירה)</th>
                      <th className="py-3 px-3 text-center">הצבעות והיגדים</th>
                      <th className="py-3 px-4 text-center">פעולות וניהול</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {(() => {
                      const list = sortTopicsByLifecycle(topics).filter(t => {
                        const lc = getTopicLifecycle(t);
                        if (topicFilter !== 'all' && lc.status !== topicFilter) return false;
                        if (topicSearchQuery.trim()) {
                          const q = topicSearchQuery.toLowerCase();
                          const m1 = t.title?.toLowerCase().includes(q);
                          const m2 = t.organization?.toLowerCase().includes(q);
                          const m3 = t.subtitle?.toLowerCase().includes(q);
                          if (!m1 && !m2 && !m3) return false;
                        }
                        return true;
                      });

                      if (list.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-400">
                              <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
                              <p className="font-bold">לא נמצאו זירות תואמות לסינון הנבחר</p>
                              {topicFilter !== 'all' && (
                                <button
                                  onClick={() => setTopicFilter('all')}
                                  className="mt-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                                >
                                  הצג את כל הזירות
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      }

                      return list.map(t => {
                        const lc = getTopicLifecycle(t);
                        const isCurrent = t.id === currentTopic.id;
                        const tVotes = t.stats?.totalVotes || 0;
                        const tStatements = t.stats?.statementsCount || 0;

                        return (
                          <tr 
                            key={t.id}
                            className={`transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer ${
                              isCurrent ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                            }`}
                            onClick={() => handleOpenManageTopic(t)}
                          >
                            {/* Column 1: Title & Organization */}
                            <td className="py-3.5 px-4 min-w-[240px] max-w-[320px]">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                {isCurrent && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-400 text-slate-950 shadow-2xs">
                                    במיקוד כעת
                                  </span>
                                )}
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                  {t.organization}
                                </span>
                              </div>
                              <div className="font-black text-slate-900 dark:text-white leading-snug line-clamp-2">
                                {t.title}
                              </div>
                              {t.subtitle && (
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                  {t.subtitle}
                                </div>
                              )}
                            </td>

                            {/* Column 2: Topic Type with Quick Toggle */}
                            <td className="py-3.5 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border flex items-center gap-1 ${
                                  t.topic_type === 'special'
                                    ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                                    : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                }`}>
                                  {t.topic_type === 'special' ? '⚡ שלא מן המניין' : '📅 שבועית'}
                                </span>
                                <button
                                  onClick={() => handleToggleTopicType(t)}
                                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                  title="החלף סוג זירה (שבועית ⟷ שלא מן המניין)"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                </button>
                              </div>
                            </td>

                            {/* Column 3: Lifecycle Status Badge */}
                            <td className="py-3.5 px-3 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${lc.badgeClass}`}>
                                <span className={`w-2 h-2 rounded-full ${lc.dotClass}`} />
                                <span>{lc.label}</span>
                              </span>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                                {lc.description}
                              </div>
                            </td>

                            {/* Column 4: Schedule Timeline */}
                            <td className="py-3.5 px-3 min-w-[200px]">
                              {lc.status === 'draft' ? (
                                <span className="text-[11px] text-slate-400 italic">
                                  טרם נקבע מועד שידור (במאגר)
                                </span>
                              ) : (
                                <div className="space-y-1 text-[11px]">
                                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                    <Play className="w-2.5 h-2.5 text-emerald-500 fill-current" />
                                    <span className="text-slate-500 dark:text-slate-400">עלייה:</span>
                                    <span className="font-bold">{lc.startsAtFormatted || 'מיידי'}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                    <Clock className="w-2.5 h-2.5 text-amber-500" />
                                    <span className="text-slate-500 dark:text-slate-400">נעילת היגדים:</span>
                                    <span className="font-bold">{lc.submissionsCloseFormatted || 'פתוח'}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                    <Lock className="w-2.5 h-2.5 text-rose-500" />
                                    <span className="text-slate-500 dark:text-slate-400">סגירת משאל:</span>
                                    <span className="font-bold">{lc.closesAtFormatted || 'ללא הגבלה'}</span>
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Column 5: Votes & Statements */}
                            <td className="py-3.5 px-3 text-center whitespace-nowrap">
                              <div className="inline-flex flex-col items-center">
                                <span className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1">
                                  <Users className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{tVotes}</span>
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                  {tStatements} היגדים
                                </span>
                              </div>
                            </td>

                            {/* Column 6: Action Buttons */}
                            <td className="py-3.5 px-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Open Lifecycle & Schedule Modal */}
                                <button
                                  onClick={() => handleOpenManageTopic(t)}
                                  className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                                  title="ניהול סטטוס, העלאה לאוויר, הורדה ותזמון"
                                >
                                  <CalendarClock className="w-3.5 h-3.5" />
                                  <span>ניהול ותזמון</span>
                                </button>

                                {/* Select for Admin Workspace */}
                                {!isCurrent ? (
                                  <button
                                    onClick={() => onSelectTopic(t.id)}
                                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                                    title="בחר זירה זו כדי לנהל את ההיגדים שלה"
                                  >
                                    בחר ללוח
                                  </button>
                                ) : (
                                  <span className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                                    נבחר
                                  </span>
                                )}

                                {/* Edit Topic Settings (Modal) */}
                                <button
                                  onClick={() => handleOpenEditModal(t)}
                                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                                  title="ערוך הגדרות זירה (טקסטים, כובעים, סינון)"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>

                                {/* Delete Topic */}
                                <button
                                  onClick={() => handleDeleteTopic(t.id, t.title)}
                                  disabled={topics.length <= 1}
                                  className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition disabled:opacity-30 cursor-pointer"
                                  title="מחק זירה זו"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* MODAL: TOPIC LIFECYCLE & SCHEDULING MANAGEMENT */}
      {managingTopic && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl max-h-[92vh] overflow-y-auto space-y-6 transition-colors text-right">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getTopicLifecycle(managingTopic).badgeClass}`}>
                    <span className={`inline-block w-2 h-2 rounded-full ${getTopicLifecycle(managingTopic).dotClass} ml-1`} />
                    {getTopicLifecycle(managingTopic).label}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    managingTopic.topic_type === 'special'
                      ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                      : 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  }`}>
                    {managingTopic.topic_type === 'special' ? '⚡ שלא מן המניין' : '📅 שבועית רגילה'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {managingTopic.stats?.totalVotes || 0} הצבעות רשומות
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-snug">
                  {managingTopic.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  ארגון: <span className="font-bold text-slate-700 dark:text-slate-300">{managingTopic.organization}</span>
                </p>
              </div>

              <button
                onClick={() => setManagingTopic(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action Cards Grid */}
            {(() => {
              const managingLc = getTopicLifecycle(managingTopic);
              const isAlreadyActive = managingLc.status === 'active';
              const isAlreadyClosed = managingLc.status === 'closed';

              return (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {isAlreadyActive ? 'סטטוס וניהול זירה פעילה באוויר:' : 'בחר פעולה במחזור חיי הזירה:'}
                  </h4>

                  {/* CARD 1: Only available when NOT active */}
                  {isAlreadyActive ? (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-400/50 dark:border-emerald-700/60 space-y-3">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5">
                          <span className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                            <Radio className="w-4 h-4 animate-pulse" />
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-black text-emerald-950 dark:text-emerald-100">
                                הזירה פעילה באוויר כעת (שידור חי)
                              </h5>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 animate-pulse">
                                ● באוויר
                              </span>
                            </div>
                            <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                              המשאל פתוח ונגיש להצבעות תושבים. הזירה כבר באוויר ואינה זקוקה להעלאה נוספת.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                        <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-800/80">
                          <span className="text-slate-500 dark:text-slate-400 block text-[10px]">🚀 עלתה לאוויר:</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {managingLc.startsAtFormatted || 'מיידית'}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-800/80">
                          <span className="text-amber-700 dark:text-amber-400 block text-[10px]">⏳ נעילת שלב היגדים:</span>
                          <span className="font-bold text-amber-900 dark:text-amber-200">
                            {managingLc.submissionsCloseFormatted || 'הסתיים / לא הוגדר'}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-emerald-200 dark:border-emerald-800/80">
                          <span className="text-rose-700 dark:text-rose-400 block text-[10px]">🔒 סגירת המשאל:</span>
                          <span className="font-bold text-rose-900 dark:text-rose-200">
                            {managingLc.closesAtFormatted || 'ללא תאריך סגירה'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="p-2 rounded-xl bg-emerald-500 text-white shadow-xs">
                            <Zap className="w-4 h-4 fill-current" />
                          </span>
                          <div>
                            <h5 className="text-sm font-black text-emerald-950 dark:text-emerald-100">
                              1. העלאה מיידית לאוויר (פעילה מעכשיו)
                            </h5>
                            <p className="text-xs text-emerald-700 dark:text-emerald-300/80 mt-0.5">
                              פותח את המשאל מיידית להצבעות, מקצה 48 שעות להוספת היגדים, ונועל להצבעות בעוד 5 ימים
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                        <div className="text-[11px] text-emerald-800 dark:text-emerald-200 font-medium">
                          ⏱️ תאריך ושעה יוגדרו כעת, שלב היגדים: +48 שעות, סגירה סופית: +5 ימים
                        </div>
                        <button
                          onClick={() => handleLaunchNow(managingTopic, 5)}
                          disabled={isProcessingAction}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>העלה לאוויר עכשיו 🚀</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* CARD 2: Schedule for Future Date */}
                  <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/80 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
                        <CalendarClock className="w-4 h-4" />
                      </span>
                      <div>
                        <h5 className="text-sm font-black text-indigo-950 dark:text-indigo-100">
                          {isAlreadyActive 
                            ? '2. שינוי תזמון / מועד סגירת המשאל' 
                            : (isAlreadyClosed ? '2. פתיחה מחודשת בתזמון עתידי' : '2. קביעת תזמון עתידי (תאריך ושעת עלייה לאוויר)')}
                        </h5>
                        <p className="text-xs text-indigo-700 dark:text-indigo-300/80 mt-0.5">
                          {isAlreadyActive 
                            ? 'הגדר מועד סגירה חדש או שנה את מועדי שלבי המשאל' 
                            : 'המערכת תחשב אוטומטית ממועד זה בדיוק 48 שעות לנעילת היגדים ו-5 ימים לסגירת המשאל'}
                        </p>
                      </div>
                    </div>

                    {/* Date & Time Picker */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-indigo-900 dark:text-indigo-200 mb-1">
                          תאריך ושעה להעלאה לאוויר:
                        </label>
                        <input
                          type="datetime-local"
                          value={scheduleLaunchAt}
                          onChange={(e) => setScheduleLaunchAt(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 text-xs text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-400 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-indigo-900 dark:text-indigo-200 mb-1">
                          משך המשאל להצבעות:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setScheduleDurationDays(5)}
                            className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                              scheduleDurationDays === 5
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50'
                            }`}
                          >
                            5 ימים (מומלץ)
                          </button>
                          <button
                            type="button"
                            onClick={() => setScheduleDurationDays(7)}
                            className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                              scheduleDurationDays === 7
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50'
                            }`}
                          >
                            7 ימים (שבוע)
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Dynamic Calculated Schedule Box */}
                    {scheduleLaunchAt && (
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-xs space-y-1.5 shadow-2xs">
                        <div className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                          <span>לוח זמנים מחושב אוטומטית:</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                          <div className="p-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/40">
                            <span className="text-slate-500 dark:text-slate-400 block text-[10px]">🚀 עלייה לאוויר:</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {formatDateTime(scheduleLaunchAt, true)}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/40">
                            <span className="text-amber-700 dark:text-amber-400 block text-[10px]">⏳ נעילת היגדים (+48ש):</span>
                            <span className="font-bold text-amber-900 dark:text-amber-200">
                              {formatDateTime(new Date(new Date(scheduleLaunchAt).getTime() + 48 * 60 * 60 * 1000).toISOString(), true)}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-rose-50/50 dark:bg-rose-950/40">
                            <span className="text-rose-700 dark:text-rose-400 block text-[10px]">🔒 סגירת המשאל (+{scheduleDurationDays}ימים):</span>
                            <span className="font-bold text-rose-900 dark:text-rose-200">
                              {formatDateTime(new Date(new Date(scheduleLaunchAt).getTime() + scheduleDurationDays * 24 * 60 * 60 * 1000).toISOString(), true)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => handleApplySchedule(managingTopic)}
                        disabled={isProcessingAction || !scheduleLaunchAt}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>שמור תזמון עתידי ⏳</span>
                      </button>
                    </div>
                  </div>

                  {/* CARD 3 & 4: Draft vs Unpublish */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Draft: Unscheduled */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          <FileText className="w-4 h-4" />
                        </span>
                        <div>
                          <h5 className="text-xs font-black text-slate-900 dark:text-white">
                            3. השאר ברשימה ללא תאריך (טיוטה)
                          </h5>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            מאפס תאריכי שידור ומשאיר את הזירה במאגר מוכנה לשיבוץ
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleKeepAsDraft(managingTopic)}
                        disabled={isProcessingAction}
                        className="w-full py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
                      >
                        השאר במאגר ללא תאריך 📝
                      </button>
                    </div>

                    {/* Close / Unpublish */}
                    <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="p-2 rounded-xl bg-rose-500 text-white">
                          <Lock className="w-4 h-4" />
                        </span>
                        <div>
                          <h5 className="text-xs font-black text-rose-950 dark:text-rose-100">
                            {isAlreadyClosed ? '4. המשאל כבר נעול וסגור' : '4. הורדה מהאוויר / נעילת המשאל'}
                          </h5>
                          <p className="text-[11px] text-rose-700 dark:text-rose-300/80">
                            {isAlreadyClosed
                              ? 'המשאל כבר סגור ואינו פתוח להצבעות תושבים'
                              : 'סוגר ונועל את המשאל מיידית להצבעות (מעביר ל"נסגרה")'}
                          </p>
                        </div>
                      </div>
                      {!isAlreadyClosed && (
                        <button
                          onClick={() => handleUnpublishClose(managingTopic)}
                          disabled={isProcessingAction}
                          className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
                        >
                          נעל והורד מהאוויר כעת 🔒
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Quick Settings & Navigation in Modal */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">שינוי סוג זירה:</span>
                <button
                  onClick={async () => {
                    await handleToggleTopicType(managingTopic);
                    const updatedT = topics.find(t => t.id === managingTopic.id);
                    if (updatedT) setManagingTopic({ ...updatedT, topic_type: updatedT.topic_type === 'special' ? 'weekly' : 'special' });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{managingTopic.topic_type === 'special' ? 'העבר ל-📅 שבועית רגילה' : 'העבר ל-⚡ שלא מן המניין'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const t = managingTopic;
                    setManagingTopic(null);
                    handleOpenEditModal(t);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>ערוך הגדרות זירה</span>
                </button>

                <button
                  onClick={() => {
                    onSelectTopic(managingTopic.id);
                    setManagingTopic(null);
                    setAdminSubTab('moderation');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>בחר ללוח ונהל היגדים ➔</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: EMBED SNIPPET GENERATOR */}
      {adminSubTab === 'embed' && (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                קוד הטמעה ישירה לכתבה באתר (Embed Widget)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                שלב את המשאל כווידג'ט חי בתוך כתבות "ערב ערב באילת" (yomyom.net) או אתרי לקוחות
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyEmbed}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition"
          >
            {copiedEmbed ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>הקוד הועתק!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>העתק קוד iFrame</span>
              </>
            )}
          </button>
        </div>

        {/* Theme Selector for Embed Code */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">ערכת נושא לקוד ההטמעה:</span>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setAdminEmbedTheme('auto')}
                className={`px-3 py-1 rounded-lg transition ${
                  adminEmbedTheme === 'auto'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                אוטומטי
              </button>
              <button
                type="button"
                onClick={() => setAdminEmbedTheme('dark')}
                className={`px-3 py-1 rounded-lg transition ${
                  adminEmbedTheme === 'dark'
                    ? 'bg-slate-950 text-amber-300 shadow-xs ring-1 ring-amber-400/40'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🌙 מצב כהה קבוע
              </button>
              <button
                type="button"
                onClick={() => setAdminEmbedTheme('light')}
                className={`px-3 py-1 rounded-lg transition ${
                  adminEmbedTheme === 'light'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                ☀️ מצב בהיר קבוע
              </button>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {adminEmbedTheme === 'dark' ? 'הווידג\'ט ייטען תמיד ברקע כהה מותאם' : adminEmbedTheme === 'light' ? 'הווידג\'ט ייטען תמיד ברקע בהיר' : 'הווידג\'ט יתאים את עצמו להגדרת המכשיר של הגולש'}
          </span>
        </div>

        <div className="p-3 bg-slate-950 text-amber-300 font-mono text-xs rounded-xl overflow-x-auto text-left border border-slate-800" dir="ltr">
          {embedCode}
        </div>
      </div>
      )}

      {/* TAB 4: STATEMENTS MANAGEMENT */}
      {adminSubTab === 'moderation' && (() => {
        const pendingQueue = allStatements.filter(s => s.status === 'pending_approval' || s.status === 'pending' || s.status === 'scheduled_auto');
        const approvedCount = allStatements.filter(s => s.status === 'approved').length;
        const rejectedCount = allStatements.filter(s => s.status === 'rejected').length;

        return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5 transition-colors">
        
        {/* Requirement 3: 3 Flexible Publishing Modes Selector for Editor */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">הגדרת מצב פרסום ובקרת עורך (3 מצבים גמישים):</span>
              <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">בחר מצב עבודה עבור הצעות תושבים חדשות:</h4>
            </div>
            <span className="text-xs px-3 py-1 rounded-full font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 self-start sm:self-auto">
              מצב פעיל: {(currentTopic.moderation_mode === 'auto_publish' ? '⏱️ טייס אוטומטי (3 שעות)' : currentTopic.moderation_mode === 'instant_publish' ? '⚡ פרסום מיידי' : '🛡️ אישור עורך בבאץ')}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <button
              type="button"
              onClick={() => handleUpdateModerationMode('batch_approval')}
              className={`p-3.5 rounded-xl border text-right transition flex flex-col justify-between cursor-pointer ${
                (currentTopic.moderation_mode || 'batch_approval') === 'batch_approval'
                  ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 ring-2 ring-amber-400/40 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-black text-slate-900 dark:text-white">1. אישור עורך בבאץ' (ברירת מחדל)</span>
                {(currentTopic.moderation_mode || 'batch_approval') === 'batch_approval' && <CheckCircle className="w-4 h-4 text-amber-600 shrink-0" />}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                היגדים ממתינים בתור לאישור גורף בקליק אחד (Batch Approve). אפס עומס ושליטה מלאה.
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleUpdateModerationMode('auto_publish')}
              className={`p-3.5 rounded-xl border text-right transition flex flex-col justify-between cursor-pointer ${
                currentTopic.moderation_mode === 'auto_publish'
                  ? 'border-purple-500 bg-purple-50/80 dark:bg-purple-950/40 ring-2 ring-purple-400/40 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-black text-slate-900 dark:text-white">2. טייס אוטומטי מבוקר (Auto-Publish)</span>
                {currentTopic.moderation_mode === 'auto_publish' && <CheckCircle className="w-4 h-4 text-purple-600 shrink-0" />}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                טיימר 3 שעות: היגדים שעברו סינון AI מתפרסמים מעצמם אלא אם העורך מטיל וטו ודוחה אותם.
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleUpdateModerationMode('instant_publish')}
              className={`p-3.5 rounded-xl border text-right transition flex flex-col justify-between cursor-pointer ${
                currentTopic.moderation_mode === 'instant_publish'
                  ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 ring-2 ring-emerald-400/40 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-black text-slate-900 dark:text-white">3. פרסום מיידי לאחר סינון AI</span>
                {currentTopic.moderation_mode === 'instant_publish' && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                מיועד לימי שיא ועומס: עלייה מיידית לאוויר עם אפשרות מחיקה ועריכה עריכתית בכל עת.
              </span>
            </button>
          </div>
        </div>

        {/* Requirement 3: Dedicated Pending Queue Box & 1-Click Batch Approval */}
        {pendingQueue.length > 0 && (
          <div className="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <span className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold shrink-0">
                  <Clock className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>תור הצעות תושבים הממתינות לאישור ({pendingQueue.length})</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-950 text-amber-900 dark:text-amber-200 font-bold">One-Click Approval</span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    הצעות נקיות שעברו את משפך הסינון החכם של ה-AI ללא לשון הרע וללא כפילויות, מוכנות לאישור העורך
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedQueueIds.length === pendingQueue.length) {
                      setSelectedQueueIds([]);
                    } else {
                      setSelectedQueueIds(pendingQueue.map(s => s.id));
                    }
                  }}
                  className="w-full sm:w-auto text-center px-4 py-2.5 sm:py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition cursor-pointer"
                >
                  {selectedQueueIds.length === pendingQueue.length ? 'בטל בחירת הכל' : 'בחר הכל'}
                </button>

                <button
                  type="button"
                  onClick={handleBatchApprove}
                  disabled={batchApproving || selectedQueueIds.length === 0}
                  className="w-full sm:w-auto justify-center px-5 py-3 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2 cursor-pointer active:scale-98"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>אשר את כל הנבחרים בלחיצת כפתור ({selectedQueueIds.length}) ✓</span>
                </button>
              </div>
            </div>

            {/* Queue List Items */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto">
              {pendingQueue.map(item => {
                const isSelected = selectedQueueIds.includes(item.id);
                const autoPublishDate = item.auto_publish_at ? new Date(item.auto_publish_at) : null;
                const minutesLeft = autoPublishDate ? Math.max(0, Math.round((autoPublishDate.getTime() - Date.now()) / 60000)) : null;

                return (
                  <div key={item.id} className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedQueueIds(prev => 
                            prev.includes(item.id) ? prev.filter(x => x !== item.id) : [...prev, item.id]
                          );
                        }}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 shrink-0 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          "{item.text}"
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1">
                          <span>מזהה #{item.id}</span>
                          {item.status === 'scheduled_auto' && minutesLeft !== null && (
                            <span className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-1 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md">
                              <Clock className="w-3 h-3" />
                              <span>פרסום אוטומטי בעוד {Math.floor(minutesLeft / 60)} ש' ו-{minutesLeft % 60} דק' (זכות וטו פעילה)</span>
                            </span>
                          )}
                          {item.status === 'pending_approval' && (
                            <span className="text-amber-600 font-bold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">ממתין לאישור עורך (One-Click)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(item.id, 'approved')}
                        className="flex-1 sm:flex-none justify-center px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                        title="אשר היגד זה בלבד"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>אשר</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(item.id, 'rejected')}
                        className="flex-1 sm:flex-none justify-center px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                        title="פסול היגד זה (זכות וטו)"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>פסול (וטו)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              כלל ההיגדים בזירה
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              צפייה בהיגדים שאושרו להצבעת הציבור, תור הממתינים והיגדים שנפסלו
            </p>
          </div>

          {/* Status Filter: אושרו / תור ממתין / נדחו */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-2 cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>אושרו ופעילים</span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                {approvedCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('queue')}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-2 cursor-pointer ${
                statusFilter === 'queue'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>תור ממתין לאישור</span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                {pendingQueue.length}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3.5 py-1.5 rounded-lg transition flex items-center gap-2 cursor-pointer ${
                statusFilter === 'rejected'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>נפסלו</span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200">
                {rejectedCount}
              </span>
            </button>

            <button
              onClick={() => loadStatements()}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
              title="רענן מאגר היגדים"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Statements Table */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {statements.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
              לא נמצאו היגדים בסטטוס שנבחר.
            </div>
          ) : (
            statements.map(st => (
              <div key={st.id} className="py-4 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-400 dark:text-slate-500">#{st.id}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      st.status === 'approved'
                        ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                        : st.status === 'pending'
                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                        : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
                    }`}>
                      {st.status === 'approved' ? 'מאושר ופעיל' : st.status === 'pending' ? 'ממתין לבדיקה' : 'נדחה'}
                    </span>
                    {st.is_seed ? (
                      <span className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-md">
                        היגד פתיחה (Seed)
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md">
                        הצעת גולש
                      </span>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-1.5">
                    {st.status !== 'approved' && (
                      <button
                        onClick={() => handleStatusChange(st.id, 'approved')}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1"
                        title="אשר היגד זה"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>אשר</span>
                      </button>
                    )}

                    {st.status !== 'rejected' && (
                      <button
                        onClick={() => handleStatusChange(st.id, 'rejected')}
                        className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/50 hover:bg-rose-200 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-300 font-bold text-xs transition flex items-center gap-1"
                        title="דחה היגד זה"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>דחה</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setEditingId(st.id);
                        setEditText(st.text);
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition"
                      title="ערוך ניסוח"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteStatement(st.id)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-slate-500 hover:text-rose-600 transition"
                      title="מחק היגד לצמיתות"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {editingId === st.id ? (
                  <div className="pt-2 space-y-2">
                    <textarea
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      rows={2}
                      className="w-full p-3 rounded-xl border border-blue-400 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveEdit(st.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>שמור שינויים</span>
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>ביטול</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">
                    "{st.text}"
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
        );
      })()}

      {/* TAB 5: AI NEWSPAPER REPORT GENERATOR */}
      {adminSubTab === 'report' && (
        <div className="space-y-4">
          {analytics ? (
            <AIReportView topic={currentTopic} analytics={analytics} darkMode={darkMode} />
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              טוען נתוני דוח קונצנזוס...
            </div>
          )}
        </div>
      )}

      {/* TAB 6: CONSENSUS DASHBOARD (READ-ONLY VIEW FOR EDITORS - NO VOTING) */}
      {adminSubTab === 'results' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-xs font-bold text-emerald-800 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>תצוגת עורכים וניתוח מעמיק: גרפים, היגדי גישור ומחלוקות (ללא הצבעות)</span>
            </div>
            {onNavigateToVote && (
              <button
                onClick={handleRequestNavigateToVote}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                title="אזהרה: לחיצה תוציא אותך ממסך הניהול ותעביר אותך לשאלון האזרחי"
              >
                <span>מעבר להצבעה בשאלון האזרחי ↗</span>
              </button>
            )}
          </div>
          {analytics ? (
            <ConsensusDashboard
              analytics={analytics}
              onRefresh={onStatementsChanged}
              onNavigateToVote={() => onNavigateToVote && onNavigateToVote()}
            />
          ) : (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs text-slate-400">
              טוען נתוני מפת תוצאות...
            </div>
          )}
        </div>
      )}

      {/* MODAL: CREATE NEW TOPIC */}
      {showNewTopicModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl max-h-[92vh] overflow-y-auto space-y-5 transition-colors">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  פתיחת זירת דיון וקונצנזוס חדשה
                </h3>
              </div>
              <button
                onClick={() => setShowNewTopicModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs sm:text-sm font-bold flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleCreateTopicSubmit} className="space-y-4">
              {/* Topic Type Selector: Weekly vs Special */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-amber-500" />
                    <span>סוג זירת הדיון *</span>
                  </span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {newTopicType === 'weekly' ? 'משאל שבועי מרכזי' : 'משאל בזק מקביל'}
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setNewTopicType('weekly');
                      setErrorMessage(null);
                    }}
                    className={`p-3 rounded-xl border text-right transition cursor-pointer ${
                      newTopicType === 'weekly'
                        ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-500 shadow-xs ring-1 ring-blue-400'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>📅 זירה שבועית רגילה</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-bold">ראשית</span>
                      </span>
                      {newTopicType === 'weekly' && <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      הסקר השבועי המרכזי של העיתון. הנוהל מאפשר זירה שבועית פעילה אחת בכל עת.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewTopicType('special');
                      setErrorMessage(null);
                    }}
                    className={`p-3 rounded-xl border text-right transition cursor-pointer ${
                      newTopicType === 'special'
                        ? 'bg-purple-50/90 dark:bg-purple-950/50 border-purple-500 shadow-xs ring-1 ring-purple-400'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>⚡ זירה שלא מן המניין (בזק)</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-bold">מקבילה</span>
                      </span>
                      {newTopicType === 'special' && <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      משאל מתפרץ על אירוע בוער. פועל במקביל לזירה השבועית ומופיע למצביעים לבחירה.
                    </p>
                  </button>
                </div>

                {/* Warning if weekly topic is selected and one is already active */}
                {newTopicType === 'weekly' && (() => {
                  const activeWeekly = topics.find(t => 
                    (t.topic_type === 'weekly' || !t.topic_type) && 
                    (!t.closes_at || new Date(t.closes_at).getTime() > Date.now())
                  );
                  if (!activeWeekly) return null;
                  return (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 text-xs space-y-2 mt-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">קיימת זירה שבועית פעילה כעת: </span>
                          <span className="font-extrabold underline">"{activeWeekly.title}"</span>
                          <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                            לא ניתן לקיים שתי זירות שבועיות במקביל. כדי להמשיך, יש לנעול את הזירה הקודמת או להגדיר זירה זו כ'זירה שלא מן המניין'.
                          </p>
                        </div>
                      </div>
                      <div className="pt-1">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 dark:text-white text-xs bg-white dark:bg-slate-950 p-2 rounded-lg border border-amber-300 dark:border-amber-700">
                          <input
                            type="checkbox"
                            checked={closePreviousWeekly}
                            onChange={e => setClosePreviousWeekly(e.target.checked)}
                            className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                          />
                          <span>נעל את הזירה השבועית הקודמת עם פתיחת זירה זו</span>
                        </label>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  כותרת הדיון / הסוגיה *
                </label>
                <input
                  type="text"
                  required
                  value={newTopicTitle}
                  onChange={e => setNewTopicTitle(e.target.value)}
                  placeholder="לדוגמה: הסדרת תחבורה ציבורית בסופי שבוע ומועדים..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  כותרת משנה / מטרת המשאל
                </label>
                <input
                  type="text"
                  value={newTopicSubtitle}
                  onChange={e => setNewTopicSubtitle(e.target.value)}
                  placeholder="מיפוי עמדות לאיתור פתרונות מוסכמים ומניעת חיכוכים..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    שם הארגון / המותג היוזם *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTopicOrg}
                    onChange={e => setNewTopicOrg(e.target.value)}
                    placeholder='ערב ערב באילת / מרכז הגישור הקהילתי'
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    קטגוריה ראשית (תבנית דיון)
                  </label>
                  <select
                    value={newTopicCategory}
                    onChange={e => handleCategoryChange(e.target.value as any)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                  >
                    <option value="municipal">עירוני ושיתוף ציבור</option>
                    <option value="mediation">גישור ויישוב סכסוכים</option>
                    <option value="committee">ועדות ציבוריות והנהלות</option>
                    <option value="consulting">ייעוץ ארגוני וניהולי</option>
                  </select>
                </div>
              </div>

              {/* Stakeholder Groups */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  קבוצות זיקה / מחנות דעה (3 קבוצות)
                </label>
                <div className="space-y-2">
                  {newTopicGroups.map((g, idx) => (
                    <div key={g.id} className="flex items-center gap-2">
                      <input
                        type="color"
                        value={g.color}
                        onChange={e => {
                          const updated = [...newTopicGroups];
                          updated[idx].color = e.target.value;
                          setNewTopicGroups(updated);
                        }}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={g.label}
                        onChange={e => {
                          const updated = [...newTopicGroups];
                          updated[idx].label = e.target.value;
                          setNewTopicGroups(updated);
                        }}
                        className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium"
                      />
                    </div>
                  ))}
                </div>
              </div>

                            {/* Publishing & Moderation Mode */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-2">
                <label className="text-xs font-bold text-amber-950 dark:text-amber-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>מדיניות סינון ופרסום היגדי קהילה</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTopicModerationMode('batch_approval')}
                    className={`p-2.5 rounded-xl border text-right transition ${
                      newTopicModerationMode === 'batch_approval'
                        ? 'bg-white dark:bg-slate-900 border-amber-500 shadow-sm'
                        : 'bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white">אישור בבאץ' בקליק (מומלץ)</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">עובר תור סינון לאישור העורך</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewTopicModerationMode('auto_publish')}
                    className={`p-2.5 rounded-xl border text-right transition ${
                      newTopicModerationMode === 'auto_publish'
                        ? 'bg-white dark:bg-slate-900 border-amber-500 shadow-sm'
                        : 'bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white">טייס אוטומטי מבוקר</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">פרסום לאחר 3 שעות ללא וטו</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewTopicModerationMode('instant_publish')}
                    className={`p-2.5 rounded-xl border text-right transition ${
                      newTopicModerationMode === 'instant_publish'
                        ? 'bg-white dark:bg-slate-900 border-amber-500 shadow-sm'
                        : 'bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white">פרסום מיידי (AI)</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">עלייה לאוויר מיד לאחר סינון</div>
                  </button>
                </div>
              </div>

              {/* Submissions Window (48h default) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>מועד נעילת הצעות הקהילה (חלון 48 שעות)</span>
                  </label>
                  {newTopicSubmissionsCloseAt && (
                    <button
                      type="button"
                      onClick={() => setNewTopicSubmissionsCloseAt('')}
                      className="text-[11px] text-rose-600 dark:text-rose-400 font-bold hover:underline"
                    >
                      ללא נעילה
                    </button>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="datetime-local"
                    value={newTopicSubmissionsCloseAt}
                    onChange={e => setNewTopicSubmissionsCloseAt(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:border-amber-500 outline-none font-medium"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setHours(d.getHours() + 48);
                        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                        setNewTopicSubmissionsCloseAt(d.toISOString().slice(0, 16));
                      }}
                      className="px-2.5 py-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition whitespace-nowrap"
                    >
                      48 שעות
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  לאחר מועד זה, הגולשים יוכלו להצביע בלבד ולא יוכלו להוסיף היגדים חדשים.
                </p>
              </div>

              {/* Closing Date and Time */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <CalendarClock className="w-4 h-4 text-amber-500" />
                    <span>תאריך ושעת סגירת המשאל (אופציונלי)</span>
                  </label>
                  {newTopicClosesAt && (
                    <button
                      type="button"
                      onClick={() => setNewTopicClosesAt('')}
                      className="text-[11px] text-rose-600 dark:text-rose-400 font-bold hover:underline"
                    >
                      ללא מועד סגירה (איפוס)
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="datetime-local"
                    value={newTopicClosesAt}
                    onChange={e => setNewTopicClosesAt(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:border-amber-500 outline-none font-medium"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setNewTopicClosesAt(getPresetDateTime(7))}
                      className="px-2.5 py-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition whitespace-nowrap"
                    >
                      שבוע
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTopicClosesAt(getPresetDateTime(14))}
                      className="px-2.5 py-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition whitespace-nowrap"
                    >
                      שבועיים
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTopicClosesAt(getPresetDateTime(30))}
                      className="px-2.5 py-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition whitespace-nowrap"
                    >
                      חודש
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  כאשר המועד יחלוף, המשאל יינעל באופן אוטומטי להצבעות נוספות ויוצג כמשאל שהסתיים.
                </p>
              </div>

              {/* Statements selection section */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>היגדי פתיחה להצבעה</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isMinimumMet
                          ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      }`}>
                        {statementsCount} / 5 לפחות
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isMinimumMet 
                        ? 'תנאי הסף להפעלת המשאל מולא בהצלחה! 👍' 
                        : `חובה לבחור או להזין לפחות 5 היגדים (נותרו עוד ${5 - statementsCount})`}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => loadSuggestions(newTopicCategory, newTopicTitle)}
                    disabled={loadingSuggestions}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/60 transition self-start sm:self-auto"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${loadingSuggestions ? 'animate-spin' : ''}`} />
                    <span>הצע היגדים ב-AI</span>
                  </button>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      isMinimumMet ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(100, (statementsCount / 5) * 100)}%` }}
                  />
                </div>

                {/* Selected statements list */}
                {selectedStatements.length > 0 && (
                  <div className="space-y-1.5 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      היגדים שנבחרו ({selectedStatements.length}):
                    </div>
                    {selectedStatements.map((text, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-start justify-between gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200"
                      >
                        <span className="shrink-0 font-bold text-amber-500">#{idx + 1}</span>
                        <span className="flex-1 leading-snug">{text}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveStatement(idx)}
                          className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition"
                          title="הסר היגד זה"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested statements */}
                {suggestedStatements.length > 0 && (
                  <div className="space-y-2 bg-purple-50/50 dark:bg-purple-950/20 p-3.5 rounded-2xl border border-purple-200 dark:border-purple-900/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-black text-purple-900 dark:text-purple-300">
                        <Lightbulb className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span>היגדים מומלצים לבחירה מהירה:</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddAllSuggestions}
                        className="text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:underline"
                      >
                        + בחר את כל המוצעים ({suggestedStatements.length})
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-52 overflow-y-auto">
                      {suggestedStatements.map((item, idx) => {
                        const isAlreadySelected = selectedStatements.includes(item);
                        return (
                          <div 
                            key={idx}
                            onClick={() => !isAlreadySelected && handleAddSuggestedStatement(item)}
                            className={`p-2.5 rounded-xl border text-xs text-right transition flex items-start justify-between gap-2 cursor-pointer ${
                              isAlreadySelected
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200 cursor-default opacity-80'
                                : 'bg-white dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <span className="flex-1 leading-snug">"{item}"</span>
                            <span className="shrink-0 mt-0.5">
                              {isAlreadySelected ? (
                                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-bold text-[11px]">
                                  <Plus className="w-3 h-3" />
                                  <span>הוסף</span>
                                </span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add custom statement */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    או הוסף היגד מקורי משלך:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customStatementInput}
                      onChange={e => setCustomStatementInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomStatement();
                        }
                      }}
                      placeholder="הקלד היגד חדש ולחץ על הוסף..."
                      className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:border-amber-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomStatement}
                      disabled={!customStatementInput.trim()}
                      className="px-4 py-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>הוסף היגד</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Form buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {!isMinimumMet ? (
                    <span className="text-amber-600 dark:text-amber-400 font-bold">
                      ⚠️ נדרשים 5 היגדים לפחות לפתיחת הזירה
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>הוגדרו {statementsCount} היגדים – מוכן לפתיחה!</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewTopicModal(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
                  >
                    ביטול
                  </button>
                  <button
                    type="submit"
                    disabled={creatingTopic || !isMinimumMet}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-black shadow-md flex items-center gap-1.5 transition"
                    title={!isMinimumMet ? 'חובה לבחור לפחות 5 היגדים' : 'לחץ לפתיחת הזירה'}
                  >
                    {creatingTopic ? 'פותח זירה...' : 'צור זירה והתחל משאל'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: EDIT TOPIC (ALLOWED ONLY IF NO VOTES YET) */}
      {showEditTopicModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5 transition-colors">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {editingTopicVotes > 0 ? 'עריכת הגדרות וסטטוס זירה' : 'עריכת פרטי והגדרות זירת דיון'}
                </h3>
              </div>
              <button
                onClick={() => setShowEditTopicModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editingTopicVotes > 0 && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 text-xs flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>
                  בזירה זו נרשמו כבר {editingTopicVotes} הצבעות. שדות כותרת וקבוצות נעולים כדי לשמור על מהימנות ההצבעות, אך סוג הזירה (שבועית / שלא מן המניין), מועדי הסגירה ומצב הסינון פתוחים לעדכון תמיד.
                </span>
              </div>
            )}

            {editErrorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs sm:text-sm font-bold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{editErrorMessage}</span>
              </div>
            )}

            <form onSubmit={handleUpdateTopicSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  כותרת הדיון / הסוגיה *
                  {editingTopicVotes > 0 && <span className="text-[10px] text-slate-400 mr-1.5">(נעול)</span>}
                </label>
                <input
                  type="text"
                  required
                  disabled={editingTopicVotes > 0}
                  value={editTopicTitle}
                  onChange={e => setEditTopicTitle(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 disabled:bg-slate-100 dark:disabled:bg-slate-900 text-slate-900 dark:text-white disabled:text-slate-500 text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  כותרת משנה / מטרת המשאל
                </label>
                <input
                  type="text"
                  disabled={editingTopicVotes > 0}
                  value={editTopicSubtitle}
                  onChange={e => setEditTopicSubtitle(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 disabled:bg-slate-100 dark:disabled:bg-slate-900 text-slate-900 dark:text-white disabled:text-slate-500 text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60">
                  <label className="block text-xs font-black text-purple-950 dark:text-purple-300 mb-1 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-purple-600" />
                    <span>סוג זירה (סטטוס)</span>
                  </label>
                  <select
                    value={editTopicType}
                    onChange={e => setEditTopicType(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold outline-none"
                  >
                    <option value="weekly">📅 זירה שבועית רגילה</option>
                    <option value="special">⚡ זירה שלא מן המניין (בזק)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    שם הארגון / המותג היוזם *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={editingTopicVotes > 0}
                    value={editTopicOrg}
                    onChange={e => setEditTopicOrg(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 disabled:bg-slate-100 dark:disabled:bg-slate-900 text-slate-900 dark:text-white disabled:text-slate-500 text-xs focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    קטגוריה
                  </label>
                  <select
                    disabled={editingTopicVotes > 0}
                    value={editTopicCategory}
                    onChange={e => setEditTopicCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 disabled:bg-slate-100 dark:disabled:bg-slate-900 text-slate-900 dark:text-white disabled:text-slate-500 text-xs focus:border-blue-500 outline-none"
                  >
                    <option value="municipal">עירוני ושיתוף ציבור</option>
                    <option value="mediation">גישור ויישוב סכסוכים</option>
                    <option value="committee">ועדות ציבוריות והנהלות</option>
                    <option value="consulting">ייעוץ ארגוני וניהולי</option>
                  </select>
                </div>
              </div>

              {/* Stakeholder Groups */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  קבוצות זיקה
                </label>
                <div className="space-y-2">
                  {editTopicGroups.map((g, idx) => (
                    <div key={g.id} className="flex items-center gap-2">
                      <input
                        type="color"
                        value={g.color}
                        onChange={e => {
                          const updated = [...editTopicGroups];
                          updated[idx].color = e.target.value;
                          setEditTopicGroups(updated);
                        }}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={g.label}
                        onChange={e => {
                          const updated = [...editTopicGroups];
                          updated[idx].label = e.target.value;
                          setEditTopicGroups(updated);
                        }}
                        className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium"
                      />
                    </div>
                  ))}
                </div>
              </div>

                            {/* Publishing & Moderation Mode */}
              <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 space-y-2">
                <label className="text-xs font-bold text-blue-950 dark:text-blue-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>מדיניות סינון ופרסום היגדי קהילה</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditTopicModerationMode('batch_approval')}
                    className={`p-2.5 rounded-xl border text-right transition ${
                      editTopicModerationMode === 'batch_approval'
                        ? 'bg-white dark:bg-slate-900 border-blue-500 shadow-sm'
                        : 'bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white">אישור בבאץ' בקליק (מומלץ)</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">עובר תור סינון לאישור העורך</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditTopicModerationMode('auto_publish')}
                    className={`p-2.5 rounded-xl border text-right transition ${
                      editTopicModerationMode === 'auto_publish'
                        ? 'bg-white dark:bg-slate-900 border-blue-500 shadow-sm'
                        : 'bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white">טייס אוטומטי מבוקר</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">פרסום לאחר 3 שעות ללא וטו</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditTopicModerationMode('instant_publish')}
                    className={`p-2.5 rounded-xl border text-right transition ${
                      editTopicModerationMode === 'instant_publish'
                        ? 'bg-white dark:bg-slate-900 border-blue-500 shadow-sm'
                        : 'bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-900 dark:text-white">פרסום מיידי (AI)</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">עלייה לאוויר מיד לאחר סינון</div>
                  </button>
                </div>
              </div>

              {/* Submissions Window (48h default) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span>מועד נעילת הצעות הקהילה (חלון 48 שעות)</span>
                  </label>
                  {editTopicSubmissionsCloseAt && (
                    <button
                      type="button"
                      onClick={() => setEditTopicSubmissionsCloseAt('')}
                      className="text-[11px] text-rose-600 dark:text-rose-400 font-bold hover:underline"
                    >
                      ללא נעילה
                    </button>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="datetime-local"
                    value={editTopicSubmissionsCloseAt}
                    onChange={e => setEditTopicSubmissionsCloseAt(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:border-blue-500 outline-none font-medium"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setHours(d.getHours() + 48);
                        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                        setEditTopicSubmissionsCloseAt(d.toISOString().slice(0, 16));
                      }}
                      className="px-2.5 py-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition whitespace-nowrap"
                    >
                      48 שעות
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  לאחר מועד זה, הגולשים יוכלו להצביע בלבד ולא יוכלו להוסיף היגדים חדשים.
                </p>
              </div>

              {/* Closing Date and Time */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <CalendarClock className="w-4 h-4 text-blue-500" />
                    <span>תאריך ושעת סגירת המשאל</span>
                  </label>
                  {editTopicClosesAt && (
                    <button
                      type="button"
                      onClick={() => setEditTopicClosesAt('')}
                      className="text-[11px] text-rose-600 dark:text-rose-400 font-bold hover:underline"
                    >
                      ללא מועד סגירה (איפוס)
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="datetime-local"
                    value={editTopicClosesAt}
                    onChange={e => setEditTopicClosesAt(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:border-blue-500 outline-none font-medium"
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditTopicClosesAt(getPresetDateTime(7))}
                      className="px-2.5 py-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition whitespace-nowrap"
                    >
                      שבוע
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditTopicClosesAt(getPresetDateTime(14))}
                      className="px-2.5 py-2 rounded-xl bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition whitespace-nowrap"
                    >
                      שבועיים
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditTopicModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={updatingTopic}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition"
                >
                  {updatingTopic ? 'מעדכן...' : 'שמור שינויים'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* WARNING MODAL: EXITING ADMIN SCREEN TO CITIZEN QUESTIONNAIRE */}
      {showExitWarningModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-right transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                אזהרת יציאה ממסך הניהול
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                לחיצה על כניסה לשאלון <strong className="text-amber-600 dark:text-amber-400">תוציא אותך לחלוטין ממסך האדמין</strong> ותעביר אותך לתצוגת האזרח וההצבעה החיה.
              </p>
              <div className="p-3 mt-3 bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 text-right space-y-1.5">
                <div className="flex items-start gap-1.5">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>במסך האזרח <strong>לא יוצגו</strong> כלי ניהול, סינון תוכן או מחולל דוחות.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>תוכל לחזור למסך הניהול דרך הקישור <strong>"כניסת עורכים ומנהלים 🔐"</strong> בתחתית העמוד (Footer) או בכתובת <code>?tab=admin</code>.</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.open(`${window.location.origin}/?topic=${encodeURIComponent(currentTopic.id)}`, '_blank');
                  setShowExitWarningModal(false);
                }}
                className="w-full py-3 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border border-blue-200 dark:border-blue-800"
              >
                <span>מומלץ: פתח שאלון תושב בלשונית נפרדת (הישאר כאדמין) ↗</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowExitWarningModal(false);
                  if (onNavigateToVote) onNavigateToVote();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>הבנתי, העבר אותי לשאלון האזרחי באותו חלון 👤</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExitWarningModal(false)}
                className="w-full py-2 px-4 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition cursor-pointer"
              >
                <span>ביטול (הישאר במסך הניהול)</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
