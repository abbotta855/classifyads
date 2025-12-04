import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import Layout from './Layout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

function UserDashboard() {
  const { user } = useAuth();
  const { section } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const activeSection = section || 'dashboard';

  // Dashboard menu items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'ad-post', label: 'Ad Post', icon: '📝' },
    { id: 'categories', label: 'Categories', icon: '📂' },
    { id: 'e-wallet', label: 'E-Wallet', icon: '💳' },
    { id: 'favourite-list', label: 'Favourite List', icon: '❤️' },
    { id: 'watch-list', label: 'Watch List', icon: '👁️' },
    { id: 'inbox', label: 'Inbox', icon: '📬' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'listed-items', label: 'Listed Items', icon: '📋' },
    { id: 'sales-report', label: 'Sales Report', icon: '📈' },
    { id: 'job-profile', label: 'Job Profile', icon: '💼' },
  ];

  // Handle navigation
  const handleSectionChange = (sectionId) => {
    if (sectionId === 'dashboard') {
      navigate('/dashboard');
    } else {
      navigate(`/dashboard/${sectionId}`);
    }
  };

  // Render section content
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardOverview user={user} />;
      case 'profile':
        return <ProfileSection user={user} />;
      case 'ad-post':
        return <AdPostSection user={user} />;
      case 'categories':
        return <CategoriesSection user={user} />;
      case 'e-wallet':
        return <EWalletSection user={user} />;
      case 'favourite-list':
        return <FavouriteListSection user={user} />;
      case 'watch-list':
        return <WatchListSection user={user} />;
      case 'inbox':
        return <InboxSection user={user} />;
      case 'notifications':
        return <NotificationsSection user={user} />;
      case 'listed-items':
        return <ListedItemsSection user={user} />;
      case 'sales-report':
        return <SalesReportSection user={user} />;
      case 'job-profile':
        return <JobProfileSection user={user} />;
      default:
        return <DashboardOverview user={user} />;
    }
  };

  return (
    <Layout>
      <div className="flex h-screen bg-[hsl(var(--background))]">
        {/* Sidebar */}
        <div className="w-64 bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-[hsl(var(--border))]">
            <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">User Dashboard</h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
              Welcome, {user?.name}
            </p>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto p-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSectionChange(item.id)}
                className={`w-full text-left px-4 py-3 mb-1 rounded-lg transition-colors flex items-center gap-3 ${
                  activeSection === item.id
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                    : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-[hsl(var(--border))]">
            <Link to="/">
              <Button variant="outline" className="w-full">
                Back to Homepage
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderSectionContent()}
        </div>
      </div>
    </Layout>
  );
}

// Dashboard Overview Component
function DashboardOverview({ user }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-2">
          Dashboard Overview
        </h1>
        <p className="text-[hsl(var(--muted-foreground))]">
          Welcome back, {user?.name}! Here's your account summary.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              Listed Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[hsl(var(--foreground))]">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              Total Sold
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[hsl(var(--foreground))]">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              Total Bought
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[hsl(var(--foreground))]">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              Total Earning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[hsl(var(--foreground))]">Rs. 0</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button onClick={() => window.location.href = '/dashboard/ad-post'}>
              Post New Ad
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/dashboard/listed-items'}>
              View My Listings
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/dashboard/e-wallet'}>
              Check E-Wallet
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-[hsl(var(--muted-foreground))]">Email:</span>
            <span className="text-[hsl(var(--foreground))]">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[hsl(var(--muted-foreground))]">Account Created:</span>
            <span className="text-[hsl(var(--foreground))]">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[hsl(var(--muted-foreground))]">Last Login:</span>
            <span className="text-[hsl(var(--foreground))]">
              {user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'N/A'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Placeholder components for other sections
function ProfileSection({ user }) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-4">Profile</h1>
      <Card>
        <CardContent className="p-6">
          <p className="text-[hsl(var(--muted-foreground))]">Profile management section - Coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}

function AdPostSection({ user }) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-4">Post New Ad</h1>
      <Card>
        <CardContent className="p-6">
          <p className="text-[hsl(var(--muted-foreground))]">Ad posting form - Coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}

function CategoriesSection({ user }) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-4">Categories</h1>
      <Card>
        <CardContent className="p-6">
          <p className="text-[hsl(var(--muted-foreground))]">Browse categories - Coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}

function EWalletSection({ user }) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-4">E-Wallet</h1>
      <Card>
        <CardContent className="p-6">
          <p className="text-[hsl(var(--muted-foreground))]">E-Wallet management - Coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}

function FavouriteListSection({ user }) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-4">Favourite List</h1>
      <Card>
        <CardContent className="p-6">
          <p className="text-[hsl(var(--muted-foreground))]">Favourite items - Coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}

function WatchListSection({ user }) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-4">Watch List</h1>
      <Card>
        <CardContent className="p-6">
          <p className="text-[hsl(var(--muted-foreground))]">Watch list items - Coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}

function InboxSection({ user }) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-4">Inbox</h1>
      <Card>
        <CardContent className="p-6">
          <p className="text-[hsl(var(--muted-foreground))]">Messages - Coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationsSection({ user }) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-4">Notifications</h1>
      <Card>
        <CardContent className="p-6">
          <p className="text-[hsl(var(--muted-foreground))]">Notifications - Coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ListedItemsSection({ user }) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-4">Listed Items</h1>
      <Card>
        <CardContent className="p-6">
          <p className="text-[hsl(var(--muted-foreground))]">Your listings - Coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}

function SalesReportSection({ user }) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-4">Sales Report</h1>
      <Card>
        <CardContent className="p-6">
          <p className="text-[hsl(var(--muted-foreground))]">Sales reports - Coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}

function JobProfileSection({ user }) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-4">Job Profile</h1>
      <Card>
        <CardContent className="p-6">
          <p className="text-[hsl(var(--muted-foreground))]">Job profile management - Coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default UserDashboard;

