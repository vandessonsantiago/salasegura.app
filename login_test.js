const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://lphpcjccvfgmlxygclmt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwaHBjamNjdmZnbWx4eWdjbG10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNjAwMzQsImV4cCI6MjA3MTYzNjAzNH0.qbOFSTNpTs0CqKf_T3Qql-qv-nfPH0Fe_A--Cj3JHjE'
);

async function login() {
  try {
    console.log('🔄 Tentando fazer login...');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'vandesson.santiago@gmail.com',
      password: 'A@40415v'
    });

    if (error) {
      console.log('❌ Erro no login:', error.message);
      return;
    }

    if (data.session) {
      console.log('✅ Login realizado com sucesso!');
      console.log('📧 Email:', data.user.email);
      console.log('🆔 User ID:', data.user.id);
      console.log('🔑 Access Token:', data.session.access_token.substring(0, 50) + '...');
      console.log('⏰ Expira em:', new Date(data.session.expires_at * 1000).toLocaleString());

      // Salvar token em arquivo para uso posterior
      const fs = require('fs');
      fs.writeFileSync('auth_token.txt', data.session.access_token);
      console.log('💾 Token salvo em auth_token.txt');

    } else {
      console.log('❌ Login falhou - sem sessão');
    }
  } catch (err) {
    console.log('❌ Erro geral:', err.message);
  }
}

login();
