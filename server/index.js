import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

import { db, initDatabase } from './db.js';
import { computeTopicAnalytics } from './analytics.js';
import { moderateStatement, generateConsensusReport, suggestTopicStatements } from './ai.js';
import { checkSupabaseStatus, syncStatementToSupabase } from './supabase.js';
import { 
  initSupabaseCloud, 
  ensureSupabaseCloud,
  isCloudActive, 
  cloudGetTopics, 
  cloudGetTopic, 
  cloudCreateTopic, 
  cloudUpdateTopic,
  cloudDeleteTopic,
  cloudGetTopicVotesCount,
  cloudGetStatements, 
  cloudCreateStatement, 
  cloudUpdateStatement,
  cloudDeleteStatement,
  cloudRecordVote, 
  cloudGetVotesForTopic,
  cloudGetUserVotes,
  cloudCountUserSubmissions
} from './supabaseDb.js';
import { statementRateLimiter, voteRateLimiter, adminLoginRateLimiter, generalApiRateLimiter } from './rateLimiter.js';
import { generateAdminToken, verifyAdminToken } from './auth.js';
import { getAIStats, requestLogger, logSecurityEvent } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB and auto-seed if empty
initDatabase();
initSupabaseCloud().catch(err => console.warn('Supabase init notice:', err.message));

const app = express();
const PORT = process.env.PORT || 3001;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'eilat-admin-2025';

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(cors());
app.use(express.json());

// HTTP Request Logger for API calls
app.use(requestLogger);

// Global API Rate Limiter
app.use('/api', generalApiRateLimiter);

// Ensure Cloud DB is initialized before handling API requests
app.use('/api', async (req, res, next) => {
  try {
    await ensureSupabaseCloud();
  } catch {}
  next();
});

// Admin authentication middleware for protected management routes
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader;
  const customPass = req.headers['x-admin-password'] || '';

  if (verifyAdminToken(token) || verifyAdminToken(customPass)) {
    return next();
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'ip-default';
  logSecurityEvent('UNAUTHORIZED_ACCESS', {
    ip,
    route: `${req.method} ${req.originalUrl}`,
    details: 'Missing or invalid admin bearer token'
  });

  return res.status(401).json({ error: 'נדרשת סיסמת מנהל מורשה לביצוע פעולה זו.', unauthorized: true });
}

// -------------------------------------------------------------
// ADMIN AUTH & OBSERVABILITY ENDPOINTS
// -------------------------------------------------------------

// Verify Admin Password with brute-force rate limiter and cryptographically signed token
app.post('/api/admin/verify', adminLoginRateLimiter, (req, res) => {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'ip-default';
  try {
    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ success: false, error: 'יש להזין סיסמת מנהל' });
    }

    if (password === ADMIN_PASSWORD) {
      const token = generateAdminToken();
      logSecurityEvent('ADMIN_LOGIN_SUCCESS', { ip, route: '/api/admin/verify', details: 'Admin authenticated successfully' });
      return res.json({ success: true, token });
    }

    logSecurityEvent('ADMIN_LOGIN_FAILED', { ip, route: '/api/admin/verify', details: 'Incorrect password attempt' });
    return res.status(401).json({ success: false, error: 'סיסמת מנהל שגויה. אנא נסה שוב.' });
  } catch (err) {
    logSecurityEvent('ADMIN_LOGIN_ERROR', { ip, route: '/api/admin/verify', details: err.message });
    res.status(500).json({ error: 'Admin authentication failed' });
  }
});

// AI Observability & Tracing Stats for Admin Panel
app.get('/api/admin/ai-stats', requireAdminAuth, (req, res) => {
  try {
    const stats = getAIStats();
    res.json(stats);
  } catch (err) {
    console.error('Error fetching AI stats:', err);
    res.status(500).json({ error: 'Failed to retrieve AI statistics' });
  }
});

// -------------------------------------------------------------
// TOPICS ENDPOINTS
// -------------------------------------------------------------

