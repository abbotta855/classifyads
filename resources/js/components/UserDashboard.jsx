import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import Layout from './Layout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { profileAPI, dashboardAPI, userAdAPI, favouriteAPI, watchlistAPI, recentlyViewedAPI, savedSearchAPI, notificationAPI, inboxAPI, ratingAPI, publicProfileAPI, boughtItemsAPI, itemsSellingAPI, sellerOfferAPI, buyerSellerMessageAPI } from '../utils/api';
import RecentlyViewedWidget from './dashboard/RecentlyViewedWidget';
import RatingModal from './RatingModal';
import PhotoCropModal from './PhotoCropModal';
import axios from 'axios';

function UserDashboard({ mode: propMode }) {
  const { user, loading } = useAuth();
  const { section } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const activeSection = section || 'dashboard';

  // Determine dashboard mode from URL path or prop
  const getModeFromPath = useCallback(() => {
    if (location.pathname.startsWith('/seller_dashboard')) {
      return 'seller';
    }
    if (location.pathname.startsWith('/user_dashboard')) {
      return 'user';
    }
    // Fallback to prop or localStorage
    return propMode || localStorage.getItem('dashboardMode') || 'user';
  }, [location.pathname, propMode]);

  // Dashboard mode: 'user' or 'seller' - determined by URL
  const [dashboardMode, setDashboardMode] = useState(() => {
    return getModeFromPath();
  });

  // Update mode when URL changes
  useEffect(() => {
    const newMode = getModeFromPath();
    if (newMode !== dashboardMode) {
      setDashboardMode(newMode);
      localStorage.setItem('dashboardMode', newMode);
    }
  }, [location.pathname, getModeFromPath, dashboardMode]);

  // Check if user has posted ads
  const [userAds, setUserAds] = useState([]);
  const [hasPostedAds, setHasPostedAds] = useState(false);
  const [loadingAds, setLoadingAds] = useState(true);

  // Don't redirect admins - they can access user dashboard from admin panel
  // Only redirect if they're trying to access from a direct URL (optional - can be removed)
  // useEffect(() => {
  //   if (!loading && user) {
  //     if (user.role === 'super_admin') {
  //       navigate('/super_admin', { replace: true });
  //       return;
  //     }
  //     if (user.role === 'admin') {
  //       navigate('/admin', { replace: true });
  //       return;
  //     }
  //   }
  // }, [user, loading, navigate]);

  // Fetch user's ads to check if they have posted any
  useEffect(() => {
    if (user && !loading) {
      const fetchUserAds = async () => {
        try {
          setLoadingAds(true);
          const response = await userAdAPI.getAds();
          const ads = response.data?.data || response.data || [];
          setUserAds(ads);
          setHasPostedAds(ads.length > 0);
          
          // If user has ads and mode is 'user', suggest seller mode
          // But don't force it - let user choose
          if (ads.length > 0 && dashboardMode === 'user') {
            // Keep user mode as default, but allow switching
          }
        } catch (err) {
          console.error('Error fetching user ads:', err);
          setHasPostedAds(false);
        } finally {
          setLoadingAds(false);
        }
      };
      fetchUserAds();
    }
  }, [user, loading]);

  // Save dashboard mode to localStorage when it changes
  useEffect(() => {
    if (dashboardMode) {
      localStorage.setItem('dashboardMode', dashboardMode);
    }
  }, [dashboardMode]);

  // Handle mode change - ensure we're on the right section
  useEffect(() => {
    // If switching to seller mode and on a user-only section, redirect to seller dashboard
    if (dashboardMode === 'seller' && hasPostedAds) {
      const userOnlySections = ['ad-post', 'categories', 'e-wallet', 'favourite-list', 'watch-list', 'bought-items'];
      if (userOnlySections.includes(activeSection)) {
        navigate('/seller_dashboard/dashboard', { replace: true });
      }
    }
    // If switching to user mode and on a seller-only section, redirect to user dashboard
    if (dashboardMode === 'user') {
      const sellerOnlySections = ['items-selling'];
      if (sellerOnlySections.includes(activeSection)) {
        navigate('/user_dashboard/dashboard', { replace: true });
      }
    }
  }, [dashboardMode, activeSection, hasPostedAds, navigate]);

  // Allow admins to access user dashboard - don't block them
  // if (!loading && user && (user.role === 'super_admin' || user.role === 'admin')) {
  //   return null; // Don't render anything while redirecting
  // }

  // Dashboard menu items - User mode
  const userMenuItems = [
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
    { id: 'bought-items', label: 'Total Bought Items', icon: '🛒' },
    { id: 'my-ratings', label: 'My Ratings', icon: '⭐' },
  ];

  // Dashboard menu items - Seller mode (only if has posted ads)
  const sellerMenuItems = [
    { id: 'dashboard', label: 'Seller Dashboard', icon: '📊' },
    { id: 'items-selling', label: 'Items Selling', icon: '🛍️' },
    { id: 'listed-items', label: 'Listed Items', icon: '📋' },
    { id: 'sales-report', label: 'Sales Report', icon: '📈' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'inbox', label: 'Inbox', icon: '📬' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'my-ratings', label: 'My Ratings', icon: '⭐' },
  ];

  // Get current menu items based on mode
  const menuItems = dashboardMode === 'seller' && hasPostedAds ? sellerMenuItems : userMenuItems;

  // Handle navigation - use correct base path based on mode
  const handleSectionChange = (sectionId) => {
    const basePath = dashboardMode === 'seller' ? '/seller_dashboard' : '/user_dashboard';
    if (sectionId === 'dashboard') {
      navigate(`${basePath}/dashboard`);
    } else {
      navigate(`${basePath}/${sectionId}`);
    }
  };

  // Render section content
  const renderSectionContent = () => {
    // If seller mode but trying to access user-only sections, redirect to seller dashboard
    if (dashboardMode === 'seller' && !hasPostedAds) {
      setDashboardMode('user');
      return <DashboardOverview user={user} />;
    }

    switch (activeSection) {
      case 'dashboard':
        return dashboardMode === 'seller' 
          ? <SellerDashboardOverview user={user} userAds={userAds} />
          : <DashboardOverview user={user} />;
      case 'items-selling':
        // Only accessible in seller mode
        if (dashboardMode !== 'seller' || !hasPostedAds) {
          return <DashboardOverview user={user} />;
        }
        return <ItemsSellingSection user={user} userAds={userAds} />;
      case 'profile':
        return <ProfileSection user={user} dashboardMode={dashboardMode} />;
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
        return <ListedItemsSection user={user} dashboardMode={dashboardMode} />;
      case 'sales-report':
        return <SalesReportSection user={user} dashboardMode={dashboardMode} />;
      case 'job-profile':
        return <JobProfileSection user={user} />;
      case 'my-ratings':
        return <MyRatingsSection user={user} />;
      case 'bought-items':
        return <TotalBoughtItemsSection user={user} />;
      default:
        return dashboardMode === 'seller'
          ? <SellerDashboardOverview user={user} userAds={userAds} />
          : <DashboardOverview user={user} />;
    }
  };

  return (
    <Layout>
      <div className="flex h-screen bg-[hsl(var(--background))]">
        {/* Sidebar */}
        <div className="w-64 bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-[hsl(var(--border))]">
            <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">
              {dashboardMode === 'seller' ? 'Seller Dashboard' : 'User Dashboard'}
            </h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
              Welcome, {user?.name}
            </p>
            
            {/* Role Switcher - Only show if user has posted ads */}
            {hasPostedAds && !loadingAds && (
              <div className="mt-3 space-y-1 border-t border-[hsl(var(--border))] pt-3">
                <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2 font-medium">Switch Mode:</p>
                <button
                  onClick={() => {
                    if (dashboardMode !== 'user') {
                      navigate('/user_dashboard/dashboard', { replace: true });
                    }
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                    dashboardMode === 'user'
                      ? 'bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] font-medium'
                      : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]'
                  }`}
                >
                  User Dashboard
                </button>
                <button
                  onClick={() => {
                    if (hasPostedAds && dashboardMode !== 'seller') {
                      navigate('/seller_dashboard/dashboard', { replace: true });
                    }
                  }}
                  disabled={!hasPostedAds}
                  className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                    dashboardMode === 'seller'
                      ? 'bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] font-medium'
                      : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]'
                  } ${!hasPostedAds ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Seller Dashboard
                </button>
              </div>
            )}
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
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine dashboard mode from URL
  const dashboardMode = location.pathname.startsWith('/seller_dashboard') ? 'seller' : 'user';
  const basePath = dashboardMode === 'seller' ? '/seller_dashboard' : '/user_dashboard';
  
  const handleSectionChange = (sectionId) => {
    if (sectionId === 'dashboard') {
      navigate(`${basePath}/dashboard`);
    } else {
      navigate(`${basePath}/${sectionId}`);
    }
  };
  const [stats, setStats] = useState({
    listed_items: 0,
    total_sold: 0,
    total_bought: 0,
    total_earning: 0,
    balance: 0,
    last_login: 'Never',
    last_login_at: null,
  });
  const [loading, setLoading] = useState(true);
  const [lastLoginFormatted, setLastLoginFormatted] = useState('Never');

  useEffect(() => {
    fetchStats();
  }, []);

  // Update last login display in real-time
  useEffect(() => {
    if (!stats.last_login_at) {
      setLastLoginFormatted('Never');
      return;
    }

    const updateLastLogin = () => {
      const lastLogin = new Date(stats.last_login_at);
      const now = new Date();
      const diffMs = now - lastLogin;

      if (diffMs < 0) {
        // If last login is in the future (timezone issue), show date
        setLastLoginFormatted(lastLogin.toLocaleDateString());
        return;
      }

      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30);
      const diffYears = Math.floor(diffDays / 365);

      if (diffSeconds < 60) {
        setLastLoginFormatted(`${diffSeconds} second${diffSeconds !== 1 ? 's' : ''} ago`);
      } else if (diffMinutes < 60) {
        setLastLoginFormatted(`${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`);
      } else if (diffHours < 24) {
        setLastLoginFormatted(`${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`);
      } else if (diffDays < 7) {
        setLastLoginFormatted(`${diffDays} day${diffDays !== 1 ? 's' : ''} ago`);
      } else if (diffWeeks < 4) {
        setLastLoginFormatted(`${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`);
      } else if (diffMonths < 12) {
        setLastLoginFormatted(`${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`);
      } else {
        setLastLoginFormatted(`${diffYears} year${diffYears !== 1 ? 's' : ''} ago`);
      }
    };

    // Update immediately
    updateLastLogin();

    // Update every 30 seconds for real-time feel
    const interval = setInterval(updateLastLogin, 30000);

    return () => clearInterval(interval);
  }, [stats.last_login_at]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

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
            {loading ? (
              <p className="text-3xl font-bold text-[hsl(var(--foreground))]">...</p>
            ) : (
              <p className="text-3xl font-bold text-[hsl(var(--foreground))]">{stats.listed_items}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              Total Sold
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-3xl font-bold text-[hsl(var(--foreground))]">...</p>
            ) : (
              <p className="text-3xl font-bold text-[hsl(var(--foreground))]">{stats.total_sold}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              Total Bought
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-3xl font-bold text-[hsl(var(--foreground))]">...</p>
            ) : (
              <p className="text-3xl font-bold text-[hsl(var(--foreground))]">{stats.total_bought}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              Total Earning
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-3xl font-bold text-[hsl(var(--foreground))]">...</p>
            ) : (
              <p className="text-3xl font-bold text-[hsl(var(--foreground))]">
                Rs. {stats.total_earning.toLocaleString()}
              </p>
            )}
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
            <Button onClick={() => handleSectionChange('ad-post')}>
              Post New Ad
            </Button>
            <Button variant="outline" onClick={() => handleSectionChange('listed-items')}>
              View My Listings
            </Button>
            <Button variant="outline" onClick={() => handleSectionChange('e-wallet')}>
              Check E-Wallet
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recently Viewed */}
      <RecentlyViewedWidget />

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
              {loading ? '...' : lastLoginFormatted}
            </span>
          </div>
          {stats.balance > 0 && (
            <div className="flex justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">Balance:</span>
              <span className="text-[hsl(var(--foreground))] font-semibold">
                Rs. {stats.balance.toLocaleString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Profile Section Component
function ProfileSection({ user: initialUser }) {
  const { user: authUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [locationData, setLocationData] = useState({ provinces: [] });
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState(new Set());
  const [expandedProvinces, setExpandedProvinces] = useState(new Set());
  const [expandedDistricts, setExpandedDistricts] = useState(new Set());
  const [expandedLocalLevels, setExpandedLocalLevels] = useState(new Set());
  const locationDropdownRef = useRef(null);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dob: '',
    phone: '',
    profile_picture: null,
  });

  // Password form
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });

  // Fetch profile data
  useEffect(() => {
    fetchProfile();
    fetchLocations();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await profileAPI.getProfile();
      const userData = response.data;
      setProfileData(userData);
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        dob: userData.dob ? userData.dob.split('T')[0] : '',
        phone: userData.phone || '',
        profile_picture: null,
      });
      
      // Initialize location selection
      if (userData.location_id) {
        const locationSet = new Set();
        // If there's a local address, use that (most specific)
        if (userData.selected_local_address && userData.selected_local_address !== '__LOCAL_LEVEL_ONLY__') {
          // Try to find the address index in the location data
          // For now, use the location_id with the selected_local_address
          // The format should be: location_id-index or just use location_id if we can't determine index
          const addressId = `${userData.location_id}-${userData.selected_local_address}`;
          locationSet.add(addressId);
        } else {
          // Otherwise, just use the location_id (ward level)
          locationSet.add(userData.location_id);
        }
        setSelectedLocations(locationSet);
      }
    } catch (err) {
      setError('Failed to load profile: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await axios.get('/api/locations');
      setLocationData(response.data);
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  // Handle click outside location dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
    };

    if (showLocationDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLocationDropdown]);

  // Compress image function for profile picture
  const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Always convert to JPEG for better compression
          const outputType = 'image/jpeg';
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                type: outputType,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            outputType,
            quality
          );
        };
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  // Handle form input changes
  const handleInputChange = async (e) => {
    const { name, value, files } = e.target;
    if (name === 'profile_picture' && files && files[0]) {
      const file = files[0];
      
      // Validate file type first
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Please upload JPEG, PNG, JPG, or GIF image.');
        setTimeout(() => setError(null), 5000);
        return;
      }
      
      const maxSize = 2 * 1024 * 1024; // 2MB
      
      // Always try to compress large images, don't reject immediately
      try {
        let processedFile = file;
        
        // If file is larger than maxSize OR larger than 500KB, compress it
        if (file.size > maxSize || file.size > 500 * 1024) {
          setError(null); // Clear any previous errors
          // Show loading message
          setError('Compressing image... Please wait.');
          
          // First compression attempt - more aggressive for larger files
          if (file.size > maxSize * 2) {
            // Very large file - start with aggressive compression
            processedFile = await compressImage(file, 800, 800, 0.7);
          } else if (file.size > maxSize) {
            // Large file - start with moderate compression
            processedFile = await compressImage(file, 1000, 1000, 0.75);
          } else {
            // Medium file - light compression
            processedFile = await compressImage(file, 1200, 1200, 0.8);
          }
          
          // If still too large, try more aggressive compression
          if (processedFile.size > maxSize) {
            processedFile = await compressImage(file, 600, 600, 0.6);
          }
          
          // If still too large, try even more aggressive compression
          if (processedFile.size > maxSize) {
            processedFile = await compressImage(file, 400, 400, 0.5);
          }
          
          // Final check - if still too large after all compression attempts
          if (processedFile.size > maxSize) {
            setError(`Image is too large even after compression (${(processedFile.size / 1024 / 1024).toFixed(2)}MB). Please choose a smaller image.`);
            setTimeout(() => setError(null), 5000);
            return;
          }
        }
        
        // Validate final file size
        if (processedFile.size > maxSize) {
          setError('File size is too large. Maximum size is 2MB. Please choose a smaller image.');
          setTimeout(() => setError(null), 5000);
          return;
        }
        
        setFormData(prev => ({ ...prev, [name]: processedFile }));
        setError(null); // Clear any errors on success
        setSuccess(`Image ready to upload! (${(processedFile.size / 1024).toFixed(0)}KB)`);
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        console.error('Error processing image:', err);
        setError('Failed to process image. Please try a different image.');
        setTimeout(() => setError(null), 5000);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  // Toggle functions for location hierarchy
  const toggleProvince = (provinceId) => {
    setExpandedProvinces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(provinceId)) {
        newSet.delete(provinceId);
      } else {
        newSet.add(provinceId);
      }
      return newSet;
    });
  };

  const toggleDistrict = (districtKey) => {
    setExpandedDistricts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(districtKey)) {
        newSet.delete(districtKey);
      } else {
        newSet.add(districtKey);
      }
      return newSet;
    });
  };

  const toggleLocalLevel = (localLevelKey) => {
    setExpandedLocalLevels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(localLevelKey)) {
        newSet.delete(localLevelKey);
      } else {
        newSet.add(localLevelKey);
      }
      return newSet;
    });
  };

  // Handle location toggle (single location selection for profile)
  const handleLocationToggle = (locationId) => {
    setSelectedLocations(new Set([locationId]));
    // Close dropdown after selection for better UX
    setShowLocationDropdown(false);
  };

  // Build location string for display
  const buildLocationString = () => {
    if (selectedLocations.size === 0) return 'Select location';
    
    const locationId = Array.from(selectedLocations)[0];
    // Find location in hierarchy
    for (const province of locationData.provinces || []) {
      for (const district of province.districts || []) {
        for (const localLevel of district.localLevels || []) {
          if (localLevel.wards) {
            for (const ward of localLevel.wards || []) {
              if (ward.id === locationId) {
                let locationString = `${province.name} > ${district.name} > ${localLevel.name}`;
                if (ward.ward_number) {
                  locationString += ` > Ward ${ward.ward_number}`;
                }
                // Check if there's a local address
                if (typeof locationId === 'string' && locationId.includes('-')) {
                  const parts = locationId.split('-');
                  const wardId = parseInt(parts[0]);
                  const addressIndex = parseInt(parts[1]);
                  if (ward.id === wardId && ward.local_addresses && ward.local_addresses[addressIndex]) {
                    locationString += ` > ${ward.local_addresses[addressIndex]}`;
                  }
                }
                return locationString;
              }
              // Check local addresses
              if (ward.local_addresses) {
                ward.local_addresses.forEach((address, idx) => {
                  const addressId = `${ward.id}-${idx}`;
                  if (addressId === locationId || (typeof locationId === 'string' && locationId === addressId)) {
                    let locationString = `${province.name} > ${district.name} > ${localLevel.name}`;
                    if (ward.ward_number) {
                      locationString += ` > Ward ${ward.ward_number}`;
                    }
                    locationString += ` > ${address}`;
                    return locationString;
                  }
                });
              }
            }
          }
        }
      }
    }
    return 'Location selected';
  };

  // Save profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      // Create FormData like ad posting does
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      if (formData.dob) formDataToSend.append('dob', formData.dob);
      if (formData.phone) formDataToSend.append('phone', formData.phone);
      
      // Append profile picture if it exists (as File object)
      if (formData.profile_picture && formData.profile_picture instanceof File) {
        formDataToSend.append('profile_picture', formData.profile_picture);
      }

      // Extract location_id from selected locations
      // If location was previously set, keep it; otherwise extract from selection
      if (selectedLocations.size > 0) {
        const locationId = Array.from(selectedLocations)[0];
        // Handle both number and string IDs (for local addresses like "123-0")
        if (typeof locationId === 'number') {
          formDataToSend.append('location_id', locationId);
        } else if (typeof locationId === 'string') {
          // If it's a string like "123-0", extract the number part
          const numericId = parseInt(locationId.split('-')[0]);
          if (!isNaN(numericId)) {
            formDataToSend.append('location_id', numericId);
            // If it contains a dash, it's a local address
            if (locationId.includes('-')) {
              const addressPart = locationId.split('-').slice(1).join('-');
              formDataToSend.append('selected_local_address', addressPart);
            }
          }
        }
      } else if (profileData?.location_id) {
        // Keep existing location if no new selection
        formDataToSend.append('location_id', profileData.location_id);
        if (profileData.selected_local_address) {
          formDataToSend.append('selected_local_address', profileData.selected_local_address);
        }
      }

      // Use PUT method for profile update
      formDataToSend.append('_method', 'PUT');

      // Use axios directly with proper headers like ad posting does
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });

      setSuccess('Profile updated successfully!');
      setProfileData(response.data.user);
      // Update auth context if needed
      setTimeout(() => {
        setSuccess(null);
        window.location.reload(); // Refresh to update user context
      }, 2000);
    } catch (err) {
      // Handle specific error codes
      if (err.response?.status === 413) {
        setError('File size is too large. Please compress your image to under 2MB or choose a smaller image.');
      } else if (err.response?.status === 422) {
        const errors = err.response?.data?.errors;
        if (errors) {
          const errorMessages = Object.values(errors).flat().join(', ');
          setError('Validation error: ' + errorMessages);
        } else {
          setError('Failed to update profile: ' + (err.response?.data?.message || 'Invalid data provided'));
        }
      } else {
        setError('Failed to update profile: ' + (err.response?.data?.message || err.message || 'Please try again'));
      }
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setChangingPassword(true);

    try {
      await profileAPI.changePassword(passwordData);
      setSuccess('Password changed successfully!');
      setPasswordData({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to change password: ' + (err.response?.data?.message || err.message));
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-4">Profile</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-[hsl(var(--muted-foreground))]">Loading profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-2">Profile Management</h1>
        <p className="text-[hsl(var(--muted-foreground))]">Manage your account information and settings</p>
      </div>

      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="p-4">
            <p className="text-green-600">{success}</p>
          </CardContent>
        </Card>
      )}

      {/* Profile Picture and Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Profile Picture */}
            <div className="flex items-center gap-6">
              <div>
                {profileData?.profile_picture ? (
                  <img
                    src={profileData.profile_picture}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-[hsl(var(--border))]"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-4xl">
                    {profileData?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Label htmlFor="profile_picture">Profile Picture</Label>
                <Input
                  id="profile_picture"
                  name="profile_picture"
                  type="file"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="mt-1"
                />
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Max size: 2MB. Formats: JPEG, PNG, JPG, GIF
                </p>
              </div>
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="mt-1"
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="mt-1"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleInputChange}
                className="mt-1"
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                className="mt-1"
                placeholder="+977 98XXXXXXXX"
              />
            </div>

            {/* Location Selection */}
            <div>
              <Label>Address</Label>
              <div className="relative mt-1" ref={locationDropdownRef}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                  className="w-full justify-between"
                >
                  <span className="truncate">{buildLocationString()}</span>
                  <span className="ml-2 flex-shrink-0">{showLocationDropdown ? '▲' : '▼'}</span>
                </Button>
                {showLocationDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-[hsl(var(--border))]">
                        <span className="font-semibold text-sm text-[hsl(var(--foreground))]">Select Location</span>
                        {selectedLocations.size > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedLocations(new Set())}
                            className="text-xs text-[hsl(var(--primary))] hover:underline"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      
                      {/* Hierarchical Location Tree */}
                      <div className="space-y-1">
                        {(locationData.provinces || []).map((province) => (
                          <div key={province.id} className="border-b border-[hsl(var(--border))] pb-1 mb-1">
                            {/* Province Level */}
                            <div className="flex items-center py-1 hover:bg-[hsl(var(--accent))] rounded px-2">
                              <button
                                type="button"
                                onClick={() => toggleProvince(province.id)}
                                className="mr-2 text-xs"
                              >
                                {expandedProvinces.has(province.id) ? '▼' : '▶'}
                              </button>
                              <span className="text-sm font-medium text-[hsl(var(--foreground))]">{province.name}</span>
                            </div>
                            
                            {/* Districts */}
                            {expandedProvinces.has(province.id) && province.districts.map((district) => (
                              <div key={district.id} className="ml-6 mt-1">
                                <div className="flex items-center py-1 hover:bg-[hsl(var(--accent))] rounded px-2">
                                  <button
                                    type="button"
                                    onClick={() => toggleDistrict(`${province.id}-${district.id}`)}
                                    className="mr-2 text-xs"
                                  >
                                    {expandedDistricts.has(`${province.id}-${district.id}`) ? '▼' : '▶'}
                                  </button>
                                  <span className="text-sm text-[hsl(var(--foreground))]">{district.name}</span>
                                </div>
                                
                                {/* Local Levels */}
                                {expandedDistricts.has(`${province.id}-${district.id}`) && district.localLevels.map((localLevel) => (
                                  <div key={localLevel.id} className="ml-6 mt-1">
                                    <div className="flex items-center py-1 hover:bg-[hsl(var(--accent))] rounded px-2">
                                      <button
                                        type="button"
                                        onClick={() => toggleLocalLevel(`${province.id}-${district.id}-${localLevel.id}`)}
                                        className="mr-2 text-xs"
                                      >
                                        {expandedLocalLevels.has(`${province.id}-${district.id}-${localLevel.id}`) ? '▼' : '▶'}
                                      </button>
                                      <span className="text-sm text-[hsl(var(--foreground))]">{localLevel.name}</span>
                                    </div>
                                    
                                    {/* Wards */}
                                    {expandedLocalLevels.has(`${province.id}-${district.id}-${localLevel.id}`) && localLevel.wards && localLevel.wards.map((ward) => (
                                      <div key={ward.id} className="ml-6 mt-1">
                                        <div className="flex items-center py-1 hover:bg-[hsl(var(--accent))] rounded px-2">
                                          <input
                                            type="radio"
                                            name="location_selection"
                                            className="mr-2"
                                            checked={selectedLocations.has(ward.id)}
                                            onChange={() => handleLocationToggle(ward.id)}
                                          />
                                          <span className="text-sm text-[hsl(var(--foreground))]">
                                            {ward.ward_number ? `Ward ${ward.ward_number}` : 'Ward'}
                                          </span>
                                        </div>
                                        
                                        {/* Local Addresses */}
                                        {ward.local_addresses && ward.local_addresses.length > 0 && (
                                          <div className="ml-6 mt-1 space-y-1">
                                            {ward.local_addresses.map((address, idx) => {
                                              const addressId = `${ward.id}-${idx}`;
                                              return (
                                                <div key={addressId} className="flex items-center py-1 hover:bg-[hsl(var(--accent))] rounded px-2">
                                                  <input
                                                    type="radio"
                                                    name="location_selection"
                                                    className="mr-2"
                                                    checked={selectedLocations.has(addressId)}
                                                    onChange={() => handleLocationToggle(addressId)}
                                                  />
                                                  <span className="text-sm text-[hsl(var(--foreground))]">{address}</span>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Label htmlFor="current_password">Current Password</Label>
              <Input
                id="current_password"
                name="current_password"
                type="password"
                value={passwordData.current_password}
                onChange={handlePasswordChange}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="new_password">New Password</Label>
              <Input
                id="new_password"
                name="new_password"
                type="password"
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                required
                minLength={8}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="new_password_confirmation">Confirm New Password</Label>
              <Input
                id="new_password_confirmation"
                name="new_password_confirmation"
                type="password"
                value={passwordData.new_password_confirmation}
                onChange={handlePasswordChange}
                required
                minLength={8}
                className="mt-1"
              />
            </div>

            <Button type="submit" disabled={changingPassword} className="w-full">
              {changingPassword ? 'Changing Password...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Profile Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">Member Since:</span>
              <span className="text-[hsl(var(--foreground))] font-semibold">
                {profileData?.member_since || (profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[hsl(var(--muted-foreground))]">Last Login:</span>
              <span className="text-[hsl(var(--foreground))] font-semibold">
                {profileData?.last_login_formatted || (profileData?.last_login_at ? formatLastLogin(profileData.last_login_at) : 'Never')}
              </span>
            </div>
            {profileData?.response_rate !== null && profileData.response_rate !== undefined && (
              <div className="flex justify-between">
                <span className="text-[hsl(var(--muted-foreground))]">Response Rate:</span>
                <span className="text-[hsl(var(--foreground))] font-semibold">
                  {profileData.response_rate}%
                </span>
              </div>
            )}
            {profileData?.total_sold !== undefined && (
              <div className="flex justify-between">
                <span className="text-[hsl(var(--muted-foreground))]">Total Sold Items:</span>
                <span className="text-[hsl(var(--foreground))] font-semibold">
                  {profileData.total_sold || 0}
                </span>
              </div>
            )}
          </div>
          
          {/* Profile Rating */}
          {profileData?.profile_rating && (
            <div className="border-t border-[hsl(var(--border))] pt-4 mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[hsl(var(--muted-foreground))]">Profile Rating:</span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-xl ${
                          star <= Math.round(profileData.profile_rating.average || 0)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-lg font-bold text-[hsl(var(--foreground))]">
                    {profileData.profile_rating.average?.toFixed(1) || '0.0'}/5
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">
                  {profileData.profile_rating.total || 0} review{(profileData.profile_rating.total || 0) !== 1 ? 's' : ''}
                </span>
                <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  {profileData.profile_rating.percentage?.toFixed(1) || '0.0'}%
                </span>
              </div>
            </div>
          )}
          {(!profileData?.profile_rating || profileData.profile_rating.total === 0) && (
            <div className="border-t border-[hsl(var(--border))] pt-4 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-[hsl(var(--muted-foreground))]">Profile Rating:</span>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className="text-xl text-gray-300">★</span>
                    ))}
                  </div>
                  <span className="text-lg font-bold text-[hsl(var(--muted-foreground))]">No ratings yet</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">0 reviews</span>
                <span className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">0%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Ad Post Section Component
function AdPostSection({ user }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '',
    location_id: null,
  });
  const [images, setImages] = useState([null, null, null, null]);
  const [categories, setCategories] = useState([]);
  const [locationData, setLocationData] = useState({ provinces: [] });
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState(new Set());
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [expandedProvinces, setExpandedProvinces] = useState(new Set());
  const [expandedDistricts, setExpandedDistricts] = useState(new Set());
  const [expandedLocalLevels, setExpandedLocalLevels] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [cropImageIndex, setCropImageIndex] = useState(null);
  const [cropImageFile, setCropImageFile] = useState(null);
  const locationDropdownRef = useRef(null);

  useEffect(() => {
    fetchCategories();
    fetchLocations();
    
    // Handle click outside location dropdown
    const handleClickOutside = (event) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await axios.get('/api/locations');
      setLocationData(response.data || { provinces: [] });
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  // Compress image before storing
  const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (index, file) => {
    if (!file) return;
    
    // Open crop modal for the image
    setCropImageIndex(index);
    setCropImageFile(file);
  };

  const handleCropComplete = async (croppedFile) => {
    if (cropImageIndex === null) return;
    
    // Compress image if it's larger than 1MB
    let processedFile = croppedFile;
    if (croppedFile.size > 1024 * 1024) { // 1MB
      try {
        processedFile = await compressImage(croppedFile);
      } catch (err) {
        console.error('Error compressing image:', err);
        // Use original file if compression fails
      }
    }
    
    const newImages = [...images];
    newImages[cropImageIndex] = processedFile;
    setImages(newImages);
    
    // Close crop modal
    setCropImageIndex(null);
    setCropImageFile(null);
  };

  const handleCropCancel = () => {
    setCropImageIndex(null);
    setCropImageFile(null);
  };

  const handleRemoveImage = (index) => {
    const newImages = [...images];
    newImages[index] = null;
    setImages(newImages);
  };

  const getSelectedCategory = () => {
    if (!selectedCategoryName) return null;
    return categories.find(c => c.name === selectedCategoryName);
  };

  const handleCategorySelect = (categoryName) => {
    setSelectedCategoryName(categoryName);
    setSelectedSubcategoryId('');
    const category = categories.find(c => c.name === categoryName);
    if (category) {
      setFormData({ ...formData, category_id: category.id.toString() });
    }
  };

  const handleSubcategorySelect = (subcategoryId) => {
    setSelectedSubcategoryId(subcategoryId);
    const category = getSelectedCategory();
    if (category) {
      const subcategory = category.subcategories?.find(s => s.id === parseInt(subcategoryId));
      if (subcategory) {
        setFormData({ ...formData, category_id: subcategory.id.toString() });
        setShowCategoryDropdown(false);
      }
    }
  };

  const buildCategoryString = () => {
    if (selectedSubcategoryId) {
      const category = getSelectedCategory();
      const subcategory = category?.subcategories?.find(s => s.id === parseInt(selectedSubcategoryId));
      if (category && subcategory) {
        return `${category.name} > ${subcategory.name}`;
      }
    }
    if (selectedCategoryName) {
      return selectedCategoryName;
    }
    return 'Select Category';
  };

  const handleLocationToggle = (locationId) => {
    setSelectedLocations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(locationId)) {
        newSet.delete(locationId);
      } else {
        // Only allow one location selection
        newSet.clear();
        newSet.add(locationId);
      }
      return newSet;
    });
  };

  const buildLocationString = () => {
    if (selectedLocations.size === 0) {
      return 'Select Location';
    }
    const locationId = Array.from(selectedLocations)[0];
    // Find location in hierarchy
    for (const province of locationData.provinces || []) {
      for (const district of province.districts || []) {
        for (const localLevel of district.localLevels || []) {
          for (const ward of localLevel.wards || []) {
            if (ward.id === locationId) {
              return `${province.name} > ${district.name} > ${localLevel.name}${ward.ward_number ? ' > Ward ' + ward.ward_number : ''}`;
            }
          }
        }
      }
    }
    return '1 location selected';
  };

  const toggleProvince = (provinceId) => {
    setExpandedProvinces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(provinceId)) {
        newSet.delete(provinceId);
      } else {
        newSet.add(provinceId);
      }
      return newSet;
    });
  };

  const toggleDistrict = (districtKey) => {
    setExpandedDistricts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(districtKey)) {
        newSet.delete(districtKey);
      } else {
        newSet.add(districtKey);
      }
      return newSet;
    });
  };

  const toggleLocalLevel = (localLevelKey) => {
    setExpandedLocalLevels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(localLevelKey)) {
        newSet.delete(localLevelKey);
      } else {
        newSet.add(localLevelKey);
      }
      return newSet;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      // Validate
      if (!formData.title || !formData.description || !formData.price || !formData.category_id) {
        throw new Error('Please fill in all required fields');
      }
      if (images.filter(img => img !== null).length === 0) {
        throw new Error('Please upload at least one image');
      }

      // Get location_id from selected locations
      // Handle both ward ID and local address ID (format: wardId-index)
      let locationId = null;
      let selectedLocalAddress = null;
      
      if (selectedLocations.size > 0) {
        const selectedId = Array.from(selectedLocations)[0];
        if (typeof selectedId === 'string' && selectedId.includes('-')) {
          // It's a local address - extract ward ID and address index
          const parts = selectedId.split('-');
          locationId = parseInt(parts[0]);
          selectedLocalAddress = parts.slice(1).join('-'); // Handle multi-part addresses
        } else {
          // It's a ward ID
          locationId = typeof selectedId === 'number' ? selectedId : parseInt(selectedId);
        }
      }

      // Prepare form data
      const submitData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category_id: parseInt(formData.category_id),
        location_id: locationId,
        selected_local_address: selectedLocalAddress || null,
        images: images.filter(img => img !== null),
      };

      await userAdAPI.createAd(submitData);
      
      setSuccess('Ad posted successfully!');
      // Reset form
      setFormData({
        title: '',
        description: '',
        price: '',
        category_id: '',
        location_id: null,
      });
      setImages([null, null, null, null]);
      setSelectedCategoryName('');
      setSelectedSubcategoryId('');
      setSelectedLocations(new Set());
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to post ad: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-2">Post New Ad</h1>
        <p className="text-[hsl(var(--muted-foreground))]">Create a new listing for your item</p>
      </div>

      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="p-4">
            <p className="text-green-600">{success}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ad Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter ad title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your item in detail"
                className="w-full min-h-[120px] px-3 py-2 border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
                required
              />
            </div>

            {/* Price */}
            <div>
              <Label htmlFor="price">Price (Rs.) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            {/* Category */}
            <div className="relative" ref={locationDropdownRef}>
              <Label>Category *</Label>
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full text-left px-3 py-2 border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
              >
                {buildCategoryString()}
              </button>
              {showCategoryDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-md shadow-lg max-h-96 overflow-y-auto">
                  {categories.map((category) => (
                    <div key={category.id}>
                      <button
                        type="button"
                        onClick={() => handleCategorySelect(category.name)}
                        className={`w-full text-left px-4 py-2 hover:bg-[hsl(var(--accent))] ${
                          selectedCategoryName === category.name ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : ''
                        }`}
                      >
                        {category.name}
                      </button>
                      {selectedCategoryName === category.name && category.subcategories && category.subcategories.length > 0 && (
                        <div className="pl-4">
                          {category.subcategories.map((subcategory) => (
                            <button
                              key={subcategory.id}
                              type="button"
                              onClick={() => handleSubcategorySelect(subcategory.id)}
                              className={`w-full text-left px-4 py-2 hover:bg-[hsl(var(--accent))] ${
                                selectedSubcategoryId === subcategory.id.toString() ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : ''
                              }`}
                            >
                              &nbsp;&nbsp;→ {subcategory.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Location */}
            <div className="relative" ref={locationDropdownRef}>
              <Label>Location</Label>
              <button
                type="button"
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                className="w-full text-left px-3 py-2 border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
              >
                {buildLocationString()}
              </button>
              {showLocationDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-md shadow-lg max-h-96 overflow-y-auto">
                  {(locationData.provinces || []).map((province) => (
                    <div key={province.id}>
                      <button
                        type="button"
                        onClick={() => toggleProvince(province.id)}
                        className="w-full text-left px-4 py-2 hover:bg-[hsl(var(--accent))] flex items-center justify-between"
                      >
                        <span>{province.name}</span>
                        <span>{expandedProvinces.has(province.id) ? '−' : '+'}</span>
                      </button>
                      {expandedProvinces.has(province.id) && (province.districts || []).map((district) => {
                        const districtKey = `${province.id}-${district.id}`;
                        return (
                          <div key={district.id} className="pl-4">
                            <button
                              type="button"
                              onClick={() => toggleDistrict(districtKey)}
                              className="w-full text-left px-4 py-2 hover:bg-[hsl(var(--accent))] flex items-center justify-between"
                            >
                              <span>{district.name}</span>
                              <span>{expandedDistricts.has(districtKey) ? '−' : '+'}</span>
                            </button>
                            {expandedDistricts.has(districtKey) && (district.localLevels || []).map((localLevel) => {
                              const localLevelKey = `${districtKey}-${localLevel.id}`;
                              return (
                                <div key={localLevel.id} className="pl-4">
                                  <button
                                    type="button"
                                    onClick={() => toggleLocalLevel(localLevelKey)}
                                    className="w-full text-left px-4 py-2 hover:bg-[hsl(var(--accent))] flex items-center justify-between"
                                  >
                                    <span>{localLevel.name}</span>
                                    <span>{expandedLocalLevels.has(localLevelKey) ? '−' : '+'}</span>
                                  </button>
                                  {expandedLocalLevels.has(localLevelKey) && (localLevel.wards || []).map((ward) => (
                                    <div key={ward.id} className="pl-4">
                                      <label className="flex items-center px-4 py-2 hover:bg-[hsl(var(--accent))] cursor-pointer">
                                        <input
                                          type="radio"
                                          name="ad_location_selection"
                                          checked={selectedLocations.has(ward.id) && !Array.from(selectedLocations)[0]?.toString().includes('-')}
                                          onChange={() => handleLocationToggle(ward.id)}
                                          className="mr-2"
                                        />
                                        <span>Ward {ward.ward_number || 'N/A'}</span>
                                      </label>
                                      {/* Local Addresses */}
                                      {ward.local_addresses && ward.local_addresses.length > 0 && (
                                        <div className="pl-6 mt-1 space-y-1">
                                          {ward.local_addresses.map((address, idx) => {
                                            const addressId = `${ward.id}-${idx}`;
                                            return (
                                              <label key={addressId} className="flex items-center px-4 py-2 hover:bg-[hsl(var(--accent))] cursor-pointer">
                                                <input
                                                  type="radio"
                                                  name="ad_location_selection"
                                                  checked={selectedLocations.has(addressId)}
                                                  onChange={() => handleLocationToggle(addressId)}
                                                  className="mr-2"
                                                />
                                                <span className="text-sm">{address}</span>
                                              </label>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Images */}
            <div>
              <Label>Images * (Up to 4 images)</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="relative">
                    {images[index] ? (
                      <div className="relative">
                        <img
                          src={URL.createObjectURL(images[index])}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md border border-[hsl(var(--border))]"
                        />
                        <div className="absolute top-1 right-1 flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setCropImageIndex(index);
                              setCropImageFile(images[index]);
                            }}
                            className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-blue-600"
                            title="Crop Image"
                          >
                            ✂️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                            title="Remove Image"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[hsl(var(--border))] rounded-md cursor-pointer hover:bg-[hsl(var(--accent))]">
                        <span className="text-2xl mb-1">+</span>
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">Add Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              handleImageChange(index, e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? 'Posting...' : 'Post Ad'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Photo Crop Modal */}
      {cropImageFile && cropImageIndex !== null && (
        <PhotoCropModal
          imageFile={cropImageFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={null} // Free crop, can be changed to specific ratios like 1, 4/3, 16/9
          minWidth={200}
          minHeight={200}
        />
      )}
    </div>
  );
}

function CategoriesSection({ user }) {
  const [savedSearches, setSavedSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSearchForm, setShowSearchForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    search_query: '',
    category_id: '',
    location_id: '',
    min_price: '',
    max_price: '',
    is_active: true,
  });
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    fetchSavedSearches();
    fetchCategories();
    fetchLocations();
  }, []);

  const fetchSavedSearches = async () => {
    try {
      const response = await savedSearchAPI.getSearches();
      setSavedSearches(response.data || []);
    } catch (err) {
      console.error('Failed to fetch saved searches:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await axios.get('/api/locations');
      setLocations(response.data || []);
    } catch (err) {
      console.error('Failed to fetch locations:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await savedSearchAPI.createSearch({
        ...formData,
        category_id: formData.category_id || null,
        location_id: formData.location_id || null,
        min_price: formData.min_price || null,
        max_price: formData.max_price || null,
      });
      setShowSearchForm(false);
      setFormData({
        name: '',
        search_query: '',
        category_id: '',
        location_id: '',
        min_price: '',
        max_price: '',
        is_active: true,
      });
      fetchSavedSearches();
    } catch (err) {
      console.error('Failed to save search:', err);
    }
  };

  const handleToggle = async (id) => {
    try {
      await savedSearchAPI.toggleActive(id);
      fetchSavedSearches();
    } catch (err) {
      console.error('Failed to toggle search:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await savedSearchAPI.deleteSearch(id);
      fetchSavedSearches();
    } catch (err) {
      console.error('Failed to delete search:', err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Saved Searches</h1>
        <Button onClick={() => setShowSearchForm(!showSearchForm)}>
          {showSearchForm ? 'Cancel' : '+ New Search'}
        </Button>
      </div>

      {showSearchForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Save Search Alert</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="search_name">Search Name</Label>
                <Input
                  id="search_name"
                  placeholder="e.g., Laptop under 50000"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="search_query">Keywords</Label>
                <Input
                  id="search_query"
                  placeholder="Search keywords..."
                  value={formData.search_query}
                  onChange={(e) => setFormData({ ...formData, search_query: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="search_category">Category</Label>
                  <select
                    id="search_category"
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="search_location">Location</Label>
                  <select
                    id="search_location"
                    value={formData.location_id}
                    onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">All Locations</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_price">Min Price</Label>
                  <Input
                    id="min_price"
                    type="number"
                    placeholder="0"
                    value={formData.min_price}
                    onChange={(e) => setFormData({ ...formData, min_price: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="max_price">Max Price</Label>
                  <Input
                    id="max_price"
                    type="number"
                    placeholder="No limit"
                    value={formData.max_price}
                    onChange={(e) => setFormData({ ...formData, max_price: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Enable email alerts for new matches
                </Label>
              </div>
              <Button type="submit" className="w-full">Save Search</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-[hsl(var(--muted-foreground))]">Loading saved searches...</p>
          </CardContent>
        </Card>
      ) : savedSearches.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">
              No saved searches
            </h3>
            <p className="text-[hsl(var(--muted-foreground))] mb-6">
              Save your searches to get alerts when new matching ads are posted
            </p>
            <Button onClick={() => setShowSearchForm(true)}>Create Your First Search</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {savedSearches.map((search) => (
            <Card key={search.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-[hsl(var(--foreground))]">
                        {search.name}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        search.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {search.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-sm text-[hsl(var(--muted-foreground))] space-y-1">
                      {search.search_query && <p>Keywords: {search.search_query}</p>}
                      {search.category && <p>Category: {search.category.category}</p>}
                      {search.location && <p>Location: {search.location.name}</p>}
                      {(search.min_price || search.max_price) && (
                        <p>
                          Price: Rs. {search.min_price || '0'} - {search.max_price || '∞'}
                        </p>
                      )}
                      {search.alert_count > 0 && (
                        <p className="text-xs">Alerts sent: {search.alert_count}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(search.id)}
                      className="text-xs"
                    >
                      {search.is_active ? 'Disable' : 'Enable'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(search.id)}
                      className="text-xs text-[hsl(var(--destructive))]"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function EWalletSection({ user }) {
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      // Calculate balance from transactions
      const response = await axios.get('/api/admin/transaction-management');
      const userTransactions = (response.data || []).filter(t => t.user_id === user?.id);
      
      // Calculate balance
      const calculatedBalance = userTransactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => {
          if (['deposit', 'payment'].includes(t.type)) {
            return sum + parseFloat(t.amount || 0);
          } else if (['withdraw', 'refund'].includes(t.type)) {
            return sum - parseFloat(t.amount || 0);
          }
          return sum;
        }, 0);
      
      setBalance(calculatedBalance);
      setTransactions(userTransactions.slice(0, 50)); // Last 50 transactions
    } catch (err) {
      setError('Failed to load wallet data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type) => {
    const icons = {
      deposit: '💰',
      withdraw: '💸',
      payment: '💳',
      refund: '↩️',
      featured_listing: '⭐',
      auction_deposit: '🔨',
      ebook_purchase: '📚',
    };
    return icons[type] || '💵';
  };

  const getTransactionColor = (type) => {
    if (['deposit', 'refund'].includes(type)) return 'text-green-600';
    if (['withdraw', 'payment'].includes(type)) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-6">E-Wallet</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-[hsl(var(--muted-foreground))]">Loading wallet...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-6">E-Wallet</h1>

      {error && (
        <Card className="mb-4 border-[hsl(var(--destructive))]">
          <CardContent className="p-4">
            <p className="text-sm text-[hsl(var(--destructive))]">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Balance Card */}
      <Card className="mb-6 bg-gradient-to-br from-[hsl(var(--primary))]/10 to-[hsl(var(--primary))]/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">Current Balance</p>
              <p className="text-4xl font-bold text-[hsl(var(--foreground))]">
                Rs. {balance.toLocaleString()}
              </p>
            </div>
            <div className="text-6xl opacity-20">💳</div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" disabled>
              Add Funds (Coming Soon)
            </Button>
            <Button variant="outline" disabled>
              Withdraw (Coming Soon)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-[hsl(var(--muted-foreground))]">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-[hsl(var(--accent))] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getTransactionIcon(transaction.type)}</div>
                    <div>
                      <p className="font-medium text-[hsl(var(--foreground))] capitalize">
                        {transaction.type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {transaction.description || 'No description'}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {new Date(transaction.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                      {['deposit', 'refund'].includes(transaction.type) ? '+' : '-'}
                      Rs. {parseFloat(transaction.amount || 0).toLocaleString()}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                      transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FavouriteListSection({ user }) {
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFavourites();
  }, []);

  const fetchFavourites = async () => {
    try {
      setLoading(true);
      const response = await favouriteAPI.getFavourites();
      setFavourites(response.data.data || response.data || []);
    } catch (err) {
      setError('Failed to load favourites');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (favouriteId) => {
    try {
      await favouriteAPI.removeFavourite(favouriteId);
      setFavourites(favourites.filter(f => f.id !== favouriteId));
    } catch (err) {
      console.error('Failed to remove favourite:', err);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-6">Favourite List</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-[hsl(var(--muted-foreground))]">Loading favourites...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Favourite List</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {favourites.length} {favourites.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      {error && (
        <Card className="mb-4 border-[hsl(var(--destructive))]">
          <CardContent className="p-4">
            <p className="text-sm text-[hsl(var(--destructive))]">{error}</p>
          </CardContent>
        </Card>
      )}

      {favourites.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">❤️</div>
            <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">
              No favourites yet
            </h3>
            <p className="text-[hsl(var(--muted-foreground))] mb-6">
              Start adding items you love to your favourites list
            </p>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              Browse Ads
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favourites.map((favourite) => {
            const ad = favourite.ad || favourite;
            return (
              <Card key={favourite.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={ad.image1_url || ad.photos?.[0]?.photo_url || '/placeholder-image.png'}
                    alt={ad.title}
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={() => handleRemove(favourite.id)}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-2 transition-colors"
                    title="Remove from favourites"
                  >
                    <span className="text-red-500 text-xl">❤️</span>
                  </button>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-[hsl(var(--foreground))] mb-2 line-clamp-2">
                    {ad.title}
                  </h3>
                  <p className="text-lg font-bold text-[hsl(var(--primary))] mb-2">
                    Rs. {parseFloat(ad.price || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
                    {ad.category?.category || 'Uncategorized'}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.location.href = `/ads/${ad.id}`}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function WatchListSection({ user }) {
  const [watchlists, setWatchlists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWatchlists();
  }, []);

  const fetchWatchlists = async () => {
    try {
      setLoading(true);
      const response = await watchlistAPI.getWatchlists();
      setWatchlists(response.data.data || response.data || []);
    } catch (err) {
      setError('Failed to load watchlist');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (watchlistId) => {
    try {
      await watchlistAPI.removeWatchlist(watchlistId);
      setWatchlists(watchlists.filter(w => w.id !== watchlistId));
    } catch (err) {
      console.error('Failed to remove from watchlist:', err);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-6">Watch List</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-[hsl(var(--muted-foreground))]">Loading watchlist...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Watch List</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {watchlists.length} {watchlists.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      {error && (
        <Card className="mb-4 border-[hsl(var(--destructive))]">
          <CardContent className="p-4">
            <p className="text-sm text-[hsl(var(--destructive))]">{error}</p>
          </CardContent>
        </Card>
      )}

      {watchlists.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">👁️</div>
            <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">
              Your watchlist is empty
            </h3>
            <p className="text-[hsl(var(--muted-foreground))] mb-6">
              Add items you're interested in to keep track of them
            </p>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              Browse Ads
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlists.map((watchlist) => {
            const ad = watchlist.ad || watchlist;
            return (
              <Card key={watchlist.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={ad.image1_url || ad.photos?.[0]?.photo_url || '/placeholder-image.png'}
                    alt={ad.title}
                    className="w-full h-48 object-cover"
                  />
                  <button
                    onClick={() => handleRemove(watchlist.id)}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white rounded-full p-2 transition-colors"
                    title="Remove from watchlist"
                  >
                    <span className="text-gray-600 text-xl">👁️</span>
                  </button>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-[hsl(var(--foreground))] mb-2 line-clamp-2">
                    {ad.title}
                  </h3>
                  <p className="text-lg font-bold text-[hsl(var(--primary))] mb-2">
                    Rs. {parseFloat(ad.price || 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
                    {ad.category?.category || 'Uncategorized'}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.location.href = `/ads/${ad.id}`}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function InboxSection({ user }) {
  const [activeTab, setActiveTab] = useState('support'); // 'support' or 'buyer-seller'
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // Buyer-Seller Conversations
  const [buyerSellerConversations, setBuyerSellerConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchChats();
    fetchBuyerSellerConversations();
  }, []);

  useEffect(() => {
    if (activeTab === 'buyer-seller' && selectedConversation) {
      loadConversationMessages(selectedConversation.ad_id);
      const interval = setInterval(() => {
        loadConversationMessages(selectedConversation.ad_id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab, selectedConversation]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      // Poll for new messages every 3 seconds
      const interval = setInterval(() => {
        fetchMessages(selectedChat.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedChat]);

  const fetchChats = async () => {
    try {
      const response = await inboxAPI.getChats();
      setChats(response.data || []);
      if (response.data && response.data.length > 0 && !selectedChat) {
        setSelectedChat(response.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await inboxAPI.getChat(chatId);
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    try {
      setSending(true);
      await inboxAPI.sendMessage(selectedChat.id, newMessage);
      setNewMessage('');
      fetchMessages(selectedChat.id);
      fetchChats(); // Refresh chat list
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleCreateChat = async () => {
    try {
      const response = await inboxAPI.createChat();
      setSelectedChat(response.data.chat || response.data);
      fetchChats();
    } catch (err) {
      console.error('Failed to create chat:', err);
    }
  };

  const fetchBuyerSellerConversations = async () => {
    setLoadingConversations(true);
    try {
      let response;
      // Check if user has any ads (seller) or is a buyer
      const userAds = await userAdAPI.getAds();
      if (userAds.data && userAds.data.length > 0) {
        // User is a seller - get seller conversations
        response = await buyerSellerMessageAPI.getSellerConversations();
      } else {
        // User is a buyer - get buyer conversations
        response = await buyerSellerMessageAPI.getBuyerConversations();
      }
      setBuyerSellerConversations(response.data || []);
      if (response.data && response.data.length > 0 && !selectedConversation) {
        setSelectedConversation(response.data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch buyer-seller conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadConversationMessages = async (adId) => {
    try {
      const response = await buyerSellerMessageAPI.getConversation(adId);
      setConversationMessages(response.data || []);
      // Auto-scroll to bottom after messages load
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Failed to load conversation messages:', err);
    }
  };

  const handleSendBuyerSellerMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      await buyerSellerMessageAPI.sendMessage(selectedConversation.ad_id, {
        message: newMessage.trim(),
        sender_type: user.id === selectedConversation.seller_id ? 'seller' : 'buyer',
      });
      setNewMessage('');
      await loadConversationMessages(selectedConversation.ad_id);
      fetchBuyerSellerConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
      alert(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-6">Inbox</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-[hsl(var(--muted-foreground))]">Loading messages...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-6">Inbox</h1>
      
      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-[hsl(var(--border))]">
        <button
          onClick={() => setActiveTab('support')}
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
            activeTab === 'support'
              ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
              : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
          }`}
        >
          Support Chat
        </button>
        <button
          onClick={() => setActiveTab('buyer-seller')}
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
            activeTab === 'buyer-seller'
              ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
              : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
          }`}
        >
          Buyer-Seller Messages
        </button>
      </div>

      {activeTab === 'support' ? (
        <div className="flex h-[calc(100vh-300px)] gap-4">
          {/* Chat List */}
          <div className="w-1/3 border-r">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Conversations</h2>
              <Button size="sm" onClick={handleCreateChat}>+ New</Button>
            </div>
            <div className="overflow-y-auto">
              {chats.length === 0 ? (
                <div className="p-4 text-center text-[hsl(var(--muted-foreground))]">
                  <p className="mb-4">No conversations yet</p>
                  <Button size="sm" onClick={handleCreateChat}>Start a conversation</Button>
                </div>
              ) : (
                chats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-4 border-b cursor-pointer hover:bg-[hsl(var(--accent))] transition-colors ${
                      selectedChat?.id === chat.id ? 'bg-[hsl(var(--accent))]' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-[hsl(var(--foreground))]">Support Team</p>
                      {chat.unread_count > 0 && (
                        <span className="bg-[hsl(var(--primary))] text-white text-xs rounded-full px-2 py-1">
                          {chat.unread_count}
                        </span>
                      )}
                    </div>
                    {chat.messages && chat.messages.length > 0 && (
                      <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-1">
                        {chat.messages[0].message}
                      </p>
                    )}
                    {chat.last_message_at && (
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                        {new Date(chat.last_message_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="p-4 border-b">
              <h3 className="font-semibold text-[hsl(var(--foreground))]">Support Team</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender_type === 'user'
                        ? 'bg-[hsl(var(--primary))] text-white'
                        : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]'
                    }`}
                  >
                    <p className="text-sm">{message.message}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender_type === 'user' ? 'text-white/70' : 'text-[hsl(var(--muted-foreground))]'
                    }`}>
                      {new Date(message.sent_at || message.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button type="submit" disabled={sending || !newMessage.trim()}>
                Send
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">
                Select a conversation
              </h3>
              <p className="text-[hsl(var(--muted-foreground))]">
                Choose a conversation from the list or start a new one
              </p>
            </div>
          </div>
        )}
          </div>
        </div>
      ) : (
        <div className="flex h-[calc(100vh-300px)] gap-4">
          {/* Buyer-Seller Conversation List */}
          <div className="w-1/3 border-r">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Ad Conversations</h2>
            </div>
            <div className="overflow-y-auto">
              {loadingConversations ? (
                <div className="p-4 text-center text-[hsl(var(--muted-foreground))]">
                  Loading conversations...
                </div>
              ) : buyerSellerConversations.length === 0 ? (
                <div className="p-4 text-center text-[hsl(var(--muted-foreground))]">
                  <p className="mb-4">No buyer-seller conversations yet</p>
                  <p className="text-sm">Start a conversation from an ad detail page</p>
                </div>
              ) : (
                buyerSellerConversations.map((conv) => (
                  <div
                    key={conv.ad_id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-4 border-b cursor-pointer hover:bg-[hsl(var(--accent))] transition-colors ${
                      selectedConversation?.ad_id === conv.ad_id ? 'bg-[hsl(var(--accent))]' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-[hsl(var(--foreground))] line-clamp-1">
                        {conv.ad_title || `Ad #${conv.ad_id}`}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="bg-[hsl(var(--primary))] text-white text-xs rounded-full px-2 py-1 ml-2">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {conv.seller_id === user.id ? 'Buyer' : 'Seller'}: {conv.other_party_name}
                    </p>
                    {conv.last_message_at && (
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                        {new Date(conv.last_message_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Buyer-Seller Messages */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-[hsl(var(--foreground))]">
                    {selectedConversation.ad_title || `Ad #${selectedConversation.ad_id}`}
                  </h3>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {selectedConversation.seller_id === user.id ? 'Buyer' : 'Seller'}: {selectedConversation.other_party_name}
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {conversationMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-[hsl(var(--muted-foreground))] text-center">
                        No messages yet. Start the conversation below.
                      </p>
                    </div>
                  ) : (
                    <>
                      {conversationMessages.map((message) => {
                        const isOtherParty = message.sender_type === (selectedConversation.seller_id === user.id ? 'buyer' : 'seller');
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOtherParty ? 'justify-start' : 'justify-end'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg p-3 ${
                                isOtherParty
                                  ? 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]'
                                  : 'bg-[hsl(var(--primary))] text-white'
                              }`}
                            >
                              <p className="text-sm">{message.message}</p>
                              <p className={`text-xs mt-1 ${
                                isOtherParty
                                  ? 'text-[hsl(var(--muted-foreground))]'
                                  : 'text-white/70'
                              }`}>
                                {new Date(message.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
                <form onSubmit={handleSendBuyerSellerMessage} className="p-4 border-t flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                  />
                  <Button type="submit" disabled={sending || !newMessage.trim()}>
                    Send
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-[hsl(var(--muted-foreground))]">
                    Choose a conversation from the list
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationsSection({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications();
      setNotifications(response.data.notifications?.data || response.data.data || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch (err) {
      setError('Failed to load notifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.data.unread_count || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationAPI.deleteNotification(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      ad_sold: '💰',
      new_message: '💬',
      bid_update: '📈',
      price_drop: '📉',
      new_match: '✨',
      system: '🔔',
      payment: '💳',
      review: '⭐',
    };
    return icons[type] || '🔔';
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-6">Notifications</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-[hsl(var(--muted-foreground))]">Loading notifications...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
              {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {error && (
        <Card className="mb-4 border-[hsl(var(--destructive))]">
          <CardContent className="p-4">
            <p className="text-sm text-[hsl(var(--destructive))]">{error}</p>
          </CardContent>
        </Card>
      )}

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">
              No notifications
            </h3>
            <p className="text-[hsl(var(--muted-foreground))]">
              You're all caught up! New notifications will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all hover:shadow-md ${
                !notification.is_read ? 'border-l-4 border-l-[hsl(var(--primary))] bg-[hsl(var(--accent))]/30' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="text-3xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className={`font-semibold mb-1 ${!notification.is_read ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-xs"
                          >
                            Mark read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                          className="text-xs text-[hsl(var(--destructive))]"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    {notification.link && (
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-2 p-0 h-auto"
                        onClick={() => window.location.href = notification.link}
                      >
                        View →
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Listed Items Section Component
function ListedItemsSection({ user }) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingAdId, setEditingAdId] = useState(null);
  const [editingAdData, setEditingAdData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [locationData, setLocationData] = useState({ provinces: [] });
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState(new Set());
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [expandedProvinces, setExpandedProvinces] = useState(new Set());
  const [expandedDistricts, setExpandedDistricts] = useState(new Set());
  const [expandedLocalLevels, setExpandedLocalLevels] = useState(new Set());
  const [editingImages, setEditingImages] = useState([null, null, null, null]);
  const locationDropdownRef = useRef(null);

  useEffect(() => {
    fetchAds();
    fetchCategories();
    fetchLocations();
    
    const handleClickOutside = (event) => {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const response = await userAdAPI.getAds();
      setAds(response.data || []);
    } catch (err) {
      setError('Failed to fetch ads: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await axios.get('/api/locations');
      setLocationData(response.data || { provinces: [] });
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  const handleEdit = (ad) => {
    setEditingAdId(ad.id);
    setEditingAdData({
      title: ad.title,
      description: ad.description,
      price: ad.price,
      category_id: ad.category_id?.toString() || '',
      location_id: ad.location_id,
    });
    
    // Set category selection
    const category = categories.find(c => c.id === ad.category_id || c.subcategories?.some(s => s.id === ad.category_id));
    if (category) {
      const subcategory = category.subcategories?.find(s => s.id === ad.category_id);
      if (subcategory) {
        setSelectedCategoryName(category.name);
        setSelectedSubcategoryId(subcategory.id.toString());
      } else {
        setSelectedCategoryName(category.name);
        setSelectedSubcategoryId('');
      }
    }
    
    // Set location selection
    // Handle both ward ID and local address
    if (ad.location_id) {
      const locationSet = new Set();
      if (ad.selected_local_address && ad.selected_local_address !== '__LOCAL_LEVEL_ONLY__') {
        // It's a local address - create address ID
        const addressId = `${ad.location_id}-${ad.selected_local_address}`;
        locationSet.add(addressId);
      } else {
        // It's just a ward ID
        locationSet.add(ad.location_id);
      }
      setSelectedLocations(locationSet);
    } else {
      setSelectedLocations(new Set());
    }
    
    // Set existing images
    setEditingImages([
      ad.image1_url ? { url: ad.image1_url, isExisting: true } : null,
      ad.image2_url ? { url: ad.image2_url, isExisting: true } : null,
      ad.image3_url ? { url: ad.image3_url, isExisting: true } : null,
      ad.image4_url ? { url: ad.image4_url, isExisting: true } : null,
    ]);
  };

  const handleCancelEdit = () => {
    setEditingAdId(null);
    setEditingAdData(null);
    setSelectedCategoryName('');
    setSelectedSubcategoryId('');
    setSelectedLocations(new Set());
    setEditingImages([null, null, null, null]);
  };

  const handleSaveEdit = async () => {
    try {
      setError(null);
      // Handle both ward ID and local address ID (format: wardId-index)
      let locationId = null;
      let selectedLocalAddress = null;
      
      if (selectedLocations.size > 0) {
        const selectedId = Array.from(selectedLocations)[0];
        if (typeof selectedId === 'string' && selectedId.includes('-')) {
          // It's a local address - extract ward ID and address index
          const parts = selectedId.split('-');
          locationId = parseInt(parts[0]);
          selectedLocalAddress = parts.slice(1).join('-'); // Handle multi-part addresses
        } else {
          // It's a ward ID
          locationId = typeof selectedId === 'number' ? selectedId : parseInt(selectedId);
        }
      }
      
      const updateData = {
        ...editingAdData,
        location_id: locationId,
        selected_local_address: selectedLocalAddress || null,
        images: editingImages.filter(img => img && !img.isExisting && img instanceof File ? img : null).filter(Boolean),
      };
      
      await userAdAPI.updateAd(editingAdId, updateData);
      setSuccess('Ad updated successfully!');
      handleCancelEdit();
      fetchAds();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update ad: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ad?')) {
      return;
    }
    
    try {
      await userAdAPI.deleteAd(id);
      setSuccess('Ad deleted successfully!');
      fetchAds();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete ad: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleMarkSold = async (id) => {
    if (!window.confirm('Mark this item as sold?')) {
      return;
    }
    
    try {
      await userAdAPI.markSold(id);
      setSuccess('Ad marked as sold!');
      fetchAds();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to mark ad as sold: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleImageChange = (index, file) => {
    const newImages = [...editingImages];
    newImages[index] = file;
    setEditingImages(newImages);
  };

  const handleRemoveImage = (index) => {
    const newImages = [...editingImages];
    newImages[index] = null;
    setEditingImages(newImages);
  };

  const getSelectedCategory = () => {
    if (!selectedCategoryName) return null;
    return categories.find(c => c.name === selectedCategoryName);
  };

  const handleCategorySelect = (categoryName) => {
    setSelectedCategoryName(categoryName);
    setSelectedSubcategoryId('');
    const category = categories.find(c => c.name === categoryName);
    if (category) {
      setEditingAdData({ ...editingAdData, category_id: category.id.toString() });
    }
  };

  const handleSubcategorySelect = (subcategoryId) => {
    setSelectedSubcategoryId(subcategoryId);
    const category = getSelectedCategory();
    if (category) {
      const subcategory = category.subcategories?.find(s => s.id === parseInt(subcategoryId));
      if (subcategory) {
        setEditingAdData({ ...editingAdData, category_id: subcategory.id.toString() });
        setShowCategoryDropdown(false);
      }
    }
  };

  const buildCategoryString = () => {
    if (selectedSubcategoryId) {
      const category = getSelectedCategory();
      const subcategory = category?.subcategories?.find(s => s.id === parseInt(selectedSubcategoryId));
      if (category && subcategory) {
        return `${category.name} > ${subcategory.name}`;
      }
    }
    if (selectedCategoryName) {
      return selectedCategoryName;
    }
    return 'Select Category';
  };

  const handleLocationToggle = (locationId) => {
    setSelectedLocations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(locationId)) {
        newSet.delete(locationId);
      } else {
        newSet.clear();
        newSet.add(locationId);
      }
      return newSet;
    });
  };

  const buildLocationString = () => {
    if (selectedLocations.size === 0) {
      return 'Select Location';
    }
    const locationId = Array.from(selectedLocations)[0];
    // Find location in hierarchy
    for (const province of locationData.provinces || []) {
      for (const district of province.districts || []) {
        for (const localLevel of district.localLevels || []) {
          if (localLevel.wards) {
            for (const ward of localLevel.wards || []) {
              // Check if it's a local address (format: wardId-index)
              if (typeof locationId === 'string' && locationId.includes('-')) {
                const parts = locationId.split('-');
                const wardId = parseInt(parts[0]);
                const addressIndex = parseInt(parts[1]);
                if (ward.id === wardId && ward.local_addresses && ward.local_addresses[addressIndex]) {
                  let locationString = `${province.name} > ${district.name} > ${localLevel.name}`;
                  if (ward.ward_number) {
                    locationString += ` > Ward ${ward.ward_number}`;
                  }
                  locationString += ` > ${ward.local_addresses[addressIndex]}`;
                  return locationString;
                }
              }
              // Check if it's the ward itself
              if (ward.id === locationId) {
                let locationString = `${province.name} > ${district.name} > ${localLevel.name}`;
                if (ward.ward_number) {
                  locationString += ` > Ward ${ward.ward_number}`;
                }
                return locationString;
              }
            }
          }
        }
      }
    }
    return 'Location selected';
  };

  const toggleProvince = (provinceId) => {
    setExpandedProvinces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(provinceId)) {
        newSet.delete(provinceId);
      } else {
        newSet.add(provinceId);
      }
      return newSet;
    });
  };

  const toggleDistrict = (districtKey) => {
    setExpandedDistricts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(districtKey)) {
        newSet.delete(districtKey);
      } else {
        newSet.add(districtKey);
      }
      return newSet;
    });
  };

  const toggleLocalLevel = (localLevelKey) => {
    setExpandedLocalLevels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(localLevelKey)) {
        newSet.delete(localLevelKey);
      } else {
        newSet.add(localLevelKey);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-4">Listed Items</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-[hsl(var(--muted-foreground))]">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-2">Listed Items</h1>
        <p className="text-[hsl(var(--muted-foreground))]">Manage your posted ads</p>
      </div>

      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="p-4">
            <p className="text-green-600">{success}</p>
          </CardContent>
        </Card>
      )}

      {ads.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-[hsl(var(--muted-foreground))] mb-4">You haven't posted any ads yet.</p>
            <Button onClick={() => handleSectionChange('ad-post')}>Post Your First Ad</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">Total Listed Items</h3>
                <p className="text-3xl font-bold text-[hsl(var(--foreground))]">{ads.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">Active Items</h3>
                <p className="text-3xl font-bold text-[hsl(var(--foreground))]">
                  {ads.filter(ad => !ad.item_sold && ad.status === 'active').length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">Sold Items</h3>
                <p className="text-3xl font-bold text-[hsl(var(--foreground))]">
                  {ads.filter(ad => ad.item_sold || ad.status === 'sold').length}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          {(() => {
            const categoryBreakdown = {};
            ads.forEach(ad => {
              const categoryName = ad.category?.category || 'Uncategorized';
              const subcategoryName = ad.category?.sub_category || null;
              const key = subcategoryName ? `${categoryName} > ${subcategoryName}` : categoryName;
              
              if (!categoryBreakdown[key]) {
                categoryBreakdown[key] = {
                  category: categoryName,
                  subcategory: subcategoryName,
                  count: 0,
                };
              }
              categoryBreakdown[key].count++;
            });

            const breakdownEntries = Object.entries(categoryBreakdown).sort((a, b) => b[1].count - a[1].count);

            return breakdownEntries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Items by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {breakdownEntries.map(([key, data]) => (
                      <div key={key} className="flex items-center justify-between p-2 rounded-md hover:bg-[hsl(var(--accent))]">
                        <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                          {key}
                        </span>
                        <span className="text-sm font-bold text-[hsl(var(--primary))]">
                          {data.count} item{data.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Listed Items */}
          <div>
            <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4">Your Listed Items</h2>
            <div className="space-y-4">
              {ads.map((ad) => (
            <Card key={ad.id}>
              <CardContent className="p-6">
                {editingAdId === ad.id ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={editingAdData.title}
                        onChange={(e) => setEditingAdData({ ...editingAdData, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <textarea
                        value={editingAdData.description}
                        onChange={(e) => setEditingAdData({ ...editingAdData, description: e.target.value })}
                        className="w-full min-h-[100px] px-3 py-2 border border-[hsl(var(--border))] rounded-md"
                      />
                    </div>
                    <div>
                      <Label>Price (Rs.)</Label>
                      <Input
                        type="number"
                        value={editingAdData.price}
                        onChange={(e) => setEditingAdData({ ...editingAdData, price: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveEdit}>Save</Button>
                      <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <img
                        src={ad.image1_url || '/placeholder-image.png'}
                        alt={ad.title}
                        className="w-32 h-32 object-cover rounded-md"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{ad.title}</h3>
                      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2 line-clamp-2">{ad.description}</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="font-semibold text-[hsl(var(--foreground))]">Rs. {parseFloat(ad.price || 0).toLocaleString()}</span>
                          <span className="text-[hsl(var(--muted-foreground))]">Views: {ad.views || 0}</span>
                          <span className={`px-2 py-1 rounded ${ad.item_sold ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {ad.item_sold ? 'Sold' : 'Active'}
                          </span>
                        </div>
                        {ad.category && (
                          <div className="text-xs text-[hsl(var(--muted-foreground))]">
                            Category: <span className="font-semibold">{ad.category.category}</span>
                            {ad.category.sub_category && (
                              <span> &gt; <span className="font-semibold">{ad.category.sub_category}</span></span>
                            )}
                          </div>
                        )}
                        {ad.location && (
                          <div className="text-xs text-[hsl(var(--muted-foreground))]">
                            📍 Address: <span className="font-semibold">{ad.location.name || 'Not specified'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(ad)}>Edit</Button>
                      {!ad.item_sold && (
                        <Button variant="outline" size="sm" onClick={() => handleMarkSold(ad.id)}>Mark Sold</Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => handleDelete(ad.id)} className="text-red-600">Delete</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SalesReportSection({ user }) {
  const [salesData, setSalesData] = useState({
    totalSales: 0,
    totalRevenue: 0,
    thisMonth: { sales: 0, revenue: 0 },
    lastMonth: { sales: 0, revenue: 0 },
    recentSales: [],
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all'); // all, month, year

  useEffect(() => {
    fetchSalesData();
  }, [period]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      const statsResponse = await dashboardAPI.getStats();
      const adsResponse = await userAdAPI.getAds();
      
      const soldAds = (adsResponse.data || []).filter(ad => ad.status === 'sold');
      const now = new Date();
      const thisMonth = soldAds.filter(ad => {
        const adDate = new Date(ad.updated_at);
        return adDate.getMonth() === now.getMonth() && adDate.getFullYear() === now.getFullYear();
      });
      const lastMonth = soldAds.filter(ad => {
        const adDate = new Date(ad.updated_at);
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
        return adDate.getMonth() === lastMonthDate.getMonth() && 
               adDate.getFullYear() === lastMonthDate.getFullYear();
      });

      setSalesData({
        totalSales: soldAds.length,
        totalRevenue: soldAds.reduce((sum, ad) => sum + parseFloat(ad.price || 0), 0),
        thisMonth: {
          sales: thisMonth.length,
          revenue: thisMonth.reduce((sum, ad) => sum + parseFloat(ad.price || 0), 0),
        },
        lastMonth: {
          sales: lastMonth.length,
          revenue: lastMonth.reduce((sum, ad) => sum + parseFloat(ad.price || 0), 0),
        },
        recentSales: soldAds.slice(0, 10),
      });
    } catch (err) {
      console.error('Failed to fetch sales data:', err);
    } finally {
      setLoading(false);
    }
  };

  const revenueChange = salesData.thisMonth.revenue - salesData.lastMonth.revenue;
  const salesChange = salesData.thisMonth.sales - salesData.lastMonth.sales;

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-6">Sales Report</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-[hsl(var(--muted-foreground))]">Loading sales data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Sales Report</h1>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Time</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[hsl(var(--foreground))]">
              {salesData.totalSales}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[hsl(var(--foreground))]">
              Rs. {salesData.totalRevenue.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))] mb-1">
              {salesData.thisMonth.sales} sales
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Rs. {salesData.thisMonth.revenue.toLocaleString()}
            </p>
            {salesChange !== 0 && (
              <p className={`text-xs mt-1 ${salesChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {salesChange > 0 ? '↑' : '↓'} {Math.abs(salesChange)} vs last month
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
              Revenue Change
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {revenueChange >= 0 ? '+' : ''}Rs. {Math.abs(revenueChange).toLocaleString()}
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
              vs last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          {salesData.recentSales.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-[hsl(var(--muted-foreground))]">No sales yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {salesData.recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={sale.image1_url || '/placeholder-image.png'}
                      alt={sale.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium text-[hsl(var(--foreground))]">
                        {sale.title}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Sold on {new Date(sale.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-[hsl(var(--primary))]">
                    Rs. {parseFloat(sale.price || 0).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
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

function MyRatingsSection({ user }) {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedAd, setSelectedAd] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showRateForm, setShowRateForm] = useState(false);
  const [adIdInput, setAdIdInput] = useState('');
  const [loadingAd, setLoadingAd] = useState(false);
  const [adError, setAdError] = useState(null);

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    setLoading(true);
    try {
      // Get all ads from homepage to check which ones user has rated
      // This is a simplified approach - in a real app, you'd track purchases
      const response = await axios.get('/api/ads');
      const allAds = response.data.ads || [];
      
      // For each ad, check if user has rated the seller
      const ratingsData = [];
      for (const ad of allAds) {
        // Only check ads that are not owned by the current user
        if (ad.user_id && ad.user_id !== user.id) {
          try {
            const checkRes = await ratingAPI.checkRating(ad.id);
            if (checkRes.data.has_rated) {
              const rating = checkRes.data.rating;
              ratingsData.push({
                ...rating,
                ad: ad,
              });
            }
          } catch (err) {
            // Rating doesn't exist or error - skip
          }
        }
      }
      
      setRatings(ratingsData);
    } catch (err) {
      console.error('Error loading ratings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRateByAdId = async () => {
    if (!adIdInput.trim()) {
      setAdError('Please enter an ad ID');
      return;
    }

    setLoadingAd(true);
    setAdError(null);

    try {
      // Fetch ad details
      const adRes = await axios.get(`/api/ads`);
      const allAds = adRes.data.ads || [];
      const ad = allAds.find(a => a.id === parseInt(adIdInput));

      if (!ad) {
        setAdError('Ad not found. Please check the ad ID.');
        setLoadingAd(false);
        return;
      }

      if (ad.user_id === user.id) {
        setAdError('You cannot rate your own ad.');
        setLoadingAd(false);
        return;
      }

      // Check if already rated
      const checkRes = await ratingAPI.checkRating(ad.id);
      if (checkRes.data.has_rated) {
        setAdError('You have already rated this seller for this ad.');
        setLoadingAd(false);
        return;
      }

      // Get seller info
      const sellerRes = await publicProfileAPI.getProfile(ad.user_id);
      const seller = sellerRes.data.user;

      setSelectedAd({ ...ad, id: parseInt(adIdInput) });
      setSelectedSeller(seller);
      setShowRateForm(false);
      setShowRatingModal(true);
      setAdIdInput('');
    } catch (err) {
      setAdError(err.response?.data?.error || 'Failed to load ad. Please check the ad ID.');
      console.error('Error loading ad:', err);
    } finally {
      setLoadingAd(false);
    }
  };

  const handleRateSeller = (ad) => {
    setSelectedAd(ad);
    setSelectedSeller(ad.user || { id: ad.user_id, name: 'Seller' });
    setShowRatingModal(true);
  };

  const handleRatingSuccess = () => {
    loadRatings();
  };

  const handleDeleteRating = async (ratingId) => {
    if (!window.confirm('Are you sure you want to delete this rating?')) {
      return;
    }

    try {
      await ratingAPI.deleteRating(ratingId);
      loadRatings();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete rating');
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-lg ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">My Ratings</h1>
        <Button onClick={() => setShowRateForm(!showRateForm)}>
          {showRateForm ? 'Cancel' : '⭐ Rate a Seller'}
        </Button>
      </div>

      {showRateForm && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Rate a Seller by Ad ID</h3>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Enter Ad ID (e.g., 123)"
                  value={adIdInput}
                  onChange={(e) => {
                    setAdIdInput(e.target.value);
                    setAdError(null);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleRateByAdId();
                    }
                  }}
                />
                {adError && (
                  <p className="text-sm text-red-600 mt-2">{adError}</p>
                )}
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                  Enter the ID of an ad you purchased to rate the seller. You can find the ad ID on the ad detail page.
                </p>
              </div>
              <Button
                onClick={handleRateByAdId}
                disabled={loadingAd || !adIdInput.trim()}
              >
                {loadingAd ? 'Loading...' : 'Load Ad'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {showRatingModal && selectedAd && selectedSeller && (
        <RatingModal
          ad={selectedAd}
          seller={selectedSeller}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedAd(null);
            setSelectedSeller(null);
          }}
          onSuccess={handleRatingSuccess}
        />
      )}

      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-[hsl(var(--muted-foreground))]">Loading your ratings...</p>
          </CardContent>
        </Card>
      ) : ratings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-[hsl(var(--muted-foreground))] mb-4">
              You haven't rated any sellers yet.
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
              Click "Rate a Seller" above to rate a seller by entering an ad ID.
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Tip: You can also view seller profiles from ad listings and rate them there.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {ratings.map((rating) => (
            <Card key={rating.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Ad Image */}
                  {rating.ad && (
                    <div className="flex-shrink-0">
                      <img
                        src={rating.ad.image1_url || rating.ad.photos?.[0]?.photo_url || '/placeholder-image.png'}
                        alt={rating.ad.title}
                        className="w-32 h-32 object-cover rounded-md"
                      />
                    </div>
                  )}

                  {/* Rating Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg text-[hsl(var(--foreground))] mb-1">
                          {rating.ad?.title || 'Ad'}
                        </h3>
                        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">
                          Seller: {rating.seller?.name || 'Unknown'}
                          {rating.seller?.id && (
                            <Link
                              to={`/profile/${rating.seller.id}`}
                              className="ml-2 text-[hsl(var(--primary))] hover:underline"
                            >
                              View Profile
                            </Link>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(rating.rating)}
                        <span className="text-sm font-semibold text-[hsl(var(--foreground))]">
                          {rating.rating}/5
                        </span>
                      </div>
                    </div>

                    {rating.comment && (
                      <p className="text-sm text-[hsl(var(--foreground))] mb-3">
                        {rating.comment}
                      </p>
                    )}

                    {rating.criteria_scores && rating.criteria_scores.length > 0 && (
                      <div className="mb-3 space-y-1">
                        {rating.criteria_scores.map((cs, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <span className="text-[hsl(var(--muted-foreground))]">
                              {cs.criteria_name}:
                            </span>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={`text-xs ${
                                    star <= cs.score ? 'text-yellow-400' : 'text-gray-300'
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                      <span>
                        {new Date(rating.created_at).toLocaleDateString()}
                      </span>
                      {rating.purchase_verified && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                          ✓ Verified Purchase
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAd(rating.ad);
                          setSelectedSeller(rating.seller);
                          setShowRatingModal(true);
                        }}
                      >
                        Edit Rating
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteRating(rating.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Seller Dashboard Overview Component
function SellerDashboardOverview({ user, userAds }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine dashboard mode from URL
  const dashboardMode = location.pathname.startsWith('/seller_dashboard') ? 'seller' : 'user';
  const basePath = dashboardMode === 'seller' ? '/seller_dashboard' : '/user_dashboard';
  
  const handleSectionChange = (sectionId) => {
    if (sectionId === 'dashboard') {
      navigate(`${basePath}/dashboard`);
    } else {
      navigate(`${basePath}/${sectionId}`);
    }
  };
  return (
    <div>
      <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-4">Seller Dashboard</h1>
      <p className="text-[hsl(var(--muted-foreground))] mb-6">
        Manage your selling activities and track your sales performance
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">Total Listed Items</h3>
            <p className="text-3xl font-bold text-[hsl(var(--foreground))]">{userAds?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">Total Views</h3>
            <p className="text-3xl font-bold text-[hsl(var(--foreground))]">
              {userAds?.reduce((sum, ad) => sum + (ad.views || 0), 0) || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">Active Items</h3>
            <p className="text-3xl font-bold text-[hsl(var(--foreground))]">
              {userAds?.filter(ad => !ad.item_sold && ad.status === 'active').length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="flex gap-3">
            <Button onClick={() => handleSectionChange('items-selling')}>
              View Items Selling
            </Button>
            <Button variant="outline" onClick={() => handleSectionChange('ad-post')}>
              Post New Ad
            </Button>
            <Button variant="outline" onClick={() => handleSectionChange('sales-report')}>
              View Sales Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Items Selling Section Component
function ItemsSellingSection({ user, userAds }) {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    total_items: 0,
    active_items: 0,
    sold_items: 0,
    total_views: 0,
    total_clicks: 0,
    total_earning: 0,
    total_inquiries: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [offerFormData, setOfferFormData] = useState({
    offer_percentage: '',
    valid_until: '',
  });
  const [offerError, setOfferError] = useState(null);
  const [offerSuccess, setOfferSuccess] = useState(null);

  useEffect(() => {
    loadItemsSelling();
  }, []);

  const loadItemsSelling = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await itemsSellingAPI.getItemsSelling();
      setItems(response.data.items || []);
      setSummary(response.data.summary || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load items selling data');
      console.error('Error loading items selling:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (itemId) => {
    try {
      const response = await itemsSellingAPI.getItemDetails(itemId);
      setSelectedItem(response.data);
      setShowDetails(true);
      // Load offers for this ad
      loadOffers(itemId);
    } catch (err) {
      console.error('Error loading item details:', err);
    }
  };

  const loadOffers = async (adId) => {
    try {
      const response = await sellerOfferAPI.getAdOffers(adId);
      if (selectedItem) {
        setSelectedItem({
          ...selectedItem,
          offers: response.data || [],
        });
      }
    } catch (err) {
      console.error('Error loading offers:', err);
    }
  };

  const handleCreateOffer = () => {
    setEditingOffer(null);
    setOfferFormData({
      offer_percentage: '',
      valid_until: '',
    });
    setOfferError(null);
    setOfferSuccess(null);
    setShowOfferForm(true);
  };

  const handleEditOffer = (offer) => {
    setEditingOffer(offer);
    setOfferFormData({
      offer_percentage: offer.offer_percentage.toString(),
      valid_until: new Date(offer.valid_until).toISOString().split('T')[0],
    });
    setOfferError(null);
    setOfferSuccess(null);
    setShowOfferForm(true);
  };

  const handleDeleteOffer = async (offerId) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) {
      return;
    }

    try {
      await sellerOfferAPI.deleteOffer(offerId);
      setOfferSuccess('Offer deleted successfully');
      if (selectedItem) {
        loadOffers(selectedItem.id);
      }
      setTimeout(() => setOfferSuccess(null), 3000);
    } catch (err) {
      setOfferError(err.response?.data?.error || 'Failed to delete offer');
      setTimeout(() => setOfferError(null), 3000);
    }
  };

  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    setOfferError(null);
    setOfferSuccess(null);

    if (!selectedItem) return;

    try {
      const data = {
        ad_id: selectedItem.id,
        offer_percentage: parseFloat(offerFormData.offer_percentage),
        valid_until: offerFormData.valid_until,
      };

      if (editingOffer) {
        await sellerOfferAPI.updateOffer(editingOffer.id, data);
        setOfferSuccess('Offer updated successfully');
      } else {
        await sellerOfferAPI.createOffer(data);
        setOfferSuccess('Offer created successfully');
      }

      setShowOfferForm(false);
      loadOffers(selectedItem.id);
      setTimeout(() => setOfferSuccess(null), 3000);
    } catch (err) {
      setOfferError(err.response?.data?.error || 'Failed to save offer');
      setTimeout(() => setOfferError(null), 3000);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-4">Items Selling</h1>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-[hsl(var(--muted-foreground))]">Loading your selling metrics...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-2">Items Selling</h1>
        <p className="text-[hsl(var(--muted-foreground))]">Track detailed metrics and performance for all your listed items</p>
      </div>

      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Total Items</h3>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{summary.total_items}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Active</h3>
            <p className="text-2xl font-bold text-green-600">{summary.active_items}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Sold</h3>
            <p className="text-2xl font-bold text-blue-600">{summary.sold_items}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">Total Earning</h3>
            <p className="text-2xl font-bold text-[hsl(var(--primary))]">
              Rs. {parseFloat(summary.total_earning || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-[hsl(var(--muted-foreground))] mb-4">You haven't posted any items yet.</p>
            <Button onClick={() => handleSectionChange('ad-post')}>Post Your First Item</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Listed Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))]">
                    <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--muted-foreground))]">Item Name</th>
                    <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--muted-foreground))]">Listed Date</th>
                    <th className="text-right p-3 text-sm font-semibold text-[hsl(var(--muted-foreground))]">Price</th>
                    <th className="text-right p-3 text-sm font-semibold text-[hsl(var(--muted-foreground))]">Views</th>
                    <th className="text-right p-3 text-sm font-semibold text-[hsl(var(--muted-foreground))]">Clicks</th>
                    <th className="text-right p-3 text-sm font-semibold text-[hsl(var(--muted-foreground))]">Watchlist</th>
                    <th className="text-right p-3 text-sm font-semibold text-[hsl(var(--muted-foreground))]">Favourites</th>
                    <th className="text-right p-3 text-sm font-semibold text-[hsl(var(--muted-foreground))]">Saved</th>
                    <th className="text-right p-3 text-sm font-semibold text-[hsl(var(--muted-foreground))]">Inquiries</th>
                    <th className="text-center p-3 text-sm font-semibold text-[hsl(var(--muted-foreground))]">Status</th>
                    <th className="text-right p-3 text-sm font-semibold text-[hsl(var(--muted-foreground))]">Earning</th>
                    <th className="text-center p-3 text-sm font-semibold text-[hsl(var(--muted-foreground))]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.item_name}
                              className="w-10 h-10 object-cover rounded"
                            />
                          )}
                          <span className="font-medium text-[hsl(var(--foreground))]">{item.item_name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-[hsl(var(--muted-foreground))]">
                        {new Date(item.listed_date).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right font-semibold text-[hsl(var(--foreground))]">
                        Rs. {parseFloat(item.price_per_unit || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-right text-sm text-[hsl(var(--muted-foreground))]">
                        {item.views || 0}
                      </td>
                      <td className="p-3 text-right text-sm text-[hsl(var(--muted-foreground))]">
                        {item.clicks || 0}
                      </td>
                      <td className="p-3 text-right text-sm text-[hsl(var(--muted-foreground))]">
                        {item.watchlist_count || 0}
                      </td>
                      <td className="p-3 text-right text-sm text-[hsl(var(--muted-foreground))]">
                        {item.favourite_count || 0}
                      </td>
                      <td className="p-3 text-right text-sm text-[hsl(var(--muted-foreground))]">
                        {item.saved_search_count || 0}
                      </td>
                      <td className="p-3 text-right text-sm text-[hsl(var(--muted-foreground))]">
                        {item.inquiries_count || 0}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          item.sold
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.sold ? 'Sold' : 'Active'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-semibold text-[hsl(var(--primary))]">
                        Rs. {parseFloat(item.total_earning || 0).toLocaleString()}
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(item.id)}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Item Details Modal */}
      {showDetails && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Item Details: {selectedItem.item_name}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowDetails(false)}>✕</Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] mb-1">Posted Date</h4>
                  <p className="text-[hsl(var(--foreground))]">{new Date(selectedItem.posted_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] mb-1">Listed Date</h4>
                  <p className="text-[hsl(var(--foreground))]">{new Date(selectedItem.listed_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] mb-1">Price per Unit</h4>
                  <p className="text-[hsl(var(--foreground))] font-semibold">
                    Rs. {parseFloat(selectedItem.price_per_unit || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] mb-1">Total Earning</h4>
                  <p className="text-[hsl(var(--primary))] font-semibold">
                    Rs. {parseFloat(selectedItem.total_earning || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Metrics */}
              <div>
                <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-3">Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-[hsl(var(--accent))] rounded-md">
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Views</p>
                    <p className="text-xl font-bold text-[hsl(var(--foreground))]">{selectedItem.views || 0}</p>
                  </div>
                  <div className="p-3 bg-[hsl(var(--accent))] rounded-md">
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Clicks</p>
                    <p className="text-xl font-bold text-[hsl(var(--foreground))]">{selectedItem.clicks || 0}</p>
                  </div>
                  <div className="p-3 bg-[hsl(var(--accent))] rounded-md">
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Watchlist</p>
                    <p className="text-xl font-bold text-[hsl(var(--foreground))]">{selectedItem.watchlist_count || 0}</p>
                  </div>
                  <div className="p-3 bg-[hsl(var(--accent))] rounded-md">
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Favourites</p>
                    <p className="text-xl font-bold text-[hsl(var(--foreground))]">{selectedItem.favourite_count || 0}</p>
                  </div>
                  <div className="p-3 bg-[hsl(var(--accent))] rounded-md">
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Saved Searches</p>
                    <p className="text-xl font-bold text-[hsl(var(--foreground))]">{selectedItem.saved_search_count || 0}</p>
                  </div>
                  <div className="p-3 bg-[hsl(var(--accent))] rounded-md">
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">Inquiries</p>
                    <p className="text-xl font-bold text-[hsl(var(--foreground))]">{selectedItem.inquiries_count || 0}</p>
                  </div>
                </div>
              </div>

              {/* Buyers */}
              {selectedItem.buyers && selectedItem.buyers.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-3">Buyers</h3>
                  <div className="space-y-2">
                    {selectedItem.buyers.map((buyer, idx) => (
                      <div key={idx} className="p-3 border border-[hsl(var(--border))] rounded-md">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-[hsl(var(--foreground))]">{buyer.user_name}</p>
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">
                              Purchased: {new Date(buyer.purchase_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-[hsl(var(--primary))]">
                              Rs. {parseFloat(buyer.price || 0).toLocaleString()}
                            </p>
                            {buyer.quantity && (
                              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                Qty: {buyer.quantity}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Offers */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Offers</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateOffer}
                  >
                    + Create Offer
                  </Button>
                </div>
                
                {offerError && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{offerError}</p>
                  </div>
                )}
                
                {offerSuccess && (
                  <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-600">{offerSuccess}</p>
                  </div>
                )}

                {selectedItem.offers && selectedItem.offers.length > 0 ? (
                  <div className="space-y-2">
                    {selectedItem.offers.map((offer) => (
                      <div key={offer.id} className="p-3 border border-[hsl(var(--border))] rounded-md">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <p className="font-semibold text-[hsl(var(--foreground))]">
                              {offer.offer_percentage}% Discount
                            </p>
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">
                              Created: {new Date(offer.created_date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">
                              Valid until: {new Date(offer.valid_until).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              offer.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {offer.status}
                            </span>
                            {offer.status === 'pending' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditOffer(offer)}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteOffer(offer.id)}
                                  className="text-red-600"
                                >
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[hsl(var(--muted-foreground))] py-4">
                    No offers created yet. Click "Create Offer" to add one.
                  </p>
                )}
              </div>

              {/* Offer Form Modal */}
              {showOfferForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <Card className="max-w-md w-full">
                    <CardHeader>
                      <CardTitle>{editingOffer ? 'Edit Offer' : 'Create New Offer'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleOfferSubmit} className="space-y-4">
                        <div>
                          <Label htmlFor="offer_percentage">Discount Percentage *</Label>
                          <Input
                            id="offer_percentage"
                            type="number"
                            min="1"
                            max="100"
                            step="0.01"
                            value={offerFormData.offer_percentage}
                            onChange={(e) => setOfferFormData({ ...offerFormData, offer_percentage: e.target.value })}
                            placeholder="e.g., 25.5"
                            required
                          />
                          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                            Enter discount percentage (1-100%)
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="valid_until">Valid Until *</Label>
                          <Input
                            id="valid_until"
                            type="date"
                            value={offerFormData.valid_until}
                            onChange={(e) => setOfferFormData({ ...offerFormData, valid_until: e.target.value })}
                            min={new Date().toISOString().split('T')[0]}
                            required
                          />
                        </div>
                        <div className="flex gap-2 pt-4">
                          <Button type="submit" className="flex-1">
                            {editingOffer ? 'Update Offer' : 'Create Offer'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowOfferForm(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Total Bought Items Section Component
function TotalBoughtItemsSection({ user }) {
  const [boughtItems, setBoughtItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    total_bought: 0,
    total_spent: 0,
  });

  useEffect(() => {
    loadBoughtItems();
  }, []);

  const loadBoughtItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await boughtItemsAPI.getBoughtItems();
      setBoughtItems(response.data.items || []);
      setSummary({
        total_bought: response.data.total_bought || 0,
        total_spent: response.data.total_spent || 0,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bought items');
      console.error('Error loading bought items:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-4">Total Bought Items</h1>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-[hsl(var(--muted-foreground))]">Loading your purchase history...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-4">Total Bought Items</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">Total Bought Items</h3>
            <p className="text-3xl font-bold text-[hsl(var(--foreground))]">{summary.total_bought}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Till date</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">Total Spent Amount</h3>
            <p className="text-3xl font-bold text-[hsl(var(--primary))]">
              Rs. {parseFloat(summary.total_spent || 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-red-500 bg-red-50 mb-6">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {boughtItems.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-[hsl(var(--muted-foreground))] mb-4">
              You haven't purchased any items yet.
            </p>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              Browse Items
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {boughtItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Item Image */}
                  {item.ad_image && (
                    <div className="flex-shrink-0">
                      <img
                        src={item.ad_image}
                        alt={item.item_name}
                        className="w-32 h-32 object-cover rounded-md"
                      />
                    </div>
                  )}

                  {/* Item Details */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">
                      {item.item_name}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-sm">
                      <div>
                        <span className="text-[hsl(var(--muted-foreground))]">Category:</span>
                        <span className="ml-2 font-semibold text-[hsl(var(--foreground))]">
                          {item.category}
                          {item.subcategory && ` > ${item.subcategory}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[hsl(var(--muted-foreground))]">Price:</span>
                        <span className="ml-2 font-semibold text-[hsl(var(--primary))]">
                          Rs. {parseFloat(item.price || 0).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[hsl(var(--muted-foreground))]">Purchase Date:</span>
                        <span className="ml-2 font-semibold text-[hsl(var(--foreground))]">
                          {new Date(item.purchase_date).toLocaleDateString()}
                        </span>
                      </div>
                      {item.payment_method && (
                        <div>
                          <span className="text-[hsl(var(--muted-foreground))]">Payment Method:</span>
                          <span className="ml-2 font-semibold text-[hsl(var(--foreground))]">
                            {item.payment_method}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Seller Information */}
                    {item.seller_info && (
                      <div className="border-t border-[hsl(var(--border))] pt-3 mt-3">
                        <h4 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                          Seller Information:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-[hsl(var(--muted-foreground))]">Name:</span>
                            <span className="ml-2 font-semibold text-[hsl(var(--foreground))]">
                              {item.seller_info.name}
                            </span>
                          </div>
                          <div>
                            <span className="text-[hsl(var(--muted-foreground))]">Email:</span>
                            <span className="ml-2 font-semibold text-[hsl(var(--foreground))]">
                              {item.seller_info.email}
                            </span>
                          </div>
                          {(item.seller_info.address || item.seller_info.selected_local_address) && (
                            <div className="md:col-span-2">
                              <span className="text-[hsl(var(--muted-foreground))]">Address:</span>
                              <span className="ml-2 font-semibold text-[hsl(var(--foreground))]">
                                {item.seller_info.address || ''}
                                {item.seller_info.address && item.seller_info.selected_local_address && ', '}
                                {item.seller_info.selected_local_address || ''}
                              </span>
                            </div>
                          )}
                        </div>
                        {item.seller_id && (
                          <div className="mt-3">
                            <Link
                              to={`/profile/${item.seller_id}`}
                              className="text-sm text-[hsl(var(--primary))] hover:underline"
                            >
                              View Seller Profile →
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserDashboard;

