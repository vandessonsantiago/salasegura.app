import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const result = await supabase
  .from('agendamentos')
  .select('id, calendar_event_id, google_meet_link, created_at')
  .order('created_at', { ascending: false })
  .limit(5);

console.log('Últimos agendamentos:');
console.log(JSON.stringify(result.data, null, 2));
