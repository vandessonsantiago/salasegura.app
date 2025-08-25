'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';

interface AuthFormProps {
  view?: 'sign_in' | 'sign_up';
  redirectTo?: string;
  allowSignUp?: boolean; // Controlar se permite cadastro
}

export function AuthForm({ view = 'sign_in', redirectTo, allowSignUp = false }: AuthFormProps) {
  return (
    <div className="w-full max-w-md mx-auto">
      <Auth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: '#0d9488',
                brandAccent: '#0f766e',
              },
            },
          },
        }}
        providers={allowSignUp ? ['google', 'github'] : []} // Providers apenas se cadastro permitido
        redirectTo={redirectTo}
        view={view}
        showLinks={allowSignUp} // Links apenas se cadastro permitido
        localization={{
          variables: {
            sign_in: {
              email_label: 'Email',
              password_label: 'Senha',
              button_label: 'Entrar',
              loading_button_label: 'Entrando...',
              social_provider_text: 'Entrar com {{provider}}',
              link_text: 'Já tem uma conta? Entre aqui',
            },
            sign_up: {
              email_label: 'Email',
              password_label: 'Senha',
              button_label: 'Criar conta',
              loading_button_label: 'Criando conta...',
              social_provider_text: 'Criar conta com {{provider}}',
              link_text: 'Não tem uma conta? Crie aqui',
            },
          },
        }}
      />
    </div>
  );
}
