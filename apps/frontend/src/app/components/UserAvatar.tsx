'use client';


interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function UserAvatar({ size = 'md', className = '' }: UserAvatarProps) {

  const userInitial = "U"; // Placeholder for user initial
 

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-lg',
    lg: 'w-12 h-12 text-xl'
  };

  return (
    <div className={`bg-black rounded-full flex items-center justify-center hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors cursor-pointer ${sizeClasses[size]} ${className}`}>
      <span className="text-white font-semibold">
        {userInitial}
      </span>
    </div>
  );
}
