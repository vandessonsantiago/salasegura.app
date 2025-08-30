import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const result = await supabase
  .from('agendamentos')
  .select('id, calendar_event_id, google_meet_link, created_at, data, horario')
  .order('created_at', { ascending: false })
  .limit(10);

console.log('Últimos 10 agendamentos:');
console.log(JSON.stringify(result.data, null, 2));
