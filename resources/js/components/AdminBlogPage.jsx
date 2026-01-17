import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

// Minimal placeholder for admin blog management.
// Replace with full CRUD UI once API wiring is ready.
export default function AdminBlogPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>Admin Blog Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-[hsl(var(--muted-foreground))]">
            Blog admin UI is not implemented yet in this build. Add posts, edit, publish,
            and moderate from here once the backend endpoints are wired.
          </p>
          <Button disabled>Coming soon</Button>
        </CardContent>
      </Card>
    </div>
  );
}

