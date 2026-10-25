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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB and auto-seed if empty
initDatabase();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// -------------------------------------------------------------
// TOPICS ENDPOINTS
// -------------------------------------------------------------

// List all topics with meta counts
app.get('/api/topics', (req, res) => {
  try {
    const topics = db.prepare('SELECT * FROM topics ORDER BY created_at DESC').all();
    const result = topics.map(topic => {
      const groups = JSON.parse(topic.groups_json);
      const stCount = db.prepare('SELECT COUNT(*) as c FROM statements WHERE topic_id = ? AND status = ?')
        .get(topic.id, 'approved').c;
      const votesCount = db.prepare('SELECT COUNT(*) as c FROM votes WHERE topic_id = ?')
        .get(topic.id).c;
      const participantCount = db.prepare('SELECT COUNT(DISTINCT session_id) as c FROM votes WHERE topic_id = ?')
        .get(topic.id).c;

      return {
        ...topic,
        groups,
        stats: {
          statementsCount: stCount,
          totalVotes: votesCount,
          participants: participantCount
        }
      };
    });
    res.json(result);
  } catch (err) {
    console.error('Error fetching topics:', err);
    res.status(500).json({ error: 'Failed to fetch topics' });
  }
});

// Get single topic
app.get('/api/topics/:id', (req, res) => {
  try {
    const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(req.params.id);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });
    
    topic.groups = JSON.parse(topic.groups_json);
    res.json(topic);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch topic' });
  }
});

