interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
  center?: boolean;
}

export default function LoadingSpinner({ 
  size = 'md', 
  text, 
  className = '',
  center = true 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const containerClasses = center 
    ? 'flex items-center justify-center' 
    : 'flex items-center';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div 
        className={`animate-spin rounded-full border-2 border-primary-200 border-t-primary-600 ${sizeClasses[size]}`}
        aria-label="Loading"
      />
      {text && (
        <span className={`ml-3 text-gray-600 ${textSizeClasses[size]}`}>
          {text}
        </span>
      )}
    </div>
  );
}