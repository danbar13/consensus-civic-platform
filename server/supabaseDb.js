import { supabase, isSupabaseConfigured } from './supabase.js';
import { db } from './db.js';

let isSupabaseActive = false;
let initPromise = null;

export async function ensureSupabaseCloud() {
  if (isSupabaseActive) return true;
  if (!initPromise) {
    initPromise = initSupabaseCloud();
  }
  return initPromise;
}

/**
 * Checks if Supabase tables exist and activates cloud persistence
 */
export async function initSupabaseCloud() {
  if (!isSupabaseConfigured || !supabase) {
    console.log('ℹ️ Supabase not configured in .env - using local SQLite database.');
    return false;
  }

  try {
    const { data, error } = await supabase.from('topics').select('id').limit(1);
    if (error) {
      console.warn('⚠️ Supabase reached but tables not yet created (Run supabase_schema.sql in Supabase SQL editor):', error.message);
      isSupabaseActive = false;
      return false;
    }

    isSupabaseActive = true;
    console.log('⚡ Connected to Supabase Cloud Database! Persistent cloud storage active.');
    await seedSupabaseIfEmpty();
    return true;
  } catch (err) {
    console.warn('⚠️ Supabase connection check failed, falling back to local SQLite:', err.message);
    isSupabaseActive = false;
    return false;
  }
}

export function isCloudActive() {
  return isSupabaseActive;
}

/**
 * Seeds initial topics and seed statements into Supabase if empty
 */
async function seedSupabaseIfEmpty() {
  if (!supabase || !isSupabaseActive) return;

  try {
    const { count, error } = await supabase
      .from('topics')
      .select('*', { count: 'exact', head: true });

    if (error || (count !== null && count > 0)) {
      return; // Already has data or count failed
    }

    console.log('🌱 Seeding initial civic consensus topics into Supabase cloud...');

    // Fetch existing seeded data from local SQLite
    const localTopics = db.prepare('SELECT * FROM topics').all();
    for (const t of localTopics) {
      await supabase.from('topics').upsert({
        id: t.id,
        slug: t.slug,
        title: t.title,
        subtitle: t.subtitle,
        organization: t.organization,
        category: t.category,
        groups_json: typeof t.groups_json === 'string' ? JSON.parse(t.groups_json) : t.groups_json,
        created_at: t.created_at,
        closes_at: t.closes_at
      });

      const localStatements = db.prepare('SELECT * FROM statements WHERE topic_id = ?').all(t.id);
      for (const st of localStatements) {
        await supabase.from('statements').upsert({
          id: st.id,
          topic_id: st.topic_id,
          text: st.text,
          author_group: st.author_group,
          is_seed: Boolean(st.is_seed),
          status: st.status,
          created_at: st.created_at
        });
      }

      const localVotes = db.prepare('SELECT * FROM votes WHERE topic_id = ?').all(t.id);
      if (localVotes.length > 0) {
        const votePayloads = localVotes.map(v => ({
          topic_id: v.topic_id,
          statement_id: v.statement_id,
          session_id: v.session_id,
          group_id: v.group_id,
          vote: v.vote,
          created_at: v.created_at
        }));
        await supabase.from('votes').upsert(votePayloads, { onConflict: 'statement_id,session_id' });
      }
    }
    console.log('✅ Supabase cloud database successfully seeded with initial topics & statements!');
  } catch (err) {
    console.warn('Supabase cloud seeding notice:', err.message);
  }
}

// -------------------------------------------------------------
// TOPICS
// -------------------------------------------------------------

