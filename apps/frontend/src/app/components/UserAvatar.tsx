'use client';

import { useAuth } from '@/contexts/AuthContext';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function UserAvatar({ size = 'md', className = '' }: UserAvatarProps) {
  const { user } = useAuth();

  // Função para obter a inicial do usuário
  const getUserInitial = () => {
    if (!user) return 'U';
    
    // Prioridade: name > email
    if (user.user_metadata?.name) {
      return user.user_metadata.name.charAt(0).toUpperCase();
    }
    
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    
    return 'U';
  };

  const userInitial = getUserInitial();

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-lg',
    lg: 'w-12 h-12 text-xl'
  };

  // Se o usuário tem avatar_url, mostrar a imagem
  const avatarUrl = user?.user_metadata?.avatar_url;

  if (avatarUrl) {
    return (
      <div className={`rounded-full overflow-hidden hover:ring-2 hover:ring-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all cursor-pointer ${sizeClasses[size]} ${className}`}>
        <img
          src={avatarUrl}
          alt={`Avatar de ${user?.user_metadata?.name || user?.email || 'Usuário'}`}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`bg-black rounded-full flex items-center justify-center hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors cursor-pointer ${sizeClasses[size]} ${className}`}>
      <span className="text-white font-semibold">
        {userInitial}
      </span>
    </div>
  );
}
