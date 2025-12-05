import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import Layout from './Layout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { profileAPI, dashboardAPI, userAdAPI } from '../utils/api';
import axios from 'axios';

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
        locationSet.add(userData.location_id);
        if (userData.selected_local_address && userData.selected_local_address !== '__LOCAL_LEVEL_ONLY__') {
          // Add local address ID if exists
          const addressId = `${userData.location_id}-${userData.selected_local_address}`;
          locationSet.add(addressId);
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
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'profile_picture' && files && files[0]) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  // Handle location toggle (simplified - single location selection)
  const handleLocationToggle = (locationId) => {
    setSelectedLocations(new Set([locationId]));
  };

  // Build location string for display
  const buildLocationString = () => {
    if (selectedLocations.size === 0) return 'Select location';
    // For now, just show "Location selected" - can enhance later
    return `${selectedLocations.size} location selected`;
  };

  // Save profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      if (formData.dob) formDataToSend.append('dob', formData.dob);
      if (formData.phone) formDataToSend.append('phone', formData.phone);
      if (formData.profile_picture) formDataToSend.append('profile_picture', formData.profile_picture);

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

      const response = await profileAPI.updateProfile(formDataToSend);
      setSuccess('Profile updated successfully!');
      setProfileData(response.data.user);
      // Update auth context if needed
      setTimeout(() => {
        setSuccess(null);
        window.location.reload(); // Refresh to update user context
      }, 2000);
    } catch (err) {
      setError('Failed to update profile: ' + (err.response?.data?.message || err.message));
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

            {/* Location - Simplified for now */}
            <div>
              <Label>Address</Label>
              <div className="relative mt-1" ref={locationDropdownRef}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                  className="w-full justify-between"
                >
                  <span>{buildLocationString()}</span>
                  <span>{showLocationDropdown ? '▲' : '▼'}</span>
                </Button>
                {showLocationDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    <div className="p-2">
                      <p className="text-xs text-[hsl(var(--muted-foreground))] p-2">
                        Location selection - Full implementation coming soon
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] p-2">
                        Current: {profileData?.locationRelation ? 
                          `${profileData.locationRelation.province || ''} > ${profileData.locationRelation.district || ''} > ${profileData.locationRelation.local_level || ''}` 
                          : 'Not set'}
                      </p>
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

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-[hsl(var(--muted-foreground))]">Account Created:</span>
            <span className="text-[hsl(var(--foreground))]">
              {profileData?.created_at ? new Date(profileData.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[hsl(var(--muted-foreground))]">Last Login:</span>
            <span className="text-[hsl(var(--foreground))]">
              {profileData?.last_login_at ? new Date(profileData.last_login_at).toLocaleString() : 'Never'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[hsl(var(--muted-foreground))]">Email Verified:</span>
            <span className="text-[hsl(var(--foreground))]">
              {profileData?.is_verified ? '✓ Yes' : '✗ No'}
            </span>
          </div>
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
    
    // Compress image if it's larger than 1MB
    let processedFile = file;
    if (file.size > 1024 * 1024) { // 1MB
      try {
        processedFile = await compressImage(file);
      } catch (err) {
        console.error('Error compressing image:', err);
        // Use original file if compression fails
      }
    }
    
    const newImages = [...images];
    newImages[index] = processedFile;
    setImages(newImages);
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
      const locationId = selectedLocations.size > 0 ? Array.from(selectedLocations)[0] : null;

      // Prepare form data
      const submitData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category_id: parseInt(formData.category_id),
        location_id: locationId,
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
                                          checked={selectedLocations.has(ward.id)}
                                          onChange={() => handleLocationToggle(ward.id)}
                                          className="mr-2"
                                        />
                                        <span>Ward {ward.ward_number || 'N/A'}</span>
                                      </label>
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
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                        >
                          ×
                        </button>
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
    if (ad.location_id) {
      setSelectedLocations(new Set([ad.location_id]));
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
      const locationId = selectedLocations.size > 0 ? Array.from(selectedLocations)[0] : null;
      
      const updateData = {
        ...editingAdData,
        location_id: locationId,
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
            <Button onClick={() => window.location.href = '/dashboard/ad-post'}>Post Your First Ad</Button>
          </CardContent>
        </Card>
      ) : (
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
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-semibold text-[hsl(var(--foreground))]">Rs. {parseFloat(ad.price || 0).toLocaleString()}</span>
                        <span className="text-[hsl(var(--muted-foreground))]">Views: {ad.views || 0}</span>
                        <span className={`px-2 py-1 rounded ${ad.item_sold ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {ad.item_sold ? 'Sold' : 'Active'}
                        </span>
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
      )}
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

