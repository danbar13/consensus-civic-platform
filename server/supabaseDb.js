import { supabase, isSupabaseConfigured } from './supabase.js';
import { db } from './db.js';

let isSupabaseActive = false;

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

export async function cloudGetTopic(id) {
  if (isSupabaseActive && supabase) {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        data.groups = typeof data.groups_json === 'string' ? JSON.parse(data.groups_json) : data.groups_json;
        return data;
      }
    } catch (err) {
      console.warn('Supabase getTopic failed, falling back to SQLite:', err.message);
    }
  }

  const topic = db.prepare('SELECT * FROM topics WHERE id = ?').get(id);
  if (topic) {
    topic.groups = JSON.parse(topic.groups_json);
  }
  return topic;
}

export async function cloudCreateTopic(topicData) {
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

// -------------------------------------------------------------
// VOTES
// -------------------------------------------------------------

export async function cloudRecordVote({ topic_id, statement_id, session_id, group_id, vote }) {
  const now = new Date().toISOString();

  if (isSupabaseActive && supabase) {
    try {
      const { error } = await supabase.from('votes').upsert({
        topic_id,
        statement_id,
        session_id,
        group_id: group_id || 'residents',
        vote,
        created_at: now
      }, { onConflict: 'statement_id,session_id' });

      if (!error) {
        // Calculate quick micro-insight from Supabase
        const { data: stVotes } = await supabase
          .from('votes')
          .select('vote')
          .eq('statement_id', statement_id);

        const votesList = stVotes || [];
        const agrees = votesList.filter(v => v.vote === 1).length;
        const decisive = votesList.filter(v => v.vote === 1 || v.vote === -1).length;
        const supportPercent = decisive > 0 ? Math.round((agrees / decisive) * 100) : 0;

        return {
          success: true,
          statementId: statement_id,
          vote,
          microInsight: {
            totalVotes: votesList.length,
            supportPercent,
            text: decisive > 0
              ? `${supportPercent}% מהמצביעים עד כה הסכימו עם היגד זה`
              : 'אתה המצביע הראשון על היגד זה!'
          }
        };
      }
    } catch (err) {
      console.warn('Supabase recordVote failed, falling back to SQLite:', err.message);
    }
  }

  // SQLite fallback
  const upsert = db.prepare(`
    INSERT INTO votes (topic_id, statement_id, session_id, group_id, vote, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(statement_id, session_id) DO UPDATE SET
      vote = excluded.vote,
      group_id = excluded.group_id,
      created_at = excluded.created_at
  `);
  upsert.run(topic_id, statement_id, session_id, group_id || 'residents', vote, now);

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