export async function cloudGetTopics() {
  if (isSupabaseActive && supabase) {
    try {
      const { data: topics, error } = await supabase
        .from('topics')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && topics) {
        // Fetch stats in parallel
        const enriched = await Promise.all(
          topics.map(async topic => {
            const groups = typeof topic.groups_json === 'string' ? JSON.parse(topic.groups_json) : topic.groups_json;
            const { count: stCount } = await supabase
              .from('statements')
              .select('*', { count: 'exact', head: true })
              .eq('topic_id', topic.id)
              .eq('status', 'approved');

            const { data: votesData } = await supabase
              .from('votes')
              .select('session_id')
              .eq('topic_id', topic.id);

            const votesList = votesData || [];
            const participants = new Set(votesList.map(v => v.session_id)).size;

            return {
              ...topic,
              groups,
              stats: {
                statementsCount: stCount || 0,
                totalVotes: votesList.length,
                participants
              }
            };
          })
        );
        return enriched;
      }
    } catch (err) {
      console.warn('Supabase getTopics failed, falling back to SQLite:', err.message);
    }
  }

  // Fallback SQLite
  const topics = db.prepare('SELECT * FROM topics ORDER BY created_at DESC').all();
  return topics.map(topic => {
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
}

// In-memory Topic Cache to avoid redundant cloud round-trips during voting
const topicCache = new Map();
const TOPIC_CACHE_TTL = 30 * 1000; // 30 seconds cache

export function invalidateTopicCache(id) {
  if (id) {
    topicCache.delete(id);
  } else {
    topicCache.clear();
  }
}

export async function cloudGetTopic(id) {
  const cached = topicCache.get(id);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  let result = null;
  if (isSupabaseActive && supabase) {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        data.groups = typeof data.groups_json === 'string' ? JSON.parse(data.groups_json) : data.groups_json;
        result = data;
      }
    } catch (err) {
      console.warn('Supabase getTopic failed, falling back to SQLite:', err.message);
    }
  }

  if (!result) {
    const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(id);
    if (topic) {
      topic.groups = JSON.parse(topic.groups_json);
      result = topic;
    }
  }

  if (result) {
    topicCache.set(id, { data: result, expiresAt: Date.now() + TOPIC_CACHE_TTL });
  }

  return result;
}

export async function cloudCreateTopic(topicData) {
  invalidateTopicCache();
  if (isSupabaseActive && supabase) {
    try {
      const { data, error } = await supabase
        .from('topics')
        .insert({
          id: topicData.id,
          slug: topicData.id,
          title: topicData.title,
          subtitle: topicData.subtitle || '',
          organization: topicData.organization,
          category: topicData.category || 'municipal',
          groups_json: topicData.groups,
          created_at: topicData.created_at,
          closes_at: topicData.closes_at || null
        })
        .select()
        .single();

      if (!error && data) {
        data.groups = typeof data.groups_json === 'string' ? JSON.parse(data.groups_json) : data.groups_json;
        return data;
      }
    } catch (err) {
      console.warn('Supabase createTopic failed, falling back to SQLite:', err.message);
    }
  }

  // SQLite fallback
  const insertTopic = db.prepare(`
    INSERT INTO topics (id, slug, title, subtitle, organization, category, groups_json, created_at, closes_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertTopic.run(
    topicData.id,
    topicData.id,
    topicData.title,
    topicData.subtitle || '',
    topicData.organization,
    topicData.category || 'municipal',
    JSON.stringify(topicData.groups),
    topicData.created_at,
    topicData.closes_at || null
  );

  const created = db.prepare('SELECT * FROM topics WHERE id = ?').get(topicData.id);
  created.groups = JSON.parse(created.groups_json);
  return created;
}

export async function cloudGetTopicVotesCount(topicId) {
  if (isSupabaseActive && supabase) {
    try {
      const { count, error } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('topic_id', topicId);
      if (!error && count !== null) return count;
    } catch {}
  }
  return db.prepare('SELECT COUNT(*) as c FROM votes WHERE topic_id = ?').get(topicId)?.c || 0;
}

export async function cloudUpdateTopic({ id, title, subtitle, organization, category, groups, closes_at }) {
  invalidateTopicCache(id);
  if (isSupabaseActive && supabase) {
    try {
      const updateData = {};
      if (title !== undefined) updateData.title = title.trim();
      if (subtitle !== undefined) updateData.subtitle = subtitle.trim();
      if (organization !== undefined) updateData.organization = organization.trim();
      if (category !== undefined) updateData.category = category;
      if (groups !== undefined) updateData.groups_json = groups;
      if (closes_at !== undefined) updateData.closes_at = closes_at;

      const { data, error } = await supabase
        .from('topics')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        data.groups = typeof data.groups_json === 'string' ? JSON.parse(data.groups_json) : data.groups_json;
        try {
          db.prepare(`
            UPDATE topics 
            SET title = coalesce(?, title), subtitle = coalesce(?, subtitle), 
                organization = coalesce(?, organization), category = coalesce(?, category), 
                groups_json = coalesce(?, groups_json), closes_at = coalesce(?, closes_at)
            WHERE id = ?
          `).run(
            title !== undefined ? title.trim() : null,
            subtitle !== undefined ? subtitle.trim() : null,
            organization !== undefined ? organization.trim() : null,
            category !== undefined ? category : null,
            groups !== undefined ? JSON.stringify(groups) : null,
            closes_at !== undefined ? closes_at : null,
            id
          );
        } catch {}
        return data;
      }
    } catch (err) {
      console.warn('Supabase updateTopic failed, falling back to SQLite:', err.message);
    }
  }

  // SQLite fallback
  const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(id);
  if (!topic) return null;

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
  `).run(newTitle, newSubtitle, newOrg, newCategory, newGroupsJson, newClosesAt, id);

  const updated = db.prepare('SELECT * FROM topics WHERE id = ?').get(id);
  updated.groups = JSON.parse(updated.groups_json);
  return updated;
}

