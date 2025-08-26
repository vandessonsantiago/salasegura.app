import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL environment variable is required');
}

if (!supabaseSecretKey) {
  throw new Error('SUPABASE_SECRET_KEY environment variable is required');
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'Authorization': `Bearer ${supabaseSecretKey}`,
      'apikey': supabaseSecretKey,
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export default supabaseAdmin;
