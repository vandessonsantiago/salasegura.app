import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const result = await supabase
  .from('agendamentos')
  .select('id, user_id, data, horario, status, created_at')
  .order('created_at', { ascending: false })
  .limit(10);

console.log('Últimos 10 agendamentos no banco:');
console.log(JSON.stringify(result.data, null, 2));
console.log(`Total de agendamentos: ${result.data?.length || 0}`);
