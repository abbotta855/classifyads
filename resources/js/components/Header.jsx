import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
                {!isAdminPage && !isUserDashboardPage && (
                  <>
                    <Link
                      to="/ebooks"
                      className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                    >
                      eBooks
                    </Link>
                    <Link
                      to="/auctions"
                      className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                    >
                      Auctions
                    </Link>
                    <Link
                      to="/forum"
                      className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                    >
                      Forum
                    </Link>
                    <Link
                      to="/user_dashboard/favourite-list"
                      className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                      title="Favourite List"
                    >
                      Favourite
                    </Link>
                    <Link
                      to="/user_dashboard/watch-list"
                      className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                      title="Watch List"
                    >
                      Watchlist
                    </Link>
                  </>
                )}
                {!isAdminPage && !isUserDashboardPage && user.role !== 'admin' && user.role !== 'super_admin' && (
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
                <Link
                  to="/ebooks"
                  className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                >
                  eBooks
                </Link>
                <Link
                  to="/auctions"
                  className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                >
                  Auctions
                </Link>
                <Link
                  to="/forum"
                  className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                >
                  Forum
                </Link>
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
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
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
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
            <nav className="flex flex-col py-4 space-y-3 px-4">
              {user ? (
                <>
                  {!isAdminPage && !isUserDashboardPage && (
                    <>
                      <Link
                        to="/ebooks"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors py-2"
                      >
                        eBooks
                      </Link>
                      <Link
                        to="/auctions"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors py-2"
                      >
                        Auctions
                      </Link>
                      <Link
                        to="/forum"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors py-2"
                      >
                        Forum
                      </Link>
                      <Link
                        to="/user_dashboard/favourite-list"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors py-2"
                      >
                        Favourite
                      </Link>
                      <Link
                        to="/user_dashboard/watch-list"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors py-2"
                      >
                        Watchlist
                      </Link>
                    </>
                  )}
                  {!isAdminPage && !isUserDashboardPage && user.role !== 'admin' && user.role !== 'super_admin' && (
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors py-2"
                    >
                      Dashboard
                    </Link>
                  )}
                  {(user.role === 'admin' || user.role === 'super_admin') && !isAdminPage && (
                    <Link
                      to={user.role === 'super_admin' ? '/super_admin' : '/admin'}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors py-2"
                    >
                      Admin Panel
                    </Link>
                  )}
                  {(user.role === 'admin' || user.role === 'super_admin') && !isUserDashboardPage && (
                    <Link
                      to="/user_dashboard/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors py-2"
                    >
                      User Dashboard
                    </Link>
                  )}
                  <span className="text-[hsl(var(--foreground))] py-2">
                    Welcome {user.name}
                  </span>
                  <Button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    to="/ebooks"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors py-2"
                  >
                    eBooks
                  </Link>
                  <Link
                    to="/auctions"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors py-2"
                  >
                    Auctions
                  </Link>
                  <Link
                    to="/forum"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors py-2"
                  >
                    Forum
                  </Link>
                  <Link 
                    to="/cart" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="transition-colors hover:opacity-80 py-2 flex items-center gap-2"
                  >
                    <img 
                      src="/images/shopping_cart.png" 
                      alt="Shopping Cart" 
                      className="w-6 h-6"
                    />
                    <span>Shopping Cart</span>
                  </Link>
                  <Link 
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="ghost" className="w-full justify-start">
                      Log in
                    </Button>
                  </Link>
                  <Link 
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="outline" className="w-full justify-start">
                      Sign up
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;

