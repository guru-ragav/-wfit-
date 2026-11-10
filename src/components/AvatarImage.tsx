import React, { useState, useEffect } from 'react';

interface AvatarImageProps {
  src?: string;
  name: string;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({
  src,
  name,
  alt,
  className = 'w-10 h-10 rounded-full object-cover',
  fallbackClassName = 'w-10 h-10 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0'
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initials = (name || 'WF')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('') || 'WF';

  if (!src || hasError) {
    return (
      <div className={fallbackClassName} aria-label={alt || name}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || name}
      className={className}
      onError={() => setHasError(true)}
    />
  );
};
