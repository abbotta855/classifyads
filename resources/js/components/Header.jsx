import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin') || location.pathname.startsWith('/super_admin');
  const isUserDashboardPage = location.pathname.startsWith('/user_dashboard') || location.pathname.startsWith('/seller_dashboard');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo area */}
          <Link to="/" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-[hsl(var(--primary))]">Shushil12</h1>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                {!isAdminPage && !isUserDashboardPage && user.role !== 'admin' && (
                  <Link
                    to="/dashboard"
                    className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                  >
                    Dashboard
                  </Link>
                )}
                {/* Admin Panel link - show when admin is NOT on admin panel */}
                {(user.role === 'admin' || user.role === 'super_admin') && !isAdminPage && (
                  <Link
                    to={user.role === 'super_admin' ? '/super_admin' : '/admin'}
                    className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                  >
                    Admin Panel
                  </Link>
                )}
                {/* User Dashboard link - show when admin is NOT on user dashboard */}
                {(user.role === 'admin' || user.role === 'super_admin') && !isUserDashboardPage && (
                  <Link
                    to="/user_dashboard/dashboard"
                    className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                  >
                    User Dashboard
                  </Link>
                )}
                {!isAdminPage && !isUserDashboardPage && user.role !== 'admin' && (
                  <Link to="/user_dashboard/ad-post">
                    <Button variant="outline">
                      Post Ad
                    </Button>
                  </Link>
                )}
                <span className="text-[hsl(var(--foreground))]">
                  Welcome {user.name}
                </span>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/cart" className="transition-colors hover:opacity-80">
                  <img 
                    src="/images/shopping_cart.png" 
                    alt="Shopping Cart" 
                    className="w-8 h-8"
                  />
                </Link>
                <Link to="/login">
                  <Button variant="ghost">
                    Log in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="outline">
                    Sign up
                  </Button>
                </Link>
                <Link to="/user_dashboard/ad-post">
                  <Button>
                    Post Ad
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;

