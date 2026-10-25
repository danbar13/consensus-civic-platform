import React, { useState, useEffect } from 'react';
import type { Topic, Statement } from '../types';
import { 
  fetchStatements, 
  updateStatement, 
  deleteStatement, 
  createTopic, 
  updateTopic,
  deleteTopic,
  fetchSuggestedStatements 
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
  CalendarClock
} from 'lucide-react';

interface AdminViewProps {
  currentTopic: Topic;
  topics: Topic[];
  onTopicCreated: (newTopic: Topic) => void;
  onTopicUpdated: (updatedTopic: Topic) => void;
  onTopicDeleted: (deletedId: string) => void;
  onStatementsChanged: () => void;
  onSelectTopic: (topicId: string) => void;
  onReturnToPitch?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  currentTopic,
  topics,
  onTopicCreated,
  onTopicUpdated,
  onTopicDeleted,
  onStatementsChanged,
  onSelectTopic,
  onReturnToPitch
}) => {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  // New topic modal form state
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicSubtitle, setNewTopicSubtitle] = useState('');
  const [newTopicOrg, setNewTopicOrg] = useState('ערב ערב באילת – המצפן העירוני');
  const [newTopicCategory, setNewTopicCategory] = useState<'municipal' | 'mediation' | 'committee' | 'consulting'>('municipal');
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

  // Edit topic modal state (allowed only if 0 votes!)
  const [showEditTopicModal, setShowEditTopicModal] = useState(false);
  const [editTopicTitle, setEditTopicTitle] = useState('');
  const [editTopicSubtitle, setEditTopicSubtitle] = useState('');
  const [editTopicOrg, setEditTopicOrg] = useState('');
  const [editTopicCategory, setEditTopicCategory] = useState<'municipal' | 'mediation' | 'committee' | 'consulting'>('municipal');
  const [editTopicClosesAt, setEditTopicClosesAt] = useState<string>('');
  const [editTopicGroups, setEditTopicGroups] = useState<{ id: string; label: string; color: string }[]>([]);
  const [updatingTopic, setUpdatingTopic] = useState(false);
  const [editErrorMessage, setEditErrorMessage] = useState<string | null>(null);

  // Action feedback message
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadStatements = async () => {
    try {
      const data = await fetchStatements(currentTopic.id, statusFilter);
      setStatements(data);
    } catch (err) {
      console.error('Error fetching statements:', err);
    }
  };

  useEffect(() => {
    loadStatements();
  }, [currentTopic.id, statusFilter]);

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
    setEditTopicTitle(t.title);
    setEditTopicSubtitle(t.subtitle || '');
    setEditTopicOrg(t.organization);
    setEditTopicCategory(t.category);
    setEditTopicGroups(t.groups || []);
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

    if (!editTopicTitle.trim() || !editTopicOrg.trim()) {
      setEditErrorMessage('נא למלא כותרת ושם ארגון.');
      return;
    }

    setUpdatingTopic(true);
    try {
      const updated = await updateTopic(currentTopic.id, {
        title: editTopicTitle.trim(),
        subtitle: editTopicSubtitle.trim(),
        organization: editTopicOrg.trim(),
        category: editTopicCategory,
        groups: editTopicGroups,
        closes_at: editTopicClosesAt ? new Date(editTopicClosesAt).toISOString() : null
      });

      setShowEditTopicModal(false);
      onTopicUpdated(updated);
      setActionSuccess('פרטי זירת הדיון עודכנו בהצלחה!');
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

    setCreatingTopic(true);
    try {
      const created = await createTopic({
        title: newTopicTitle.trim(),
        subtitle: newTopicSubtitle.trim(),
        organization: newTopicOrg.trim(),
        category: newTopicCategory,
        groups: newTopicGroups,
        initialStatements: selectedStatements,
        closes_at: newTopicClosesAt ? new Date(newTopicClosesAt).toISOString() : null
      });

      setShowNewTopicModal(false);
      setSelectedStatements([]);
      setNewTopicTitle('');
      setNewTopicSubtitle('');
      setNewTopicClosesAt('');
      onTopicCreated(created);
    } catch (err: any) {
      console.error('Error creating topic:', err);
      setErrorMessage(err.message || 'שגיאה ביצירת הזירה');
    } finally {
      setCreatingTopic(false);
    }
  };

  const embedUrl = `${window.location.origin}/?topic=${currentTopic.id}&embed=true`;
  const embedCode = `<iframe src="${embedUrl}" width="100%" height="720" frameborder="0" style="border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;" allow="clipboard-write"></iframe>`;

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

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      
      {/* Back to Pitch Deck button if launched from pitch */}
      {onReturnToPitch && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 shadow-xs">
          <div className="text-xs font-bold text-amber-950 dark:text-amber-200">
            אתה צופה במערכת הניהול והסינון של "המצפן העירוני"
          </div>
          <button
            onClick={onReturnToPitch}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs shadow-xs transition"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>חזור לדף הנחיתה ↩️</span>
          </button>
        </div>
      )}

      {/* SUCCESS TOAST */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-sm font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 1. TOPIC CONTROL & MANAGEMENT PANEL */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                <Settings className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                ניהול זירת הדיון הפעילה
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              ארגון: <span className="font-bold text-slate-900 dark:text-slate-200">{currentTopic.organization}</span>
            </p>
          </div>

          <button
            onClick={handleOpenNewTopicModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-sm transition self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>פתח זירה חדשה</span>
          </button>
        </div>

        {/* Current Topic Card with Edit/Delete Actions */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  זירה במיקוד: {currentTopic.id}
                </span>

                {/* Closing status badge */}
                {(() => {
                  const closing = getClosingStatus(currentTopic.closes_at);
                  if (!closing) return null;
                  return closing.isPast ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 text-[11px] font-bold border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                      <span>המשאל נסגר ב-{closing.formatted}</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 text-[11px] font-bold border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>מועד סגירה: {closing.formatted}</span>
                    </span>
                  );
                })()}
                
                {/* Editable vs Locked Badge */}
                {isCurrentTopicEditable ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                    <Unlock className="w-3 h-3" />
                    <span>0 תגובות – פתוח לעריכה</span>
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold border border-slate-300 dark:border-slate-700 flex items-center gap-1" title="זירה זו כבר צברה תגובות מן הציבור ולכן נעולה לעריכה כדי למנוע הטיית הצבעות שכבר נאספו">
                    <Lock className="w-3 h-3 text-slate-500" />
                    <span>נרשמו {currentVotesCount} הצבעות – נעול לעריכה</span>
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                {currentTopic.title}
              </h3>
              {currentTopic.subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {currentTopic.subtitle}
                </p>
              )}
            </div>

            {/* Action Buttons for Topic: Edit & Delete */}
            <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
              {/* Edit Topic Button */}
              {isCurrentTopicEditable ? (
                <button
                  onClick={() => handleOpenEditModal(currentTopic)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>ערוך נושא</span>
                </button>
              ) : (
                <button
                  disabled
                  className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 font-bold text-xs flex items-center gap-1.5 cursor-not-allowed opacity-60"
                  title="לא ניתן לערוך נושא לאחר שכבר התקבלו בו הצבעות ותגובות"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>נעול לעריכה</span>
                </button>
              )}

              {/* Delete Topic Button */}
              <button
                onClick={() => handleDeleteTopic(currentTopic.id, currentTopic.title)}
                disabled={topics.length <= 1}
                className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-40"
                title={topics.length <= 1 ? 'לא ניתן למחוק את הזירה היחידה' : 'מחק זירה זו וכל ההצבעות עליה'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>מחק זירה</span>
              </button>
            </div>
          </div>
        </div>

        {/* ALL TOPICS OVERVIEW & SWITCHER TABLE */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-400" />
              <span>כלל זירות הדיון במערכת ({topics.length}):</span>
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
            {topics.map(t => {
              const isActive = t.id === currentTopic.id;
              const tVotes = t.stats?.totalVotes || 0;
              const isEditable = tVotes === 0;

              return (
                <div 
                  key={t.id} 
                  className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                    isActive ? 'bg-amber-50/50 dark:bg-amber-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{t.organization}</span>
                      {isActive && (
                        <span className="px-2 py-0.2 rounded text-[10px] font-black bg-amber-400 text-slate-950">
                          זירה פעילה
                        </span>
                      )}
                      {(() => {
                        const closing = getClosingStatus(t.closes_at);
                        if (!closing) return null;
                        return closing.isPast ? (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" /> נסגר
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-0.5" title={`נסגר ב-${closing.formatted}`}>
                            <Clock className="w-2.5 h-2.5" /> עד {closing.shortDate}
                          </span>
                        );
                      })()}
                      {isEditable ? (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                          <Unlock className="w-2.5 h-2.5" /> 0 תגובות
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> {tVotes} הצבעות
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {t.title}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isActive && (
                      <button
                        onClick={() => onSelectTopic(t.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition"
                      >
                        בחר זירה
                      </button>
                    )}

                    {isEditable ? (
                      <button
                        onClick={() => handleOpenEditModal(t)}
                        className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 transition"
                        title="ערוך זירה זו"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="p-1.5 text-slate-300 dark:text-slate-700" title="נעול לעריכה מכיוון שכבר נרשמו הצבעות">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    )}

                    <button
                      onClick={() => handleDeleteTopic(t.id, t.title)}
                      disabled={topics.length <= 1}
                      className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 transition disabled:opacity-30"
                      title="מחק זירה זו"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. EMBED SNIPPET GENERATOR */}
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

        <div className="p-3 bg-slate-950 text-amber-300 font-mono text-xs rounded-xl overflow-x-auto text-left border border-slate-800" dir="ltr">
          {embedCode}
        </div>
      </div>

      {/* 3. MODERATION & STATEMENTS MANAGEMENT */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              ניהול ואישור היגדים בזירה זו (Moderation Queue)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              אישור הצעות גולשים, עריכת ניסוחים ומחיקת היגדים לא הולמים
            </p>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  statusFilter === status
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {status === 'all' && 'הכל'}
                {status === 'pending' && 'ממתינים לאישור'}
                {status === 'approved' && 'מאושרים'}
                {status === 'rejected' && 'נדחו'}
              </button>
            ))}
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

      {/* 4. MODAL: CREATE NEW TOPIC */}
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
                  עריכת זירת דיון (טרם התקבלו הצבעות)
                </h3>
              </div>
              <button
                onClick={() => setShowEditTopicModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

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
                </label>
                <input
                  type="text"
                  required
                  value={editTopicTitle}
                  onChange={e => setEditTopicTitle(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  כותרת משנה / מטרת המשאל
                </label>
                <input
                  type="text"
                  value={editTopicSubtitle}
                  onChange={e => setEditTopicSubtitle(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
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
                    value={editTopicOrg}
                    onChange={e => setEditTopicOrg(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    קטגוריה
                  </label>
                  <select
                    value={editTopicCategory}
                    onChange={e => setEditTopicCategory(e.target.value as any)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:border-blue-500 outline-none"
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

    </div>
  );
};
