import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { initializeTimezone } from '../utils/timezone';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import UserDashboard from './UserDashboard';
import AdminPanel from './AdminPanel';
import Homepage from './Homepage';
import CategoriesPage from './CategoriesPage';
import CategoryPage from './CategoryPage';
import PublicProfile from './PublicProfile';
import AdDetailPage from './AdDetailPage';
import EbookListingPage from './EbookListingPage';
import EbookDetailPage from './EbookDetailPage';
import AuctionListingPage from './AuctionListingPage';
import AuctionDetailPage from './AuctionDetailPage';
import CartPage from './CartPage';
import { Card, CardContent } from './ui/card';
import BlogList from './BlogList';
import BlogDetail from './BlogDetail';
import ForumList from './ForumList';
import ForumThread from './ForumThread';
import AdminAnalytics from './AdminAnalytics';
import UserAnalytics from './UserAnalytics';
import AdminBlogPage from './AdminBlogPage';
import AdminForumModeration from './AdminForumModeration';
import SupportChatWidget from './SupportChatWidget';
import NepaliProductList from './NepaliProductList';
import NepaliProductDetail from './NepaliProductDetail';
import NepaliProductForm from './NepaliProductForm';

function LoadingCard() {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <p className="text-center">Loading...</p>
      </CardContent>
    </Card>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingCard />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingCard />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.role !== 'admin' && user.role !== 'super_admin') return <Navigate to="/user_dashboard/dashboard" replace />;
  return children;
}

function SuperAdminRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingCard />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.role !== 'super_admin') return <Navigate to="/user_dashboard/dashboard" replace />;
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingCard />;
  if (user) {
    let redirectPath = '/user_dashboard/dashboard';
    if (user.role === 'super_admin') {
      redirectPath = '/super_admin';
    } else if (user.role === 'admin') {
      redirectPath = '/admin';
    }
    return <Navigate to={location.state?.from?.pathname || redirectPath} replace />;
  }
  return children;
}

function DashboardRedirect() {
  const { user } = useAuth();
  if (user?.role === 'super_admin') {
    return <Navigate to="/super_admin" replace />;
  }
  if (user?.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  // Regular users go to User Dashboard
  return <Navigate to="/user_dashboard/dashboard" replace />;
}

function UserDashboardRedirect() {
  const location = useLocation();
  const section = location.pathname.replace('/dashboard', '').replace(/^\//, '') || 'dashboard';
  return <Navigate to={`/user_dashboard/${section}`} replace />;
}

function GATracker() {
  const location = useLocation();
  React.useEffect(() => {
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);
  return null;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/categories" element={<CategoriesPage />} />
      <Route path="/categories/:slug" element={<CategoryPage />} />
      <Route path="/categories/:slug/:subSlug" element={<CategoryPage />} />
      <Route path="/ads/:slug" element={<AdDetailPage />} />
      <Route path="/ebooks" element={<EbookListingPage />} />
      <Route path="/ebooks/:id" element={<EbookDetailPage />} />
      <Route path="/auctions" element={<AuctionListingPage />} />
      <Route path="/auctions/:id" element={<AuctionDetailPage />} />
      <Route path="/profile/:userId" element={<PublicProfile />} />
      <Route path="/blog" element={<BlogList />} />
      <Route path="/blog/:slug" element={<BlogDetail />} />
      <Route path="/forum" element={<ForumList />} />
      <Route path="/forum/:slug" element={<ForumThread />} />
      <Route path="/nepali-products" element={<NepaliProductList />} />
      <Route path="/nepali-products/:id" element={<NepaliProductDetail />} />
      <Route
        path="/nepali-products/new"
        element={
          <ProtectedRoute>
            <NepaliProductForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/nepali-products/:id/edit"
        element={
          <ProtectedRoute>
            <NepaliProductForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cart"
        element={
          <ProtectedRoute>
            <CartPage />
          </ProtectedRoute>
        }
      />
      {/* Category-based ad URLs - must be last to avoid conflicts with other routes */}
      <Route path="/:categorySlug/:adSlug" element={<AdDetailPage />} />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardRedirect />
          </ProtectedRoute>
        }
      />
      <Route
        path="/user_dashboard/:section?"
        element={
          <ProtectedRoute>
            <UserDashboard mode="user" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller_dashboard/:section?"
        element={
          <ProtectedRoute>
            <UserDashboard mode="seller" />
          </ProtectedRoute>
        }
      />
      {/* Keep old /dashboard/:section? route for backward compatibility, redirect to user_dashboard */}
      <Route
        path="/dashboard/:section?"
        element={
          <ProtectedRoute>
            <UserDashboardRedirect />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/:section?/:subsection?"
        element={
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        }
      />
      <Route
        path="/admin-analytics"
        element={
          <AdminRoute>
            <AdminAnalytics />
          </AdminRoute>
        }
      />
      <Route
        path="/admin-blog"
        element={
          <AdminRoute>
            <AdminBlogPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin-forum"
        element={
          <AdminRoute>
            <AdminForumModeration />
          </AdminRoute>
        }
      />
      <Route
        path="/my-analytics"
        element={
          <ProtectedRoute>
            <UserAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super_admin/:section?/:subsection?"
        element={
          <SuperAdminRoute>
            <AdminPanel />
          </SuperAdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  // Initialize timezone on app load
  useEffect(() => {
    initializeTimezone().then(timezone => {
      // Optionally send to backend if user is logged in
      // This will be handled by AuthContext when user loads
    });
  }, []);

  // Google Analytics (env-driven, prod only)
  useEffect(() => {
    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    if (!gaId || !import.meta.env.PROD) return;
    if (document.getElementById('ga-script')) return;
    const script = document.createElement('script');
    script.id = 'ga-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', gaId);
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <GATracker />
        <AppRoutes />
        <SupportChatWidget />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;