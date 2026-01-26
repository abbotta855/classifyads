import React from 'react';

/**
 * UserAvatar - Reusable component for displaying user profile photos
 * @param {string} src - Profile picture URL
 * @param {string} name - User name (for fallback initials)
 * @param {string} size - Size variant: 'sm', 'md', 'lg' (default: 'md')
 * @param {string} className - Additional CSS classes
 */
export default function UserAvatar({ src, name, size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg',
  };

  const baseClasses = 'rounded-full flex items-center justify-center bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] font-medium overflow-hidden';
  const sizeClass = sizeClasses[size] || sizeClasses.md;

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const [imageError, setImageError] = React.useState(false);

  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={name || 'User'}
        className={`${baseClasses} ${sizeClass} ${className} object-cover`}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div className={`${baseClasses} ${sizeClass} ${className}`}>
      {getInitials(name)}
    </div>
  );
}

