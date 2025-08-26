'use client';


import { useAuth } from '../../contexts/AuthContext';
import Dashboard from '../components/Dashboard';
import LoginForm from '../components/LoginForm';
import { useParams } from 'next/navigation';
import RegisterPage from '../register/page';

export default function AdminPage() {
  const { user, loading, isSignedIn } = useAuth();
  const params = useParams();

  // Verificar se a rota é /register e renderizar a página de registro
  console.log('🔍 Parâmetros da rota:', params.rest);
  if (params.rest && Array.isArray(params.rest) && params.rest.length > 0 && params.rest[0] === 'register') {
    console.log('✅ Renderizando página de registro');
    return <RegisterPage />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
                         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!isSignedIn ? (
        // Página de login - design minimalista sem header
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <LoginForm />
        </div>
      ) : (
        // Dashboard - com header dinâmico
        <Dashboard />
      )}
    </>
  );
}