// Create new topic
app.post('/api/topics', (req, res) => {
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

    const insertTopic = db.prepare(`
      INSERT INTO topics (id, slug, title, subtitle, organization, category, groups_json, created_at, closes_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertTopic.run(
      topicId,
      topicId,
      title,
      subtitle || '',
      organization,
      category || 'municipal',
      JSON.stringify(groups),
      now,
      closes_at || null
    );

    // Insert the validated seed statements
    const insertSt = db.prepare(`
      INSERT INTO statements (topic_id, text, author_group, is_seed, status, created_at)
      VALUES (?, ?, ?, 1, 'approved', ?)
    `);
    
    // Distribute seed statements across available groups
    validStatements.forEach((stText, idx) => {
      const assignedGroup = groups[idx % groups.length]?.id || 'general';
      insertSt.run(topicId, stText, assignedGroup, now);
    });

    const created = db.prepare('SELECT * FROM topics WHERE id = ?').get(topicId);
    created.groups = JSON.parse(created.groups_json);
    res.status(201).json(created);
  } catch (err) {
    console.error('Error creating topic:', err);
    res.status(500).json({ error: 'Failed to create topic' });
  }
});

// Update topic (ALLOWED ONLY IF NO VOTES/RESPONSES YET)
app.patch('/api/topics/:id', (req, res) => {
  try {
    const topicId = req.params.id;
    const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(topicId);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });

    // Check if topic already has votes/responses
    const votesCount = db.prepare('SELECT COUNT(*) as c FROM votes WHERE topic_id = ?').get(topicId).c;
    if (votesCount > 0) {
      return res.status(400).json({ 
        error: `לא ניתן לערוך זירת דיון שכבר נרשמו בה תגובות או הצבעות מן הציבור (קיימות ${votesCount} הצבעות פעילות).` 
      });
    }

    const { title, subtitle, organization, category, groups, closes_at } = req.body;

    const newTitle = title !== undefined ? title.trim() : topic.title;
    const newSubtitle = subtitle !== undefined ? subtitle.trim() : topic.subtitle;
    const newOrg = organization !== undefined ? organization.trim() : topic.organization;
    const newCategory = category !== undefined ? category : topic.category;
    const newGroupsJson = groups !== undefined ? JSON.stringify(groups) : topic.groups_json;
    const newClosesAt = closes_at !== undefined ? closes_at : topic.closes_at;

    db.prepare(`
      UPDATE topics 
      SET title = ?, subtitle = ?, organization = ?, category = ?, groups_json = ?, closes_at = ?
      WHERE id = ?
    `).run(newTitle, newSubtitle, newOrg, newCategory, newGroupsJson, newClosesAt, topicId);

    const updated = db.prepare('SELECT * FROM topics WHERE id = ?').get(topicId);
    updated.groups = JSON.parse(updated.groups_json);
    res.json(updated);
  } catch (err) {
    console.error('Error updating topic:', err);
    res.status(500).json({ error: 'Failed to update topic' });
  }
});

// Delete topic (and all associated statements & votes)
app.delete('/api/topics/:id', (req, res) => {
  try {
    const topicId = req.params.id;
    const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(topicId);
    if (!topic) return res.status(404).json({ error: 'Topic not found' });

    // Ensure at least one topic remains in the system
    const totalTopics = db.prepare('SELECT COUNT(*) as c FROM topics').get().c;
    if (totalTopics <= 1) {
      return res.status(400).json({ error: 'לא ניתן למחוק את זירת הדיון היחידה שנותרה במערכת.' });
    }

    // Delete in cascade
    db.prepare('DELETE FROM votes WHERE topic_id = ?').run(topicId);
    db.prepare('DELETE FROM statements WHERE topic_id = ?').run(topicId);
    db.prepare('DELETE FROM topics WHERE id = ?').run(topicId);

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
app.get('/api/topics/:id/statements', (req, res) => {
  try {
    const status = req.query.status;
    let query = 'SELECT * FROM statements WHERE topic_id = ?';
    const params = [req.params.id];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY id ASC';
    const statements = db.prepare(query).all(...params);
    res.json(statements);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch statements' });
  }
});

// Submit a new statement
app.post('/api/topics/:id/statements', async (req, res) => {
  try {
    const { text, author_group, session_id } = req.body;
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Statement text is required' });
    }

    const trimmed = text.trim();
    if (trimmed.length > 200) {
      return res.status(400).json({ error: 'Statement is too long (maximum 140-200 characters)' });
    }

    const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(req.params.id);
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

    const insert = db.prepare(`
      INSERT INTO statements (topic_id, text, author_group, is_seed, status, created_at)
      VALUES (?, ?, ?, 0, ?, ?)
    `);

    const result = insert.run(topic.id, trimmed, author_group || 'general', status, now);
    const newStatement = db.prepare('SELECT * FROM statements WHERE id = ?').get(result.lastInsertRowid);

    // Asynchronous mirror sync to Supabase if configured
    syncStatementToSupabase(newStatement).catch(err => {
      console.warn('Supabase mirror sync deferred:', err.message);
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
app.patch('/api/statements/:id', (req, res) => {
  try {
    const { status, text } = req.body;
    const st = db.prepare('SELECT * FROM statements WHERE id = ?').get(req.params.id);
    if (!st) return res.status(404).json({ error: 'Statement not found' });

    const newStatus = status !== undefined ? status : st.status;
    const newText = text !== undefined ? text.trim() : st.text;

    db.prepare('UPDATE statements SET status = ?, text = ? WHERE id = ?')
      .run(newStatus, newText, req.params.id);

    const updated = db.prepare('SELECT * FROM statements WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update statement' });
  }
});

// Delete statement
app.delete('/api/statements/:id', (req, res) => {
  try {
    const st = db.prepare('SELECT * FROM statements WHERE id = ?').get(req.params.id);
    if (!st) return res.status(404).json({ error: 'Statement not found' });

    db.prepare('DELETE FROM statements WHERE id = ?').run(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete statement' });
  }
});

// -------------------------------------------------------------
// VOTING ENDPOINTS
// -------------------------------------------------------------

// Record or change a vote
app.post('/api/votes', (req, res) => {
  try {
    const { topic_id, statement_id, session_id, group_id, vote } = req.body;

    if (!topic_id || !statement_id || !session_id || vote === undefined) {
      return res.status(400).json({ error: 'Missing vote parameters' });
    }

    const voteVal = Number(vote); // 1 = Agree, -1 = Disagree, 0 = Pass
    if (![1, -1, 0].includes(voteVal)) {
      return res.status(400).json({ error: 'Invalid vote value. Must be 1, -1, or 0' });
    }

    const topic = db.prepare('SELECT closes_at FROM topics WHERE id = ?').get(topic_id);
    if (topic && topic.closes_at && new Date(topic.closes_at) < new Date()) {
      return res.status(403).json({ error: 'המשאל נסגר להצבעות.', isClosed: true });
    }

    const now = new Date().toISOString();

    // Upsert vote based on UNIQUE(statement_id, session_id)
    const upsert = db.prepare(`
      INSERT INTO votes (topic_id, statement_id, session_id, group_id, vote, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(statement_id, session_id) DO UPDATE SET
        vote = excluded.vote,
        group_id = excluded.group_id,
        created_at = excluded.created_at
    `);

    upsert.run(topic_id, statement_id, session_id, group_id || 'residents', voteVal, now);

    // Get real-time quick micro-insight for this statement
    const totalVotes = db.prepare('SELECT vote FROM votes WHERE statement_id = ?').all(statement_id);
    const agrees = totalVotes.filter(v => v.vote === 1).length;
    const decisive = totalVotes.filter(v => v.vote === 1 || v.vote === -1).length;
    const supportPercent = decisive > 0 ? Math.round((agrees / decisive) * 100) : 0;

    res.json({
      success: true,
      statementId: statement_id,
      vote: voteVal,
      microInsight: {
        totalVotes: totalVotes.length,
        supportPercent,
        text: decisive > 0
          ? `${supportPercent}% מהמצביעים עד כה הסכימו עם היגד זה`
          : 'אתה המצביע הראשון על היגד זה!'
      }
    });
  } catch (err) {
    console.error('Error recording vote:', err);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// Get votes of a user/session for a topic
app.get('/api/topics/:id/user-votes', (req, res) => {
  try {
    const sessionId = req.query.session_id;
    if (!sessionId) return res.json({});

    const votes = db.prepare(`
      SELECT statement_id, vote, group_id FROM votes
      WHERE topic_id = ? AND session_id = ?
    `).all(req.params.id, sessionId);

    const voteMap = {};
    for (const v of votes) {
      voteMap[v.statement_id] = { vote: v.vote, group_id: v.group_id };
    }
    res.json(voteMap);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user votes' });
  }
});

// -------------------------------------------------------------
// ANALYTICS & AI ENDPOINTS
// -------------------------------------------------------------

// Live algorithmic consensus & bridging calculation
app.get('/api/topics/:id/analytics', (req, res) => {
  try {
    const analytics = computeTopicAnalytics(req.params.id);
    if (!analytics) return res.status(404).json({ error: 'Topic not found' });
    res.json(analytics);
  } catch (err) {
    console.error('Error computing analytics:', err);
    res.status(500).json({ error: 'Failed to compute analytics' });
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
      supabase: supabaseStatus,
      persistence: {
        primary: 'SQLite (better-sqlite3) - consensus.db',
        cloudSync: supabaseStatus.connected ? 'Enabled' : 'Disabled'
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Status check failed', details: err.message });
  }
});

// AI Guardrail & Rephrasing
app.post('/api/ai/moderate', async (req, res) => {
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

// AI & Template Seed Statement Suggester
app.post('/api/ai/suggest-statements', async (req, res) => {
  try {
    const { title, category, organization } = req.body;
    const statements = await suggestTopicStatements({ title, category, organization });
    res.json({ statements });
  } catch (err) {
    console.error('Error suggesting statements:', err);
    res.status(500).json({ error: 'Failed to suggest statements' });
  }
});

// AI Consensus Report Generator
app.post('/api/ai/report', async (req, res) => {
  try {
    const { topicId, templateType } = req.body;
    const analytics = computeTopicAnalytics(topicId);
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