export async function cloudDeleteTopic(topicId) {
  invalidateTopicCache(topicId);
  if (isSupabaseActive && supabase) {
    try {
      await supabase.from('votes').delete().eq('topic_id', topicId);
      await supabase.from('statements').delete().eq('topic_id', topicId);
      const { error } = await supabase.from('topics').delete().eq('id', topicId);
      if (!error) {
        try {
          db.prepare('DELETE FROM votes WHERE topic_id = ?').run(topicId);
          db.prepare('DELETE FROM statements WHERE topic_id = ?').run(topicId);
          db.prepare('DELETE FROM topics WHERE id = ?').run(topicId);
        } catch {}
        return true;
      }
    } catch (err) {
      console.warn('Supabase deleteTopic failed, falling back to SQLite:', err.message);
    }
  }

  db.prepare('DELETE FROM votes WHERE topic_id = ?').run(topicId);
  db.prepare('DELETE FROM statements WHERE topic_id = ?').run(topicId);
  db.prepare('DELETE FROM topics WHERE id = ?').run(topicId);
  return true;
}

// -------------------------------------------------------------
// STATEMENTS
// -------------------------------------------------------------

export async function cloudGetStatements(topicId, status) {
  if (isSupabaseActive && supabase) {
    try {
      let query = supabase.from('statements').select('*').eq('topic_id', topicId);
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      query = query.order('id', { ascending: true });
      const { data, error } = await query;
      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase getStatements failed, falling back to SQLite:', err.message);
    }
  }

  let query = 'SELECT * FROM statements WHERE topic_id = ?';
  const params = [topicId];
  if (status && status !== 'all') {
    query += ' AND status = ?';
    params.push(status);
  }
  query += ' ORDER BY id ASC';
  return db.prepare(query).all(...params);
}