// List all topics with meta counts
app.get('/api/topics', async (req, res) => {
  try {
    const result = await cloudGetTopics();
    res.json(result);
  } catch (err) {
    console.error('Error fetching topics:', err);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

// Get single topic
app.get('/api/topics/:id', async (req, res) => {
  try {
    const topic = await cloudGetTopic(req.params.id);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });
    res.json(topic);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch topic' });
  }
});

// Create new topic
app.post('/api/topics', requireAdminAuth, async (req, res) => {
  try {
    const { 
      id, 
      title, 
      subtitle, 
      organization, 
      category, 
      groups, 
      initialStatements, 
      topic_type, 
      moderation_mode, 
      starts_at,
      submissions_close_at, 
      closes_at,
      close_previous_weekly 
    } = req.body;
    
    if (!title || !organization || !groups || groups.length === 0) {
      return res.status(400).json({ error: 'Missing required topic fields' });
    }

    const targetTopicType = topic_type === 'special' ? 'special' : 'weekly';

    // Enforcement: Only one regular weekly topic can be active at a time
    if (targetTopicType === 'weekly') {
      const allTopics = await cloudGetTopics();
      const activeWeekly = allTopics.find(t => 
        (t.topic_type === 'weekly' || !t.topic_type) && 
        (!t.closes_at || new Date(t.closes_at).getTime() > Date.now())
      );

      if (activeWeekly) {
        if (close_previous_weekly === true) {
          const nowIso = new Date().toISOString();
          await cloudUpdateTopic({ 
            id: activeWeekly.id, 
            closes_at: nowIso, 
            submissions_close_at: nowIso 
          });
          console.log(`[Topics] Closed previous active weekly topic '${activeWeekly.title}' to open new weekly topic.`);
        } else {
          return res.status(400).json({ 
            error: `קיימת כבר זירה שבועית פעילה ("${activeWeekly.title}"). על פי הנוהל העיתונאי, לא ניתן לפתוח זירה שבועית נוספת כל עוד הקודמת פעילה. באפשרותך לסגור/לנעול את הזירה הקודמת, או להגדיר זירה זו כ"זירה שלא מן המניין" (בזק/מיוחדת).`,
            activeWeeklyTopic: {
              id: activeWeekly.id,
              title: activeWeekly.title
            }
          });
        }
      }
    }

    // Validate that at least 5 statements are provided
    const validStatements = Array.isArray(initialStatements)
      ? initialStatements.map(s => (typeof s === 'string' ? s.trim() : '')).filter(s => s.length > 0)
      : [];

    if (validStatements.length < 5) {
      return res.status(400).json({ 
        error: `חובה להזין לפחות 5 היגדי פתיחה לפתיחת זירת דיון (הוזנו רק ${validStatements.length})` 
      });
    }

    const topicId = id || (title.replace(/\s+/g, '-').slice(0, 30) + '-' + Date.now().toString(36));
    const now = new Date().toISOString();
    const defaultSubmissionsClose = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const created = await cloudCreateTopic({
      id: topicId,
      title,
      subtitle: subtitle || '',
      organization,
      category: category || 'municipal',
      groups,
      topic_type: targetTopicType,
      moderation_mode: moderation_mode || 'batch_approval',
      created_at: now,
      starts_at: starts_at || null,
      submissions_close_at: submissions_close_at || defaultSubmissionsClose,
      closes_at: closes_at || null
    });

    // Insert the validated seed statements
    for (let idx = 0; idx < validStatements.length; idx++) {
      const stText = validStatements[idx];
      const assignedGroup = groups[idx % groups.length]?.id || 'general';
      await cloudCreateStatement({
        topic_id: topicId,
        text: stText,
        author_group: assignedGroup,
        is_seed: true,
        status: 'approved',
        created_at: now
      });
    }

    res.status(201).json(created);
  } catch (err) {
    console.error('Error creating topic:', err);
    res.status(500).json({ error: 'Failed to create topic' });
  }
});

// Update topic (operational settings like moderation_mode, submissions_close_at and closes_at are always editable)
app.patch('/api/topics/:id', requireAdminAuth, async (req, res) => {
  try {
    const topicId = req.params.id;
    const topic = await cloudGetTopic(topicId);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });

    const { title, subtitle, organization, category, groups, topic_type, moderation_mode, starts_at, submissions_close_at, closes_at } = req.body;

    // Check if structural fields are being changed when topic already has votes
    const structuralChangeRequested = (title && title !== topic.title) || 
      (category && category !== topic.category) || 
      (groups && JSON.stringify(groups) !== JSON.stringify(topic.groups));

    if (structuralChangeRequested) {
      const votesCount = await cloudGetTopicVotesCount(topicId);
      if (votesCount > 0) {
        return res.status(400).json({ 
          error: `לא ניתן לשנות כותרת, קטגוריה או קבוצות בזירת דיון שכבר נרשמו בה הצבעות (${votesCount} הצבעות פעילות). ניתן לעדכן מועדי סגירה ומצב סינון.` 
        });
      }
    }

    const updated = await cloudUpdateTopic({
      id: topicId,
      title,
      subtitle,
      organization,
      category,
      groups,
      topic_type,
      moderation_mode,
      starts_at,
      submissions_close_at,
      closes_at
    });

    res.json(updated);
  } catch (err) {
    console.error('Error updating topic:', err);
    res.status(500).json({ error: 'Failed to update topic' });
  }
});

