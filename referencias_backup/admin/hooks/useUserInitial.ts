import { useAuth } from '../contexts/AuthContext';

export function useUserInitial(): string {
  const { user } = useAuth();

  // Função para extrair a inicial do usuário
  const getUserInitial = (): string => {
    if (!user) return 'V';
    
    // Prioriza o nome completo (firstName + lastName)
    if (user.firstName && user.lastName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    
    // Se só tem firstName
    if (user.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    
    // Se só tem lastName
    if (user.lastName) {
      return user.lastName.charAt(0).toUpperCase();
    }
    
    // Se não tem nome, usa o email
    if (user.email) {
      const emailInitial = user.email.charAt(0).toUpperCase();
      // Verifica se é uma letra válida
      return /[A-Za-z]/.test(emailInitial) ? emailInitial : 'V';
    }
    
    return 'V';
  };

  return getUserInitial();
}
