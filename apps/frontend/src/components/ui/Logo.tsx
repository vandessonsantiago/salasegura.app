interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = "", size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-10 w-auto'
  };

  return (
    <div className="flex items-center">
      <img 
        src="/logotipo-salasegura.svg" 
        alt="Sala Segura" 
        className={`${sizeClasses[size]} ${className}`}
      />
    </div>
  );
}
