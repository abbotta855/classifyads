import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from './Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Welcome back, {user?.name}!</CardTitle>
            <CardDescription>
              You are successfully logged in to your account.
              {isAdmin && (
                <span className="block mt-1 text-[hsl(var(--primary))] font-medium">
                  Admin Access Enabled
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Email:</p>
              <p className="text-sm font-medium text-[hsl(var(--foreground))]">{user?.email}</p>
              {user?.role && (
                <>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">Role:</p>
                  <p className="text-sm font-medium text-[hsl(var(--foreground))] capitalize">
                    {user.role}
                  </p>
                </>
              )}
              {user?.location && (
                <>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">Location:</p>
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                    {user.location}
                  </p>
                </>
              )}
            </div>
            <div className="pt-4 border-t border-[hsl(var(--border))]">
              <h3 className="font-semibold mb-2 text-[hsl(var(--foreground))]">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button>
                  Post New Ad
                </Button>
                <Button variant="outline">
                  My Listings
                </Button>
              </div>
            </div>
            {isAdmin && (
              <div className="pt-4 border-t border-[hsl(var(--border))]">
                <h3 className="font-semibold mb-2 text-[hsl(var(--foreground))]">Admin Panel</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                  Access administrative controls and manage the platform
                </p>
                <Link to="/admin">
                  <Button className="w-full bg-[hsl(var(--primary))] hover:opacity-90">
                    Go to Admin Panel
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default Dashboard;