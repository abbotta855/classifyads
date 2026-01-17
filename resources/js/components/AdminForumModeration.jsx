import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

// Minimal placeholder for forum moderation UI.
// Replace with full moderation tools (approve/delete threads, manage reports) when ready.
export default function AdminForumModeration() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>Admin Forum Moderation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[hsl(var(--muted-foreground))]">
            Forum moderation UI is not implemented yet in this build. Manage reports and threads here when wired.
          </p>
          <Button disabled>Coming soon</Button>
        </CardContent>
      </Card>
    </div>
  );
}

