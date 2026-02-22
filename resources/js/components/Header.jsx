import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { cartAPI } from '../utils/api';

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const isAdminPage = location.pathname.startsWith('/admin') || location.pathname.startsWith('/super_admin');
  const isUserDashboardPage = location.pathname.startsWith('/user_dashboard') || location.pathname.startsWith('/seller_dashboard');
  
  // Safely get theme - with fallback if ThemeProvider not available
  let theme = 'light';
  let toggleTheme = () => {
    // Default toggle function
    const root = document.documentElement;
    const currentTheme = root.classList.contains('dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', newTheme);
  };
  
  try {
    const themeContext = useTheme();
    if (themeContext && themeContext.theme) {
      theme = themeContext.theme;
      toggleTheme = themeContext.toggleTheme;
    }
  } catch (e) {
    // ThemeProvider not available, use default
    // This is fine - we'll use the fallback toggleTheme function above
  }

  // Safely get language - with fallback if LanguageProvider not available
  let language = 'en';
  let changeLanguage = (lng) => {
    // Default language change function
    localStorage.setItem('i18nextLng', lng);
    window.location.reload(); // Simple reload for language change
  };
  
  try {
    const languageContext = useLanguage();
    if (languageContext && languageContext.language) {
      language = languageContext.language;
      changeLanguage = languageContext.changeLanguage;
    }
  } catch (e) {
    // LanguageProvider not available, use default
    // Try to get language from localStorage
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('i18nextLng');
      if (savedLang) {
        language = savedLang;
      }
    }
  }

  // Safely get translation function - with fallback
  let t = (key) => {
    // Default: return key as-is, or try to extract readable text
    const parts = key.split('.');
    return parts[parts.length - 1];
  };
  
  try {
    const { t: translate } = useTranslation();
    if (translate) {
      t = translate;
    }
  } catch (e) {
    // useTranslation not available, use default
    console.warn('Translation not available:', e);
  }

  useEffect(() => {
    const loadCartCount = async () => {
      if (!user) {
        setCartCount(0);
        return;
      }
      try {
        const res = await cartAPI.get();
        setCartCount(res.data.count || 0);
      } catch (e) {
        console.error('Failed to load cart count', e);
      }
    };
    loadCartCount();
    // Refresh cart count every 5 seconds
    const interval = setInterval(loadCartCount, 5000);
    return () => clearInterval(interval);
  }, [user]);

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

          <div className="flex items-center space-x-4">
            {/* Language Switcher */}
            <div className="relative">
              <select
                value={language}
                onChange={(e) => changeLanguage(e.target.value)}
                className="p-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] text-sm cursor-pointer"
                aria-label="Select language"
              >
                <option value="en">English</option>
                <option value="ne">नेपाली</option>
              </select>
            </div>

            {/* Theme Toggle Button - More Visible */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[hsl(var(--accent))] transition-colors border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <svg
                  className="w-6 h-6 text-[hsl(var(--foreground))]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6 text-[hsl(var(--foreground))]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            <nav className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                {!isAdminPage && !isUserDashboardPage && (
                  <>
                    <Link
                      to="/ebooks"
                      className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                    >
                      {t('header.ebooks')}
                    </Link>
                    <Link
                      to="/auctions"
                      className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                    >
                      {t('header.auctions')}
                    </Link>
                    <Link
                      to="/nepali-products"
                      className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                    >
                      {t('header.nepaliProducts')}
                    </Link>
                    <Link
                      to="/user_dashboard/favourite-list"
                      className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                      title="Favourite List"
                    >
                      {t('header.favourite')}
                    </Link>
                    <Link
                      to="/user_dashboard/watch-list"
                      className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                      title="Watch List"
                    >
                      {t('header.watchlist')}
                    </Link>
                  </>
                )}
                {!isAdminPage && !isUserDashboardPage && user.role !== 'admin' && user.role !== 'super_admin' && (
                  <Link
                    to="/user_dashboard/dashboard"
                    className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                  >
                    User Dashboard
                  </Link>
                )}
                <span className="text-[hsl(var(--foreground))]">
                  {t('common.welcome')} {user.name}
                </span>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                >
                  {t('common.logout')}
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/ebooks"
                  className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                >
                  {t('header.ebooks')}
                </Link>
                <Link
                  to="/auctions"
                  className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                >
                  {t('header.auctions')}
                </Link>
                <Link
                  to="/nepali-products"
                  className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                >
                  {t('header.nepaliProducts')}
                </Link>
                <Link to="/login">
                  <Button variant="ghost">
                    {t('common.login')}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="outline">
                    {t('common.register')}
                  </Button>
                </Link>
              </>
            )}
            </nav>

            {/* Cart icon for desktop */}
            {user && !isAdminPage && !isUserDashboardPage && (
              <Link to="/cart" className="relative transition-colors hover:opacity-80">
                <img
                  src="/images/shopping_cart.png"
                  alt="Shopping Cart"
                  className="w-8 h-8"
                />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Cart icon for mobile */}
              {user && !isAdminPage && !isUserDashboardPage && (
                <Link to="/cart" className="relative transition-colors hover:opacity-80">
                  <img
                    src="/images/shopping_cart.png"
                    alt="Shopping Cart"
                    className="w-8 h-8"
                  />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>
              )}
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
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
            <nav className="flex flex-col py-4 space-y-3 px-4">
              {/* Language Switcher - Mobile */}
              <div className="py-2">
                <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-1 block">Language:</label>
                <select
                  value={language}
                  onChange={(e) => {
                    changeLanguage(e.target.value);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full p-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] text-sm"
                >
                  <option value="en">English</option>
                  <option value="ne">नेपाली</option>
                </select>
              </div>

              {/* Theme Toggle Button - Mobile */}
              <button
                onClick={() => {
                  toggleTheme();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors py-2"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                      />
                    </svg>
                    <span>Dark Mode</span>
                  </>
                )}
              </button>

              {user ? (
                <>
                  {!isAdminPage && !isUserDashboardPage && (
                    <>
                      <Link
                        to="/ebooks"
                        className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {t('header.ebooks')}
                      </Link>
                      <Link
                        to="/auctions"
                        className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {t('header.auctions')}
                      </Link>
                      <Link
                        to="/nepali-products"
                        className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {t('header.nepaliProducts')}
                      </Link>
                      <Link
                        to="/user_dashboard/favourite-list"
                        className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {t('header.favourite')}
                      </Link>
                      <Link
                        to="/user_dashboard/watch-list"
                        className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {t('header.watchlist')}
                      </Link>
                    </>
                  )}
                  {!isAdminPage && !isUserDashboardPage && user.role !== 'admin' && user.role !== 'super_admin' && (
                    <Link
                      to="/user_dashboard/dashboard"
                      className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      User Dashboard
                    </Link>
                  )}
                  <span className="text-[hsl(var(--foreground))]">
                    {t('common.welcome')} {user.name}
                  </span>
                  <Button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    variant="ghost"
                    className="w-full justify-start"
                  >
                    {t('common.logout')}
                  </Button>
                </>
              ) : (
                <>
                  <Link
                    to="/ebooks"
                    className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('header.ebooks')}
                  </Link>
                  <Link
                    to="/auctions"
                    className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('header.auctions')}
                  </Link>
                  <Link
                    to="/nepali-products"
                    className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('header.nepaliProducts')}
                  </Link>
                  <Link
                    to="/login"
                    className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('common.login')}
                  </Link>
                  <Link
                    to="/register"
                    className="text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('common.register')}
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
