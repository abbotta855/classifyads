import React from 'react';
import { Button } from './button';
import { ThumbsUp } from 'lucide-react';

/**
 * ThumbsUpButton - Reusable thumbs up button for forum reactions
 * @param {number} count - Current reaction count
 * @param {boolean} isActive - Whether user has reacted
 * @param {function} onClick - Click handler
 * @param {boolean} disabled - Whether button is disabled
 * @param {string} label - Label text (e.g., "useful" or "helpful")
 */
export default function ThumbsUpButton({ 
  count = 0, 
  isActive = false, 
  onClick, 
  disabled = false,
  label = 'helpful'
}) {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <Button
      variant={isActive ? 'default' : 'outline'}
      size="sm"
      onClick={handleClick}
      disabled={disabled}
      className="gap-2"
    >
      <ThumbsUp className={`h-4 w-4 ${isActive ? 'fill-current' : ''}`} />
      <span>
        {count > 0 ? (
          <>
            {count} {count === 1 ? 'person' : 'people'} found this {label}
          </>
        ) : (
          <>Found this {label}?</>
        )}
      </span>
    </Button>
  );
}

