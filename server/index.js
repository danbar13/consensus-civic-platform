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
  cloudGetUserVotes
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
    const { id, title, subtitle, organization, category, groups, initialStatements, closes_at } = req.body;
    
    if (!title || !organization || !groups || groups.length === 0) {
      return res.status(400).json({ error: 'Missing required topic fields' });
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

    const created = await cloudCreateTopic({
      id: topicId,
      title,
      subtitle: subtitle || '',
      organization,
      category: category || 'municipal',
      groups,
      created_at: now,
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

// Update topic (ALLOWED ONLY IF NO VOTES/RESPONSES YET)
app.patch('/api/topics/:id', requireAdminAuth, async (req, res) => {
  try {
    const topicId = req.params.id;
    const topic = await cloudGetTopic(topicId);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });

    // Check if topic already has votes/responses
    const votesCount = await cloudGetTopicVotesCount(topicId);
    if (votesCount > 0) {
      return res.status(400).json({ 
        error: `לא ניתן לערוך זירת דיון שכבר נרשמו בה תגובות או הצבעות מן הציבור (קיימות ${votesCount} הצבעות פעילות).` 
      });
    }

    const { title, subtitle, organization, category, groups, closes_at } = req.body;
    const updated = await cloudUpdateTopic({
      id: topicId,
      title,
      subtitle,
      organization,
      category,
      groups,
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

// Submit a new statement (protected with rate limiter)
app.post('/api/topics/:id/statements', statementRateLimiter, async (req, res) => {
  try {
    const { text, author_group, session_id } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Statement text is required' });
    }

    const trimmed = text.trim();
    if (trimmed.length > 200) {
      return res.status(400).json({ error: 'Statement is too long (maximum 140-200 characters)' });
    }

    const topic = await cloudGetTopic(req.params.id);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });

    if (topic.closes_at && new Date(topic.closes_at) < new Date()) {
      return res.status(403).json({ error: 'המשאל נסגר להגשת היגדים נוספים.', isClosed: true });
    }

    // Optional fast check: if author is an editor/admin or pre-moderated
    const moderation = await moderateStatement({
      text: trimmed,
      topicTitle: topic.title,
      topicCategory: topic.category
    });

    const now = new Date().toISOString();
    // If moderation passed, approve immediately; if rant or requires approval, set to pending
    const status = moderation.passed ? 'approved' : 'pending';

    const newStatement = await cloudCreateStatement({
      topic_id: topic.id,
      text: trimmed,
      author_group: author_group || 'general',
      is_seed: false,
      status,
      created_at: now
    });

    res.status(201).json({
      statement: newStatement,
      moderation
    });
  } catch (err) {
    console.error('Error adding statement:', err);
    res.status(500).json({ error: 'Failed to submit statement' });
  }
});

// Update statement (status: 'approved' | 'rejected' | 'pending', or text edit)
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

// Record or change a vote (Protected by rate limiter)
app.post('/api/votes', voteRateLimiter, async (req, res) => {
  try {
    const { topic_id, statement_id, session_id, group_id, vote } = req.body;

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
      vote: voteVal
    });

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

// Live algorithmic consensus & bridging calculation
app.get('/api/topics/:id/analytics', async (req, res) => {
  try {
    const topic = await cloudGetTopic(req.params.id);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });
    const statements = await cloudGetStatements(req.params.id, 'approved');
    const votes = await cloudGetVotesForTopic(req.params.id);

    const analytics = computeTopicAnalytics(req.params.id, { topic, statements, votes });
    if (!analytics) return res.status(404).json({ error: 'Topic not found' });
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

// AI Guardrail & Rephrasing (Rate limited)
app.post('/api/ai/moderate', statementRateLimiter, async (req, res) => {
  try {
    const { text, topicTitle, topicCategory } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const result = await moderateStatement({
      text,
      topicTitle,
      topicCategory
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
