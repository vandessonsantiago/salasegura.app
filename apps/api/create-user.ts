import { supabaseAdmin } from './src/lib/supabase.js';

async function createUser() {
  try {
    console.log('🔧 Criando usuário...');

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: 'vandesson.santiago@gmail.com',
      password: 'A@40415v',
      email_confirm: true
    });

    if (error) {
      console.error('❌ Erro ao criar usuário:', error);
      return;
    }

    console.log('✅ Usuário criado com sucesso!');
    console.log('👤 Email:', data.user?.email);
    console.log('🆔 ID:', data.user?.id);

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

createUser();