// Delete topic (and all associated statements & votes)
app.delete('/api/topics/:id', requireAdminAuth, async (req, res) => {
  try {
    const topicId = req.params.id;
    const topic = await cloudGetTopic(topicId);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });

    // Ensure at least one topic remains in the system
    const allTopics = await cloudGetTopics();
    if (allTopics.length <= 1) {
      return res.status(400).json({ error: 'לא ניתן למחוק את זירת הדיון היחידה שנותרה במערכת.' });
    }

    await cloudDeleteTopic(topicId);
    res.json({ success: true, deletedId: topicId });
  } catch (err) {
    console.error('Error deleting topic:', err);
    res.status(500).json({ error: 'Failed to delete topic' });
  }
});

// -------------------------------------------------------------
// STATEMENTS ENDPOINTS
// -------------------------------------------------------------

// Get statements for topic (optional status filter)
app.get('/api/topics/:id/statements', async (req, res) => {
  try {
    const status = req.query.status;
    const statements = await cloudGetStatements(req.params.id, status);
    res.json(statements);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch statements' });
  }
});

// Submit a new statement (protected with rate limiter and smart AI funnel)
app.post('/api/topics/:id/statements', statementRateLimiter, async (req, res) => {
  try {
    const { text, author_group, session_id, device_fingerprint, user_confirmed_reframing } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Statement text is required' });
    }

    const trimmed = text.trim();
    if (trimmed.length > 200) {
      return res.status(400).json({ error: 'Statement is too long (maximum 140-200 characters)' });
    }

    const topic = await cloudGetTopic(req.params.id);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });

    // Check full poll closing date
    if (topic.closes_at && new Date(topic.closes_at) < new Date()) {
      return res.status(403).json({ error: 'המשאל נסגר להגשת היגדים נוספים.', isClosed: true });
    }

    // Requirement 5: Check 48-hour submissions window
    if (topic.submissions_close_at && new Date(topic.submissions_close_at) < new Date()) {
      return res.status(403).json({ 
        error: 'שלב הוספת ההצעות הסתיים — כעת מצביעים על המאגר הסופי לקראת סגירת הגיליון.', 
        isSubmissionsClosed: true 
      });
    }

    // Requirement 4: Limit 2 proposals per user / device
    const userSubmissionsCount = await cloudCountUserSubmissions(topic.id, session_id, device_fingerprint);
    if (userSubmissionsCount >= 2) {
      return res.status(403).json({
        error: 'הגעת למגבלת 2 ההצעות המותרות למשתמש במשאל זה. תודה על מעורבותך האזרחית!',
        limitReached: true
      });
    }

    // Fetch existing statements to check semantic similarity & deduplication
    const existing = await cloudGetStatements(req.params.id, 'all');
    const existingApproved = (existing || []).filter(s => s.status !== 'rejected');
    const existingTexts = existingApproved.map(s => s.text);

    const moderation = await moderateStatement({
      text: trimmed,
      topicTitle: topic.title,
      topicCategory: topic.category,
      existingStatements: existingTexts
    });

    // Requirement 2: Active deduplication facing the voter
    // If AI detects that voter's idea is similar to an existing statement, do NOT save a new statement and do NOT send to editor!
    if (moderation.isDuplicate) {
      // Find matching statement to prompt immediate vote
      let matchedStatement = null;
      if (moderation.similarStatement) {
        matchedStatement = existingApproved.find(s => 
          s.text === moderation.similarStatement || 
          s.text.includes(moderation.similarStatement) || 
          moderation.similarStatement.includes(s.text)
        ) || null;
      }

      return res.status(200).json({
        statement: null,
        moderation,
        isDuplicate: true,
        matchedStatement
      });
    }

    // Requirement 2: Reframing with voter approval
    // If ranting but contains legitimate idea and user hasn't approved the constructive reframing yet:
    if (moderation.isRant && moderation.suggestion && !user_confirmed_reframing) {
      return res.status(200).json({
        statement: null,
        moderation,
        needsConfirmation: true
      });
    }

    // Requirement 2: Immediate noise/toxicity blocking
    // If failed guardrails (curses / defamation / PII / gibberish) and not a constructive suggestion:
    // Blocked directly at the voter level — do NOT send to editor queue!
    if (!moderation.passed && !user_confirmed_reframing) {
      return res.status(200).json({
        statement: null,
        moderation,
        passed: false
      });
    }

    // Use confirmed reframed text if voter clicked approval button
    const finalText = (user_confirmed_reframing && moderation.suggestion) 
      ? moderation.suggestion.trim() 
      : trimmed;

    // Requirement 3: 3 flexible publishing modes for the editor
    // 1. batch_approval (Default): pending_approval
    // 2. auto_publish (Auto-publish with veto): scheduled_auto + 3-hour timer
    // 3. instant_publish: approved
    const mode = topic.moderation_mode || 'batch_approval';
    const now = new Date();
    let initialStatus = 'pending_approval';
    let autoPublishAt = null;

    if (mode === 'instant_publish') {
      initialStatus = 'approved';
    } else if (mode === 'auto_publish') {
      initialStatus = 'scheduled_auto';
      autoPublishAt = new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(); // 3 hours timer
    } else {
      initialStatus = 'pending_approval';
    }

    const newStatement = await cloudCreateStatement({
      topic_id: topic.id,
      text: finalText,
      author_group: author_group || 'general',
      is_seed: false,
      status: initialStatus,
      auto_publish_at: autoPublishAt,
      session_id: session_id || null,
      device_fingerprint: device_fingerprint || null,
      created_at: now.toISOString()
    });

    res.status(201).json({
      statement: newStatement,
      moderation,
      mode,
      initialStatus
    });
  } catch (err) {
    console.error('Error adding statement:', err);
    res.status(500).json({ error: 'Failed to submit statement' });
  }
});

