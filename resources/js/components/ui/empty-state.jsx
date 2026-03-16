import React from 'react';
import { Card, CardContent } from './card';
import { Button } from './button';
import { cn } from '../../lib/utils';

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  actionLabel,
  className 
}) {
  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="flex flex-col items-center justify-center p-12 text-center">
        {icon && (
          <div className="mb-4 text-[hsl(var(--muted-foreground))]">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold mb-2 text-[hsl(var(--foreground))]">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4 max-w-sm">
            {description}
          </p>
        )}
        {action && actionLabel && (
          <Button onClick={action} variant="outline">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

