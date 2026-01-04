import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import Layout from './Layout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { profileAPI, dashboardAPI, userAdAPI, favouriteAPI, watchlistAPI, recentlyViewedAPI, savedSearchAPI, notificationAPI, inboxAPI, ratingAPI, publicProfileAPI, boughtItemsAPI, itemsSellingAPI, sellerOfferAPI, buyerSellerMessageAPI, sellerVerificationAPI, sellerEbookAPI, userAuctionAPI, walletAPI, getAdUrl } from '../utils/api';
import { localDateTimeToUTC } from '../utils/timezone';
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
  
  // Unread counts for badges
  const [inboxUnreadCount, setInboxUnreadCount] = useState(0);
  const [notificationsUnreadCount, setNotificationsUnreadCount] = useState(0);

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

  // Fetch unread counts for badges
  const fetchUnreadCounts = async () => {
    if (!user) return;
    
    try {
      // Fetch notifications unread count
      const notificationsResponse = await notificationAPI.getUnreadCount();
      setNotificationsUnreadCount(notificationsResponse.data.unread_count || 0);
      
      // Fetch inbox unread count (support chats + buyer-seller messages)
      let totalInboxUnread = 0;
      
      try {
        // Support chat unread count
        const supportChatsResponse = await inboxAPI.getChats();
        const supportChats = supportChatsResponse.data || [];
        const supportUnread = supportChats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0);
        totalInboxUnread += supportUnread;
      } catch (err) {
        console.error('Error fetching support chats:', err);
      }
      
      try {
        // Buyer-seller messages unread count
        const userAdsResponse = await userAdAPI.getAds();
        const userAdsData = userAdsResponse.data?.data || userAdsResponse.data || [];
        
        if (userAdsData.length > 0) {
          // User is a seller - get seller conversations
          const sellerConvsResponse = await buyerSellerMessageAPI.getSellerConversations();
          const sellerConvs = sellerConvsResponse.data || [];
          const sellerUnread = sellerConvs.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
          totalInboxUnread += sellerUnread;
        } else {
          // User is a buyer - get buyer conversations
          const buyerConvsResponse = await buyerSellerMessageAPI.getBuyerConversations();
          const buyerConvs = buyerConvsResponse.data || [];
          const buyerUnread = buyerConvs.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
          totalInboxUnread += buyerUnread;
        }
      } catch (err) {
        console.error('Error fetching buyer-seller conversations:', err);
      }
      
      setInboxUnreadCount(totalInboxUnread);
    } catch (err) {
      console.error('Error fetching unread counts:', err);
    }
  };

  // Fetch unread counts on mount and periodically
  useEffect(() => {
    if (user && !loading) {
      fetchUnreadCounts();
      // Poll every 30 seconds for updates
      const interval = setInterval(fetchUnreadCounts, 30000);
      // Expose fetchUnreadCounts globally so child components can trigger refresh
      window.fetchUnreadCounts = fetchUnreadCounts;
      return () => {
        clearInterval(interval);
        delete window.fetchUnreadCounts;
      };
    }
  }, [user, loading]);

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
    ...(user?.seller_verified ? [{ id: 'my-ebooks', label: 'My eBooks', icon: '📚' }] : []),
    { id: 'my-auctions', label: 'My Auctions', icon: '🔨' },
    { id: 'my-bids', label: 'My Bids', icon: '💰' },
    { id: 'won-auctions', label: 'Won Auctions', icon: '🏆' },
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
    
    // Refresh unread counts when navigating to inbox or notifications
    if (sectionId === 'inbox' || sectionId === 'notifications') {
      fetchUnreadCounts();
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
      case 'my-ebooks':
        // Only show for verified sellers
        if (!user?.seller_verified) {
          return <DashboardOverview user={user} />;
        }
        return <MyEbooksSection user={user} />;
      case 'my-auctions':
        return <MyAuctionsSection user={user} />;
      case 'my-bids':
        return <MyBidsSection user={user} />;
      case 'won-auctions':
        return <WonAuctionsSection user={user} />;
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
            {menuItems.map((item) => {
              // Get unread count for this item
              let unreadCount = 0;
              if (item.id === 'inbox') {
                unreadCount = inboxUnreadCount;
              } else if (item.id === 'notifications') {
                unreadCount = notificationsUnreadCount;
              }
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={`w-full text-left px-4 py-3 mb-1 rounded-lg transition-colors flex items-center gap-3 relative ${
                    activeSection === item.id
                      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                      : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium flex-1">{item.label}</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
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

  // Section visibility state
  const [showOverview, setShowOverview] = useState(false);
  const [showRecentlyViewed, setShowRecentlyViewed] = useState(false);
  
  // Refs for smooth scrolling
  const overviewRef = useRef(null);
  const recentlyViewedRef = useRef(null);

  // Search and ad browsing state (no sidebar filters)
  const [categories, setCategories] = useState([]);
  const [locationData, setLocationData] = useState({ provinces: [] });
  const [selectedLocations, setSelectedLocations] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(new Set()); // For domain categories (using name as key)
  const [expandedFieldCategories, setExpandedFieldCategories] = useState(new Set()); // For field categories (using name as key)
  const [selectedCategories, setSelectedCategories] = useState(new Set()); // Selected domain category IDs
  const [selectedSubcategories, setSelectedSubcategories] = useState(new Set()); // Selected field category IDs
  const [selectedItemCategories, setSelectedItemCategories] = useState(new Set()); // Selected item category IDs
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [expandedProvinces, setExpandedProvinces] = useState(new Set());
  const [expandedDistricts, setExpandedDistricts] = useState(new Set());
  const [expandedLocalLevels, setExpandedLocalLevels] = useState(new Set());
  const [expandedWards, setExpandedWards] = useState(new Set());
  const [sortBy, setSortBy] = useState('most relevant');
  const [allAds, setAllAds] = useState([]);
  const [adsLoading, setAdsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const adsPerPage = 40;
  const categoryDropdownRef = useRef(null);
  const locationDropdownRef = useRef(null);

  useEffect(() => {
    fetchStats();
    fetchCategories();
    fetchLocations();
    fetchAds();
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

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  // Fetch locations
  const fetchLocations = async () => {
    try {
      const response = await axios.get('/api/locations');
      setLocationData(response.data || { provinces: [] });
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  };

  // Fetch ads
  const fetchAds = async () => {
    try {
      setAdsLoading(true);
      const response = await window.axios.get('/api/ads');
      const adsData = response.data.ads || [];
      
      const transformedAds = adsData.map(ad => ({
        id: ad.id,
        title: ad.title,
        description: ad.description,
        price: ad.price,
        image: ad.image || 'https://via.placeholder.com/1200x1200?text=No+Image',
        category_id: ad.category_id,
        category: ad.category,
        subcategory: ad.subcategory || ad.sub_category,
        sub_category: ad.subcategory || ad.sub_category,
        location: ad.location,
        location_id: ad.location_id,
        selected_local_address_index: ad.selected_local_address_index !== undefined ? ad.selected_local_address_index : null,
        created_at: ad.created_at,
      }));
      
      setAllAds(transformedAds);
    } catch (error) {
      console.error('Error fetching ads:', error);
      setAllAds([]);
    } finally {
      setAdsLoading(false);
    }
  };

  // Helper functions for 3-level categories
  const getTopLevelCategories = () => {
    // Return domain categories (top level)
    return categories.filter(cat => cat.domain_category || cat.name);
  };

  const getFieldCategories = (domainCategoryIdOrName) => {
    // Try to find by id first, then by name
    const domainCategory = categories.find(c => 
      c.id === domainCategoryIdOrName || 
      c.domain_category === domainCategoryIdOrName || 
      c.name === domainCategoryIdOrName
    );
    if (!domainCategory) return [];
    return domainCategory.field_categories || [];
  };

  const getItemCategories = (domainCategoryId, fieldCategoryId) => {
    const domainCategory = categories.find(c => c.id === domainCategoryId);
    if (!domainCategory) return [];
    const fieldCategory = domainCategory.field_categories?.find(fc => fc.id === fieldCategoryId);
    return fieldCategory?.item_categories || [];
  };

  const toggleCategory = (categoryName) => {
    // Directly use the category name as key (matching location toggle logic)
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const toggleFieldCategory = (fieldCategoryName) => {
    // Directly use the field category name as key (matching location toggle logic)
    setExpandedFieldCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldCategoryName)) {
        newSet.delete(fieldCategoryName);
      } else {
        newSet.add(fieldCategoryName);
      }
      return newSet;
    });
  };

  const handleCategoryToggle = (categoryId) => {
    const domainCategory = categories.find(c => c.id === categoryId);
    if (!domainCategory) return;
    
    const domainCategoryName = domainCategory.domain_category || domainCategory.name;
    const fieldCategories = domainCategory.field_categories || [];
    
    // Check if currently selected
    const isCurrentlySelected = selectedCategories.has(categoryId);
    
    // Toggle domain category selection
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (isCurrentlySelected) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
        // Don't auto-expand - user must click the name/button to expand
      }
      return newSet;
    });
    
    // Select/deselect all field categories and their item categories
    fieldCategories.forEach(fieldCat => {
      setSelectedSubcategories(prev => {
        const newSet = new Set(prev);
        if (isCurrentlySelected) {
          newSet.delete(fieldCat.id);
        } else {
          newSet.add(fieldCat.id);
        }
        return newSet;
      });
      
      // Select/deselect all item categories under this field category
      const itemCategories = fieldCat.item_categories || [];
      itemCategories.forEach(itemCat => {
        setSelectedItemCategories(prev => {
          const newSet = new Set(prev);
          if (isCurrentlySelected) {
            newSet.delete(itemCat.id);
          } else {
            newSet.add(itemCat.id);
          }
          return newSet;
        });
      });
    });
    
    // Also handle direct item categories (under domain, no field)
    const directItemCategories = domainCategory.item_categories || [];
    directItemCategories.forEach(itemCat => {
      setSelectedItemCategories(prev => {
        const newSet = new Set(prev);
        if (isCurrentlySelected) {
          newSet.delete(itemCat.id);
        } else {
          newSet.add(itemCat.id);
        }
        return newSet;
      });
    });
  };

  const handleSubcategoryToggle = (subcategoryId) => {
    // Find which domain category this field category belongs to
    const domainCategory = categories.find(cat => {
      const fieldCats = cat.field_categories || [];
      return fieldCats.some(fc => fc.id === subcategoryId);
    });
    
    if (!domainCategory) return;
    
    const fieldCategory = domainCategory.field_categories?.find(fc => fc.id === subcategoryId);
    if (!fieldCategory) return;
    
    const fieldCategoryName = fieldCategory.field_category || fieldCategory.name;
    const itemCategories = fieldCategory.item_categories || [];
    
    // Check if currently selected
    const isCurrentlySelected = selectedSubcategories.has(subcategoryId);
    
    // Toggle field category selection and update domain category status
    setSelectedSubcategories(prev => {
      const newSet = new Set(prev);
      if (isCurrentlySelected) {
        newSet.delete(subcategoryId);
      } else {
        newSet.add(subcategoryId);
        // Don't auto-expand - user must click the name/button to expand
      }
      
      // Update domain category selection status
      // If all field categories under domain are selected, auto-select domain
      // If any field category is deselected, deselect domain
      const allFieldCategories = domainCategory.field_categories || [];
      const allFieldSelected = allFieldCategories.every(fc => {
        if (fc.id === subcategoryId) {
          // Use the new state (after toggle)
          return !isCurrentlySelected;
        }
        return newSet.has(fc.id);
      });
      
      setSelectedCategories(prevCats => {
        const newCats = new Set(prevCats);
        if (allFieldSelected && allFieldCategories.length > 0) {
          newCats.add(domainCategory.id);
        } else {
          newCats.delete(domainCategory.id);
        }
        return newCats;
      });
      
      return newSet;
    });
    
    // Select/deselect all item categories under this field category
    itemCategories.forEach(itemCat => {
      setSelectedItemCategories(prev => {
        const newSet = new Set(prev);
        if (isCurrentlySelected) {
          newSet.delete(itemCat.id);
        } else {
          newSet.add(itemCat.id);
        }
        return newSet;
      });
    });
  };

  const handleItemCategoryToggle = (itemCategoryId) => {
    setSelectedItemCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemCategoryId)) {
        newSet.delete(itemCategoryId);
      } else {
        newSet.add(itemCategoryId);
      }
      return newSet;
    });
  };

  const getCategoryAdCount = (categoryId, categoryName) => {
    if (!allAds || allAds.length === 0) return 0;
    
    // CRITICAL: Check item categories by NAME first (before any ID matching)
    // This prevents conflicts where item category ID matches domain/field category IDs
    let itemCategory = null;
    let itemCategoryFound = false;
    
    if (categoryName) {
      for (const domainCat of categories) {
        if (domainCat.item_categories) {
          itemCategory = domainCat.item_categories.find(item => {
            const itemName = (item.item_category || item.name || '').trim();
            const searchName = (categoryName || '').trim();
            return itemName && searchName && itemName === searchName;
          });
          if (itemCategory) {
            itemCategoryFound = true;
            break;
          }
        }
        if (domainCat.field_categories) {
          for (const fieldCat of domainCat.field_categories) {
            if (fieldCat.item_categories) {
              itemCategory = fieldCat.item_categories.find(item => {
                const itemName = (item.item_category || item.name || '').trim();
                const searchName = (categoryName || '').trim();
                return itemName && searchName && itemName === searchName;
              });
              if (itemCategory) {
                itemCategoryFound = true;
                break;
              }
            }
          }
          if (itemCategoryFound) break;
        }
      }
    }
    
    // If item category found by name, count its ads
    if (itemCategoryFound && itemCategory) {
      return allAds.filter(ad => {
        if (!ad.category_id) return false;
        const adCategoryId = typeof ad.category_id === 'string' ? parseInt(ad.category_id, 10) : Number(ad.category_id);
        return adCategoryId === categoryId;
      }).length;
    }
    
    // CRITICAL: Check field categories by name (before domain category ID matching)
    // This prevents conflicts where field category ID matches domain category ID
    let fieldCategory = null;
    let fieldCategoryFound = false;
    
    if (categoryName && !itemCategoryFound) {
      for (const domainCat of categories) {
        if (domainCat.field_categories) {
          const foundByName = domainCat.field_categories.find(fc => {
            const fcName = (fc.field_category || fc.name || '').trim();
            const searchName = (categoryName || '').trim();
            return fcName && searchName && fcName === searchName;
          });
          // Accept field category if it exists (even if it has no item_categories yet)
          if (foundByName) {
            fieldCategory = foundByName;
            fieldCategoryFound = true;
            break;
          }
        }
      }
    }
    
    // If field category found by name, count its ads
    if (fieldCategoryFound && fieldCategory) {
      // Check if field category has item_categories
      if (fieldCategory.item_categories && Array.isArray(fieldCategory.item_categories) && fieldCategory.item_categories.length > 0) {
        const itemCategoryIds = fieldCategory.item_categories.map(item => item.id).filter(id => id != null);
        if (itemCategoryIds.length > 0) {
          return allAds.filter(ad => {
            if (!ad.category_id) return false;
            const adCategoryId = typeof ad.category_id === 'string' ? parseInt(ad.category_id, 10) : Number(ad.category_id);
            return itemCategoryIds.includes(adCategoryId);
          }).length;
        }
      }
      // If field category has no item_categories, return 0
      return 0;
    }
    
    // Priority 1: Check if it's a domain category (by name first, then by ID and structure)
    // Domain categories have field_categories or item_categories structure
    // IMPORTANT: Domain category IDs can match item category IDs, so we MUST check name/structure first
    // CRITICAL: Only check domain by ID if we haven't found item or field category
    const domainCategory = categories.find(c => {
      // First, check by name (most reliable)
      if (categoryName && (
        (c.domain_category && c.domain_category === categoryName) ||
        (c.name && c.name === categoryName)
      )) {
        // Verify it has the structure of a domain category
        return c.field_categories || c.item_categories;
      }
      // Then check by ID, but only if it has domain category structure AND we haven't found item/field category
      if (!itemCategoryFound && !fieldCategoryFound && c.id === categoryId && (c.field_categories || c.item_categories)) {
        // Double-check it's not just an item category that happens to have the same ID
        // A domain category should have field_categories or item_categories array
        return true;
      }
      return false;
    });
    
    if (domainCategory) {
      // Collect all item category IDs under this domain
      const allItemCategoryIds = [];
      
      // Get item categories directly under domain
      if (domainCategory.item_categories) {
        domainCategory.item_categories.forEach(item => {
          allItemCategoryIds.push(item.id);
        });
      }
      
      // Get item categories under all field categories
      if (domainCategory.field_categories) {
        domainCategory.field_categories.forEach(fieldCat => {
          if (fieldCat.item_categories) {
            fieldCat.item_categories.forEach(item => {
              allItemCategoryIds.push(item.id);
            });
          }
        });
      }
      
      // Remove duplicates (in case of any data inconsistency)
      const uniqueItemCategoryIds = [...new Set(allItemCategoryIds)];
      
      // Count ads that match any of these item category IDs
      const count = allAds.filter(ad => {
        if (!ad.category_id) return false;
        const adCategoryId = typeof ad.category_id === 'string' ? parseInt(ad.category_id, 10) : Number(ad.category_id);
        return uniqueItemCategoryIds.includes(adCategoryId);
      }).length;
      
      return count;
    }
    
    // Priority 2: Check if it's a field category by ID (if name matching didn't work)
    // Field category IDs are sequential (1, 2, 3...) not database IDs
    // IMPORTANT: Only check if we haven't found an item category
    if (!fieldCategoryFound && !itemCategoryFound) {
      for (const domainCat of categories) {
        if (domainCat.field_categories) {
          const foundById = domainCat.field_categories.find(fc => fc.id === categoryId);
          // Accept if found (even if it has no item_categories yet)
          if (foundById) {
            fieldCategory = foundById;
            fieldCategoryFound = true;
            break;
          }
        }
      }
      
      // If field category found by ID, count its ads
      if (fieldCategoryFound && fieldCategory) {
        // Check if field category has item_categories
        if (fieldCategory.item_categories && Array.isArray(fieldCategory.item_categories) && fieldCategory.item_categories.length > 0) {
          const itemCategoryIds = fieldCategory.item_categories.map(item => item.id).filter(id => id != null);
          if (itemCategoryIds.length > 0) {
            return allAds.filter(ad => {
              if (!ad.category_id) return false;
              const adCategoryId = typeof ad.category_id === 'string' ? parseInt(ad.category_id, 10) : Number(ad.category_id);
              return itemCategoryIds.includes(adCategoryId);
            }).length;
          }
        }
        // If field category has no item_categories, return 0
        return 0;
      }
    }
    
    // Priority 3: Check if it's an item category by ID (last resort)
    // Item categories have actual database IDs that ads reference
    // Only check if we haven't already identified it as domain, field, or item category
    if (!domainCategory && !fieldCategoryFound && !itemCategoryFound) {
      for (const domainCat of categories) {
        if (domainCat.item_categories) {
          itemCategory = domainCat.item_categories.find(item => item.id === categoryId);
          if (itemCategory) break;
        }
        if (domainCat.field_categories) {
          for (const fieldCat of domainCat.field_categories) {
            if (fieldCat.item_categories) {
              itemCategory = fieldCat.item_categories.find(item => item.id === categoryId);
              if (itemCategory) break;
            }
          }
          if (itemCategory) break;
        }
      }
      
      // If it's an item category, count ads directly linked to it
      if (itemCategory) {
        return allAds.filter(ad => {
          if (!ad.category_id) return false;
          const adCategoryId = typeof ad.category_id === 'string' ? parseInt(ad.category_id, 10) : Number(ad.category_id);
          return adCategoryId === categoryId;
        }).length;
      }
    }
    
    return 0;
  };

  const buildCategorySearchString = () => {
    // Count only item categories (leaf level) - matching location logic that counts only addresses
    const total = selectedItemCategories.size;
    if (total === 0) {
      return 'All Categories';
    }
    if (total === 1) {
      return '1 category selected';
    }
    return `${total} categories selected`;
  };

  const buildSearchLocationString = () => {
    // Count only addresses (leaf level) - addresses are stored as "wardId-index" format (string with hyphen)
    // Also count wards that don't have addresses (numeric IDs without corresponding addresses)
    const selectedIds = Array.from(selectedLocations);
    const addressIds = selectedIds.filter(id => typeof id === 'string' && id.includes('-'));
    
    // Count wards without addresses (numeric IDs that don't have corresponding addresses selected)
    const wardIdsWithoutAddresses = selectedIds.filter(id => {
      if (typeof id === 'number' || (typeof id === 'string' && !id.includes('-'))) {
        // Check if this ward has any addresses selected
        const wardId = typeof id === 'number' ? id : parseInt(id, 10);
        const hasAddresses = selectedIds.some(selectedId => 
          typeof selectedId === 'string' && selectedId.startsWith(`${wardId}-`)
        );
        return !hasAddresses;
      }
      return false;
    });
    
    const totalCount = addressIds.length + wardIdsWithoutAddresses.length;
    
    if (totalCount === 0) {
      return 'All Locations';
    }
    if (totalCount === 1) {
      return '1 location selected';
    }
    return `${totalCount} locations selected`;
  };

  const handleLocationToggle = (locationId) => {
    setSelectedLocations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(locationId)) {
        newSet.delete(locationId);
      } else {
        newSet.add(locationId);
      }
      return newSet;
    });
  };

  const getLocationAdCount = (locationId) => {
    if (!locationId || !allAds || allAds.length === 0) return 0;
    
    if (typeof locationId === 'string' && locationId.includes('-')) {
      const parts = locationId.split('-');
      const wardId = parseInt(parts[0], 10);
      const addressIndex = parseInt(parts.slice(1).join('-'), 10);
      
      if (isNaN(wardId) || isNaN(addressIndex)) return 0;
      
      return allAds.filter(ad => {
        const adLocationId = ad.location_id || ad.locationId;
        if (!adLocationId) return false;
        
        const adLocationIdNum = typeof adLocationId === 'string' ? parseInt(adLocationId, 10) : Number(adLocationId);
        if (adLocationIdNum !== wardId) return false;
        
        let adAddressIndex = null;
        if (ad.selected_local_address_index !== null && ad.selected_local_address_index !== undefined) {
          const indexValue = Number(ad.selected_local_address_index);
          if (!isNaN(indexValue)) {
            adAddressIndex = indexValue;
          }
        }
        
        if (addressIndex === 0) {
          return adAddressIndex === 0 || adAddressIndex === null;
        }
        
        return adAddressIndex === addressIndex;
      }).length;
    }
    
    const locationIdNum = typeof locationId === 'string' ? parseInt(locationId, 10) : Number(locationId);
    if (isNaN(locationIdNum)) return 0;
    
    return allAds.filter(ad => {
      const adLocationId = ad.location_id || ad.locationId;
      if (!adLocationId) return false;
      
      const adLocationIdNum = typeof adLocationId === 'string' ? parseInt(adLocationId, 10) : Number(adLocationId);
      return adLocationIdNum === locationIdNum;
    }).length;
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

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleAdClick = (ad) => {
    navigate(getAdUrl(ad));
  };

  // Toggle sections without scrolling
  const handleToggleOverview = () => {
    setShowOverview(!showOverview);
  };

  const handleToggleRecentlyViewed = () => {
    setShowRecentlyViewed(!showRecentlyViewed);
  };

  // Filter and sort ads
  const filteredAndSortedAds = useMemo(() => {
    if (!allAds || allAds.length === 0) {
      return [];
    }
    
    let filtered = [...allAds];

    // Filter by search keyword
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ad => 
        ad.title.toLowerCase().includes(query) || 
        ad.description.toLowerCase().includes(query)
      );
    }

    // Filter by selected categories (domain, field, or item categories)
    // Ads are linked to item category IDs, so we need to collect all relevant item category IDs
    if (selectedCategories.size > 0 || selectedSubcategories.size > 0 || selectedItemCategories.size > 0) {
      // Collect all item category IDs that should be included
      const allItemCategoryIds = new Set();
      
      // Normalize selected IDs to numbers for comparison
      const selectedCategoryIds = Array.from(selectedCategories).map(id => typeof id === 'string' ? parseInt(id, 10) : Number(id));
      const selectedSubcategoryIds = Array.from(selectedSubcategories).map(id => typeof id === 'string' ? parseInt(id, 10) : Number(id));
      const selectedItemCategoryIds = Array.from(selectedItemCategories).map(id => typeof id === 'string' ? parseInt(id, 10) : Number(id));
      
      // Add directly selected item categories
      selectedItemCategoryIds.forEach(id => allItemCategoryIds.add(id));
      
      // For each selected domain category, collect all item category IDs under it
      selectedCategoryIds.forEach(domainId => {
        const domainCategory = categories.find(c => {
          // Match by ID first
          if (c.id === domainId) {
            // Verify it's a domain category by checking structure
            return c.field_categories || c.item_categories || c.domain_category;
          }
          return false;
        });
        
        if (domainCategory) {
          // Get item categories directly under domain
          if (domainCategory.item_categories && Array.isArray(domainCategory.item_categories)) {
            domainCategory.item_categories.forEach(item => {
              if (item && item.id != null) {
                allItemCategoryIds.add(item.id);
              }
            });
          }
          
          // Get item categories under all field categories
          if (domainCategory.field_categories && Array.isArray(domainCategory.field_categories)) {
            domainCategory.field_categories.forEach(fieldCat => {
              if (fieldCat && fieldCat.item_categories && Array.isArray(fieldCat.item_categories)) {
                fieldCat.item_categories.forEach(item => {
                  if (item && item.id != null) {
                    allItemCategoryIds.add(item.id);
                  }
                });
              }
            });
          }
        }
      });
      
      // For each selected field category, collect all item category IDs under it
      selectedSubcategoryIds.forEach(fieldId => {
        for (const domainCat of categories) {
          if (domainCat.field_categories && Array.isArray(domainCat.field_categories)) {
            const fieldCategory = domainCat.field_categories.find(fc => fc && fc.id === fieldId);
            if (fieldCategory && fieldCategory.item_categories && Array.isArray(fieldCategory.item_categories)) {
              fieldCategory.item_categories.forEach(item => {
                if (item && item.id != null) {
                  allItemCategoryIds.add(item.id);
                }
              });
              break;
            }
          }
        }
      });
      
      // Only filter if we have item category IDs to filter by
      if (allItemCategoryIds.size > 0) {
        // Filter ads by checking if their category_id matches any collected item category ID
        filtered = filtered.filter(ad => {
          if (ad.category_id) {
            const categoryId = typeof ad.category_id === 'string' ? parseInt(ad.category_id, 10) : Number(ad.category_id);
            return allItemCategoryIds.has(categoryId);
          }
          return false;
        });
      } else {
        // If no item category IDs collected, don't show any ads (categories selected but no matching items)
        filtered = [];
      }
    }

    // Filter by selected locations
    if (selectedLocations.size > 0) {
      filtered = filtered.filter(ad => {
        const adLocationId = ad.location_id || ad.locationId;
        if (!adLocationId) return false;
        
        const adLocationIdStr = String(adLocationId);
        const adLocationIdNum = Number(adLocationId);
        
        let adAddressIndex = null;
        if (ad.selected_local_address_index !== null && ad.selected_local_address_index !== undefined) {
          const indexValue = Number(ad.selected_local_address_index);
          if (!isNaN(indexValue)) {
            adAddressIndex = indexValue;
          }
        }
        
        for (const selectedId of selectedLocations) {
          if (typeof selectedId === 'number') {
            if (selectedId === adLocationIdNum) {
              return true;
            }
          } else if (typeof selectedId === 'string') {
            if (selectedId === adLocationIdStr) {
              return true;
            }
            if (selectedId.includes('-')) {
              const parts = selectedId.split('-');
              const wardIdStr = parts[0];
              const addressIndexStr = parts.slice(1).join('-');
              const wardIdNum = parseInt(wardIdStr, 10);
              const addressIndex = parseInt(addressIndexStr, 10);
              
              if (!isNaN(wardIdNum) && (wardIdNum === adLocationIdNum || String(wardIdNum) === adLocationIdStr)) {
                if (!isNaN(addressIndex)) {
                  if (addressIndex === 0) {
                    if (adAddressIndex === 0 || adAddressIndex === null) {
                      return true;
                    }
                  } else {
                    if (adAddressIndex === addressIndex) {
                      return true;
                    }
                  }
                } else {
                  return true;
                }
              }
            } else {
              const selectedIdNum = parseInt(selectedId, 10);
              if (!isNaN(selectedIdNum) && selectedIdNum === adLocationIdNum) {
                return true;
              }
            }
          }
        }
        
        return false;
      });
    }

    // Sort ads
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'lowest price':
          return a.price - b.price;
        case 'highest price':
          return b.price - a.price;
        case 'ascending order':
          return a.title.localeCompare(b.title);
        case 'descending order':
          return b.title.localeCompare(a.title);
        case 'latest listing':
          return b.id - a.id;
        case 'top review':
          return 0;
        default:
          return 0;
      }
    });

    return sorted;
  }, [
    searchQuery, 
    selectedLocations, 
    selectedCategories, 
    selectedSubcategories,
    selectedItemCategories, // Add this - it was missing!
    sortBy, 
    categories,
    allAds
  ]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredAndSortedAds.length / adsPerPage);
  const startResult = filteredAndSortedAds.length > 0 ? (currentPage - 1) * adsPerPage + 1 : 0;
  const endResult = Math.min(currentPage * adsPerPage, filteredAndSortedAds.length);
  const displayedAds = filteredAndSortedAds.slice((currentPage - 1) * adsPerPage, currentPage * adsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategories, selectedSubcategories, selectedItemCategories, selectedLocations]);

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <section className="mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2 flex-wrap items-center">
              <Input
                type="text"
                placeholder="Enter keyword"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 min-w-[200px] bg-[hsl(var(--background))]"
              />
              {/* Category Dropdown */}
              <div className="relative min-w-[150px]" ref={categoryDropdownRef}>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className={`w-full px-3 py-2 text-left border-0 rounded-md bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] focus:outline-none flex items-center transition-colors ${
                      showCategoryDropdown ? 'bg-[hsl(var(--accent))]' : ''
                    }`}
                  >
                    <span>{buildCategorySearchString() || 'All Categories'}</span>
                  </button>
                  
                  {showCategoryDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-md shadow-lg z-50 w-[300px] max-h-[500px] overflow-y-auto">
                      <div className="p-3">
                        <div className="space-y-1">
                          {getTopLevelCategories().map((domainCategory) => {
                            const domainCategoryName = domainCategory.domain_category || domainCategory.name;
                            // The API already returns field_categories nested in domainCategory
                            // Use it directly (similar to how locations work: province.districts)
                            const fieldCategories = domainCategory.field_categories || [];
                            const hasFieldCategories = fieldCategories && fieldCategories.length > 0;
                            // Use domain category name as key for expansion (matching location logic)
                            const isDomainExpanded = expandedCategories.has(domainCategoryName);
                            const adCount = getCategoryAdCount(domainCategory.id, domainCategoryName);
                            
                            return (
                              <div key={domainCategory.id} className="space-y-1">
                                {/* Domain Category Level - matching location province structure */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2 flex-1">
                                    {hasFieldCategories ? (
                                      <button
                                        onClick={() => toggleCategory(domainCategoryName)}
                                        className="flex items-center space-x-2 flex-1 text-left"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={(() => {
                                            // Collect all item category IDs under this domain - matching location province logic
                                            const allItemCategoryIds = [];
                                            // Get item categories from field categories
                                            fieldCategories.forEach(fieldCat => {
                                              const itemCats = fieldCat.item_categories || [];
                                              itemCats.forEach(itemCat => {
                                                allItemCategoryIds.push(itemCat.id);
                                              });
                                            });
                                            // Get direct item categories under domain
                                            const directItemCategories = domainCategory.item_categories || [];
                                            directItemCategories.forEach(itemCat => {
                                              allItemCategoryIds.push(itemCat.id);
                                            });
                                            return allItemCategoryIds.length > 0 && allItemCategoryIds.every(id => selectedItemCategories.has(id));
                                          })()}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            // Collect all item category IDs - matching location province logic
                                            const allItemCategoryIds = [];
                                            fieldCategories.forEach(fieldCat => {
                                              const itemCats = fieldCat.item_categories || [];
                                              itemCats.forEach(itemCat => {
                                                allItemCategoryIds.push(itemCat.id);
                                              });
                                            });
                                            const directItemCategories = domainCategory.item_categories || [];
                                            directItemCategories.forEach(itemCat => {
                                              allItemCategoryIds.push(itemCat.id);
                                            });
                                            // Toggle all - matching location logic exactly
                                            setSelectedItemCategories(prev => {
                                              const newSet = new Set(prev);
                                              const allSelected = allItemCategoryIds.every(id => newSet.has(id));
                                              allItemCategoryIds.forEach(id => {
                                                  if (allSelected) {
                                                  newSet.delete(id);
                                                  } else {
                                                  newSet.add(id);
                                                  }
                                              });
                                              return newSet;
                                            });
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-4 h-4"
                                        />
                                        <span className="text-sm text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] cursor-pointer">
                                          {domainCategoryName}
                                        </span>
                                      </button>
                                    ) : (
                                      <label className="flex items-center space-x-2 flex-1 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={(() => {
                                            // For domains without field categories, check direct item categories
                                            const directItemCategories = domainCategory.item_categories || [];
                                            const allItemCategoryIds = directItemCategories.map(itemCat => itemCat.id);
                                            return allItemCategoryIds.length > 0 && allItemCategoryIds.every(id => selectedItemCategories.has(id));
                                          })()}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            const directItemCategories = domainCategory.item_categories || [];
                                            const allItemCategoryIds = directItemCategories.map(itemCat => itemCat.id);
                                            setSelectedItemCategories(prev => {
                                              const newSet = new Set(prev);
                                              const allSelected = allItemCategoryIds.every(id => newSet.has(id));
                                              allItemCategoryIds.forEach(id => {
                                                if (allSelected) {
                                                  newSet.delete(id);
                                                } else {
                                                  newSet.add(id);
                                                }
                                              });
                                              return newSet;
                                            });
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-4 h-4"
                                        />
                                        <span className="text-sm text-[hsl(var(--foreground))]">
                                          {domainCategoryName}
                                        </span>
                                      </label>
                                    )}
                                  </div>
                                  <span className="text-xs text-[hsl(var(--muted-foreground))] ml-2">
                                    ({adCount})
                                  </span>
                                </div>
                                
                                {/* Field Categories Level - shown when domain category is expanded - matching location district structure */}
                                {hasFieldCategories && isDomainExpanded && (
                                  <div className="ml-5 pl-2 border-l-2 border-[hsl(var(--border))] space-y-1 mt-1">
                                    {fieldCategories.map((fieldCategory) => {
                                      const fieldCategoryName = fieldCategory.field_category || fieldCategory.name;
                                      // The API already returns item_categories nested in fieldCategory
                                      // Use it directly (similar to how locations work: district.localLevels)
                                      const itemCategories = fieldCategory.item_categories || [];
                                      const hasItemCategories = itemCategories && itemCategories.length > 0;
                                      // Use field category name as key for expansion (consistent with domain category)
                                      const isFieldExpanded = expandedFieldCategories.has(fieldCategoryName);
                                      const fieldAdCount = getCategoryAdCount(fieldCategory.id, fieldCategoryName);
                                      
                                      return (
                                        <div key={fieldCategory.id} className="space-y-1">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2 flex-1">
                                              {hasItemCategories ? (
                                                <button
                                                  onClick={() => toggleFieldCategory(fieldCategoryName)}
                                                  className="flex items-center space-x-2 flex-1 text-left"
                                                >
                                                  <input
                                                    type="checkbox"
                                                    checked={(() => {
                                                      // Collect all item category IDs under this field - matching location district logic
                                                      const allItemCategoryIds = [];
                                                      itemCategories.forEach(itemCat => {
                                                        allItemCategoryIds.push(itemCat.id);
                                                      });
                                                      return allItemCategoryIds.length > 0 && allItemCategoryIds.every(id => selectedItemCategories.has(id));
                                                    })()}
                                                    onChange={(e) => {
                                                      e.stopPropagation();
                                                      // Collect all item category IDs - matching location district logic
                                                      const allItemCategoryIds = [];
                                                      itemCategories.forEach(itemCat => {
                                                        allItemCategoryIds.push(itemCat.id);
                                                      });
                                                      // Toggle all - matching location logic exactly
                                                      setSelectedItemCategories(prev => {
                                                        const newSet = new Set(prev);
                                                        const allSelected = allItemCategoryIds.every(id => newSet.has(id));
                                                        allItemCategoryIds.forEach(id => {
                                                          if (allSelected) {
                                                            newSet.delete(id);
                                                          } else {
                                                            newSet.add(id);
                                                          }
                                                        });
                                                        return newSet;
                                                      });
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-4 h-4"
                                                  />
                                                  <span className="text-sm text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] cursor-pointer">
                                                    {fieldCategoryName}
                                                  </span>
                                                </button>
                                              ) : (
                                                <label className="flex items-center space-x-2 cursor-pointer flex-1">
                                                  <input
                                                    type="checkbox"
                                                    checked={false}
                                                    disabled
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-4 h-4 opacity-50"
                                                  />
                                                  <span className="text-sm text-[hsl(var(--muted-foreground))]">{fieldCategoryName}</span>
                                                </label>
                                              )}
                                            </div>
                                            <span className="text-xs text-[hsl(var(--muted-foreground))] ml-2">
                                              ({fieldAdCount})
                                            </span>
                                          </div>
                                          
                                          {/* Item Categories Level - shown when field category is expanded - matching location ward structure */}
                                          {hasItemCategories && isFieldExpanded && (
                                            <div className="ml-5 pl-2 border-l-2 border-[hsl(var(--border))] space-y-1 mt-1">
                                              {itemCategories.map((itemCategory) => {
                                                const itemCategoryName = itemCategory.item_category || itemCategory.name;
                                                const itemAdCount = getCategoryAdCount(itemCategory.id, itemCategoryName);
                                                return (
                                                  <div key={itemCategory.id} className="flex items-center justify-between">
                                                    <label className="flex items-center space-x-2 cursor-pointer flex-1">
                                                      <input
                                                        type="checkbox"
                                                        checked={selectedItemCategories.has(itemCategory.id)}
                                                        onChange={(e) => {
                                                          e.stopPropagation();
                                                          handleItemCategoryToggle(itemCategory.id);
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="w-4 h-4"
                                                      />
                                                      <span className="text-xs text-[hsl(var(--muted-foreground))]">{itemCategoryName}</span>
                                                    </label>
                                                    <span className="text-xs text-[hsl(var(--muted-foreground))] ml-2">
                                                      ({itemAdCount})
                                                    </span>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Location Dropdown - Simplified version matching Homepage */}
              <div className="relative min-w-[150px]" ref={locationDropdownRef}>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                    className={`w-full px-3 py-2 text-left border-0 rounded-md bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] focus:outline-none flex items-center transition-colors ${
                      showLocationDropdown ? 'bg-[hsl(var(--accent))]' : ''
                    }`}
                  >
                    <span>{buildSearchLocationString()}</span>
                  </button>
                  
                  {showLocationDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-md shadow-lg z-50 w-[300px] max-h-[500px] overflow-y-auto">
                      <div className="p-3">
                        <div className="space-y-1">
                          {locationData.provinces.map((province) => {
                            const hasDistricts = province.districts && province.districts.length > 0;
                            const isProvinceExpanded = expandedProvinces.has(province.id);
                            const provinceAdCount = (() => {
                              let count = 0;
                              province.districts.forEach(d => {
                                d.localLevels.forEach(ll => {
                                  if (ll.wards) {
                                    ll.wards.forEach(w => {
                                      count += getLocationAdCount(w.id);
                                    });
                                  }
                                });
                              });
                              return count;
                            })();
                            
                            return (
                              <div key={province.id} className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2 flex-1">
                                    {hasDistricts ? (
                                      <button
                                        onClick={() => toggleProvince(province.id)}
                                        className="flex items-center space-x-2 flex-1 text-left"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={(() => {
                                            const allLocationIds = [];
                                            province.districts.forEach(d => {
                                              d.localLevels.forEach(ll => {
                                                if (ll.wards) {
                                                  ll.wards.forEach(w => {
                                                    allLocationIds.push(w.id);
                                                    if (w.local_addresses) {
                                                      w.local_addresses.forEach((_, idx) => {
                                                        allLocationIds.push(`${w.id}-${idx}`);
                                                      });
                                                    }
                                                  });
                                                }
                                              });
                                            });
                                            return allLocationIds.length > 0 && allLocationIds.every(id => selectedLocations.has(id));
                                          })()}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            const allLocationIds = [];
                                            province.districts.forEach(d => {
                                              d.localLevels.forEach(ll => {
                                                if (ll.wards) {
                                                  ll.wards.forEach(w => {
                                                    allLocationIds.push(w.id);
                                                    if (w.local_addresses) {
                                                      w.local_addresses.forEach((_, idx) => {
                                                        allLocationIds.push(`${w.id}-${idx}`);
                                                      });
                                                    }
                                                  });
                                                }
                                              });
                                            });
                                            setSelectedLocations(prev => {
                                              const newSet = new Set(prev);
                                              const allSelected = allLocationIds.every(id => newSet.has(id));
                                              allLocationIds.forEach(id => {
                                                if (allSelected) {
                                                  newSet.delete(id);
                                                } else {
                                                  newSet.add(id);
                                                }
                                              });
                                              return newSet;
                                            });
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-4 h-4"
                                        />
                                        <span className="text-sm text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] cursor-pointer">
                                          {province.name}
                                        </span>
                                      </button>
                                    ) : (
                                      <label className="flex items-center space-x-2 flex-1 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={(() => {
                                            const allLocationIds = [];
                                            province.districts.forEach(d => {
                                              d.localLevels.forEach(ll => {
                                                if (ll.wards) {
                                                  ll.wards.forEach(w => {
                                                    allLocationIds.push(w.id);
                                                    if (w.local_addresses) {
                                                      w.local_addresses.forEach((_, idx) => {
                                                        allLocationIds.push(`${w.id}-${idx}`);
                                                      });
                                                    }
                                                  });
                                                }
                                              });
                                            });
                                            return allLocationIds.length > 0 && allLocationIds.every(id => selectedLocations.has(id));
                                          })()}
                                          onChange={(e) => {
                                            const allLocationIds = [];
                                            province.districts.forEach(d => {
                                              d.localLevels.forEach(ll => {
                                                if (ll.wards) {
                                                  ll.wards.forEach(w => {
                                                    allLocationIds.push(w.id);
                                                    if (w.local_addresses) {
                                                      w.local_addresses.forEach((_, idx) => {
                                                        allLocationIds.push(`${w.id}-${idx}`);
                                                      });
                                                    }
                                                  });
                                                }
                                              });
                                            });
                                            setSelectedLocations(prev => {
                                              const newSet = new Set(prev);
                                              const allSelected = allLocationIds.every(id => newSet.has(id));
                                              allLocationIds.forEach(id => {
                                                if (allSelected) {
                                                  newSet.delete(id);
                                                } else {
                                                  newSet.add(id);
                                                }
                                              });
                                              return newSet;
                                            });
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-4 h-4"
                                        />
                                        <span className="text-sm text-[hsl(var(--foreground))]">
                                          {province.name}
                                        </span>
                                      </label>
                                    )}
                                  </div>
                                  <span className="text-xs text-[hsl(var(--muted-foreground))] ml-2">
                                    ({provinceAdCount})
                                  </span>
                                </div>
                                
                                {hasDistricts && isProvinceExpanded && (
                                  <div className="ml-5 pl-2 border-l-2 border-[hsl(var(--border))] space-y-1 mt-1">
                                    {province.districts.map((district) => {
                                      const districtKey = `${province.id}-${district.id}`;
                                      const hasLocalLevels = district.localLevels && district.localLevels.length > 0;
                                      const isDistrictExpanded = expandedDistricts.has(districtKey);
                                      const districtAdCount = (() => {
                                        let count = 0;
                                        district.localLevels.forEach(ll => {
                                          if (ll.wards) {
                                            ll.wards.forEach(w => {
                                              count += getLocationAdCount(w.id);
                                            });
                                          }
                                        });
                                        return count;
                                      })();
                                      
                                      return (
                                        <div key={district.id} className="space-y-1">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2 flex-1">
                                              {hasLocalLevels ? (
                                                <button
                                                  onClick={() => toggleDistrict(districtKey)}
                                                  className="flex items-center space-x-2 flex-1 text-left"
                                                >
                                                  <input
                                                    type="checkbox"
                                                    checked={(() => {
                                                      const allLocationIds = [];
                                                      district.localLevels.forEach(ll => {
                                                        if (ll.wards) {
                                                          ll.wards.forEach(w => {
                                                            allLocationIds.push(w.id);
                                                            if (w.local_addresses) {
                                                              w.local_addresses.forEach((_, idx) => {
                                                                allLocationIds.push(`${w.id}-${idx}`);
                                                              });
                                                            }
                                                          });
                                                        }
                                                      });
                                                      return allLocationIds.length > 0 && allLocationIds.every(id => selectedLocations.has(id));
                                                    })()}
                                                    onChange={(e) => {
                                                      e.stopPropagation();
                                                      const allLocationIds = [];
                                                      district.localLevels.forEach(ll => {
                                                        if (ll.wards) {
                                                          ll.wards.forEach(w => {
                                                            allLocationIds.push(w.id);
                                                            if (w.local_addresses) {
                                                              w.local_addresses.forEach((_, idx) => {
                                                                allLocationIds.push(`${w.id}-${idx}`);
                                                              });
                                                            }
                                                          });
                                                        }
                                                      });
                                                      setSelectedLocations(prev => {
                                                        const newSet = new Set(prev);
                                                        const allSelected = allLocationIds.every(id => newSet.has(id));
                                                        allLocationIds.forEach(id => {
                                                          if (allSelected) {
                                                            newSet.delete(id);
                                                          } else {
                                                            newSet.add(id);
                                                          }
                                                        });
                                                        return newSet;
                                                      });
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-4 h-4"
                                                  />
                                                  <span className="text-sm text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] cursor-pointer">
                                                    {district.name}
                                                  </span>
                                                </button>
                                              ) : (
                                                <label className="flex items-center space-x-2 flex-1 cursor-pointer">
                                                  <input
                                                    type="checkbox"
                                                    checked={(() => {
                                                      const allLocationIds = [];
                                                      district.localLevels.forEach(ll => {
                                                        if (ll.wards) {
                                                          ll.wards.forEach(w => {
                                                            allLocationIds.push(w.id);
                                                            if (w.local_addresses) {
                                                              w.local_addresses.forEach((_, idx) => {
                                                                allLocationIds.push(`${w.id}-${idx}`);
                                                              });
                                                            }
                                                          });
                                                        }
                                                      });
                                                      return allLocationIds.length > 0 && allLocationIds.every(id => selectedLocations.has(id));
                                                    })()}
                                                    onChange={(e) => {
                                                      const allLocationIds = [];
                                                      district.localLevels.forEach(ll => {
                                                        if (ll.wards) {
                                                          ll.wards.forEach(w => {
                                                            allLocationIds.push(w.id);
                                                            if (w.local_addresses) {
                                                              w.local_addresses.forEach((_, idx) => {
                                                                allLocationIds.push(`${w.id}-${idx}`);
                                                              });
                                                            }
                                                          });
                                                        }
                                                      });
                                                      setSelectedLocations(prev => {
                                                        const newSet = new Set(prev);
                                                        const allSelected = allLocationIds.every(id => newSet.has(id));
                                                        allLocationIds.forEach(id => {
                                                          if (allSelected) {
                                                            newSet.delete(id);
                                                          } else {
                                                            newSet.add(id);
                                                          }
                                                        });
                                                        return newSet;
                                                      });
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-4 h-4"
                                                  />
                                                  <span className="text-sm text-[hsl(var(--foreground))]">
                                                    {district.name}
                                                  </span>
                                                </label>
                                              )}
                                            </div>
                                            <span className="text-xs text-[hsl(var(--muted-foreground))] ml-2">
                                              ({districtAdCount})
                                            </span>
                                          </div>
                                          
                                          {hasLocalLevels && isDistrictExpanded && (
                                            <div className="ml-5 pl-2 border-l-2 border-[hsl(var(--border))] space-y-1 mt-1">
                                              {district.localLevels.map((localLevel) => {
                                                const localLevelKey = `${districtKey}-${localLevel.id}`;
                                                const hasWards = localLevel.wards && localLevel.wards.length > 0;
                                                const isLocalLevelExpanded = expandedLocalLevels.has(localLevelKey);
                                                const localLevelAdCount = (() => {
                                                  if (!localLevel.wards) return 0;
                                                  let count = 0;
                                                  localLevel.wards.forEach(w => {
                                                    count += getLocationAdCount(w.id);
                                                  });
                                                  return count;
                                                })();
                                                
                                                return (
                                                  <div key={localLevel.id} className="space-y-1">
                                                    <div className="flex items-center justify-between">
                                                      <div className="flex items-center space-x-2 flex-1">
                                                        {hasWards ? (
                                                          <button
                                                            onClick={() => toggleLocalLevel(localLevelKey)}
                                                            className="flex items-center space-x-2 flex-1 text-left"
                                                          >
                                                            <input
                                                              type="checkbox"
                                                              checked={(() => {
                                                                if (!localLevel.wards) return false;
                                                                const allLocationIds = [];
                                                                localLevel.wards.forEach(w => {
                                                                  allLocationIds.push(w.id);
                                                                  if (w.local_addresses) {
                                                                    w.local_addresses.forEach((_, idx) => {
                                                                      allLocationIds.push(`${w.id}-${idx}`);
                                                                    });
                                                                  }
                                                                });
                                                                return allLocationIds.length > 0 && allLocationIds.every(id => selectedLocations.has(id));
                                                              })()}
                                                              onChange={(e) => {
                                                                e.stopPropagation();
                                                                if (localLevel.wards) {
                                                                  const allLocationIds = [];
                                                                  localLevel.wards.forEach(w => {
                                                                    allLocationIds.push(w.id);
                                                                    if (w.local_addresses) {
                                                                      w.local_addresses.forEach((_, idx) => {
                                                                        allLocationIds.push(`${w.id}-${idx}`);
                                                                      });
                                                                    }
                                                                  });
                                                                  setSelectedLocations(prev => {
                                                                    const newSet = new Set(prev);
                                                                    const allSelected = allLocationIds.every(id => newSet.has(id));
                                                                    allLocationIds.forEach(id => {
                                                                      if (allSelected) {
                                                                        newSet.delete(id);
                                                                      } else {
                                                                        newSet.add(id);
                                                                      }
                                                                    });
                                                                    return newSet;
                                                                  });
                                                                }
                                                              }}
                                                              onClick={(e) => e.stopPropagation()}
                                                              className="w-4 h-4"
                                                            />
                                                            <span className="text-sm text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] cursor-pointer">
                                                              {localLevel.name} ({localLevel.type === 'municipality' ? 'M' : 'RM'})
                                                            </span>
                                                          </button>
                                                        ) : (
                                                          <label className="flex items-center space-x-2 flex-1 cursor-pointer">
                                                            <input
                                                              type="checkbox"
                                                              checked={(() => {
                                                                if (!localLevel.wards) return false;
                                                                const allLocationIds = [];
                                                                localLevel.wards.forEach(w => {
                                                                  allLocationIds.push(w.id);
                                                                  if (w.local_addresses) {
                                                                    w.local_addresses.forEach((_, idx) => {
                                                                      allLocationIds.push(`${w.id}-${idx}`);
                                                                    });
                                                                  }
                                                                });
                                                                return allLocationIds.length > 0 && allLocationIds.every(id => selectedLocations.has(id));
                                                              })()}
                                                              onChange={(e) => {
                                                                if (localLevel.wards) {
                                                                  const allLocationIds = [];
                                                                  localLevel.wards.forEach(w => {
                                                                    allLocationIds.push(w.id);
                                                                    if (w.local_addresses) {
                                                                      w.local_addresses.forEach((_, idx) => {
                                                                        allLocationIds.push(`${w.id}-${idx}`);
                                                                      });
                                                                    }
                                                                  });
                                                                  setSelectedLocations(prev => {
                                                                    const newSet = new Set(prev);
                                                                    const allSelected = allLocationIds.every(id => newSet.has(id));
                                                                    allLocationIds.forEach(id => {
                                                                      if (allSelected) {
                                                                        newSet.delete(id);
                                                                      } else {
                                                                        newSet.add(id);
                                                                      }
                                                                    });
                                                                    return newSet;
                                                                  });
                                                                }
                                                              }}
                                                              onClick={(e) => e.stopPropagation()}
                                                              className="w-4 h-4"
                                                            />
                                                            <span className="text-sm text-[hsl(var(--foreground))]">
                                                              {localLevel.name} ({localLevel.type === 'municipality' ? 'M' : 'RM'})
                                                            </span>
                                                          </label>
                                                        )}
                                                      </div>
                                                      <span className="text-xs text-[hsl(var(--muted-foreground))] ml-2">
                                                        ({localLevelAdCount})
                                                      </span>
                                                    </div>
                                                    
                                                    {hasWards && isLocalLevelExpanded && (
                                                      <div className="ml-5 pl-2 border-l-2 border-[hsl(var(--border))] space-y-1 mt-1">
                                                        {localLevel.wards.map((ward) => {
                                                          const wardAdCount = getLocationAdCount(ward.id);
                                                          const hasAddresses = ward.local_addresses && ward.local_addresses.length > 0;
                                                          const wardKey = `${localLevelKey}-${ward.id}`;
                                                          const isWardExpanded = expandedWards.has(wardKey);
                                                          
                                                          return (
                                                            <div key={ward.id} className="space-y-1">
                                                              <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-2 flex-1">
                                                                  {hasAddresses ? (
                                                                    <button
                                                                      onClick={() => {
                                                                        setExpandedWards(prev => {
                                                                          const newSet = new Set(prev);
                                                                          if (newSet.has(wardKey)) {
                                                                            newSet.delete(wardKey);
                                                                          } else {
                                                                            newSet.add(wardKey);
                                                                          }
                                                                          return newSet;
                                                                        });
                                                                      }}
                                                                      className="flex items-center space-x-2 flex-1 text-left"
                                                                    >
                                                                      <input
                                                                        type="checkbox"
                                                                        checked={(() => {
                                                                          const wardSelected = selectedLocations.has(ward.id);
                                                                          if (wardSelected) return true;
                                                                          if (ward.local_addresses && ward.local_addresses.length > 0) {
                                                                            const addressIds = ward.local_addresses.map((_, idx) => `${ward.id}-${idx}`);
                                                                            return addressIds.length > 0 && addressIds.every(id => selectedLocations.has(id));
                                                                          }
                                                                          return false;
                                                                        })()}
                                                                        onChange={(e) => {
                                                                          e.stopPropagation();
                                                                          const allIds = [ward.id];
                                                                          if (ward.local_addresses) {
                                                                            ward.local_addresses.forEach((_, idx) => {
                                                                              allIds.push(`${ward.id}-${idx}`);
                                                                            });
                                                                          }
                                                                          const allSelected = allIds.every(id => selectedLocations.has(id));
                                                                          setSelectedLocations(prev => {
                                                                            const newSet = new Set(prev);
                                                                            allIds.forEach(id => {
                                                                              if (allSelected) {
                                                                                newSet.delete(id);
                                                                              } else {
                                                                                newSet.add(id);
                                                                              }
                                                                            });
                                                                            return newSet;
                                                                          });
                                                                        }}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="w-4 h-4"
                                                                      />
                                                                      <span className="text-sm text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] cursor-pointer">
                                                                        Ward {ward.ward_number}
                                                                      </span>
                                                                    </button>
                                                                  ) : (
                                                                    <label className="flex items-center space-x-2 flex-1 cursor-pointer">
                                                                      <input
                                                                        type="checkbox"
                                                                        checked={selectedLocations.has(ward.id)}
                                                                        onChange={(e) => {
                                                                          e.stopPropagation();
                                                                          handleLocationToggle(ward.id);
                                                                        }}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="w-4 h-4"
                                                                      />
                                                                      <span className="text-sm text-[hsl(var(--foreground))]">
                                                                        Ward {ward.ward_number}
                                                                      </span>
                                                                    </label>
                                                                  )}
                                                                </div>
                                                                <span className="text-xs text-[hsl(var(--muted-foreground))] ml-2">
                                                                  ({wardAdCount})
                                                                </span>
                                                              </div>
                                                              
                                                              {hasAddresses && isWardExpanded && (
                                                                <div className="ml-5 pl-2 border-l-2 border-[hsl(var(--border))] space-y-1 mt-1">
                                                                  {ward.local_addresses.map((address, idx) => {
                                                                    const addressId = `${ward.id}-${idx}`;
                                                                    const addressAdCount = getLocationAdCount(addressId);
                                                                    return (
                                                                      <div key={addressId} className="flex items-center justify-between">
                                                                        <label className="flex items-center space-x-2 cursor-pointer flex-1">
                                                                          <input
                                                                            type="checkbox"
                                                                            checked={selectedLocations.has(addressId)}
                                                                            onChange={(e) => {
                                                                              e.stopPropagation();
                                                                              handleLocationToggle(addressId);
                                                                            }}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="w-4 h-4"
                                                                          />
                                                                          <span className="text-xs text-[hsl(var(--muted-foreground))]">{address}</span>
                                                                        </label>
                                                                        <span className="text-xs text-[hsl(var(--muted-foreground))] ml-2">
                                                                          ({addressAdCount})
                                                                        </span>
                                                                      </div>
                                                                    );
                                                                  })}
                                                                </div>
                                                              )}
                                                            </div>
                                                          );
                                                        })}
                                                      </div>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <Button className="min-w-[100px]" onClick={handleSearch}>Search</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Results Summary and Toggle Buttons */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Showing {startResult}-{endResult} of {filteredAndSortedAds.length} results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleOverview}
              className={`px-4 py-2 rounded-md transition-colors ${
                showOverview
                  ? 'bg-[hsl(var(--primary))] text-white'
                  : 'bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]/80'
              }`}
            >
              Quick Overview
            </button>
            <button
              onClick={handleToggleRecentlyViewed}
              className={`px-4 py-2 rounded-md transition-colors ${
                showRecentlyViewed
                  ? 'bg-[hsl(var(--primary))] text-white'
                  : 'bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]/80'
              }`}
            >
              Recently Viewed
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[hsl(var(--foreground))]">Sorting option:</label>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
          >
            <option value="most relevant">most relevant</option>
            <option value="lowest price">lowest price</option>
            <option value="highest price">highest price</option>
            <option value="ascending order">ascending order</option>
            <option value="descending order">descending order</option>
            <option value="latest listing">latest listing</option>
            <option value="top review">top review</option>
          </select>
        </div>
      </div>

      {/* Overview Section (Hidden by default) */}
      {showOverview && (
        <div ref={overviewRef} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Quick Actions</h3>
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
              </div>

              {/* Account Information */}
              <div>
                <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Account Information</h3>
                <div className="space-y-2">
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
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recently Viewed Section (Hidden by default) */}
      {showRecentlyViewed && (
        <div ref={recentlyViewedRef} className="space-y-4">
          <RecentlyViewedWidget />
        </div>
      )}

      {/* Ads Section (Always Visible) */}
      <div className="space-y-4">
        {adsLoading ? (
          <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
            Loading ads...
          </div>
        ) : displayedAds.length === 0 ? (
          <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">
            <p>No ads found matching your search criteria.</p>
          </div>
        ) : (
          <>
            {/* Display ads in grid (4 per row) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {displayedAds.map((ad) => (
                <Card 
                  key={ad.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleAdClick(ad)}
                >
                  <CardContent className="p-0">
                    <img
                      src={ad.image}
                      alt={ad.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-3">
                      <h3 className="font-semibold text-sm text-[hsl(var(--foreground))] mb-1 line-clamp-2">
                        {ad.title}
                      </h3>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2 line-clamp-2">
                        {ad.description}
                      </p>
                      <p className="text-lg font-bold text-[hsl(var(--primary))] mb-2">
                        Rs. {ad.price.toLocaleString()}
                      </p>
                      {ad.user_id && (
                        <Link
                          to={`/profile/${ad.user_id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-[hsl(var(--primary))] hover:underline"
                        >
                          View Seller Profile →
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 2 && page <= currentPage + 2)
                    ) {
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          onClick={() => handlePageChange(page)}
                          className="min-w-[40px]"
                        >
                          {page}
                        </Button>
                      );
                    } else if (
                      page === currentPage - 3 ||
                      page === currentPage + 3
                    ) {
                      return <span key={page} className="px-2">...</span>;
                    }
                    return null;
                  })}
                </div>

                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
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
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [locationData, setLocationData] = useState({ provinces: [] });
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState(new Set());
  const [expandedProvinces, setExpandedProvinces] = useState(new Set());
  const [expandedDistricts, setExpandedDistricts] = useState(new Set());
  const [expandedLocalLevels, setExpandedLocalLevels] = useState(new Set());
  const locationDropdownRef = useRef(null);
  
  // Crop modal state for profile picture
  const [cropImageIndex, setCropImageIndex] = useState(null);
  const [cropImageFile, setCropImageFile] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dob: '',
    phone: '',
    show_phone: true,
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

  const handleCropComplete = async (croppedFile) => {
    if (cropImageIndex === null) return;
    
    // Verify the cropped image is 400x400
    const img = new Image();
    const objectUrl = URL.createObjectURL(croppedFile);
    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      if (img.width !== 400 || img.height !== 400) {
        alert('Image must be exactly 400x400 pixels. Please crop again.');
        return;
      }
      
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
      
      // Handle profile picture
      if (cropImageIndex === 'profile') {
        setFormData(prev => ({ ...prev, profile_picture: processedFile }));
      }
      
      // Close crop modal
      setCropImageIndex(null);
      setCropImageFile(null);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      alert('Error processing image. Please try again.');
    };
    img.src = objectUrl;
  };

  const handleCropCancel = () => {
    setCropImageIndex(null);
    setCropImageFile(null);
  };

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
        show_phone: userData.show_phone !== undefined ? userData.show_phone : true,
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
      
      // Validate file size (max 10MB before crop)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        setTimeout(() => setError(null), 5000);
        return;
      }
      
      // Open crop modal for profile picture
      setCropImageIndex('profile');
      setCropImageFile(file);
      // Clear the input to allow re-selecting the same file
      e.target.value = '';
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
      formDataToSend.append('show_phone', formData.show_phone ? '1' : '0');
      
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
      setIsEditingProfile(false); // Exit edit mode after successful save
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
    <div className="space-y-8">
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

      {/* Profile View / Edit Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Profile Information</CardTitle>
            {!isEditingProfile && (
              <Button onClick={() => setIsEditingProfile(true)} variant="outline">
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!isEditingProfile ? (
            /* View Mode - Display Profile Information */
            <div className="space-y-6">
              {/* Profile Picture and Name */}
              <div className="flex items-center gap-6">
                <div>
                  {profileData?.profile_picture ? (
                    <img
                      src={profileData.profile_picture}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-2 border-[hsl(var(--border))]"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-5xl">
                      {profileData?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">{profileData?.name || 'User'}</h2>
                  {profileData?.id && (
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">ID: {profileData.id}</p>
                  )}
                </div>
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[hsl(var(--border))]">
                <div>
                  <span className="text-sm text-[hsl(var(--muted-foreground))] font-medium">Email:</span>
                  <p className="text-[hsl(var(--foreground))] mt-1">{profileData?.email || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-[hsl(var(--muted-foreground))] font-medium">Phone Number:</span>
                  <p className="text-[hsl(var(--foreground))] mt-1">{profileData?.phone || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-[hsl(var(--muted-foreground))] font-medium">Date of Birth:</span>
                  <p className="text-[hsl(var(--foreground))] mt-1">
                    {profileData?.dob ? new Date(profileData.dob).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-[hsl(var(--muted-foreground))] font-medium">Address:</span>
                  <p className="text-[hsl(var(--foreground))] mt-1">
                    {buildLocationString() !== 'Select location' ? buildLocationString() : 'Not set'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Edit Mode - Show Form */
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

              {/* Show Phone Number Option */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="show_phone"
                  name="show_phone"
                  checked={formData.show_phone}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, show_phone: e.target.checked }));
                  }}
                  className="w-4 h-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                />
                <Label htmlFor="show_phone" className="text-sm font-normal cursor-pointer">
                  Show phone number to other users
                </Label>
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

              <div className="flex gap-3">
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditingProfile(false);
                    // Reset form data to original profile data
                    setFormData({
                      name: profileData?.name || '',
                      email: profileData?.email || '',
                      dob: profileData?.dob ? profileData.dob.split('T')[0] : '',
                      phone: profileData?.phone || '',
                      show_phone: profileData?.show_phone !== undefined ? profileData.show_phone : true,
                      profile_picture: null,
                    });
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
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
        <CardContent className="space-y-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="flex justify-between items-center py-3 px-4 bg-[hsl(var(--muted))]/30 rounded-lg">
              <span className="text-[hsl(var(--muted-foreground))] font-medium">Member Since:</span>
              <span className="text-[hsl(var(--foreground))] font-semibold text-lg">
                {profileData?.member_since || (profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A')}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 px-4 bg-[hsl(var(--muted))]/30 rounded-lg">
              <span className="text-[hsl(var(--muted-foreground))] font-medium">Last Login:</span>
              <span className="text-[hsl(var(--foreground))] font-semibold text-lg">
                {profileData?.last_login_formatted || (profileData?.last_login_at ? formatLastLogin(profileData.last_login_at) : 'Never')}
              </span>
            </div>
            {profileData?.response_rate !== null && profileData.response_rate !== undefined && (
              <div className="flex justify-between items-center py-3 px-4 bg-[hsl(var(--muted))]/30 rounded-lg">
                <span className="text-[hsl(var(--muted-foreground))] font-medium">Response Rate:</span>
                <span className="text-[hsl(var(--foreground))] font-semibold text-lg">
                  {profileData.response_rate}%
                </span>
              </div>
            )}
            {profileData?.total_sold !== undefined && (
              <div className="flex justify-between items-center py-3 px-4 bg-[hsl(var(--muted))]/30 rounded-lg">
                <span className="text-[hsl(var(--muted-foreground))] font-medium">Total Sold Items:</span>
                <span className="text-[hsl(var(--foreground))] font-semibold text-lg">
                  {profileData.total_sold || 0}
                </span>
              </div>
            )}
          </div>
          
          {/* Profile Rating */}
          {profileData?.profile_rating && (
            <div className="border-t border-[hsl(var(--border))] pt-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[hsl(var(--muted-foreground))] font-medium text-base">Profile Rating:</span>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-2xl ${
                          star <= Math.round(profileData.profile_rating.average || 0)
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-xl font-bold text-[hsl(var(--foreground))]">
                    {profileData.profile_rating.average?.toFixed(1) || '0.0'}/5
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-base text-[hsl(var(--muted-foreground))]">
                  {profileData.profile_rating.total || 0} review{(profileData.profile_rating.total || 0) !== 1 ? 's' : ''}
                </span>
                <span className="text-base font-semibold text-[hsl(var(--foreground))]">
                  {profileData.profile_rating.percentage?.toFixed(1) || '0.0'}%
                </span>
              </div>
            </div>
          )}
          {(!profileData?.profile_rating || profileData.profile_rating.total === 0) && (
            <div className="border-t border-[hsl(var(--border))] pt-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[hsl(var(--muted-foreground))] font-medium text-base">Profile Rating:</span>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className="text-2xl text-gray-300">★</span>
                    ))}
                  </div>
                  <span className="text-xl font-bold text-[hsl(var(--muted-foreground))]">No ratings yet</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-base text-[hsl(var(--muted-foreground))]">0 reviews</span>
                <span className="text-base font-semibold text-[hsl(var(--muted-foreground))]">0%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Crop Modal for Profile Picture */}
      {cropImageFile && (
        <PhotoCropModal
          imageFile={cropImageFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
          minWidth={400}
          minHeight={400}
          fixedSize={{ width: 400, height: 400 }}
        />
      )}
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
  const [selectedItemCategoryId, setSelectedItemCategoryId] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState(new Set());
  const categoryDropdownRef = useRef(null);
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
    
    // Handle click outside dropdowns
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
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
      const categoriesData = response.data || [];
      
      // Transform 3-level structure (domain > field > item) to 2-level structure (category > subcategory)
      const categoriesWithSubcategories = [];
      
      if (Array.isArray(categoriesData)) {
        categoriesData.forEach((domainCategory) => {
          const mainCategory = {
            id: domainCategory.id,
            name: domainCategory.domain_category || domainCategory.name,
            subcategories: []
          };
          
          if (domainCategory.field_categories && Array.isArray(domainCategory.field_categories)) {
            domainCategory.field_categories.forEach((fieldCategory) => {
              mainCategory.subcategories.push({
                id: fieldCategory.id,
                name: fieldCategory.field_category || fieldCategory.name,
                item_categories: fieldCategory.item_categories || []
              });
            });
          }
          
          if (domainCategory.item_categories && Array.isArray(domainCategory.item_categories) && domainCategory.item_categories.length > 0) {
            if (mainCategory.subcategories.length === 0) {
              mainCategory.subcategories.push({
                id: domainCategory.item_categories[0].id,
                name: domainCategory.domain_category || domainCategory.name,
                item_categories: domainCategory.item_categories
              });
            }
          }
          
          if (mainCategory.subcategories.length > 0 || domainCategory.item_categories?.length > 0) {
            categoriesWithSubcategories.push(mainCategory);
          }
        });
      }
      
      setCategories(categoriesWithSubcategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
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
    
    // Verify the cropped image is 400x400
    const img = new Image();
    const objectUrl = URL.createObjectURL(croppedFile);
    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      if (img.width !== 400 || img.height !== 400) {
        alert('Image must be exactly 400x400 pixels. Please crop again.');
        return;
      }
      
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
      
      // Handle profile picture and eBook cover separately
      if (cropImageIndex === 'profile') {
        setFormData({ ...formData, profile_picture: processedFile });
      } else if (cropImageIndex === 'ebook-cover') {
        setEbookCoverImage(processedFile);
      } else {
        // Handle ad images (cropImageIndex is a number)
        const newImages = [...images];
        newImages[cropImageIndex] = processedFile;
        setImages(newImages);
      }
      
      // Close crop modal
      setCropImageIndex(null);
      setCropImageFile(null);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      alert('Error processing image. Please try again.');
    };
    img.src = objectUrl;
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

  const toggleCategory = (categoryName) => {
    const trimmedName = (categoryName || '').trim();
    if (!trimmedName) return;
    
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trimmedName)) {
        newSet.delete(trimmedName);
      } else {
        newSet.add(trimmedName);
      }
      return newSet;
    });
  };

  const toggleSubcategory = (subcategoryName) => {
    const trimmedName = (subcategoryName || '').trim();
    if (!trimmedName) return;
    
    setExpandedSubcategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trimmedName)) {
        newSet.delete(trimmedName);
      } else {
        newSet.add(trimmedName);
      }
      return newSet;
    });
  };

  const handleCategorySelect = (categoryId, categoryName, hasSubcategories = false) => {
    const trimmedCategoryName = (categoryName || '').trim();
    
    setSelectedCategoryName(trimmedCategoryName);
    setSelectedSubcategoryId('');
    setSelectedItemCategoryId('');
    setFormData(prev => ({...prev, category_id: categoryId.toString()}));
    
    if (!hasSubcategories) {
      setShowCategoryDropdown(false);
    }
  };

  const handleSubcategorySelect = (subcategoryId, subcategoryName, hasItemCategories = false) => {
    const category = getSelectedCategory();
    if (category) {
      setSelectedSubcategoryId(subcategoryId.toString());
      setSelectedItemCategoryId('');
      setFormData(prev => ({...prev, category_id: subcategoryId.toString()}));
      
      if (!hasItemCategories) {
        setShowCategoryDropdown(false);
      }
    }
  };

  const handleItemCategorySelect = (itemCategoryId, categoryName, subcategoryId) => {
    const itemIdStr = itemCategoryId.toString();
    if (categoryName) setSelectedCategoryName(categoryName);
    if (subcategoryId) setSelectedSubcategoryId(subcategoryId.toString());
    setSelectedItemCategoryId(itemIdStr);
    setFormData(prev => ({...prev, category_id: itemIdStr}));
    setShowCategoryDropdown(false);
  };

  const buildCategoryString = () => {
    if (selectedItemCategoryId) {
      const category = getSelectedCategory();
      if (category && selectedSubcategoryId) {
        const subcategory = category.subcategories?.find(s => s.id === parseInt(selectedSubcategoryId));
        if (subcategory && subcategory.item_categories) {
          const itemCategory = subcategory.item_categories.find(item => item.id === parseInt(selectedItemCategoryId));
          if (itemCategory) {
            const itemName = itemCategory.item_category || itemCategory.name;
            return `${category.name} > ${subcategory.name} > ${itemName}`;
          }
        }
      }
    }
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
    const selectedId = Array.from(selectedLocations)[0];
    
    // Check if it's a local address (format: wardId-index)
    let wardId = null;
    let addressIndex = null;
    if (typeof selectedId === 'string' && selectedId.includes('-')) {
      const parts = selectedId.split('-');
      wardId = parseInt(parts[0]);
      addressIndex = parseInt(parts[parts.length - 1]); // Last part is the index
    } else {
      wardId = typeof selectedId === 'number' ? selectedId : parseInt(selectedId);
    }
    
    // Find location in hierarchy
    for (const province of locationData.provinces || []) {
      for (const district of province.districts || []) {
        for (const localLevel of district.localLevels || []) {
          for (const ward of localLevel.wards || []) {
            if (ward.id === wardId) {
              let path = `${province.name} > ${district.name} > ${localLevel.name}`;
              if (ward.ward_number) {
                path += ` > Ward ${ward.ward_number}`;
              }
              // If a specific local address is selected, add it to the path
              if (addressIndex !== null && ward.local_addresses && ward.local_addresses[addressIndex]) {
                path += ` > ${ward.local_addresses[addressIndex]}`;
              }
              return path;
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
      setSelectedItemCategoryId('');
      setExpandedCategories(new Set());
      setExpandedSubcategories(new Set());
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
              <Label htmlFor="title">Title * (Max 90 characters)</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 90) {
                    setFormData({ ...formData, title: value });
                  }
                }}
                placeholder="Enter ad title"
                maxLength={90}
                required
              />
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                {formData.title.length}/90 characters
              </p>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description * (Max 300 words)</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  const value = e.target.value;
                  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
                  if (wordCount <= 300) {
                    setFormData({ ...formData, description: value });
                  }
                }}
                placeholder="Describe your item in detail"
                className="w-full min-h-[120px] px-3 py-2 border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
                required
              />
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                {formData.description.trim() ? formData.description.trim().split(/\s+/).length : 0}/300 words
              </p>
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
            <div className="relative" ref={categoryDropdownRef}>
              <Label>Category *</Label>
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full text-left px-3 py-2 border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
              >
                {buildCategoryString() || 'Select Category'}
              </button>
              {showCategoryDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-md shadow-lg max-h-96 overflow-y-auto">
                  {categories.map((category) => {
                    const hasSubcategories = category.subcategories && category.subcategories.length > 0;
                    const isExpanded = expandedCategories.has(category.name);
                    
                    return (
                    <div key={category.id}>
                        <div className="flex items-center">
                      <button
                        type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCategory(category.name);
                            }}
                            className="px-2 py-1 text-xs"
                          >
                            {hasSubcategories ? (isExpanded ? '▼' : '▶') : ''}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCategorySelect(category.id, category.name, hasSubcategories)}
                            className={`flex-1 text-left px-2 py-2 hover:bg-[hsl(var(--accent))] ${
                              selectedCategoryName === category.name && !selectedSubcategoryId && !selectedItemCategoryId 
                                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : ''
                        }`}
                      >
                        {category.name}
                      </button>
                        </div>
                        {isExpanded && hasSubcategories && (
                          <div className="pl-6">
                            {category.subcategories.map((subcategory) => {
                              const hasItemCategories = subcategory.item_categories && subcategory.item_categories.length > 0;
                              const subcategoryKey = `${category.name}-${subcategory.name}`;
                              const isSubExpanded = expandedSubcategories.has(subcategoryKey);
                              
                              return (
                                <div key={subcategory.id}>
                                  <div className="flex items-center">
                            <button
                              type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleSubcategory(subcategoryKey);
                                      }}
                                      className="px-2 py-1 text-xs"
                                    >
                                      {hasItemCategories ? (isSubExpanded ? '▼' : '▶') : ''}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSubcategorySelect(subcategory.id, subcategory.name, hasItemCategories)}
                                      className={`flex-1 text-left px-2 py-2 hover:bg-[hsl(var(--accent))] ${
                                        selectedSubcategoryId === subcategory.id.toString() && !selectedItemCategoryId 
                                          ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : ''
                                      }`}
                                    >
                                      {subcategory.name}
                                    </button>
                                  </div>
                                  {isSubExpanded && hasItemCategories && (
                                    <div className="pl-6">
                                      {subcategory.item_categories.map((itemCategory) => (
                                        <button
                                          key={itemCategory.id}
                                          type="button"
                                          onClick={() => handleItemCategorySelect(itemCategory.id, category.name, subcategory.id)}
                                          className={`w-full text-left px-2 py-2 hover:bg-[hsl(var(--accent))] ${
                                            selectedItemCategoryId === itemCategory.id.toString() 
                                              ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : ''
                                          }`}
                                        >
                                          {itemCategory.item_category || itemCategory.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
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

      {/* Photo Crop Modal - for ad images, profile picture, and eBook cover */}
      {cropImageFile && (
        <PhotoCropModal
          imageFile={cropImageFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
          minWidth={400}
          minHeight={400}
          fixedSize={{ width: 400, height: 400 }}
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
    location_path: '', // Store the full location path for display
    min_price: '',
    max_price: '',
    is_active: true,
  });
  const [categories, setCategories] = useState([]);
  const [locationData, setLocationData] = useState(null);
  
  // Category selection state
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
  const [selectedItemCategoryId, setSelectedItemCategoryId] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState(new Set());
  const categoryDropdownRef = useRef(null);
  
  // Location selection state
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [expandedProvinces, setExpandedProvinces] = useState(new Set());
  const [expandedDistricts, setExpandedDistricts] = useState(new Set());
  const [expandedLocalLevels, setExpandedLocalLevels] = useState(new Set());
  const locationDropdownRef = useRef(null);

  useEffect(() => {
    fetchSavedSearches();
    fetchCategories();
    fetchLocations();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      const categoriesData = response.data || [];
      
      // Transform 3-level structure (domain > field > item) to 2-level structure (category > subcategory)
      const categoriesWithSubcategories = [];
      
      if (Array.isArray(categoriesData)) {
        categoriesData.forEach((domainCategory) => {
          const mainCategory = {
            id: domainCategory.id,
            name: domainCategory.domain_category || domainCategory.name,
            subcategories: []
          };
          
          if (domainCategory.field_categories && Array.isArray(domainCategory.field_categories)) {
            domainCategory.field_categories.forEach((fieldCategory) => {
              mainCategory.subcategories.push({
                id: fieldCategory.id,
                name: fieldCategory.field_category || fieldCategory.name,
                item_categories: fieldCategory.item_categories || []
              });
            });
          }
          
          if (domainCategory.item_categories && Array.isArray(domainCategory.item_categories) && domainCategory.item_categories.length > 0) {
            if (mainCategory.subcategories.length === 0) {
              mainCategory.subcategories.push({
                id: domainCategory.item_categories[0].id,
                name: domainCategory.domain_category || domainCategory.name,
                item_categories: domainCategory.item_categories
              });
            }
          }
          
          if (mainCategory.subcategories.length > 0 || domainCategory.item_categories?.length > 0) {
            categoriesWithSubcategories.push(mainCategory);
          }
        });
      }
      
      setCategories(categoriesWithSubcategories);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setCategories([]);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await axios.get('/api/locations');
      // Keep the hierarchical structure for the dropdown
      setLocationData(response.data || { provinces: [] });
    } catch (err) {
      console.error('Failed to fetch locations:', err);
      setLocationData({ provinces: [] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare data with proper types and null values
      const minPrice = formData.min_price && formData.min_price !== '' ? parseFloat(formData.min_price) : null;
      const maxPrice = formData.max_price && formData.max_price !== '' ? parseFloat(formData.max_price) : null;
      
      const submitData = {
        name: formData.name,
        search_query: formData.search_query || null,
        category_id: formData.category_id && formData.category_id !== '' ? parseInt(formData.category_id) : null,
        location_id: formData.location_id && formData.location_id !== '' ? parseInt(formData.location_id) : null,
        min_price: minPrice,
        max_price: maxPrice,
        is_active: formData.is_active === true || formData.is_active === 'true',
      };
      
      // Ensure max_price validation: if both are set, max must be >= min
      if (minPrice !== null && maxPrice !== null && maxPrice < minPrice) {
        alert('Max price must be greater than or equal to min price');
        return;
      }
      
      await savedSearchAPI.createSearch(submitData);
      setShowSearchForm(false);
      setFormData({
        name: '',
        search_query: '',
        category_id: '',
        location_id: '',
        location_path: '',
        min_price: '',
        max_price: '',
        is_active: true,
      });
      setSelectedCategoryName('');
      setSelectedSubcategoryId('');
      setSelectedItemCategoryId('');
      setExpandedCategories(new Set());
      setExpandedSubcategories(new Set());
      fetchSavedSearches();
    } catch (err) {
      console.error('Failed to save search:', err);
      if (err.response?.data?.errors) {
        console.error('Validation errors:', err.response.data.errors);
      }
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

  // Category selection helper functions (similar to MyAuctionsSection)
  const getSelectedCategory = () => {
    if (!selectedCategoryName) return null;
    return categories.find(c => c.name === selectedCategoryName);
  };

  const toggleCategory = (categoryName) => {
    const trimmedName = (categoryName || '').trim();
    if (!trimmedName) return;
    
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trimmedName)) {
        newSet.delete(trimmedName);
      } else {
        newSet.add(trimmedName);
      }
      return newSet;
    });
  };

  const toggleSubcategory = (subcategoryName) => {
    const trimmedName = (subcategoryName || '').trim();
    if (!trimmedName) return;
    
    setExpandedSubcategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trimmedName)) {
        newSet.delete(trimmedName);
    } else {
        newSet.add(trimmedName);
      }
      return newSet;
    });
  };

  const handleCategorySelect = (categoryId, categoryName, hasSubcategories = false) => {
    const trimmedCategoryName = (categoryName || '').trim();
    
    setSelectedCategoryName(trimmedCategoryName);
    setSelectedSubcategoryId('');
    setSelectedItemCategoryId('');
    setFormData(prev => ({...prev, category_id: categoryId.toString()}));
    
    if (!hasSubcategories) {
    setShowCategoryDropdown(false);
    }
  };

  const handleSubcategorySelect = (subcategoryId, subcategoryName, hasItemCategories = false) => {
    const category = getSelectedCategory();
    if (category) {
      setSelectedSubcategoryId(subcategoryId.toString());
      setSelectedItemCategoryId('');
      setFormData(prev => ({...prev, category_id: subcategoryId.toString()}));
      
      if (!hasItemCategories) {
        setShowCategoryDropdown(false);
      }
    }
  };

  const handleItemCategorySelect = (itemCategoryId, categoryName, subcategoryId) => {
    const itemIdStr = itemCategoryId.toString();
    if (categoryName) setSelectedCategoryName(categoryName);
    if (subcategoryId) setSelectedSubcategoryId(subcategoryId.toString());
    setSelectedItemCategoryId(itemIdStr);
    setFormData(prev => ({...prev, category_id: itemIdStr}));
    setShowCategoryDropdown(false);
  };

  const buildCategoryString = () => {
    if (selectedItemCategoryId) {
      const category = getSelectedCategory();
      if (category && selectedSubcategoryId) {
        const subcategory = category.subcategories?.find(s => s.id === parseInt(selectedSubcategoryId));
        if (subcategory && subcategory.item_categories) {
          const itemCategory = subcategory.item_categories.find(item => item.id === parseInt(selectedItemCategoryId));
          if (itemCategory) {
            const itemName = itemCategory.item_category || itemCategory.name;
            return `${category.name} > ${subcategory.name} > ${itemName}`;
          }
        }
      }
    }
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
    if (formData.category_id) {
      return 'All Categories';
    }
    return 'All Categories';
  };

  // Location helper functions
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

  const handleLocationSelect = (locationId, locationType = 'ward', locationPath = '') => {
    setFormData({ 
      ...formData, 
      location_id: locationId ? locationId.toString() : '',
      location_path: locationPath || ''
    });
    setShowLocationDropdown(false);
  };

  // Helper to find first ward ID under a location hierarchy
  const findFirstWardId = (province, district = null, localLevel = null) => {
    if (localLevel && localLevel.wards && localLevel.wards.length > 0) {
      return localLevel.wards[0].id;
    }
    if (district) {
      for (const ll of district.localLevels || []) {
        if (ll.wards && ll.wards.length > 0) {
          return ll.wards[0].id;
        }
      }
    }
    if (province) {
      for (const dist of province.districts || []) {
        for (const ll of dist.localLevels || []) {
          if (ll.wards && ll.wards.length > 0) {
            return ll.wards[0].id;
          }
        }
      }
    }
    return null;
  };

  const buildLocationString = () => {
    if (!formData.location_id || !locationData?.provinces) return 'All Locations';
    
    // Use stored location path if available
    if (formData.location_path) {
      return formData.location_path;
    }
    
    // Fallback: find location by ID
    const locationId = parseInt(formData.location_id);
    
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
    return 'All Locations';
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
                  <Label>Category</Label>
                  <div className="relative mt-1" ref={categoryDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      className="w-full px-3 py-2 text-left border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] flex items-center justify-between"
                    >
                      <span>{buildCategoryString()}</span>
                      <span>{showCategoryDropdown ? '▼' : '▶'}</span>
                    </button>
                    {showCategoryDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-md shadow-lg z-50 w-[325px] max-h-[500px] overflow-y-auto">
                        <div className="p-3">
                          <div className="space-y-1">
                          <button
                            type="button"
                              onClick={() => {
                                setFormData(prev => ({...prev, category_id: ''}));
                                setSelectedCategoryName('');
                                setSelectedSubcategoryId('');
                                setSelectedItemCategoryId('');
                                setShowCategoryDropdown(false);
                              }}
                            className="w-full text-left px-3 py-2 hover:bg-[hsl(var(--accent))] rounded text-sm"
                          >
                            All Categories
                          </button>
                            {categories.map((category) => {
                              const subcategories = category.subcategories || [];
                              const hasSubcategories = subcategories.length > 0;
                              const categoryName = (category.name || '').trim();
                              const isCategoryExpanded = categoryName ? expandedCategories.has(categoryName) : false;
                              const isCategorySelected = selectedCategoryName === categoryName && !selectedSubcategoryId && !selectedItemCategoryId;
                              
                              return (
                                <div key={category.id} className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 flex-1">
                                      {hasSubcategories ? (
                                        <div className="flex items-center space-x-2 flex-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                              toggleCategory(categoryName);
                                  }}
                                            className="text-xs text-[hsl(var(--muted-foreground))] px-1"
                                >
                                            {isCategoryExpanded ? '▼' : '▶'}
                                </button>
                                          <div className="flex items-center space-x-2 flex-1">
                                <button
                                  type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if (hasSubcategories && !isCategoryExpanded) {
                                                  toggleCategory(categoryName);
                                                }
                                                handleCategorySelect(category.id, categoryName, hasSubcategories);
                                              }}
                                              className={`flex-1 text-left text-sm ${
                                                isCategorySelected
                                                  ? 'text-[hsl(var(--primary))] font-medium'
                                                  : 'text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]'
                                  }`}
                                >
                                  {category.name}
                                </button>
                                            {isCategorySelected && (
                                              <span className="text-xs text-[hsl(var(--primary))]">✓</span>
                                            )}
                              </div>
                                        </div>
                                      ) : (
                                    <button
                                      type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCategorySelect(category.id, categoryName, false);
                                          }}
                                          className={`flex-1 text-left text-sm ${
                                            isCategorySelected
                                              ? 'text-[hsl(var(--primary))] font-medium'
                                              : 'text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]'
                                          }`}
                                        >
                                          {category.name}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {hasSubcategories && isCategoryExpanded && (
                                    <div className="ml-5 pl-2 border-l-2 border-[hsl(var(--border))] space-y-1 mt-1">
                                      {subcategories.map((subcategory) => {
                                        const itemCategories = subcategory.item_categories || [];
                                        const hasItemCategories = itemCategories.length > 0;
                                        const subcategoryName = (subcategory.name || '').trim();
                                        const isSubcategoryExpanded = subcategoryName ? expandedSubcategories.has(subcategoryName) : false;
                                        const subcategoryIdStr = subcategory.id.toString();
                                        const isSubcategorySelected = selectedSubcategoryId === subcategoryIdStr && !selectedItemCategoryId;
                                        
                                        return (
                                          <div key={subcategory.id} className="space-y-1">
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center space-x-2 flex-1">
                                                {hasItemCategories ? (
                                                  <div className="flex items-center space-x-2 flex-1">
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleSubcategory(subcategoryName);
                                                      }}
                                                      className="text-xs text-[hsl(var(--muted-foreground))] px-1"
                                                    >
                                                      {isSubcategoryExpanded ? '▼' : '▶'}
                                                    </button>
                                                    <div className="flex items-center space-x-2 flex-1">
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          if (hasItemCategories && !isSubcategoryExpanded) {
                                                            toggleSubcategory(subcategoryName);
                                                          }
                                                          handleSubcategorySelect(subcategory.id, subcategoryName, hasItemCategories);
                                                        }}
                                                        className={`flex-1 text-left text-sm ${
                                                          isSubcategorySelected
                                                            ? 'text-[hsl(var(--primary))] font-medium'
                                                            : 'text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]'
                                      }`}
                                    >
                                      {subcategory.name}
                                    </button>
                                                      {isSubcategorySelected && (
                                                        <span className="text-xs text-[hsl(var(--primary))]">✓</span>
                                                      )}
                                </div>
                                                  </div>
                                                ) : (
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleSubcategorySelect(subcategory.id, subcategoryName, false);
                                                    }}
                                                    className={`flex-1 text-left text-sm ${
                                                      isSubcategorySelected
                                                        ? 'text-[hsl(var(--primary))] font-medium'
                                                        : 'text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]'
                                                    }`}
                                                  >
                                                    {subcategory.name}
                                                  </button>
                              )}
                            </div>
                        </div>
                                            
                                            {hasItemCategories && isSubcategoryExpanded && (
                                              <div className="ml-5 pl-2 border-l-2 border-[hsl(var(--border))] space-y-1 mt-1">
                                                {itemCategories.map((itemCategory) => {
                                                  const itemCategoryIdStr = itemCategory.id.toString();
                                                  const isItemCategorySelected = selectedItemCategoryId === itemCategoryIdStr;
                                                  const itemName = itemCategory.item_category || itemCategory.name;
                                                  
                                                  return (
                                                    <div key={itemCategory.id} className="flex items-center space-x-2">
                                                      <button
                                                        type="button"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleItemCategorySelect(itemCategory.id, categoryName, subcategory.id);
                                                        }}
                                                        className={`flex-1 text-left text-sm px-2 py-1 rounded ${
                                                          isItemCategorySelected
                                                            ? 'text-[hsl(var(--primary))] font-medium bg-[hsl(var(--primary))]/10'
                                                            : 'text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--accent))]'
                                                        }`}
                                                      >
                                                        {itemName}
                                                      </button>
                                                      {isItemCategorySelected && (
                                                        <span className="text-xs text-[hsl(var(--primary))]">✓</span>
                                                      )}
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Location</Label>
                  <div className="relative mt-1" ref={locationDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                      className="w-full px-3 py-2 text-left border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] flex items-center justify-between"
                    >
                      <span>{buildLocationString()}</span>
                      <span>{showLocationDropdown ? '▼' : '▶'}</span>
                    </button>
                    {showLocationDropdown && locationData?.provinces && (
                      <div className="absolute top-full left-0 mt-1 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-md shadow-lg z-50 w-[500px] max-h-[400px] overflow-y-auto">
                        <div className="p-3">
                          <button
                            type="button"
                            onClick={() => handleLocationSelect('')}
                            className="w-full text-left px-3 py-2 hover:bg-[hsl(var(--accent))] rounded text-sm mb-2"
                          >
                            All Locations
                          </button>
                          {locationData.provinces.map((province) => (
                            <div key={province.id} className="mb-2">
                              <div className="flex items-center py-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleProvince(province.id);
                                  }}
                                  className="mr-2 text-xs w-4 text-center"
                                >
                                  {expandedProvinces.has(province.id) ? '▼' : '▶'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const firstWardId = findFirstWardId(province);
                                    if (firstWardId) {
                                      handleLocationSelect(firstWardId, 'province', province.name);
                                    }
                                  }}
                                  className={`flex-1 text-left px-2 py-1 hover:bg-[hsl(var(--accent))] rounded text-xs font-medium ${
                                    formData.location_id && findFirstWardId(province) === parseInt(formData.location_id) ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : ''
                                  }`}
                                >
                                  {province.name}
                                </button>
                              </div>
                              {expandedProvinces.has(province.id) && province.districts.map((district) => (
                                <div key={district.id} className="ml-4 mt-1">
                                  <div className="flex items-center py-1">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleDistrict(`${province.id}-${district.id}`);
                                      }}
                                      className="mr-2 text-xs w-4 text-center"
                                    >
                                      {expandedDistricts.has(`${province.id}-${district.id}`) ? '▼' : '▶'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const firstWardId = findFirstWardId(province, district);
                                        if (firstWardId) {
                                          handleLocationSelect(firstWardId, 'district', `${province.name} > ${district.name}`);
                                        }
                                      }}
                                      className={`flex-1 text-left px-2 py-1 hover:bg-[hsl(var(--accent))] rounded text-xs ${
                                        formData.location_id && findFirstWardId(province, district) === parseInt(formData.location_id) ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : ''
                                      }`}
                                    >
                                      {district.name}
                                    </button>
                                  </div>
                                  {expandedDistricts.has(`${province.id}-${district.id}`) && district.localLevels.map((localLevel) => (
                                    <div key={localLevel.id} className="ml-4 mt-1">
                                      <div className="flex items-center py-1">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleLocalLevel(`${province.id}-${district.id}-${localLevel.id}`);
                                          }}
                                          className="mr-2 text-xs w-4 text-center"
                                        >
                                          {expandedLocalLevels.has(`${province.id}-${district.id}-${localLevel.id}`) ? '▼' : '▶'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const firstWardId = findFirstWardId(province, district, localLevel);
                                            if (firstWardId) {
                                              handleLocationSelect(firstWardId, 'localLevel', `${province.name} > ${district.name} > ${localLevel.name}`);
                                            }
                                          }}
                                          className={`flex-1 text-left px-2 py-1 hover:bg-[hsl(var(--accent))] rounded text-xs ${
                                            formData.location_id && findFirstWardId(province, district, localLevel) === parseInt(formData.location_id) ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : ''
                                          }`}
                                        >
                                          {localLevel.name} ({localLevel.type === 'municipality' ? 'M' : 'RM'})
                                        </button>
                                      </div>
                                      {expandedLocalLevels.has(`${province.id}-${district.id}-${localLevel.id}`) && localLevel.wards && localLevel.wards.map((ward) => (
                                        <div key={ward.id} className="ml-4 mt-1">
                                          <button
                                            type="button"
                                            onClick={() => handleLocationSelect(ward.id, 'ward', `${province.name} > ${district.name} > ${localLevel.name} > Ward ${ward.ward_number}`)}
                                            className={`w-full text-left px-2 py-1 hover:bg-[hsl(var(--accent))] rounded text-xs ${
                                              formData.location_id === ward.id.toString() ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : ''
                                            }`}
                                          >
                                            Ward {ward.ward_number}
                                          </button>
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
                    )}
                  </div>
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
  const [availableBalance, setAvailableBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verificationMessage, setVerificationMessage] = useState(null);
  const [initiatingVerification, setInitiatingVerification] = useState(false);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [depositPaypalEmail, setDepositPaypalEmail] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [initiatingDeposit, setInitiatingDeposit] = useState(false);
  const [requestingWithdrawal, setRequestingWithdrawal] = useState(false);

  useEffect(() => {
    fetchWalletData();
    // Check URL query for wallet and seller verification messages
    const params = new URLSearchParams(window.location.search);
    
    // Wallet messages
    const walletStatus = params.get('wallet');
    const walletMessage = params.get('message');
    if (walletStatus === 'success') {
      setVerificationMessage({
        type: 'success',
        text: walletMessage || 'Wallet operation completed successfully.',
      });
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
    } else if (walletStatus === 'error') {
      setVerificationMessage({
        type: 'error',
        text: walletMessage || 'Wallet operation failed. Please try again.',
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (walletStatus === 'cancelled') {
      setVerificationMessage({
        type: 'info',
        text: walletMessage || 'Wallet operation was cancelled.',
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
    
    // Seller verification messages
    const verificationStatus = params.get('seller_verification');
    const message = params.get('message');
    if (verificationStatus === 'success') {
      setVerificationMessage({
        type: 'success',
        text: 'Seller verification payment completed successfully. Your account will now be treated as a verified seller.',
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (verificationStatus === 'error') {
      setVerificationMessage({
        type: 'error',
        text: message || 'Seller verification payment failed. Please try again.',
      });
      window.history.replaceState({}, '', window.location.pathname);
    } else if (verificationStatus === 'cancelled') {
      setVerificationMessage({
        type: 'info',
        text: 'Seller verification payment was cancelled.',
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch balance
      const balanceResponse = await walletAPI.getBalance();
      setBalance(balanceResponse.data.balance || 0);
      setAvailableBalance(balanceResponse.data.available_balance || 0);
      
      // Fetch transactions
      const transactionsResponse = await walletAPI.getTransactions();
      setTransactions(transactionsResponse.data.data || transactionsResponse.data || []);
    } catch (err) {
      setError('Failed to load wallet data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    
    if (!amount || amount < 1 || amount > 10000) {
      setVerificationMessage({
        type: 'error',
        text: 'Please enter an amount between $1 and $10,000',
      });
      return;
    }

    // Validate PayPal email
    if (!depositPaypalEmail || !/\S+@\S+\.\S+/.test(depositPaypalEmail)) {
      setVerificationMessage({
        type: 'error',
        text: 'Please enter a valid PayPal email address',
      });
      return;
    }

    try {
      setInitiatingDeposit(true);
      setVerificationMessage(null);
      const response = await walletAPI.initiateDeposit(amount, depositPaypalEmail);
      
      // Demo mode: Transaction completed immediately
      if (response.data.demo_mode) {
        setVerificationMessage({
          type: 'success',
          text: response.data.message || 'Deposit completed successfully (Demo Mode)',
        });
        setShowDepositForm(false);
        setDepositAmount('');
        setDepositPaypalEmail('');
        fetchWalletData(); // Refresh balance and transactions
        return;
      }
      
      // Production mode: Redirect to PayPal
      const approvalUrl = response.data.approval_url;
      if (approvalUrl) {
        window.location.href = approvalUrl;
      } else {
        setVerificationMessage({
          type: 'error',
          text: 'Failed to start deposit. Please try again.',
        });
      }
    } catch (err) {
      console.error('Error initiating deposit:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to start deposit. Please try again.';
      setVerificationMessage({ type: 'error', text: msg });
    } finally {
      setInitiatingDeposit(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    
    // Validate amount
    if (!amount || amount < 10) {
      setVerificationMessage({
        type: 'error',
        text: 'Please enter an amount of at least $10.00',
      });
      return;
    }

    // Validate PayPal email
    if (!paypalEmail || !paypalEmail.includes('@')) {
      setVerificationMessage({
        type: 'error',
        text: 'Please enter a valid PayPal email address',
      });
      return;
    }

    if (amount > availableBalance) {
      setVerificationMessage({
        type: 'error',
        text: `Insufficient balance. Available balance: $${availableBalance.toFixed(2)}`,
      });
      return;
    }

    try {
      setRequestingWithdrawal(true);
      setVerificationMessage(null);
      const response = await walletAPI.requestWithdrawal(amount, paypalEmail);
      
      // Handle demo mode or automatic processing
      if (response.data.demo_mode) {
        setVerificationMessage({
          type: 'success',
          text: response.data.message || 'Withdrawal processed successfully (Demo Mode). Funds have been sent to your PayPal account.',
        });
      } else if (response.data.status === 'completed') {
        setVerificationMessage({
          type: 'success',
          text: response.data.message || 'Withdrawal processed successfully. Funds have been sent to your PayPal account.',
        });
      } else if (response.data.status === 'pending') {
        setVerificationMessage({
          type: 'success',
          text: response.data.message || 'Withdrawal is being processed. You will receive the funds shortly.',
        });
      } else {
        setVerificationMessage({
          type: 'success',
          text: response.data.message || 'Withdrawal request submitted successfully.',
        });
      }
      
      setShowWithdrawForm(false);
      setWithdrawAmount('');
      setPaypalEmail('');
      fetchWalletData(); // Refresh balance and transactions
    } catch (err) {
      console.error('Error requesting withdrawal:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to submit withdrawal request. Please try again.';
      setVerificationMessage({ type: 'error', text: msg });
    } finally {
      setRequestingWithdrawal(false);
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

      {verificationMessage && (
        <Card className={`mb-4 ${
          verificationMessage.type === 'success'
            ? 'border-green-300 bg-green-50'
            : verificationMessage.type === 'error'
            ? 'border-red-300 bg-red-50'
            : 'border-blue-300 bg-blue-50'
        }`}>
          <CardContent className="p-4">
            <p className={
              verificationMessage.type === 'success'
                ? 'text-green-800'
                : verificationMessage.type === 'error'
                ? 'text-red-800'
                : 'text-blue-800'
            }>
              {verificationMessage.text}
            </p>
          </CardContent>
        </Card>
      )}

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
                ${balance.toFixed(2)}
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
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDepositForm(!showDepositForm);
                setShowWithdrawForm(false);
                setVerificationMessage(null);
              }}
            >
              Add Funds
            </Button>
            <div>
              <Button 
                variant="outline" 
                disabled={!user?.seller_verified}
                onClick={() => {
                  if (user?.seller_verified) {
                    setShowWithdrawForm(!showWithdrawForm);
                    setShowDepositForm(false);
                    setVerificationMessage(null);
                  }
                }}
              >
                Withdraw
              </Button>
              {!user?.seller_verified && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Seller verification required for withdrawals
                </p>
              )}
            </div>
          </div>

          {/* Deposit Form */}
          {showDepositForm && (
            <div className="mt-4 p-4 border rounded-lg bg-[hsl(var(--accent))]">
              <h4 className="font-semibold mb-3">Add Funds to Wallet</h4>
              <form onSubmit={handleDeposit}>
                <div className="mb-3">
                  <Label htmlFor="depositAmount">Amount (USD)</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    min="1"
                    max="10000"
                    step="0.01"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter amount (1-10,000)"
                    required
                    className="mt-1"
                  />
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                    Minimum: $1.00 | Maximum: $10,000.00
                  </p>
                </div>
                <div className="mb-3">
                  <Label htmlFor="depositPaypalEmail">PayPal Email</Label>
                  <Input
                    id="depositPaypalEmail"
                    type="email"
                    value={depositPaypalEmail}
                    onChange={(e) => setDepositPaypalEmail(e.target.value)}
                    placeholder="Enter your PayPal email"
                    required
                    className="mt-1"
                  />
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                    This is the email address of your PayPal account from which funds will be sent.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={initiatingDeposit}>
                    {initiatingDeposit ? 'Processing...' : 'Add Funds'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowDepositForm(false);
                      setDepositAmount('');
                      setDepositPaypalEmail('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Withdraw Form */}
          {showWithdrawForm && (
            <div className="mt-4 p-4 border rounded-lg bg-[hsl(var(--accent))]">
              <h4 className="font-semibold mb-3">Request Withdrawal</h4>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">
                Available balance: <span className="font-semibold">${availableBalance.toFixed(2)}</span>
              </p>
              <form onSubmit={handleWithdraw}>
                <div className="mb-3">
                  <Label htmlFor="withdrawAmount">Amount (USD)</Label>
                  <Input
                    id="withdrawAmount"
                    type="number"
                    min="10"
                    step="0.01"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder={`Enter amount (min: $10.00, max: $${availableBalance.toFixed(2)})`}
                    max={availableBalance}
                    required
                    className="mt-1"
                  />
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                    Minimum: $10.00 | Maximum: $10,000.00 per request | Withdrawal requests are subject to admin approval
                  </p>
                </div>
                <div className="mb-3">
                  <Label htmlFor="paypalEmail">PayPal Email Address</Label>
                  <Input
                    id="paypalEmail"
                    type="email"
                    value={paypalEmail}
                    onChange={(e) => setPaypalEmail(e.target.value)}
                    placeholder="Enter your PayPal email address"
                    required
                    className="mt-1"
                  />
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                    Money will be sent to this PayPal email address
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={requestingWithdrawal || availableBalance < 10}>
                    {requestingWithdrawal ? 'Submitting...' : 'Request Withdrawal'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowWithdrawForm(false);
                      setWithdrawAmount('');
                      setPaypalEmail('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Seller Verification - Hide for super admins */}
          {user?.role !== 'super_admin' && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">Become a Verified Seller</h3>
              {user?.seller_verified ? (
                <p className="text-sm text-green-700">
                  ✓ Your account is verified for selling (eBooks and Auctions).
                </p>
              ) : (
                <>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">
                    Pay a small one-time verification fee to enable seller features. After verification, you can sell eBooks and create auctions.
                  </p>
                  <Button
                    variant="default"
                    disabled={initiatingVerification}
                    onClick={async () => {
                      try {
                        setInitiatingVerification(true);
                        setVerificationMessage(null);
                        const response = await sellerVerificationAPI.initiatePayment();
                        
                        // Check for demo mode
                        if (response.data.demo_mode) {
                          setVerificationMessage({
                            type: 'success',
                            text: response.data.message || 'Seller verification completed successfully (Demo Mode). You are now a verified seller!',
                          });
                          // Refresh wallet data to show updated status and transaction
                          await fetchWalletData();
                          // Reload page to refresh user data (seller_verified status)
                          // This ensures the UI updates immediately (e.g., withdraw button becomes enabled)
                          setTimeout(() => {
                            window.location.reload();
                          }, 1500);
                        } else {
                          // Normal PayPal flow
                          const approvalUrl = response.data.approval_url;
                          if (approvalUrl) {
                            window.location.href = approvalUrl;
                          } else {
                            setVerificationMessage({
                              type: 'error',
                              text: 'Failed to start verification payment.',
                            });
                          }
                        }
                      } catch (err) {
                        console.error('Error initiating seller verification payment:', err);
                        const msg =
                          err.response?.data?.error || err.message || 'Failed to start verification payment.';
                        setVerificationMessage({ type: 'error', text: msg });
                      } finally {
                        setInitiatingVerification(false);
                      }
                    }}
                  >
                    {initiatingVerification ? 'Processing...' : 'Pay Verification Fee with PayPal'}
                  </Button>
                  <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                    Note: If demo mode is enabled, verification will complete instantly without PayPal. Otherwise, PayPal credentials must be configured on the server.
                  </p>
                </>
              )}
            </div>
          )}
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
                    onClick={() => {
                      window.location.href = getAdUrl(ad);
                    }}
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
                    onClick={() => {
                      window.location.href = getAdUrl(ad);
                    }}
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
    
    // Check URL parameters for auction_id
    const urlParams = new URLSearchParams(window.location.search);
    const auctionId = urlParams.get('auction_id');
    if (auctionId) {
      setActiveTab('buyer-seller');
      // Will select conversation after fetching
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'buyer-seller' && selectedConversation) {
      // Load messages - support both ad_id and auction_id
      const conversationId = selectedConversation.auction_id || selectedConversation.ad_id;
      loadConversationMessages(conversationId, selectedConversation.auction_id ? 'auction' : 'ad', false);
      const interval = setInterval(() => {
        // When polling, don't scroll to bottom unless there are new messages
        loadConversationMessages(conversationId, selectedConversation.auction_id ? 'auction' : 'ad', false);
        // Also refresh unread counts periodically
        if (window.fetchUnreadCounts) {
          window.fetchUnreadCounts();
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab, selectedConversation]);
  
  // Handle URL parameter for auction_id
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const auctionId = urlParams.get('auction_id');
    if (auctionId) {
      setActiveTab('buyer-seller');
      
      if (buyerSellerConversations.length > 0) {
        // Find auction conversation
        const auctionConv = buyerSellerConversations.find(c => c.auction_id === parseInt(auctionId));
        if (auctionConv) {
          setSelectedConversation(auctionConv);
        } else if (!loadingConversations) {
          // If auction not found in conversations, try to load it directly
          // This handles the case where user clicks Contact Seller but hasn't sent a message yet
          loadConversationMessages(parseInt(auctionId), 'auction', false);
          // Fetch auction details to get title and seller info
          fetch(`/api/auctions/${auctionId}`)
            .then(res => res.json())
            .then(data => {
              setSelectedConversation({
                auction_id: parseInt(auctionId),
                auction_title: data.title || 'Auction',
                ad_title: data.title || 'Auction', // For compatibility
                seller_id: data.user_id,
                other_party_name: data.seller?.name || 'Seller',
              });
            })
            .catch(err => {
              console.error('Failed to fetch auction details:', err);
              setSelectedConversation({
                auction_id: parseInt(auctionId),
                auction_title: 'Auction',
                ad_title: 'Auction',
                seller_id: null,
              });
            });
        }
      } else if (!loadingConversations) {
        // Conversations not loaded yet, but we have auction_id - load conversation
        loadConversationMessages(parseInt(auctionId), 'auction', false);
        // Fetch auction details
        fetch(`/api/auctions/${auctionId}`)
          .then(res => res.json())
          .then(data => {
            setSelectedConversation({
              auction_id: parseInt(auctionId),
              auction_title: data.title || 'Auction',
              ad_title: data.title || 'Auction',
              seller_id: data.user_id,
              other_party_name: data.seller?.name || 'Seller',
            });
          })
          .catch(err => {
            console.error('Failed to fetch auction details:', err);
          });
      }
    }
  }, [buyerSellerConversations, loadingConversations]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      // Poll for new messages every 3 seconds
      const interval = setInterval(() => {
        fetchMessages(selectedChat.id);
        // Also refresh unread counts periodically
        if (window.fetchUnreadCounts) {
          window.fetchUnreadCounts();
        }
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
      // Refresh inbox unread count when chats are fetched
      if (window.fetchUnreadCounts) {
        window.fetchUnreadCounts();
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
      // Mark support chat notifications as read when viewing the chat
      markSupportChatNotificationsAsRead(chatId);
      // Refresh inbox unread count after viewing messages
      if (window.fetchUnreadCounts) {
        window.fetchUnreadCounts();
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  // Mark "new_message" notifications from support chat as read when user views the chat
  const markSupportChatNotificationsAsRead = async (chatId) => {
    try {
      // Get all notifications
      const response = await notificationAPI.getNotifications();
      const allNotifications = response.data.notifications?.data || response.data.data || [];
      
      // Find unread "new_message" notifications related to this support chat
      const relatedNotifications = allNotifications.filter(
        n => !n.is_read && 
        n.type === 'new_message' && 
        n.metadata?.chat_id === chatId &&
        n.metadata?.sender_type === 'admin'
      );
      
      // Mark each as read
      for (const notification of relatedNotifications) {
        try {
          await notificationAPI.markAsRead(notification.id);
        } catch (err) {
          console.error('Failed to mark notification as read:', err);
        }
      }
      
      // Refresh unread counts if any notifications were marked
      if (relatedNotifications.length > 0 && window.fetchUnreadCounts) {
        // Trigger parent component to refresh unread counts
        window.fetchUnreadCounts();
      }
    } catch (err) {
      console.error('Error marking support chat notifications as read:', err);
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
      // Fetch both seller and buyer conversations to handle users who might be both
      const allConversations = [];
      
      try {
        // Get seller conversations (if user has ads)
        const sellerResponse = await buyerSellerMessageAPI.getSellerConversations();
        if (sellerResponse.data && Array.isArray(sellerResponse.data)) {
          allConversations.push(...sellerResponse.data);
        }
      } catch (err) {
        console.error('Error fetching seller conversations:', err);
      }
      
      try {
        // Get buyer conversations (if user has messaged about any ads)
        const buyerResponse = await buyerSellerMessageAPI.getBuyerConversations();
        if (buyerResponse.data && Array.isArray(buyerResponse.data)) {
          allConversations.push(...buyerResponse.data);
        }
      } catch (err) {
        console.error('Error fetching buyer conversations:', err);
      }
      
      // Remove duplicates based on ad_id or auction_id (in case user is both buyer and seller for same ad/auction)
      const uniqueConversations = allConversations.reduce((acc, conv) => {
        const existing = acc.find(c => 
          (c.ad_id && conv.ad_id && c.ad_id === conv.ad_id) ||
          (c.auction_id && conv.auction_id && c.auction_id === conv.auction_id)
        );
        if (!existing) {
          acc.push(conv);
        }
        return acc;
      }, []);
      
      // Sort by last message time (most recent first)
      uniqueConversations.sort((a, b) => {
        const timeA = a.last_message_at ? new Date(a.last_message_at) : new Date(0);
        const timeB = b.last_message_at ? new Date(b.last_message_at) : new Date(0);
        return timeB - timeA;
      });
      
      setBuyerSellerConversations(uniqueConversations);
      if (uniqueConversations.length > 0 && !selectedConversation) {
        setSelectedConversation(uniqueConversations[0]);
      }
      // Refresh inbox unread count when conversations are fetched
      if (window.fetchUnreadCounts) {
        window.fetchUnreadCounts();
      }
    } catch (err) {
      console.error('Failed to fetch buyer-seller conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadConversationMessages = async (id, type = 'ad', shouldScrollToBottom = false) => {
    try {
      let response;
      if (type === 'auction') {
        response = await buyerSellerMessageAPI.getAuctionConversation(id);
      } else {
        response = await buyerSellerMessageAPI.getConversation(id);
      }
      setConversationMessages(response.data || []);
      // Only auto-scroll to bottom if explicitly requested (e.g., when sending a new message)
      if (shouldScrollToBottom) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
      
      // Mark related notifications as read when viewing the conversation
      markMessageNotificationsAsRead(id, type);
      // Refresh inbox unread count after viewing messages
      if (window.fetchUnreadCounts) {
        window.fetchUnreadCounts();
      }
    } catch (err) {
      console.error('Failed to load conversation messages:', err);
    }
  };

  // Mark "new_message" notifications as read when user views the conversation
  const markMessageNotificationsAsRead = async (id, type = 'ad') => {
    try {
      // Get all notifications
      const response = await notificationAPI.getNotifications();
      const allNotifications = response.data.notifications?.data || response.data.data || [];
      
      // Find unread "new_message" notifications related to this ad
      const relatedNotifications = allNotifications.filter(
        n => !n.is_read && 
        n.type === 'new_message' && 
        n.related_ad_id === adId
      );
      
      // Mark each as read
      for (const notification of relatedNotifications) {
        try {
          await notificationAPI.markAsRead(notification.id);
        } catch (err) {
          console.error('Failed to mark notification as read:', err);
        }
      }
      
      // Refresh unread counts if any notifications were marked
      if (relatedNotifications.length > 0 && window.fetchUnreadCounts) {
        // Trigger parent component to refresh unread counts
        window.fetchUnreadCounts();
      }
    } catch (err) {
      console.error('Error marking message notifications as read:', err);
    }
  };

  const handleSendBuyerSellerMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      const conversationId = selectedConversation.auction_id || selectedConversation.ad_id;
      const isAuction = !!selectedConversation.auction_id;
      
      if (isAuction) {
        await buyerSellerMessageAPI.sendAuctionMessage(conversationId, {
          message: newMessage.trim(),
          sender_type: user.id === selectedConversation.seller_id ? 'seller' : 'buyer',
        });
      } else {
        await buyerSellerMessageAPI.sendMessage(conversationId, {
          message: newMessage.trim(),
          sender_type: user.id === selectedConversation.seller_id ? 'seller' : 'buyer',
        });
      }
      
      setNewMessage('');
      // Scroll to bottom after sending a new message
      await loadConversationMessages(conversationId, isAuction ? 'auction' : 'ad', true);
      fetchBuyerSellerConversations();
      // Mark notifications as read when user sends a message (they've clearly seen the conversation)
      markMessageNotificationsAsRead(conversationId, isAuction ? 'auction' : 'ad');
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
                buyerSellerConversations.map((conv) => {
                  const convId = conv.auction_id || conv.ad_id;
                  const isSelected = selectedConversation && (
                    (selectedConversation.auction_id && conv.auction_id && selectedConversation.auction_id === conv.auction_id) ||
                    (selectedConversation.ad_id && conv.ad_id && selectedConversation.ad_id === conv.ad_id)
                  );
                  
                  return (
                  <div
                    key={conv.auction_id ? `auction-${conv.auction_id}` : `ad-${conv.ad_id}`}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-4 border-b cursor-pointer hover:bg-[hsl(var(--accent))] transition-colors ${
                      isSelected ? 'bg-[hsl(var(--accent))]' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-[hsl(var(--foreground))] line-clamp-1">
                        {conv.auction_title || conv.ad_title || 
                         (conv.auction_id ? `Auction #${conv.auction_id}` : `Ad #${conv.ad_id}`)}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="bg-[hsl(var(--primary))] text-white text-xs rounded-full px-2 py-1 ml-2">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {conv.seller_id === user.id ? 'Buyer' : 'Seller'}: {conv.other_party_name || 'Unknown'}
                      {conv.auction_id && <span className="ml-2 text-blue-600">(Auction)</span>}
                    </p>
                    {conv.last_message_at && (
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                        {new Date(conv.last_message_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Buyer-Seller Messages */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-[hsl(var(--foreground))]">
                    {selectedConversation.auction_title || selectedConversation.ad_title || 
                     (selectedConversation.auction_id ? `Auction #${selectedConversation.auction_id}` : `Ad #${selectedConversation.ad_id}`)}
                  </h3>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    {selectedConversation.seller_id === user.id ? 'Buyer' : 'Seller'}: {selectedConversation.other_party_name || 'Unknown'}
                    {selectedConversation.auction_id && <span className="ml-2 text-blue-600 text-xs">(Auction)</span>}
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
      // Remove notification from list when marked as read
      setNotifications(notifications.filter(n => n.id !== id));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  // Auto-mark as read and remove when notification is clicked/viewed
  const handleNotificationClick = async (notification) => {
    // Mark as read and remove from list first (disappears immediately)
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }
    
    // If notification has a link, navigate to it
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      // Remove all notifications from list when marked as read (disappear)
      setNotifications([]);
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
      new_auction: '🔨',
      auction_ending_soon: '⏰',
      auction_finished: '🏁',
      auction_won: '🎉',
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
              className={`transition-all hover:shadow-md cursor-pointer ${
                !notification.is_read ? 'border-l-4 border-l-[hsl(var(--primary))] bg-[hsl(var(--accent))]/30' : ''
              }`}
              onClick={(e) => {
                // Don't trigger if clicking on buttons
                if (e.target.closest('button')) return;
                handleNotificationClick(notification);
              }}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            className="text-xs"
                          >
                            Mark read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notification.id);
                          }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNotificationClick(notification);
                        }}
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
  const [selectedItemCategoryId, setSelectedItemCategoryId] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState(new Set());
  const [selectedLocations, setSelectedLocations] = useState(new Set());
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [expandedProvinces, setExpandedProvinces] = useState(new Set());
  const [expandedDistricts, setExpandedDistricts] = useState(new Set());
  const [expandedLocalLevels, setExpandedLocalLevels] = useState(new Set());
  const [editingImages, setEditingImages] = useState([null, null, null, null]);
  const categoryDropdownRef = useRef(null);
  const locationDropdownRef = useRef(null);

  useEffect(() => {
    fetchAds();
    fetchCategories();
    fetchLocations();
    
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
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
      const categoriesData = response.data || [];
      
      // Transform 3-level structure (domain > field > item) to 2-level structure (category > subcategory)
      // API returns: { id, name, domain_category, field_categories: [...], item_categories: [...] }
      // Code expects: { id, name, subcategories: [...] }
      const categoriesWithSubcategories = [];
      
      if (Array.isArray(categoriesData)) {
        categoriesData.forEach((domainCategory) => {
          const mainCategory = {
            id: domainCategory.id,
            name: domainCategory.domain_category || domainCategory.name,
            subcategories: []
          };
          
          if (domainCategory.field_categories && Array.isArray(domainCategory.field_categories)) {
            domainCategory.field_categories.forEach((fieldCategory) => {
              mainCategory.subcategories.push({
                id: fieldCategory.id,
                name: fieldCategory.field_category || fieldCategory.name,
                item_categories: fieldCategory.item_categories || []
              });
            });
          }
          
          if (domainCategory.item_categories && Array.isArray(domainCategory.item_categories) && domainCategory.item_categories.length > 0) {
            if (mainCategory.subcategories.length === 0) {
              mainCategory.subcategories.push({
                id: domainCategory.item_categories[0].id,
                name: domainCategory.domain_category || domainCategory.name,
                item_categories: domainCategory.item_categories
              });
            }
          }
          
          if (mainCategory.subcategories.length > 0 || domainCategory.item_categories?.length > 0) {
            categoriesWithSubcategories.push(mainCategory);
          }
        });
      }
      
      setCategories(categoriesWithSubcategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
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
    
    // Set category selection - need to check all 3 levels (domain, field, item)
    const categoryIdNum = typeof ad.category_id === 'string' ? parseInt(ad.category_id, 10) : Number(ad.category_id);
    let foundCategory = null;
    let foundSubcategory = null;
    let foundItemCategory = null;
    
    for (const category of categories) {
      const catIdNum = typeof category.id === 'string' ? parseInt(category.id, 10) : Number(category.id);
      if (catIdNum === categoryIdNum) {
        foundCategory = category;
        break;
      }
      if (category.subcategories) {
        for (const subcategory of category.subcategories) {
          const subIdNum = typeof subcategory.id === 'string' ? parseInt(subcategory.id, 10) : Number(subcategory.id);
          if (subIdNum === categoryIdNum) {
            foundCategory = category;
            foundSubcategory = subcategory;
            break;
          }
          if (subcategory.item_categories && Array.isArray(subcategory.item_categories)) {
            const itemCat = subcategory.item_categories.find(item => {
              const itemIdNum = typeof item.id === 'string' ? parseInt(item.id, 10) : Number(item.id);
              return itemIdNum === categoryIdNum;
            });
            if (itemCat) {
              foundCategory = category;
              foundSubcategory = subcategory;
              foundItemCategory = itemCat;
              break;
            }
          }
        }
        if (foundCategory) break;
      }
    }
    
    if (foundCategory) {
      setSelectedCategoryName(foundCategory.name);
      if (foundItemCategory) {
        setSelectedSubcategoryId(foundSubcategory.id.toString());
        setSelectedItemCategoryId(foundItemCategory.id.toString());
      } else if (foundSubcategory) {
        setSelectedSubcategoryId(foundSubcategory.id.toString());
        setSelectedItemCategoryId('');
      } else {
        setSelectedSubcategoryId('');
        setSelectedItemCategoryId('');
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
    setSelectedItemCategoryId('');
    setExpandedCategories(new Set());
    setExpandedSubcategories(new Set());
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

  const toggleCategory = (categoryName) => {
    const trimmedName = (categoryName || '').trim();
    if (!trimmedName) return;
    
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trimmedName)) {
        newSet.delete(trimmedName);
      } else {
        newSet.add(trimmedName);
      }
      return newSet;
    });
  };

  const toggleSubcategory = (subcategoryName) => {
    const trimmedName = (subcategoryName || '').trim();
    if (!trimmedName) return;
    
    setExpandedSubcategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trimmedName)) {
        newSet.delete(trimmedName);
      } else {
        newSet.add(trimmedName);
      }
      return newSet;
    });
  };

  const handleCategorySelect = (categoryId, categoryName, hasSubcategories = false) => {
    const trimmedCategoryName = (categoryName || '').trim();
    
    setSelectedCategoryName(trimmedCategoryName);
    setSelectedSubcategoryId('');
    setSelectedItemCategoryId('');
    setEditingAdData(prev => ({ ...prev, category_id: categoryId.toString() }));
    
    if (!hasSubcategories) {
      setShowCategoryDropdown(false);
    }
  };

  const handleSubcategorySelect = (subcategoryId, subcategoryName, hasItemCategories = false) => {
    const category = getSelectedCategory();
    if (category) {
      setSelectedSubcategoryId(subcategoryId.toString());
      setSelectedItemCategoryId('');
      setEditingAdData(prev => ({ ...prev, category_id: subcategoryId.toString() }));
      
      if (!hasItemCategories) {
        setShowCategoryDropdown(false);
      }
    }
  };

  const handleItemCategorySelect = (itemCategoryId, categoryName, subcategoryId) => {
    const itemIdStr = itemCategoryId.toString();
    if (categoryName) setSelectedCategoryName(categoryName);
    if (subcategoryId) setSelectedSubcategoryId(subcategoryId.toString());
    setSelectedItemCategoryId(itemIdStr);
    setEditingAdData(prev => ({ ...prev, category_id: itemIdStr}));
    setShowCategoryDropdown(false);
  };

  const buildCategoryString = () => {
    if (selectedItemCategoryId) {
      const category = getSelectedCategory();
      if (category && selectedSubcategoryId) {
        const subcategory = category.subcategories?.find(s => s.id === parseInt(selectedSubcategoryId));
        if (subcategory && subcategory.item_categories) {
          const itemCategory = subcategory.item_categories.find(item => item.id === parseInt(selectedItemCategoryId));
          if (itemCategory) {
            const itemName = itemCategory.item_category || itemCategory.name;
            return `${category.name} > ${subcategory.name} > ${itemName}`;
          }
        }
      }
    }
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
              // Use category_path if available (new 3-level structure: domain > field > item)
              // Fallback to old structure for backward compatibility
              let categoryKey = 'Uncategorized';
              
              if (ad.category_path) {
                // Use the full category path from backend (domain > field > item)
                categoryKey = ad.category_path;
              } else if (ad.category) {
                // Fallback: build from old structure
                const categoryName = ad.category.category || ad.category.domain_category || 'Uncategorized';
                const subcategoryName = ad.category.sub_category || ad.category.field_category || null;
                const itemCategoryName = ad.category.item_category || null;
                
                if (itemCategoryName) {
                  categoryKey = subcategoryName 
                    ? `${categoryName} > ${subcategoryName} > ${itemCategoryName}`
                    : `${categoryName} > ${itemCategoryName}`;
                } else if (subcategoryName) {
                  categoryKey = `${categoryName} > ${subcategoryName}`;
                } else {
                  categoryKey = categoryName;
                }
              } else if (ad.category_id && categories.length > 0) {
                // Last resort: look up category by ID from categories list
                const categoryIdNum = typeof ad.category_id === 'string' ? parseInt(ad.category_id, 10) : Number(ad.category_id);
                let foundCategory = null;
                let foundSubcategory = null;
                let foundItemCategory = null;
                
                for (const cat of categories) {
                  const catIdNum = typeof cat.id === 'string' ? parseInt(cat.id, 10) : Number(cat.id);
                  if (catIdNum === categoryIdNum) {
                    foundCategory = cat;
                    break;
                  }
                  if (cat.subcategories) {
                    for (const subcat of cat.subcategories) {
                      const subIdNum = typeof subcat.id === 'string' ? parseInt(subcat.id, 10) : Number(subcat.id);
                      if (subIdNum === categoryIdNum) {
                        foundCategory = cat;
                        foundSubcategory = subcat;
                        break;
                      }
                      if (subcat.item_categories) {
                        const itemCat = subcat.item_categories.find(item => {
                          const itemIdNum = typeof item.id === 'string' ? parseInt(item.id, 10) : Number(item.id);
                          return itemIdNum === categoryIdNum;
                        });
                        if (itemCat) {
                          foundCategory = cat;
                          foundSubcategory = subcat;
                          foundItemCategory = itemCat;
                          break;
                        }
                      }
                    }
                    if (foundCategory) break;
                  }
                }
                
                if (foundItemCategory) {
                  categoryKey = `${foundCategory.name} > ${foundSubcategory.name} > ${foundItemCategory.item_category || foundItemCategory.name}`;
                } else if (foundSubcategory) {
                  categoryKey = `${foundCategory.name} > ${foundSubcategory.name}`;
                } else if (foundCategory) {
                  categoryKey = foundCategory.name;
                }
              }
              
              if (!categoryBreakdown[categoryKey]) {
                categoryBreakdown[categoryKey] = {
                  path: categoryKey,
                  count: 0,
                };
              }
              categoryBreakdown[categoryKey].count++;
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
                            Category: <span className="font-semibold">
                              {(() => {
                                // Build category path from 3-level structure
                                const parts = [];
                                if (ad.category.domain_category) parts.push(ad.category.domain_category);
                                if (ad.category.field_category) parts.push(ad.category.field_category);
                                if (ad.category.item_category) parts.push(ad.category.item_category);
                                
                                // Fallback to old structure if new fields don't exist
                                if (parts.length === 0) {
                                  if (ad.category.category) parts.push(ad.category.category);
                                  if (ad.category.sub_category) parts.push(ad.category.sub_category);
                                }
                                
                                return parts.length > 0 ? parts.join(' > ') : 'Uncategorized';
                              })()}
                            </span>
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

// My eBooks Section (for verified sellers)
function MyEbooksSection({ user }) {
  const [ebooks, setEbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEbookId, setEditingEbookId] = useState(null);
  const [editingEbookData, setEditingEbookData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [ebookFile, setEbookFile] = useState(null);
  const [ebookCoverImage, setEbookCoverImage] = useState(null);
  const [salesReport, setSalesReport] = useState(null);
  const [showSalesReport, setShowSalesReport] = useState(false);
  // Category selection state
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
  const [selectedItemCategoryId, setSelectedItemCategoryId] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState(new Set());
  const categoryDropdownRef = useRef(null);
  const [cropImageIndex, setCropImageIndex] = useState(null);
  const [cropImageFile, setCropImageFile] = useState(null);

  const [ebookFormData, setEbookFormData] = useState({
    category_id: '',
    title: '',
    description: '',
    writer: '',
    language: '',
    pages: '',
    book_size: '',
    file_format: '',
    price: '',
    publisher_name: '',
    publisher_address: '',
    publisher_website: '',
    publisher_email: '',
    publisher_phone: '',
    copyright_declared: false,
    book_type: 'ebook',
    shipping_cost: '',
    delivery_time: '',
  });

  useEffect(() => {
    fetchEbooks();
    fetchCategories();
    fetchSalesReport();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      const categoriesData = response.data || [];
      
      // Transform 3-level structure (domain > field > item) to 2-level structure (category > subcategory)
      // API returns: { id, name, domain_category, field_categories: [...], item_categories: [...] }
      // Code expects: { id, name, subcategories: [...] }
      const categoriesWithSubcategories = [];
      
      if (Array.isArray(categoriesData)) {
        categoriesData.forEach((domainCategory) => {
          // Domain category becomes main category
          const mainCategory = {
            id: domainCategory.id,
            name: domainCategory.domain_category || domainCategory.name,
            subcategories: []
          };
          
          // Field categories become subcategories
          if (domainCategory.field_categories && Array.isArray(domainCategory.field_categories)) {
            domainCategory.field_categories.forEach((fieldCategory) => {
              mainCategory.subcategories.push({
                id: fieldCategory.id,
                name: fieldCategory.field_category || fieldCategory.name,
                // Store item categories for flattening
                item_categories: fieldCategory.item_categories || []
              });
            });
          }
          
          // If domain has direct item categories (no field categories), add them as subcategories
          if (domainCategory.item_categories && Array.isArray(domainCategory.item_categories) && domainCategory.item_categories.length > 0) {
            if (mainCategory.subcategories.length === 0) {
              // If no field categories, add direct item categories as subcategories
              domainCategory.item_categories.forEach(itemCat => {
                mainCategory.subcategories.push({
                  id: itemCat.id,
                  name: itemCat.item_category || itemCat.name,
                  item_categories: [itemCat] // Store as array for consistency
                });
              });
            } else {
              // If field categories exist, also add direct item categories
              domainCategory.item_categories.forEach(itemCat => {
                mainCategory.subcategories.push({
                  id: itemCat.id,
                  name: itemCat.item_category || itemCat.name,
                  item_categories: [itemCat]
                });
              });
            }
          }
          
          if (mainCategory.subcategories.length > 0) {
            categoriesWithSubcategories.push(mainCategory);
          }
        });
      }
      
      setCategories(categoriesWithSubcategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    }
  };

  const fetchEbooks = async () => {
    try {
      setLoading(true);
      const response = await sellerEbookAPI.getMyEbooks();
      setEbooks(response.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load eBooks');
      console.error('Error fetching eBooks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalesReport = async () => {
    try {
      const response = await sellerEbookAPI.getSalesReport();
      setSalesReport(response.data);
    } catch (err) {
      console.error('Error fetching sales report:', err);
    }
  };

  // Category selection helper functions (similar to MyAuctionsSection)
  const getSelectedCategory = () => {
    if (!selectedCategoryName) return null;
    return categories.find(c => c.name === selectedCategoryName);
  };

  const toggleCategory = (categoryName) => {
    const trimmedName = (categoryName || '').trim();
    if (!trimmedName) return;
    
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trimmedName)) {
        newSet.delete(trimmedName);
      } else {
        newSet.add(trimmedName);
      }
      return newSet;
    });
  };

  const toggleSubcategory = (subcategoryName) => {
    const trimmedName = (subcategoryName || '').trim();
    if (!trimmedName) return;
    
    setExpandedSubcategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trimmedName)) {
        newSet.delete(trimmedName);
      } else {
        newSet.add(trimmedName);
      }
      return newSet;
    });
  };

  const handleCategorySelect = (categoryId, categoryName, hasSubcategories = false) => {
    const trimmedCategoryName = (categoryName || '').trim();
    
    setSelectedCategoryName(trimmedCategoryName);
    setSelectedSubcategoryId('');
    setSelectedItemCategoryId('');
    setEbookFormData(prev => ({...prev, category_id: categoryId.toString()}));
    
    if (!hasSubcategories) {
      setShowCategoryDropdown(false);
    }
  };

  const handleSubcategorySelect = (subcategoryId, subcategoryName, hasItemCategories = false) => {
    const category = getSelectedCategory();
    if (category) {
      setSelectedSubcategoryId(subcategoryId.toString());
      setSelectedItemCategoryId('');
      setEbookFormData(prev => ({...prev, category_id: subcategoryId.toString()}));
      
      if (!hasItemCategories) {
        setShowCategoryDropdown(false);
      }
    }
  };

  const handleItemCategorySelect = (itemCategoryId, categoryName, subcategoryId) => {
    const itemIdStr = itemCategoryId.toString();
    if (categoryName) setSelectedCategoryName(categoryName);
    if (subcategoryId) setSelectedSubcategoryId(subcategoryId.toString());
    setSelectedItemCategoryId(itemIdStr);
    setEbookFormData(prev => ({...prev, category_id: itemIdStr}));
    setShowCategoryDropdown(false);
  };

  const buildCategoryString = () => {
    if (selectedItemCategoryId) {
      const category = getSelectedCategory();
      if (category && selectedSubcategoryId) {
        const subcategory = category.subcategories?.find(s => s.id === parseInt(selectedSubcategoryId));
        if (subcategory && subcategory.item_categories) {
          const itemCategory = subcategory.item_categories.find(item => item.id === parseInt(selectedItemCategoryId));
          if (itemCategory) {
            const itemName = itemCategory.item_category || itemCategory.name;
            return `${category.name} > ${subcategory.name} > ${itemName}`;
          }
        }
      }
    }
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
    return '';
  };

  // Image compression utility
  const compressImage = (file, maxWidth = 1920, maxHeight = 1920, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

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
              if (!blob) {
                reject(new Error('Compression failed'));
                return;
              }
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            file.type,
            quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  // Image handling with crop for eBook cover
  const handleCropComplete = async (croppedFile) => {
    if (cropImageIndex !== 'ebook-cover') return;
    
    const img = new Image();
    const objectUrl = URL.createObjectURL(croppedFile);
    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      if (img.width !== 400 || img.height !== 400) {
        alert('Image must be exactly 400x400 pixels. Please crop again.');
        return;
      }
      
      let processedFile = croppedFile;
      if (croppedFile.size > 1024 * 1024) {
        try {
          processedFile = await compressImage(croppedFile);
        } catch (err) {
          console.error('Error compressing image:', err);
        }
      }
      
      setEbookCoverImage(processedFile);
      setCropImageIndex(null);
      setCropImageFile(null);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      alert('Error processing image. Please try again.');
    };
    img.src = objectUrl;
  };

  const handleCropCancel = () => {
    setCropImageIndex(null);
    setCropImageFile(null);
  };

  const handleAddEbook = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(ebookFormData).forEach(key => {
        if (ebookFormData[key] !== null && ebookFormData[key] !== undefined && ebookFormData[key] !== '') {
          if (typeof ebookFormData[key] === 'boolean') {
            formData.append(key, ebookFormData[key] ? '1' : '0');
          } else {
            formData.append(key, ebookFormData[key]);
          }
        }
      });
      if (ebookFile) formData.append('file', ebookFile);
      if (ebookCoverImage) formData.append('cover_image', ebookCoverImage);

      await sellerEbookAPI.createEbook(formData);
      setShowAddForm(false);
      setEbookFormData({
        category_id: '', title: '', description: '', writer: '', language: '', pages: '',
        book_size: '', file_format: '', price: '', publisher_name: '', publisher_address: '',
        publisher_website: '', publisher_email: '', publisher_phone: '', copyright_declared: false,
        book_type: 'ebook', shipping_cost: '', delivery_time: '',
      });
      setEbookFile(null);
      setEbookCoverImage(null);
      fetchEbooks();
      fetchSalesReport();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create eBook');
    }
  };

  const handleEditEbook = (ebook) => {
    setEditingEbookId(ebook.id);
    setEditingEbookData({ ...ebook });
    setEbookFile(null);
    setEbookCoverImage(null);
  };

  const handleSaveEbook = async () => {
    try {
      const formData = new FormData();
      const dataToSend = { ...editingEbookData };
      delete dataToSend.cover_image; // Remove existing cover URL
      delete dataToSend.file_url; // Remove existing file URL
      delete dataToSend.user;
      delete dataToSend.category;
      delete dataToSend.id;
      delete dataToSend.created_at;
      delete dataToSend.updated_at;

      Object.keys(dataToSend).forEach(key => {
        if (dataToSend[key] !== null && dataToSend[key] !== undefined && dataToSend[key] !== '') {
          if (typeof dataToSend[key] === 'boolean') {
            formData.append(key, dataToSend[key] ? '1' : '0');
          } else {
            formData.append(key, dataToSend[key]);
          }
        }
      });
      if (ebookFile) formData.append('file', ebookFile);
      if (ebookCoverImage) formData.append('cover_image', ebookCoverImage);

      await sellerEbookAPI.updateEbook(editingEbookId, formData);
      setEditingEbookId(null);
      setEditingEbookData(null);
      setEbookFile(null);
      setEbookCoverImage(null);
      fetchEbooks();
      fetchSalesReport();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update eBook');
    }
  };

  const handleDeleteEbook = async (id) => {
    if (!window.confirm('Are you sure you want to delete this eBook?')) return;
    try {
      await sellerEbookAPI.deleteEbook(id);
      fetchEbooks();
      fetchSalesReport();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete eBook');
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-6">My eBooks</h1>
        <Card>
          <CardContent className="p-8 text-center">
            <p>Loading eBooks...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">My eBooks</h1>
        <div className="flex gap-2">
          <Button onClick={() => setShowSalesReport(!showSalesReport)} variant="outline">
            {showSalesReport ? 'Hide' : 'Show'} Sales Report
          </Button>
          <Button onClick={() => setShowAddForm(true)}>Add New eBook</Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {showSalesReport && salesReport && (
        <Card>
          <CardHeader>
            <CardTitle>eBook Sales Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Total eBooks</p>
                <p className="text-2xl font-bold">{salesReport.total_ebooks}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold">{salesReport.total_sales}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">Rs {parseFloat(salesReport.total_revenue || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Downloads</p>
                <p className="text-2xl font-bold">{salesReport.total_downloads}</p>
              </div>
            </div>
            {salesReport.sales_by_ebook && salesReport.sales_by_ebook.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Sales by eBook</h3>
                <div className="space-y-2">
                  {salesReport.sales_by_ebook.map((item) => (
                    <div key={item.ebook_id} className="flex justify-between p-2 border rounded">
                      <span>{item.title}</span>
                      <span>Sales: {item.sales_count} | Revenue: Rs {parseFloat(item.revenue || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New eBook</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddEbook} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category *</Label>
                  <div className="relative" ref={categoryDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      className="w-full px-3 py-2 text-left border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] flex items-center justify-between"
                    >
                      <span>{buildCategoryString() || 'Select Category'}</span>
                      <span className="ml-2">{showCategoryDropdown ? '▼' : '▶'}</span>
                    </button>
                    
                    {showCategoryDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-md shadow-lg z-50 w-[325px] max-h-[500px] overflow-y-auto">
                        <div className="p-3">
                          <div className="space-y-1">
                            {categories.map((category) => {
                              const subcategories = category.subcategories || [];
                              const hasSubcategories = subcategories.length > 0;
                              const categoryName = (category.name || '').trim();
                              const isCategoryExpanded = categoryName ? expandedCategories.has(categoryName) : false;
                              const isCategorySelected = selectedCategoryName === categoryName && !selectedSubcategoryId && !selectedItemCategoryId;
                              
                              return (
                                <div key={category.id} className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2 flex-1">
                                      {hasSubcategories ? (
                                        <div className="flex items-center space-x-2 flex-1">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleCategory(categoryName);
                                            }}
                                            className="px-2 py-1 text-xs hover:bg-[hsl(var(--accent))] rounded"
                                          >
                                            {isCategoryExpanded ? '▼' : '▶'}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleCategorySelect(category.id, categoryName, hasSubcategories)}
                                            className={`flex-1 text-left px-2 py-2 hover:bg-[hsl(var(--accent))] rounded ${
                                              isCategorySelected ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : ''
                                            }`}
                                          >
                                            {category.name}
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleCategorySelect(category.id, categoryName, false)}
                                          className={`flex-1 text-left px-2 py-2 hover:bg-[hsl(var(--accent))] rounded ${
                                            isCategorySelected ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : ''
                                          }`}
                                        >
                                          {category.name}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  {isCategoryExpanded && hasSubcategories && (
                                    <div className="pl-6 space-y-1">
                                      {subcategories.map((subcategory) => {
                                        const itemCategories = subcategory.item_categories || [];
                                        const hasItemCategories = itemCategories.length > 0;
                                        const subcategoryKey = `${categoryName}-${subcategory.name}`;
                                        const isSubExpanded = expandedSubcategories.has(subcategoryKey);
                                        const isSubSelected = selectedSubcategoryId === subcategory.id.toString() && !selectedItemCategoryId;
                                        
                                        return (
                                          <div key={subcategory.id} className="space-y-1">
                                            <div className="flex items-center space-x-2">
                                              {hasItemCategories ? (
                                                <div className="flex items-center space-x-2 flex-1">
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      toggleSubcategory(subcategoryKey);
                                                    }}
                                                    className="px-2 py-1 text-xs hover:bg-[hsl(var(--accent))] rounded"
                                                  >
                                                    {isSubExpanded ? '▼' : '▶'}
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => handleSubcategorySelect(subcategory.id, subcategory.name, hasItemCategories)}
                                                    className={`flex-1 text-left px-2 py-2 hover:bg-[hsl(var(--accent))] rounded ${
                                                      isSubSelected ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : ''
                                                    }`}
                                                  >
                                                    {subcategory.name}
                                                  </button>
                                                </div>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={() => handleSubcategorySelect(subcategory.id, subcategory.name, false)}
                                                  className={`flex-1 text-left px-2 py-2 hover:bg-[hsl(var(--accent))] rounded ${
                                                    isSubSelected ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : ''
                                                  }`}
                                                >
                                                  {subcategory.name}
                                                </button>
                                              )}
                                            </div>
                                            {isSubExpanded && hasItemCategories && (
                                              <div className="pl-6 space-y-1">
                                                {itemCategories.map((itemCategory) => {
                                                  const itemIdStr = itemCategory.id.toString();
                                                  const isItemSelected = selectedItemCategoryId === itemIdStr;
                                                  const itemName = itemCategory.item_category || itemCategory.name;
                                                  
                                                  return (
                                                    <div key={itemCategory.id}>
                                                      <button
                                                        type="button"
                                                        onClick={() => handleItemCategorySelect(itemCategory.id, categoryName, subcategory.id)}
                                                        className={`w-full text-left px-2 py-2 hover:bg-[hsl(var(--accent))] rounded ${
                                                          isItemSelected ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' : ''
                                                        }`}
                                                      >
                                                        {itemName}
                                                      </button>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Book Type *</Label>
                  <select
                    value={ebookFormData.book_type}
                    onChange={(e) => setEbookFormData({...ebookFormData, book_type: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="ebook">eBook</option>
                    <option value="hard_copy">Hard Copy</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Title *</Label>
                <Input
                  value={ebookFormData.title}
                  onChange={(e) => setEbookFormData({...ebookFormData, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <textarea
                  value={ebookFormData.description}
                  onChange={(e) => setEbookFormData({...ebookFormData, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  rows="3"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Writer</Label>
                  <Input
                    value={ebookFormData.writer}
                    onChange={(e) => setEbookFormData({...ebookFormData, writer: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Language</Label>
                  <Input
                    value={ebookFormData.language}
                    onChange={(e) => setEbookFormData({...ebookFormData, language: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Pages</Label>
                  <Input
                    type="number"
                    value={ebookFormData.pages}
                    onChange={(e) => setEbookFormData({...ebookFormData, pages: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Book Size</Label>
                  <Input
                    value={ebookFormData.book_size}
                    onChange={(e) => setEbookFormData({...ebookFormData, book_size: e.target.value})}
                  />
                </div>
                <div>
                  <Label>File Format</Label>
                  <Input
                    value={ebookFormData.file_format}
                    onChange={(e) => setEbookFormData({...ebookFormData, file_format: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label>Price *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={ebookFormData.price}
                  onChange={(e) => setEbookFormData({...ebookFormData, price: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>eBook File * (PDF, EPUB, MOBI, DOC, DOCX)</Label>
                <Input
                  type="file"
                  accept=".pdf,.epub,.mobi,.doc,.docx"
                  onChange={(e) => setEbookFile(e.target.files[0])}
                  required
                />
              </div>
              <div>
                <Label>Cover Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      // Validate file size (max 10MB before crop)
                      if (file.size > 10 * 1024 * 1024) {
                        setError('Image size must be less than 10MB');
                        setTimeout(() => setError(null), 3000);
                        return;
                      }
                      // Open crop modal for eBook cover
                      setCropImageIndex('ebook-cover');
                      setCropImageFile(file);
                    }
                    e.target.value = ''; // Clear input
                  }}
                />
              </div>
              {(ebookFormData.book_type === 'hard_copy' || ebookFormData.book_type === 'both') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Shipping Cost</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={ebookFormData.shipping_cost}
                      onChange={(e) => setEbookFormData({...ebookFormData, shipping_cost: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Delivery Time</Label>
                    <Input
                      value={ebookFormData.delivery_time}
                      onChange={(e) => setEbookFormData({...ebookFormData, delivery_time: e.target.value})}
                    />
                  </div>
                </div>
              )}
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold">Publisher Information (optional)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Publisher Name</Label>
                    <Input
                      value={ebookFormData.publisher_name}
                      onChange={(e) => setEbookFormData({...ebookFormData, publisher_name: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Publisher Address</Label>
                    <textarea
                      value={ebookFormData.publisher_address}
                      onChange={(e) => setEbookFormData({...ebookFormData, publisher_address: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                      rows="2"
                    />
                  </div>
                  <div>
                    <Label>Publisher Email</Label>
                    <Input
                      type="email"
                      value={ebookFormData.publisher_email}
                      onChange={(e) => setEbookFormData({...ebookFormData, publisher_email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Publisher Phone</Label>
                    <Input
                      value={ebookFormData.publisher_phone}
                      onChange={(e) => setEbookFormData({...ebookFormData, publisher_phone: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Publisher Website</Label>
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      value={ebookFormData.publisher_website}
                      onChange={(e) => setEbookFormData({...ebookFormData, publisher_website: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label>
                  <input
                    type="checkbox"
                    checked={ebookFormData.copyright_declared}
                    onChange={(e) => setEbookFormData({...ebookFormData, copyright_declared: e.target.checked})}
                  />
                  {' '}Copyright Declared *
                </Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
                <Button type="submit">Add eBook</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit eBook Modal */}
      {editingEbookId && editingEbookData && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto px-4 mx-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Edit eBook</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingEbookId(null);
                  setEditingEbookData(null);
                  setEbookFile(null);
                  setEbookCoverImage(null);
                }}
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveEbook();
                }}
                className="space-y-4"
              >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <select
                    value={editingEbookData.category_id || ''}
                    onChange={(e) => setEditingEbookData({...editingEbookData, category_id: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Book Type *</Label>
                  <select
                    value={editingEbookData.book_type || 'ebook'}
                    onChange={(e) => setEditingEbookData({...editingEbookData, book_type: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="ebook">eBook</option>
                    <option value="hard_copy">Hard Copy</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>
              <div>
                <Label>Title *</Label>
                <Input
                  value={editingEbookData.title || ''}
                  onChange={(e) => setEditingEbookData({...editingEbookData, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>Description</Label>
                <textarea
                  value={editingEbookData.description || ''}
                  onChange={(e) => setEditingEbookData({...editingEbookData, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  rows="3"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Writer</Label>
                  <Input
                    value={editingEbookData.writer || ''}
                    onChange={(e) => setEditingEbookData({...editingEbookData, writer: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Language</Label>
                  <Input
                    value={editingEbookData.language || ''}
                    onChange={(e) => setEditingEbookData({...editingEbookData, language: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Pages</Label>
                  <Input
                    type="number"
                    value={editingEbookData.pages || ''}
                    onChange={(e) => setEditingEbookData({...editingEbookData, pages: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label>Price *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingEbookData.price || ''}
                  onChange={(e) => setEditingEbookData({...editingEbookData, price: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label>eBook File (leave empty to keep current file)</Label>
                <Input
                  type="file"
                  accept=".pdf,.epub,.mobi,.doc,.docx"
                  onChange={(e) => setEbookFile(e.target.files[0])}
                />
              </div>
              <div>
                <Label>Cover Image (leave empty to keep current cover)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      // Validate file size (max 10MB before crop)
                      if (file.size > 10 * 1024 * 1024) {
                        setError('Image size must be less than 10MB');
                        setTimeout(() => setError(null), 3000);
                        return;
                      }
                      // Open crop modal for eBook cover
                      setCropImageIndex('ebook-cover');
                      setCropImageFile(file);
                    }
                    e.target.value = ''; // Clear input
                  }}
                />
              </div>
              {(editingEbookData.book_type === 'hard_copy' || editingEbookData.book_type === 'both') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Shipping Cost</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingEbookData.shipping_cost || ''}
                      onChange={(e) => setEditingEbookData({...editingEbookData, shipping_cost: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Delivery Time</Label>
                    <Input
                      value={editingEbookData.delivery_time || ''}
                      onChange={(e) => setEditingEbookData({...editingEbookData, delivery_time: e.target.value})}
                    />
                  </div>
                </div>
              )}
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold">Publisher Information (optional)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Publisher Name</Label>
                    <Input
                      value={editingEbookData.publisher_name || ''}
                      onChange={(e) => setEditingEbookData({...editingEbookData, publisher_name: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Publisher Address</Label>
                    <textarea
                      value={editingEbookData.publisher_address || ''}
                      onChange={(e) => setEditingEbookData({...editingEbookData, publisher_address: e.target.value})}
                      className="w-full px-3 py-2 border rounded-md"
                      rows="2"
                    />
                  </div>
                  <div>
                    <Label>Publisher Email</Label>
                    <Input
                      type="email"
                      value={editingEbookData.publisher_email || ''}
                      onChange={(e) => setEditingEbookData({...editingEbookData, publisher_email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Publisher Phone</Label>
                    <Input
                      value={editingEbookData.publisher_phone || ''}
                      onChange={(e) => setEditingEbookData({...editingEbookData, publisher_phone: e.target.value})}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Publisher Website</Label>
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      value={editingEbookData.publisher_website || ''}
                      onChange={(e) => setEditingEbookData({...editingEbookData, publisher_website: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <div>
                <Label>
                  <input
                    type="checkbox"
                    checked={editingEbookData.copyright_declared || false}
                    onChange={(e) => setEditingEbookData({...editingEbookData, copyright_declared: e.target.checked})}
                  />
                  {' '}Copyright Declared
                </Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => {
                  setEditingEbookId(null);
                  setEditingEbookData(null);
                  setEbookFile(null);
                  setEbookCoverImage(null);
                }}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      )}

      {ebooks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 mb-4">You haven't uploaded any eBooks yet.</p>
            <Button onClick={() => setShowAddForm(true)}>Add Your First eBook</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {ebooks.map((ebook) => (
            <Card key={ebook.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {ebook.cover_image && (
                    <img
                      src={ebook.cover_image}
                      alt={ebook.title}
                      className="w-24 h-32 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{ebook.title}</h3>
                    {ebook.writer && <p className="text-sm text-gray-600 mb-1">By {ebook.writer}</p>}
                    <div className="flex items-center gap-4 text-sm mb-2">
                      <span className="font-semibold text-primary">Rs {parseFloat(ebook.price || 0).toFixed(2)}</span>
                      {ebook.overall_rating > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          {ebook.overall_rating.toFixed(1)}
                        </span>
                      )}
                      <span className="text-gray-600">Sales: {ebook.purchase_count || 0}</span>
                      <span className="text-gray-600">Downloads: {ebook.download_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditEbook(ebook)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteEbook(ebook.id)}
                      >
                        Delete
                      </Button>
                      <span className={`px-2 py-1 rounded text-xs ${
                        ebook.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {ebook.status || 'active'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Photo Crop Modal for eBook Cover */}
      {cropImageFile && cropImageIndex === 'ebook-cover' && (
        <PhotoCropModal
          imageFile={cropImageFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
          minWidth={400}
          minHeight={400}
          fixedSize={{ width: 400, height: 400 }}
        />
      )}
    </div>
  );
}

// My Auctions Section
function MyAuctionsSection({ user }) {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAuction, setEditingAuction] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    category_id: '',
    location_id: '',
    title: '',
    description: '',
    starting_price: '',
    reserve_price: '',
    buy_now_price: '',
    bid_increment: '1.00',
    start_time: '',
    end_time: '',
    self_pickup: false,
    seller_delivery: false,
    financing_available: false,
  });
  const [images, setImages] = useState([null, null, null, null]);
  
  // Categories and locations
  const [categories, setCategories] = useState([]);
  const [locationData, setLocationData] = useState({ provinces: [] });
  
  // Category dropdown state
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('');
  const [selectedItemCategoryId, setSelectedItemCategoryId] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState(new Set());
  const categoryDropdownRef = useRef(null);
  
  // Location dropdown state
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [expandedProvinces, setExpandedProvinces] = useState(new Set());
  const [expandedDistricts, setExpandedDistricts] = useState(new Set());
  const [expandedLocalLevels, setExpandedLocalLevels] = useState(new Set());
  const [expandedWards, setExpandedWards] = useState(new Set());
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const locationDropdownRef = useRef(null);
  
  // Real-time status updates
  const [statusUpdateInterval, setStatusUpdateInterval] = useState(10);

  useEffect(() => {
    fetchAuctions();
    fetchCategories();
    fetchLocations();
  }, []);

  // Real-time status updates
  useEffect(() => {
    if (auctions.length > 0 && !showCreateForm && !editingAuction) {
      const activeAuctionIds = auctions
        .filter(auction => auction.status === 'pending' || auction.status === 'active')
        .map(auction => auction.id);
      
      if (activeAuctionIds.length > 0) {
        const updateStatuses = async () => {
          try {
            const response = await publicAuctionAPI.getAuctionStatuses(activeAuctionIds);
            const statuses = response.data.statuses || {};
            const recommendedInterval = response.data.recommended_interval || 10;
            
            if (recommendedInterval !== statusUpdateInterval) {
              setStatusUpdateInterval(recommendedInterval);
            }
            
            setAuctions(prevAuctions =>
              prevAuctions.map(auction => {
                const newStatus = statuses[auction.id];
                if (newStatus && newStatus !== auction.status) {
                  return { ...auction, status: newStatus };
                }
                return auction;
              })
            );
          } catch (err) {
            console.warn('Failed to update auction statuses:', err);
          }
        };
        
        updateStatuses();
        const interval = setInterval(updateStatuses, statusUpdateInterval * 1000);
        return () => clearInterval(interval);
      }
    }
  }, [auctions.length, statusUpdateInterval, showCreateForm, editingAuction]);

  const fetchAuctions = async () => {
    try {
      setLoading(true);
      const response = await userAuctionAPI.getMyAuctions();
      setAuctions(response.data || []);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      setError('Failed to fetch auctions');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      const categoriesData = response.data || [];
      
      // Transform 3-level structure (domain > field > item) to 2-level structure (category > subcategory)
      // API returns: { id, name, domain_category, field_categories: [...], item_categories: [...] }
      // Code expects: { id, name, subcategories: [...] }
      const categoriesWithSubcategories = [];
      
      if (Array.isArray(categoriesData)) {
        categoriesData.forEach((domainCategory) => {
          // Domain category becomes main category
          const mainCategory = {
            id: domainCategory.id,
            name: domainCategory.domain_category || domainCategory.name,
            subcategories: []
          };
          
          // Field categories become subcategories
          if (domainCategory.field_categories && Array.isArray(domainCategory.field_categories)) {
            domainCategory.field_categories.forEach((fieldCategory) => {
              mainCategory.subcategories.push({
                id: fieldCategory.id,
                name: fieldCategory.field_category || fieldCategory.name,
                // Store item categories for selection
                item_categories: fieldCategory.item_categories || []
              });
            });
          }
          
          // If domain has direct item categories (no field categories), create a subcategory for them
          if (domainCategory.item_categories && Array.isArray(domainCategory.item_categories) && domainCategory.item_categories.length > 0) {
            if (mainCategory.subcategories.length === 0) {
              // If no field categories, create a single subcategory for direct item categories
              mainCategory.subcategories.push({
                id: domainCategory.item_categories[0].id, // Use first item category ID
                name: domainCategory.domain_category || domainCategory.name, // Use domain name as subcategory name
                item_categories: domainCategory.item_categories
              });
            }
          }
          
          if (mainCategory.subcategories.length > 0 || domainCategory.item_categories?.length > 0) {
            categoriesWithSubcategories.push(mainCategory);
          }
        });
      }
      
      setCategories(categoriesWithSubcategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
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

  const handleCreateAuction = () => {
    // Check if user is verified seller
    if (!user?.seller_verified) {
      setError('You must be a verified seller to create auctions. Please complete seller verification first.');
      setTimeout(() => setError(null), 8000);
      return;
    }
    
    setShowCreateForm(true);
    setEditingAuction(null);
    resetForm();
  };

  const handleEditAuction = (auction) => {
    if (auction.status !== 'pending') {
      setError('Auction can only be edited when status is pending');
      setTimeout(() => setError(null), 5000);
      return;
    }
    
    setEditingAuction(auction);
    setShowCreateForm(true);
    
    // Populate form with auction data
    setFormData({
      category_id: auction.category_id || '',
      location_id: auction.location_id || '',
      title: auction.title || '',
      description: auction.description || '',
      starting_price: auction.starting_price || '',
      reserve_price: auction.reserve_price || '',
      buy_now_price: auction.buy_now_price || '',
      bid_increment: auction.bid_increment || '1.00',
      start_time: auction.start_time ? new Date(auction.start_time).toISOString().slice(0, 16) : '',
      end_time: auction.end_time ? new Date(auction.end_time).toISOString().slice(0, 16) : '',
      self_pickup: auction.self_pickup || false,
      seller_delivery: auction.seller_delivery || false,
      financing_available: auction.financing_available || false,
    });
    
    // Set images (would need to load existing images)
    setImages([null, null, null, null]);
    
    // Initialize category selection (similar to AdminPanel logic)
    // This is simplified - you'd need full category initialization logic here
  };

  const handleDeleteAuction = async (id) => {
    if (!window.confirm('Are you sure you want to delete this auction? This cannot be undone.')) return;
    
    try {
      await userAuctionAPI.deleteAuction(id);
      setSuccess('Auction deleted successfully');
      fetchAuctions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete auction: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleEndAuction = async (id) => {
    if (!window.confirm('Are you sure you want to end this auction? The winner will be determined automatically.')) return;
    
    try {
      await userAuctionAPI.endAuction(id);
      setSuccess('Auction ended successfully');
      fetchAuctions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to end auction: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 5000);
    }
  };

  const resetForm = () => {
    setFormData({
      category_id: '',
      location_id: '',
      title: '',
      description: '',
      starting_price: '',
      reserve_price: '',
      buy_now_price: '',
      bid_increment: '1.00',
      start_time: '',
      end_time: '',
      self_pickup: false,
      seller_delivery: false,
      financing_available: false,
    });
    setImages([null, null, null, null]);
    setSelectedCategoryName('');
    setSelectedSubcategoryId('');
    setSelectedItemCategoryId('');
  };

  const handleSubmitAuction = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Check if user is verified seller (double-check on frontend)
    if (!user?.seller_verified) {
      setError('You must be a verified seller to create auctions. Please complete seller verification first.');
      setTimeout(() => {
        setError(null);
        navigate('/user_dashboard/e-wallet');
      }, 5000);
      return;
    }
    
    // Validate category_id (handlers should set formData.category_id, matching AdminPanel pattern)
    // Use formData.category_id directly like AdminPanel does, with fallback to selectedItemCategoryId/selectedSubcategoryId
    const finalCategoryId = formData.category_id || selectedItemCategoryId || selectedSubcategoryId;
    
    // Debug logging
    console.log('Form submission - category_id check:', {
      'formData.category_id': formData.category_id,
      'selectedItemCategoryId': selectedItemCategoryId,
      'selectedSubcategoryId': selectedSubcategoryId,
      'finalCategoryId': finalCategoryId
    });
    
    if (!finalCategoryId || finalCategoryId.toString().trim() === '') {
      setError('Please select a category');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      // Build data object (userAuctionAPI.createAuction expects a plain object, not FormData)
      const categoryIdValue = finalCategoryId.toString().trim();
      
      if (!categoryIdValue) {
        setError('Category ID is invalid. Please select a category again.');
        setTimeout(() => setError(null), 3000);
        return;
      }
      
      // Convert datetime-local to UTC ISO string for proper timezone handling
      // datetime-local gives us local time without timezone, we need to convert to UTC
      const startTimeUTC = localDateTimeToUTC(formData.start_time);
      const endTimeUTC = localDateTimeToUTC(formData.end_time);
      
      if (!startTimeUTC || !endTimeUTC) {
        setError('Start time and end time are required');
        setTimeout(() => setError(null), 3000);
        return;
      }

      const dataToSubmit = {
        category_id: categoryIdValue,
        title: formData.title,
        description: formData.description,
        starting_price: formData.starting_price,
        start_time: startTimeUTC,
        end_time: endTimeUTC,
        self_pickup: formData.self_pickup ? '1' : '0',
        seller_delivery: formData.seller_delivery ? '1' : '0',
        financing_available: formData.financing_available ? '1' : '0',
      };
      
      // Optional fields
      if (formData.location_id) dataToSubmit.location_id = formData.location_id;
      if (formData.reserve_price) dataToSubmit.reserve_price = formData.reserve_price;
      if (formData.buy_now_price) dataToSubmit.buy_now_price = formData.buy_now_price;
      if (formData.bid_increment) dataToSubmit.bid_increment = formData.bid_increment;
      
      // Add images array
      const imageFiles = images.filter(img => img !== null);
      if (imageFiles.length > 0) {
        dataToSubmit.images = imageFiles;
      }
      
      // Debug: Log what we're sending
      console.log('Submitting data with category_id:', categoryIdValue);
      console.log('Full data object:', dataToSubmit);
      
      if (editingAuction) {
        await userAuctionAPI.updateAuction(editingAuction.id, dataToSubmit);
        setSuccess('Auction updated successfully');
      } else {
        await userAuctionAPI.createAuction(dataToSubmit);
        setSuccess('Auction created successfully');
      }
      
      setShowCreateForm(false);
      setEditingAuction(null);
      resetForm();
      fetchAuctions();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      setError('Failed to ' + (editingAuction ? 'update' : 'create') + ' auction: ' + errorMsg);
      setTimeout(() => setError(null), 8000);
    }
  };

  const handleAuctionClick = (auction) => {
    navigate(`/auctions/${auction.slug || auction.id}`);
  };

  // Crop modal state
  const [cropImageIndex, setCropImageIndex] = useState(null);
  const [cropImageFile, setCropImageFile] = useState(null);

  // Category selection helper functions (similar to AdminPanel)
  const getSelectedCategory = () => {
    if (!selectedCategoryName) return null;
    return categories.find(c => c.name === selectedCategoryName);
  };

  const toggleCategory = (categoryName) => {
    const trimmedName = (categoryName || '').trim();
    if (!trimmedName) return;
    
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trimmedName)) {
        newSet.delete(trimmedName);
      } else {
        newSet.add(trimmedName);
      }
      return newSet;
    });
  };

  const toggleSubcategory = (subcategoryName) => {
    const trimmedName = (subcategoryName || '').trim();
    if (!trimmedName) return;
    
    setExpandedSubcategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trimmedName)) {
        newSet.delete(trimmedName);
      } else {
        newSet.add(trimmedName);
      }
      return newSet;
    });
  };

  const handleCategorySelect = (categoryId, categoryName, hasSubcategories = false) => {
    const trimmedCategoryName = (categoryName || '').trim();
    
    // Update selection state
    setSelectedCategoryName(trimmedCategoryName);
    setSelectedSubcategoryId('');
    setSelectedItemCategoryId('');
    setFormData(prev => ({...prev, category_id: categoryId.toString()}));
    
    // Only close dropdown if category has no subcategories (leaf node)
    // Expansion is handled explicitly in onClick handler
    if (!hasSubcategories) {
      setShowCategoryDropdown(false);
    }
  };

  const handleSubcategorySelect = (subcategoryId, subcategoryName, hasItemCategories = false) => {
    const category = getSelectedCategory();
    if (category) {
      // Update selection state
      setSelectedSubcategoryId(subcategoryId.toString());
      setSelectedItemCategoryId('');
      setFormData(prev => ({...prev, category_id: subcategoryId.toString()}));
      
      // Only close dropdown if subcategory has no item categories (leaf node)
      // Expansion is handled explicitly in onClick handler
      if (!hasItemCategories) {
        setShowCategoryDropdown(false);
      }
    }
  };

  const handleItemCategorySelect = (itemCategoryId, categoryName, subcategoryId) => {
    const itemIdStr = itemCategoryId.toString();
    console.log('handleItemCategorySelect called:', { itemCategoryId, itemIdStr, categoryName, subcategoryId });
    if (categoryName) setSelectedCategoryName(categoryName);
    if (subcategoryId) setSelectedSubcategoryId(subcategoryId.toString());
    setSelectedItemCategoryId(itemIdStr);
    setFormData(prev => {
      const updated = {...prev, category_id: itemIdStr};
      console.log('Updated formData.category_id to:', itemIdStr, 'Full formData:', updated);
      return updated;
    });
    // Item categories are always leaf nodes, so close dropdown
    setShowCategoryDropdown(false);
  };

  const buildCategoryString = () => {
    if (selectedItemCategoryId) {
      const category = getSelectedCategory();
      if (category && selectedSubcategoryId) {
        const subcategory = category.subcategories?.find(s => s.id === parseInt(selectedSubcategoryId));
        if (subcategory && subcategory.item_categories) {
          const itemCategory = subcategory.item_categories.find(item => item.id === parseInt(selectedItemCategoryId));
          if (itemCategory) {
            const itemName = itemCategory.item_category || itemCategory.name;
            return `${category.name} > ${subcategory.name} > ${itemName}`;
          }
        }
      }
    }
    if (selectedSubcategoryId) {
      const category = getSelectedCategory();
      const subcategory = category?.subcategories?.find(s => s.id === parseInt(selectedSubcategoryId));
      if (category && subcategory) {
        return `${category.name} > ${subcategory.name}`;
      }
    }
    if (selectedCategoryName) {
      const category = getSelectedCategory();
      if (category) {
        return category.name;
      }
    }
    return '';
  };

  // Image handling with crop
  const handleImageChange = (index, file) => {
    if (file && file.type.startsWith('image/')) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        setTimeout(() => setError(null), 3000);
        return;
      }
      setCropImageIndex(index);
      setCropImageFile(file);
    } else {
      setError('Please select a valid image file');
      setTimeout(() => setError(null), 3000);
    }
  };

  const compressImage = (file, maxWidth = 1920, maxHeight = 1920, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

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
              if (!blob) {
                reject(new Error('Compression failed'));
                return;
              }
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            file.type,
            quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
    });
  };

  const handleCropComplete = async (croppedFile) => {
    if (cropImageIndex === null) return;
    
    const img = new Image();
    const objectUrl = URL.createObjectURL(croppedFile);
    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      if (img.width !== 400 || img.height !== 400) {
        alert('Image must be exactly 400x400 pixels. Please crop again.');
        return;
      }
      
      let processedFile = croppedFile;
      if (croppedFile.size > 1024 * 1024) {
        try {
          processedFile = await compressImage(croppedFile);
        } catch (err) {
          console.error('Error compressing image:', err);
        }
      }
      
      const newImages = [...images];
      newImages[cropImageIndex] = processedFile;
      setImages(newImages);
      
      setCropImageIndex(null);
      setCropImageFile(null);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      alert('Error processing image. Please try again.');
    };
    img.src = objectUrl;
  };

  const handleCropCancel = () => {
    setCropImageIndex(null);
    setCropImageFile(null);
  };

  // Location handling (simplified - can expand later)
  const buildLocationString = () => {
    if (!selectedLocationId) return '';
    // Would need to traverse location hierarchy - simplified for now
    return selectedLocationId;
  };

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Auctions</h1>
        {user?.seller_verified ? (
          <Button onClick={handleCreateAuction}>Create Auction</Button>
        ) : (
          <div className="flex items-center gap-4">
            <Card className="border-yellow-500 bg-yellow-50">
              <CardContent className="p-3">
                <p className="text-sm text-yellow-800">
                  Seller verification required to create auctions
                </p>
              </CardContent>
            </Card>
            <Button onClick={() => navigate('/user_dashboard/e-wallet')}>
              Verify Now
            </Button>
          </div>
        )}
      </div>

      {error && (
        <Card className="mb-4 border-red-500">
          <CardContent className="p-4 bg-red-50 text-red-800">
            {error}
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="mb-4 border-green-500">
          <CardContent className="p-4 bg-green-50 text-green-800">
            {success}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Auction Form */}
      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editingAuction ? 'Edit Auction' : 'Create New Auction'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitAuction} className="space-y-4">
              {/* Category Selection */}
              <div>
                <Label>Category *</Label>
                <div className="relative" ref={categoryDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="w-full px-3 py-2 text-left border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] flex items-center justify-between"
                  >
                    <span>{buildCategoryString() || 'Select Category'}</span>
                    <span className="ml-2">{showCategoryDropdown ? '▼' : '▶'}</span>
                  </button>
                  
                  {showCategoryDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-md shadow-lg z-50 w-[325px] max-h-[500px] overflow-y-auto">
                      <div className="p-3">
                        <div className="space-y-1">
                          {categories.map((category) => {
                            const subcategories = category.subcategories || [];
                            const hasSubcategories = subcategories.length > 0;
                            const categoryName = (category.name || '').trim();
                            const isCategoryExpanded = categoryName ? expandedCategories.has(categoryName) : false;
                            const isCategorySelected = selectedCategoryName === categoryName && !selectedSubcategoryId && !selectedItemCategoryId;
                            
                            return (
                              <div key={category.id} className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2 flex-1">
                                    {hasSubcategories ? (
                                      <div className="flex items-center space-x-2 flex-1">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleCategory(categoryName);
                                          }}
                                          className="text-xs text-[hsl(var(--muted-foreground))] px-1"
                                        >
                                          {isCategoryExpanded ? '▼' : '▶'}
                                        </button>
                                        <div className="flex items-center space-x-2 flex-1">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // Expand first, then select
                                              if (hasSubcategories && !isCategoryExpanded) {
                                                toggleCategory(categoryName);
                                              }
                                              handleCategorySelect(category.id, categoryName, hasSubcategories);
                                            }}
                                            className={`flex-1 text-left text-sm ${
                                              isCategorySelected
                                                ? 'text-[hsl(var(--primary))] font-medium'
                                                : 'text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]'
                                            }`}
                                          >
                                            {category.name}
                                          </button>
                                          {isCategorySelected && (
                                            <span className="text-xs text-[hsl(var(--primary))]">✓</span>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCategorySelect(category.id, categoryName, false);
                                        }}
                                        className={`flex-1 text-left text-sm ${
                                          isCategorySelected
                                            ? 'text-[hsl(var(--primary))] font-medium'
                                            : 'text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]'
                                        }`}
                                      >
                                        {category.name}
                                      </button>
                                    )}
                                  </div>
                                </div>
                                
                                {hasSubcategories && isCategoryExpanded && (
                                  <div className="ml-5 pl-2 border-l-2 border-[hsl(var(--border))] space-y-1 mt-1">
                                    {subcategories.map((subcategory) => {
                                      const itemCategories = subcategory.item_categories || [];
                                      const hasItemCategories = itemCategories.length > 0;
                                      const subcategoryName = (subcategory.name || '').trim();
                                      const isSubcategoryExpanded = subcategoryName ? expandedSubcategories.has(subcategoryName) : false;
                                      const subcategoryIdStr = subcategory.id.toString();
                                      const isSubcategorySelected = selectedSubcategoryId === subcategoryIdStr && !selectedItemCategoryId;
                                      
                                      return (
                                        <div key={subcategory.id} className="space-y-1">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2 flex-1">
                                              {hasItemCategories ? (
                                                <div className="flex items-center space-x-2 flex-1">
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      toggleSubcategory(subcategoryName);
                                                    }}
                                                    className="text-xs text-[hsl(var(--muted-foreground))] px-1"
                                                  >
                                                    {isSubcategoryExpanded ? '▼' : '▶'}
                                                  </button>
                                                  <div className="flex items-center space-x-2 flex-1">
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Expand first, then select
                                                        if (hasItemCategories && !isSubcategoryExpanded) {
                                                          toggleSubcategory(subcategoryName);
                                                        }
                                                        handleSubcategorySelect(subcategory.id, subcategoryName, hasItemCategories);
                                                      }}
                                                      className={`flex-1 text-left text-sm ${
                                                        isSubcategorySelected
                                                          ? 'text-[hsl(var(--primary))] font-medium'
                                                          : 'text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]'
                                                      }`}
                                                    >
                                                      {subcategory.name}
                                                    </button>
                                                    {isSubcategorySelected && (
                                                      <span className="text-xs text-[hsl(var(--primary))]">✓</span>
                                                    )}
                                                  </div>
                                                </div>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSubcategorySelect(subcategory.id, subcategoryName, false);
                                                  }}
                                                  className={`flex-1 text-left text-sm ${
                                                    isSubcategorySelected
                                                      ? 'text-[hsl(var(--primary))] font-medium'
                                                      : 'text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))]'
                                                  }`}
                                                >
                                                  {subcategory.name}
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                          
                                          {hasItemCategories && isSubcategoryExpanded && (
                                            <div className="ml-5 pl-2 border-l-2 border-[hsl(var(--border))] space-y-1 mt-1">
                                              {itemCategories.map((itemCategory) => {
                                                const itemCategoryIdStr = itemCategory.id.toString();
                                                const isItemCategorySelected = selectedItemCategoryId === itemCategoryIdStr;
                                                const itemName = itemCategory.item_category || itemCategory.name;
                                                
                                                return (
                                                  <div key={itemCategory.id} className="flex items-center space-x-2">
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleItemCategorySelect(itemCategory.id, categoryName, subcategory.id);
                                                      }}
                                                      className={`flex-1 text-left text-sm px-2 py-1 rounded ${
                                                        isItemCategorySelected
                                                          ? 'text-[hsl(var(--primary))] font-medium bg-[hsl(var(--primary))]/10'
                                                          : 'text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--accent))]'
                                                      }`}
                                                    >
                                                      {itemName}
                                                    </button>
                                                    {isItemCategorySelected && (
                                                      <span className="text-xs text-[hsl(var(--primary))]">✓</span>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  maxLength={90}
                />
              </div>
              
              <div>
                <Label>Description *</Label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                  className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                  maxLength={2000}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Starting Price *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.starting_price}
                    onChange={(e) => setFormData({...formData, starting_price: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Bid Increment</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.bid_increment}
                    onChange={(e) => setFormData({...formData, bid_increment: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Reserve Price (Optional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.reserve_price}
                    onChange={(e) => setFormData({...formData, reserve_price: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Buy Now Price (Optional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.buy_now_price}
                    onChange={(e) => setFormData({...formData, buy_now_price: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>End Time *</Label>
                  <Input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Images (up to 4) *</Label>
                <div className="grid grid-cols-4 gap-2">
                  {images.map((img, index) => (
                    <div key={index} className="space-y-2">
                      {img ? (
                        <div className="relative">
                          <img
                            src={URL.createObjectURL(img)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1"
                            onClick={() => {
                              const newImages = [...images];
                              newImages[index] = null;
                              setImages(newImages);
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      ) : (
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              handleImageChange(index, file);
                            }
                            e.target.value = '';
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Images will be cropped to 400x400 pixels. Max size: 10MB per image.
                </p>
              </div>

              <div className="flex gap-4">
                <Button type="submit">{editingAuction ? 'Update Auction' : 'Create Auction'}</Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowCreateForm(false);
                  setEditingAuction(null);
                  resetForm();
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Photo Crop Modal */}
      {cropImageFile && (
        <PhotoCropModal
          imageFile={cropImageFile}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
          fixedSize={{ width: 400, height: 400 }}
        />
      )}
      
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p>Loading auctions...</p>
          </CardContent>
        </Card>
      ) : auctions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600 mb-4">You haven't created any auctions yet.</p>
            {user?.seller_verified ? (
              <Button className="mt-4" onClick={handleCreateAuction}>Create Your First Auction</Button>
            ) : (
              <div className="space-y-4">
                <Card className="border-yellow-500 bg-yellow-50 mx-auto max-w-md">
                  <CardContent className="p-4">
                    <p className="text-yellow-800 mb-3">
                      You need to be a verified seller to create auctions. Complete seller verification to get started.
                    </p>
                    <Button onClick={() => navigate('/user_dashboard/e-wallet')}>
                      Complete Verification
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map(auction => (
            <Card key={auction.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <img
                  src={auction.image || 'https://via.placeholder.com/300x300?text=No+Image'}
                  alt={auction.title}
                  className="w-full h-48 object-cover rounded-t-lg cursor-pointer"
                  onClick={() => handleAuctionClick(auction)}
                />
                <div className="p-4">
                  <h3 
                    className="font-semibold text-lg mb-2 line-clamp-2 cursor-pointer hover:text-blue-600"
                    onClick={() => handleAuctionClick(auction)}
                  >
                    {auction.title}
                  </h3>
                  <p className="text-xl font-bold text-blue-600 mb-2">
                    Rs. {auction.current_bid_price?.toLocaleString() || auction.starting_price?.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    {auction.bid_count || 0} bid{auction.bid_count !== 1 ? 's' : ''}
                  </p>
                  
                  {auction.winner && (
                    <div className="mb-2 p-2 bg-green-50 rounded">
                      <p className="text-sm font-semibold text-green-800">
                        Winner: {auction.winner.name}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      auction.status === 'active' ? 'bg-green-100 text-green-800' :
                      auction.status === 'ended' ? 'bg-gray-100 text-gray-800' :
                      auction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {auction.status}
                    </span>
                    <p className="text-sm text-gray-500">{auction.time_remaining || 'N/A'}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {auction.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAuction(auction);
                        }}
                      >
                        Edit
                      </Button>
                    )}
                    {auction.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAuction(auction.id);
                        }}
                      >
                        Delete
                      </Button>
                    )}
                    {(auction.status === 'active' || auction.status === 'pending') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEndAuction(auction.id);
                        }}
                      >
                        End Auction
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAuctionClick(auction);
                      }}
                    >
                      View
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

// My Bids Section
function MyBidsSection({ user }) {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBids();
  }, []);

  const fetchBids = async () => {
    try {
      setLoading(true);
      const response = await userAuctionAPI.getMyBids();
      setBids(response.data || []);
    } catch (error) {
      console.error('Error fetching bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuctionClick = (auction) => {
    navigate(`/auctions/${auction.slug || auction.id}`);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">My Bids</h1>
      
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p>Loading bids...</p>
          </CardContent>
        </Card>
      ) : bids.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">You haven't placed any bids yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {bids.map((bidGroup, index) => (
            <Card
              key={index}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleAuctionClick(bidGroup.auction)}
            >
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <img
                    src={bidGroup.auction.image || 'https://via.placeholder.com/150x150?text=No+Image'}
                    alt={bidGroup.auction.title}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{bidGroup.auction.title}</h3>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Current Bid</p>
                        <p className="text-lg font-bold text-blue-600">
                          Rs. {bidGroup.current_bid?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Your Highest Bid</p>
                        <p className="text-lg font-bold">
                          Rs. {bidGroup.my_highest_bid.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        bidGroup.auction.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {bidGroup.auction.status}
                      </span>
                      {bidGroup.my_highest_bid.is_winning ? (
                        <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800 font-medium">
                          ✓ You are winning!
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800 font-medium">
                          You have been outbid
                        </span>
                      )}
                      <p className="text-sm text-gray-500">{bidGroup.auction.time_remaining}</p>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {bidGroup.my_bids.length} bid{bidGroup.my_bids.length !== 1 ? 's' : ''} placed
                    </p>
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

// Won Auctions Section
function WonAuctionsSection({ user }) {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWonAuctions();
  }, []);

  const fetchWonAuctions = async () => {
    try {
      setLoading(true);
      const response = await userAuctionAPI.getWonAuctions();
      setAuctions(response.data || []);
    } catch (error) {
      console.error('Error fetching won auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuctionClick = (auction) => {
    navigate(`/auctions/${auction.slug || auction.id}`);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Won Auctions</h1>
      
      {loading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p>Loading won auctions...</p>
          </CardContent>
        </Card>
      ) : auctions.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600">You haven't won any auctions yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auctions.map(auction => (
            <Card
              key={auction.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleAuctionClick(auction)}
            >
              <CardContent className="p-0">
                <img
                  src={auction.image || 'https://via.placeholder.com/300x300?text=No+Image'}
                  alt={auction.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">{auction.title}</h3>
                  <p className="text-xl font-bold text-green-600 mb-2">
                    Won for: Rs. {auction.winning_bid_amount?.toLocaleString()}
                  </p>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      auction.payment_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {auction.payment_completed ? 'Payment Completed' : 'Payment Pending'}
                    </span>
                  </div>
                  {auction.seller && (
                    <p className="text-sm text-gray-600">
                      Seller: {auction.seller.name}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    Won on: {new Date(auction.won_at).toLocaleDateString()}
                  </p>
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