export async function cloudCreateStatement(stData) {
  if (isSupabaseActive && supabase) {
    try {
      const { data, error } = await supabase
        .from('statements')
        .insert({
          topic_id: stData.topic_id,
          text: stData.text,
          author_group: stData.author_group || 'general',
          is_seed: Boolean(stData.is_seed),
          status: stData.status || 'approved',
          created_at: stData.created_at
        })
        .select()
        .single();

      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase createStatement failed, falling back to SQLite:', err.message);
    }
  }

  const insert = db.prepare(`
    INSERT INTO statements (topic_id, text, author_group, is_seed, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = insert.run(
    stData.topic_id,
    stData.text,
    stData.author_group || 'general',
    stData.is_seed ? 1 : 0,
    stData.status || 'approved',
    stData.created_at
  );
  return db.prepare('SELECT * FROM statements WHERE id = ?').get(result.lastInsertRowid);
}

export async function cloudUpdateStatement({ id, status, text }) {
  const numId = Number(id);
  if (isSupabaseActive && supabase) {
    try {
      const updateData = {};
      if (status !== undefined) updateData.status = status;
      if (text !== undefined) updateData.text = text.trim();

      const { data, error } = await supabase
        .from('statements')
        .update(updateData)
        .eq('id', numId)
        .select()
        .single();

      if (!error && data) {
        try {
          db.prepare('UPDATE statements SET status = coalesce(?, status), text = coalesce(?, text) WHERE id = ?')
            .run(status, text !== undefined ? text.trim() : null, numId);
        } catch {}
        return data;
      }
    } catch (err) {
      console.warn('Supabase updateStatement failed, falling back to SQLite:', err.message);
    }
  }

  // SQLite fallback
  const st = db.prepare('SELECT * FROM statements WHERE id = ?').get(numId);
  if (!st) return null;

  const newStatus = status !== undefined ? status : st.status;
  const newText = text !== undefined ? text.trim() : st.text;

  db.prepare('UPDATE statements SET status = ?, text = ? WHERE id = ?')
    .run(newStatus, newText, numId);

  return db.prepare('SELECT * FROM statements WHERE id = ?').get(numId);
}

export async function cloudDeleteStatement(id) {
  const numId = Number(id);
  if (isSupabaseActive && supabase) {
    try {
      await supabase.from('votes').delete().eq('statement_id', numId);
      const { error } = await supabase.from('statements').delete().eq('id', numId);
      if (!error) {
        try {
          db.prepare('DELETE FROM votes WHERE statement_id = ?').run(numId);
          db.prepare('DELETE FROM statements WHERE id = ?').run(numId);
        } catch {}
        return true;
      }
    } catch (err) {
      console.warn('Supabase deleteStatement failed, falling back to SQLite:', err.message);
    }
  }

  db.prepare('DELETE FROM votes WHERE statement_id = ?').run(numId);
  db.prepare('DELETE FROM statements WHERE id = ?').run(numId);
  return true;
}

// -------------------------------------------------------------
// VOTES
// -------------------------------------------------------------

export async function cloudRecordVote({ topic_id, statement_id, session_id, group_id, vote }) {
  const now = new Date().toISOString();

  // 1. Immediately write to local SQLite for instant zero-latency caching & robustness
  try {
    const upsertSql = db.prepare(`
      INSERT INTO votes (topic_id, statement_id, session_id, group_id, vote, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(statement_id, session_id) DO UPDATE SET
        vote = excluded.vote,
        group_id = excluded.group_id,
        created_at = excluded.created_at
    `);
    upsertSql.run(topic_id, statement_id, session_id, group_id || 'residents', vote, now);
  } catch (sqlErr) {
    console.warn('SQLite vote write notice:', sqlErr.message);
  }

  // 2. Synchronize to Supabase Cloud in a single fast upsert (no redundant second query)
  if (isSupabaseActive && supabase) {
    try {
      await supabase.from('votes').upsert({
        topic_id,
        statement_id,
        session_id,
        group_id: group_id || 'residents',
        vote,
        created_at: now
      }, { onConflict: 'statement_id,session_id' });
    } catch (err) {
      console.warn('Supabase recordVote notice:', err.message);
    }
  }

  // 3. Fast micro-insight calculation directly from local DB (<1ms)
  const totalVotes = db.prepare('SELECT vote FROM votes WHERE statement_id = ?').all(statement_id);
  const agrees = totalVotes.filter(v => v.vote === 1).length;
  const decisive = totalVotes.filter(v => v.vote === 1 || v.vote === -1).length;
  const supportPercent = decisive > 0 ? Math.round((agrees / decisive) * 100) : 0;

  return {
    success: true,
    statementId: statement_id,
    vote,
    microInsight: {
      totalVotes: totalVotes.length,
      supportPercent,
      text: decisive > 0
        ? `${supportPercent}% מהמצביעים עד כה הסכימו עם היגד זה`
        : 'אתה המצביע הראשון על היגד זה!'
    }
  };
}

export async function cloudGetVotesForTopic(topicId) {
  if (isSupabaseActive && supabase) {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('topic_id', topicId);

      if (!error && data) return data;
    } catch (err) {
      console.warn('Supabase getVotes failed, falling back to SQLite:', err.message);
    }
  }

  return db.prepare('SELECT * FROM votes WHERE topic_id = ?').all(topicId);
}

export async function cloudGetUserVotes(topicId, sessionId) {
  if (isSupabaseActive && supabase) {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('statement_id, vote, group_id')
        .eq('topic_id', topicId)
        .eq('session_id', sessionId);

      if (!error && data) {
        const voteMap = {};
        for (const v of data) {
          voteMap[v.statement_id] = { vote: v.vote, group_id: v.group_id };
        }
        return voteMap;
      }
    } catch (err) {
      console.warn('Supabase getUserVotes failed, falling back to SQLite:', err.message);
    }
  }

  const votes = db.prepare(`
    SELECT statement_id, vote, group_id FROM votes
    WHERE topic_id = ? AND session_id = ?
  `).all(topicId, sessionId);

  const voteMap = {};
  for (const v of votes) {
    voteMap[v.statement_id] = { vote: v.vote, group_id: v.group_id };
  }
  return voteMap;
}
