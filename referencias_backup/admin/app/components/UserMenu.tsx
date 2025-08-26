'use client';

import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUserInitial } from '../../hooks/useUserInitial';
import UserAvatar from './UserAvatar';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const userInitial = useUserInitial();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
      >
        <UserAvatar size="md" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 min-w-80 bg-white rounded-lg shadow-lg py-3 z-50 border">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <UserAvatar size="sm" />
              </div>
              <div className={`text-sm text-gray-900 underline ${user?.email && user.email.length > 30 ? 'break-all' : ''}`}>
                {user?.email}
              </div>
            </div>
          </div>

          <div className="py-2">
            <button
              onClick={handleSignOut}
              className="flex items-center justify-end space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <img 
                src="/sair-do-usuario.svg" 
                alt="Sair" 
                className="w-4 h-4"
              />
              <span>Sair</span>
            </button>

            <div className="border-t border-gray-100 my-2"></div>

            <div className="flex items-center justify-center space-x-3 px-4 py-2 text-sm text-gray-500">
              <img 
                src="/verificacao-de-cadeado.svg" 
                alt="Acesso protegido" 
                className="w-4 h-4"
              />
              <span>Acesso protegido</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
