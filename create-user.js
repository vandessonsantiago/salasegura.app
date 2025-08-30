const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createOrUpdateUser() {
  try {
    console.log('🔧 Criando/atualizando usuário...');

    // Primeiro, tentar fazer sign up (se já existir, vai dar erro)
    const { data: signUpData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: 'vandesson.santiago@gmail.com',
      password: 'A@40415v',
      email_confirm: true
    });

    if (signUpError) {
      console.log('⚠️ Erro no sign up (usuário pode já existir):', signUpError.message);

      // Se o usuário já existe, vamos tentar atualizar a senha
      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        '7ace3a0f-f31d-4c76-99e5-e6a5aa8c67d3', // ID do usuário existente
        {
          password: 'A@40415v',
          email_confirm: true
        }
      );

      if (updateError) {
        console.error('❌ Erro ao atualizar usuário:', updateError);
        return;
      }

      console.log('✅ Usuário atualizado com sucesso!');
      console.log('👤 Email:', updateData.user?.email);
      return;
    }

    console.log('✅ Usuário criado com sucesso!');
    console.log('👤 Email:', signUpData.user?.email);
    console.log('🆔 ID:', signUpData.user?.id);

  } catch (error) {
    console.error('💥 Erro inesperado:', error);
  }
}

createOrUpdateUser();
