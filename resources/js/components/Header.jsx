import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-[hsl(var(--primary))]">ClassifiedAds</h1>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
            >
              Home
            </Link>
            <Link
              to="/categories"
              className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
            >
              Categories
            </Link>
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                >
                  Dashboard
                </Link>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                  >
                    Admin Panel
                  </Link>
                )}
                <Button
                  onClick={handleLogout}
                  variant="outline"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button>
                    Sign Up
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

