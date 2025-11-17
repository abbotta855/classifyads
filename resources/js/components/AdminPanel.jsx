import React from 'react';
import Layout from './Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

function AdminPanel() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-2">
            Admin Panel
          </h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Manage all aspects of the platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Listings Management */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Listings Management</CardTitle>
              <CardDescription>
                View, edit, and remove all listings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Manage Listings</Button>
            </CardContent>
          </Card>

          {/* Categories Management */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Categories Management</CardTitle>
              <CardDescription>
                Manage categories and subcategories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Manage Categories</Button>
            </CardContent>
          </Card>

          {/* Users Management */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Users Management</CardTitle>
              <CardDescription>
                View and manage all users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Manage Users</Button>
            </CardContent>
          </Card>

          {/* Reviews Management */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Reviews Management</CardTitle>
              <CardDescription>
                Moderate ratings and reviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Manage Reviews</Button>
            </CardContent>
          </Card>

          {/* Payments Management */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Payments Management</CardTitle>
              <CardDescription>
                View all transactions and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Manage Payments</Button>
            </CardContent>
          </Card>

          {/* Auctions Management */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Auctions Management</CardTitle>
              <CardDescription>
                Monitor and manage all auctions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Manage Auctions</Button>
            </CardContent>
          </Card>

          {/* Analytics Dashboard */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                View platform statistics and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">View Analytics</Button>
            </CardContent>
          </Card>

          {/* Content Moderation */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Content Moderation</CardTitle>
              <CardDescription>
                Review and moderate platform content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Moderate Content</Button>
            </CardContent>
          </Card>

          {/* Activity Logs */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>
                View system activity and logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">View Logs</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

export default AdminPanel;

