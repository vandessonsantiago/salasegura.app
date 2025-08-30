const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lphpcjccvfgmlxygclmt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwaHBjamNjdmZnbWx4eWdjbG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNjAwMzQsImV4cCI6MjA3MTYzNjAzNH0.qbOFSTNpTs0CqKf_T3Qql-qv-nfPH0Fe_A--Cj3JHjE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  try {
    console.log('🔐 Testando login...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'vandesson.santiago@gmail.com',
      password: 'A@40415v'
    });

    if (error) {
      console.error('❌ Erro no login:', error);
      return;
    }

    console.log('✅ Login bem-sucedido!');
    console.log('👤 Usuário:', data.user?.email);
    console.log('🔑 Token:', data.session?.access_token ? 'Presente' : 'Ausente');

  } catch (err) {
    console.error('💥 Erro inesperado:', err);
  }
}

testLogin();
