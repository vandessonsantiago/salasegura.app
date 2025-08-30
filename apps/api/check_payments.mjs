import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const result = await supabase
  .from('payments')
  .select('id, asaas_id, status, valor, user_id, agendamento_id, created_at')
  .order('created_at', { ascending: false })
  .limit(10);

console.log('Últimos 10 pagamentos:');
console.log(JSON.stringify(result.data, null, 2));
