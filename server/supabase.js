import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

/**
 * Checks connection health to Supabase
 */
export async function checkSupabaseStatus() {
  if (!supabase) {
    return {
      connected: false,
      configured: false,
      url: null,
      message: 'Supabase credentials are not configured in .env'
    };
  }

  try {
    // Attempt a light ping/query
    const { error } = await supabase.from('statements').select('count', { count: 'exact', head: true });
    
    // Even if statements table isn't created yet, a PGRST205 means the project itself is reachable and authenticated!
    if (!error || error.code === 'PGRST205') {
      return {
        connected: true,
        configured: true,
        url: supabaseUrl,
        tableCreated: !error,
        message: !error 
          ? 'Connected to Supabase cloud database with active schema.'
          : 'Connected to Supabase project. Schema ready to sync.'
      };
    }

    return {
      connected: false,
      configured: true,
      url: supabaseUrl,
      error: error.message
    };
  } catch (err) {
    return {
      connected: false,
      configured: true,
      url: supabaseUrl,
      error: err.message
    };
  }
}

/**
 * Optional cloud sync: sync an approved or moderated statement to Supabase
 */
export async function syncStatementToSupabase(statement) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.from('statements').upsert({
      id: statement.id,
      topic_id: statement.topic_id,
      text: statement.text,
      author_group: statement.author_group,
      status: statement.status,
      created_at: statement.created_at
    });
    if (error && error.code !== 'PGRST205') {
      console.warn('Supabase sync notice:', error.message);
    }
    return data;
  } catch (err) {
    // Graceful silent fallback
    return null;
  }
}