// Update statement (status: 'approved' | 'rejected' | 'pending' | 'pending_approval', or text edit)
app.patch('/api/statements/:id', requireAdminAuth, async (req, res) => {
  try {
    const { status, text } = req.body;
    const updated = await cloudUpdateStatement({
      id: req.params.id,
      status,
      text
    });

    if (!updated) return res.status(404).json({ error: 'Statement not found' });
    res.json(updated);
  } catch (err) {
    console.error('Error updating statement:', err);
    res.status(500).json({ error: 'Failed to update statement' });
  }
});

// Batch approve statements (Requirement 3: 1-Click Batch Approval)
app.post('/api/statements/batch-approve', requireAdminAuth, async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }

    const updated = [];
    for (const id of ids) {
      const up = await cloudUpdateStatement({ id, status: 'approved' });
      if (up) updated.push(up);
    }

    res.json({ success: true, count: updated.length, updated });
  } catch (err) {
    console.error('Error batch approving statements:', err);
    res.status(500).json({ error: 'Failed to batch approve statements' });
  }
});

// Delete statement
app.delete('/api/statements/:id', requireAdminAuth, async (req, res) => {
  try {
    await cloudDeleteStatement(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    console.error('Error deleting statement:', err);
    res.status(500).json({ error: 'Failed to delete statement' });
  }
});

// -------------------------------------------------------------
// VOTING ENDPOINTS
// -------------------------------------------------------------

// Record or change a vote (Protected by rate limiter & Anti-Spam device fingerprinting)
app.post('/api/votes', voteRateLimiter, async (req, res) => {
  try {
    const { topic_id, statement_id, session_id, group_id, vote, device_fingerprint } = req.body;

    if (!topic_id || !statement_id || !session_id || vote === undefined) {
      return res.status(400).json({ error: 'Missing vote parameters' });
    }

    const voteVal = Number(vote); // 1 = Agree, -1 = Disagree, 0 = Pass
    if (![1, -1, 0].includes(voteVal)) {
      return res.status(400).json({ error: 'Invalid vote value. Must be 1, -1, or 0' });
    }

    const topic = await cloudGetTopic(topic_id);
    if (topic && topic.closes_at && new Date(topic.closes_at) < new Date()) {
      return res.status(403).json({ error: 'המשאל נסגר להצבעות.', isClosed: true });
    }

    const result = await cloudRecordVote({
      topic_id,
      statement_id: Number(statement_id),
      session_id,
      group_id: group_id || 'residents',
      vote: voteVal,
      device_fingerprint
    });

    invalidateAnalyticsCache(topic_id);
    res.json(result);
  } catch (err) {
    console.error('Error recording vote:', err);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// Get votes of a user/session for a topic (Cloud synchronized)
app.get('/api/topics/:id/user-votes', async (req, res) => {
  try {
    const sessionId = req.query.session_id;
    if (!sessionId) return res.json({});

    const voteMap = await cloudGetUserVotes(req.params.id, sessionId);
    res.json(voteMap);
  } catch (err) {
    console.error('Error fetching user votes:', err);
    res.status(500).json({ error: 'Failed to fetch user votes' });
  }
});

// -------------------------------------------------------------
// ANALYTICS & AI ENDPOINTS
// -------------------------------------------------------------

// In-memory analytics cache (TTL: 15s) for instant sub-10ms topic switching
const analyticsCache = new Map();
const ANALYTICS_CACHE_TTL_MS = 15000;

function invalidateAnalyticsCache(topicId) {
  if (topicId) {
    analyticsCache.delete(topicId);
  } else {
    analyticsCache.clear();
  }
}

// Live algorithmic consensus & bridging calculation
app.get('/api/topics/:id/analytics', async (req, res) => {
  try {
    const topicId = req.params.id;
    const cached = analyticsCache.get(topicId);
    if (cached && (Date.now() - cached.timestamp < ANALYTICS_CACHE_TTL_MS)) {
      return res.json(cached.data);
    }

    const topic = await cloudGetTopic(topicId);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });
    const statements = await cloudGetStatements(topicId, 'approved');
    const votes = await cloudGetVotesForTopic(topicId);

    const analytics = computeTopicAnalytics(topicId, { topic, statements, votes });
    if (!analytics) return res.status(404).json({ error: 'Topic not found' });

    analyticsCache.set(topicId, { data: analytics, timestamp: Date.now() });
    res.json(analytics);
  } catch (err) {
    console.error('Error computing analytics:', err);
    res.status(500).json({ error: 'Failed to compute analytics' });
  }
});

// Export complete topic consensus data as CSV (Excel UTF-8 compatible)
app.get('/api/topics/:id/export', async (req, res) => {
  try {
    const topicId = decodeURIComponent(req.params.id);
    const topic = await cloudGetTopic(topicId);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });

    const statements = await cloudGetStatements(topicId, 'approved');
    const votes = await cloudGetVotesForTopic(topicId);
    const analytics = computeTopicAnalytics(topicId, { topic, statements, votes });

    // Build CSV with UTF-8 BOM so Excel opens Hebrew properly without mojibake
    let csv = '\uFEFF';
    csv += `"דוח קונצנזוס אילתי - ${topic.title.replace(/"/g, '""')}"\n`;
    csv += `"ארגון מוביל","${topic.organization.replace(/"/g, '""')}"\n`;
    csv += `"תאריך הפקה","${new Date().toLocaleDateString('he-IL')}"\n`;
    csv += `"סה""כ משתתפים","${analytics?.meta?.totalParticipants || 0}"\n`;
    csv += `"סה""כ הצבעות","${analytics?.meta?.totalVotesCast || 0}"\n\n`;

    csv += `"מזהה","היגד","קבוצה מציעה","סה""כ הצבעות","תמיכה כללית (%)","קולות בעד","קולות נגד","קולות נמנע","סיווג אלגוריתמי"\n`;

    if (analytics?.statements) {
      for (const st of analytics.statements) {
        const vs = st.votesSummary || {};
        const typeLabel = st.isBridging 
          ? 'היגד מגשר (Bridge)' 
          : (st.isDivisive ? 'מחלוקת עמוקה (Divisive)' : (vs.overallSupportPercent >= 70 ? 'קונצנזוס רחב' : 'רגיל'));
        csv += `"${st.id}","${st.text.replace(/"/g, '""')}","${st.author_group || ''}","${vs.total || 0}","${vs.overallSupportPercent || 0}%","${vs.agree || 0}","${vs.disagree || 0}","${vs.pass || 0}","${typeLabel}"\n`;
      }
    }

    const safeId = (topic.slug || topic.id || 'topic').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeFilename = `consensus_${safeId}_${Date.now()}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.send(csv);
  } catch (err) {
    console.error('Error exporting CSV:', err);
    res.status(500).json({ error: 'Failed to export CSV', details: err.message });
  }
});

// -------------------------------------------------------------
// SYSTEM STATUS & INTEGRATION HEALTH (Supabase & Gemini AI)
// -------------------------------------------------------------
app.get('/api/status', async (req, res) => {
  try {
    const supabaseStatus = await checkSupabaseStatus();
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);

    res.json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      aiModeration: {
        connected: hasGeminiKey,
        provider: 'Google Gemini',
        model: 'gemini-3.5-flash',
        features: [
          'סינון לשון הרע ומניעת הכפשות אישיות (Defamation & Toxic phrase guardrail)',
          'זיהוי שמות אישיים ופרטיות (PII protection)',
          'ניסוח מחדש בונה ומקרב קונצנזוס עד 140 תווים (Constructive Rephrasing)',
          'הצעת היגדים אוטומטית לפי זירת דיון (Seed Statement Suggester)',
          'מחולל דוחות קונצנזוס עיתונאיים/ארגוניים (AI Executive Consensus Reporter)'
        ]
      },
      supabase: {
        ...supabaseStatus,
        cloudActive: isCloudActive(),
        freeTierVerified: true
      },
      persistence: {
        primary: isCloudActive() ? 'Supabase Cloud PostgreSQL (Free Tier - Persistent)' : 'SQLite Local / Memory Fallback',
        cloudSync: isCloudActive() ? 'Active & Fully Persistent' : (supabaseStatus.connected ? 'Schema Setup Needed' : 'Offline')
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Status check failed', details: err.message });
  }
});

// AI Guardrail & Rephrasing & Deduplication (Rate limited)
app.post('/api/ai/moderate', statementRateLimiter, async (req, res) => {
  try {
    const { text, topicTitle, topicCategory, topicId, existingStatements } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    let existingTexts = existingStatements;
    if (!existingTexts && topicId) {
      const existing = await cloudGetStatements(topicId, 'approved');
      existingTexts = (existing || []).map(s => s.text);
    }

    const result = await moderateStatement({
      text,
      topicTitle,
      topicCategory,
      existingStatements: existingTexts || []
    });
    res.json(result);
  } catch (err) {
    console.error('Error in AI moderate:', err);
    res.status(500).json({ error: 'Failed to moderate statement' });
  }
});

// AI & Template Seed Statement Suggester (Rate limited)
app.post('/api/ai/suggest-statements', statementRateLimiter, async (req, res) => {
  try {
    const { title, category, organization } = req.body;
    const statements = await suggestTopicStatements({ title, category, organization });
    res.json({ statements });
  } catch (err) {
    console.error('Error suggesting statements:', err);
    res.status(500).json({ error: 'Failed to suggest statements' });
  }
});

// AI Consensus Report Generator (Rate limited)
app.post('/api/ai/report', statementRateLimiter, async (req, res) => {
  try {
    const { topicId, templateType } = req.body;
    const topic = await cloudGetTopic(topicId);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });
    const statements = await cloudGetStatements(topicId, 'approved');
    const votes = await cloudGetVotesForTopic(topicId);
    const analytics = computeTopicAnalytics(topicId, { topic, statements, votes });
    if (!analytics) return res.status(404).json({ error: 'Topic not found' });

    const report = await generateConsensusReport({
      topic: analytics.topic,
      analytics,
      templateType: templateType || 'press'
    });

    res.json({ report, templateType, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: 'Failed to generate consensus report' });
  }
});

// Serve static frontend in production if built
const clientDist = path.resolve(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexHtml = path.join(clientDist, 'index.html');
  res.sendFile(indexHtml, err => {
    if (err) {
      res.status(200).send('API Server is running on port ' + PORT);
    }
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Civic Consensus Engine listening on http://localhost:${PORT}`);
  });
}

export default app;
