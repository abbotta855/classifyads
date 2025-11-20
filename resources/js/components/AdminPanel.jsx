import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from './Layout';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';

function AdminPanel() {
  const { user } = useAuth();
  const { section } = useParams();
  const navigate = useNavigate();
  const activeSection = section || 'admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const locationDropdownRef = useRef(null);

  // Search location hierarchy state
  const [searchLocationHierarchy, setSearchLocationHierarchy] = useState({
    province: '',
    district: '',
    localLevel: '',
    ward: ''
  });

  // Mock location data structure - Same as homepage
  const locationData = {
    provinces: [
      {
        id: 1,
        name: 'Province 1',
        districts: [
          {
            id: 1,
            name: 'Morang',
            localLevels: [
              { id: 1, name: 'Biratnagar', type: 'municipality', wards: [{ ward_id: 1, ward_number: 32 }, { ward_id: 1, ward_number: 19 }] },
              { id: 2, name: 'Itahari', type: 'municipality', wards: [{ ward_id: 1, ward_number: 9 }] },
              { id: 3, name: 'Ratuwamai', type: 'rural_municipality', wards: [{ ward_id: 1, ward_number: 9 }] }
            ]
          }
        ]
      },
      {
        id: 2,
        name: 'Province 2',
        districts: [
          {
            id: 2,
            name: 'Dhanusha',
            localLevels: [
              { id: 4, name: 'Janakpur', type: 'municipality', wards: [{ ward_id: 1, ward_number: 25 }] },
              { id: 5, name: 'Dhanusadham', type: 'rural_municipality', wards: [{ ward_id: 1, ward_number: 9 }] }
            ]
          }
        ]
      },
      {
        id: 3,
        name: 'Bagmati Province',
        districts: [
          {
            id: 3,
            name: 'Kathmandu',
            localLevels: [
              { id: 6, name: 'Kathmandu', type: 'municipality', wards: [{ ward_id: 1, ward_number: 32 }, { ward_id: 2, ward_number: 15 }] },
              { id: 7, name: 'Lalitpur', type: 'municipality', wards: [{ ward_id: 1, ward_number: 29 }] }
            ]
          }
        ]
      }
    ]
  };

  // Helper functions for search location hierarchy
  const getSearchProvince = () => {
    if (!searchLocationHierarchy.province) return null;
    return locationData.provinces.find(p => p.id === parseInt(searchLocationHierarchy.province));
  };

  const getSearchDistrict = () => {
    const province = getSearchProvince();
    if (!province || !searchLocationHierarchy.district) return null;
    return province.districts.find(d => d.id === parseInt(searchLocationHierarchy.district));
  };

  const getSearchLocalLevel = () => {
    const district = getSearchDistrict();
    if (!district || !searchLocationHierarchy.localLevel) return null;
    return district.localLevels.find(ll => ll.id === parseInt(searchLocationHierarchy.localLevel));
  };

  const handleSearchLocationChange = (level, value) => {
    setSearchLocationHierarchy(prev => {
      const newHierarchy = { ...prev };
      newHierarchy[level] = value;
      
      // Reset all dependent levels when a parent level changes
      const levels = ['province', 'district', 'localLevel', 'ward'];
      const currentIndex = levels.indexOf(level);
      for (let i = currentIndex + 1; i < levels.length; i++) {
        newHierarchy[levels[i]] = '';
      }
      
      return newHierarchy;
    });
  };

  const buildSearchLocationString = () => {
    const parts = [];
    if (searchLocationHierarchy.province) {
      const province = getSearchProvince();
      if (province) parts.push(province.name);
    }
    if (searchLocationHierarchy.district) {
      const district = getSearchDistrict();
      if (district) parts.push(district.name);
    }
    if (searchLocationHierarchy.localLevel) {
      const localLevel = getSearchLocalLevel();
      if (localLevel) parts.push(localLevel.name);
    }
    if (searchLocationHierarchy.ward) {
      const localLevel = getSearchLocalLevel();
      if (localLevel) {
        const ward = localLevel.wards.find(w => w.ward_id === parseInt(searchLocationHierarchy.ward.split('-')[0]) && w.ward_number === parseInt(searchLocationHierarchy.ward.split('-')[1]));
        if (ward) parts.push(`Ward ${ward.ward_id}-${ward.ward_number}`);
      }
    }
    return parts.length > 0 ? parts.join(', ') : '';
  };

  const fetchCategories = async () => {
    try {
      const response = await window.axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Close location dropdown when clicking outside
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

  const menuItems = [
    { id: 'super-admin', label: 'Super Admin' },
    { id: 'admin', label: 'Admin' },
    { id: 'change-password', label: 'Change password' },
    { id: 'user-management', label: 'User Management' },
    { id: 'ad-management', label: 'Ad management' },
    { id: 'category-management', label: 'Category Management' },
    { id: 'transaction-management', label: 'Transaction Management' },
    { id: 'sales-report', label: 'Sales Report' },
    { id: 'auction-management', label: 'Auction Management' },
    { id: 'job', label: 'Job' },
    { id: 'stock-management', label: 'Stock management' },
    { id: 'rating-review', label: 'Rating/review' },
    { id: 'offer-discount', label: 'Offer/Discount' },
    { id: 'email-subscriber', label: 'Email subscriber list' },
    { id: 'support-management', label: 'Support Management' },
  ];

  return (
    <Layout showFooter={false}>
      <div className="flex gap-6 max-w-7xl mx-auto">
        {/* Left Sidebar - Admin Navigation */}
        <aside className="w-64 flex-shrink-0 hidden lg:block">
          <Card>
            <CardContent className="p-4">
              <h2 className="text-lg font-bold text-[hsl(var(--foreground))] mb-4">Admin Dashboard</h2>
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.id}
                    to={`/admin/${item.id}`}
                    className={`block w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                      activeSection === item.id
                        ? 'bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] font-medium'
                        : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1">
          {/* Search and Filter Section */}
          <section className="mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-2 flex-wrap items-center">
                  <Input
                    type="text"
                    placeholder="Enter keyword"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 min-w-[200px] bg-[hsl(var(--background))]"
                  />
                  <select
                    value={searchCategory}
                    onChange={(e) => setSearchCategory(e.target.value)}
                    className="px-3 py-2 border-0 rounded-md bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] min-w-[150px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {/* Location Selection - Cascading nested menu */}
                  <div className="relative min-w-[150px]" ref={locationDropdownRef}>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                        className="w-full px-3 py-2 text-left border-0 rounded-md bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] flex items-center justify-between"
                      >
                        <span>{buildSearchLocationString() || 'All Locations'}</span>
                        <span className="ml-2">{showLocationDropdown ? '▼' : '▶'}</span>
                      </button>
                      
                      {/* Cascading Menu */}
                      {showLocationDropdown && (
                        <div className="absolute top-full left-0 mt-1 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-md shadow-lg z-50 flex">
                          {/* Province Column */}
                          <div className="min-w-[200px] max-h-96 overflow-y-auto border-r border-[hsl(var(--border))]">
                            <div className="p-2 font-semibold text-xs text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                              Province
                            </div>
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  handleSearchLocationChange('province', '');
                                  setShowLocationDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-[hsl(var(--accent))] ${
                                  !searchLocationHierarchy.province ? 'bg-[hsl(var(--accent))]' : ''
                                }`}
                              >
                                All Locations
                              </button>
                              {locationData.provinces.map((province) => (
                                <button
                                  key={province.id}
                                  onClick={() => handleSearchLocationChange('province', province.id.toString())}
                                  onMouseEnter={() => {
                                    if (searchLocationHierarchy.province !== province.id.toString()) {
                                      handleSearchLocationChange('province', province.id.toString());
                                    }
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[hsl(var(--accent))] flex items-center justify-between ${
                                    searchLocationHierarchy.province === province.id.toString() ? 'bg-[hsl(var(--accent))]' : ''
                                  }`}
                                >
                                  <span>{province.name}</span>
                                  {province.districts.length > 0 && <span>▶</span>}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          {/* District Column - appears when province is selected */}
                          {searchLocationHierarchy.province && getSearchProvince() && (
                            <div className="min-w-[200px] max-h-96 overflow-y-auto border-r border-[hsl(var(--border))]">
                              <div className="p-2 font-semibold text-xs text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                                District
                              </div>
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    handleSearchLocationChange('district', '');
                                    setShowLocationDropdown(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[hsl(var(--accent))] ${
                                    !searchLocationHierarchy.district ? 'bg-[hsl(var(--accent))]' : ''
                                  }`}
                                >
                                  All Districts
                                </button>
                                {getSearchProvince().districts.map((district) => (
                                  <button
                                    key={district.id}
                                    onClick={() => handleSearchLocationChange('district', district.id.toString())}
                                    onMouseEnter={() => {
                                      if (searchLocationHierarchy.district !== district.id.toString()) {
                                        handleSearchLocationChange('district', district.id.toString());
                                      }
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-[hsl(var(--accent))] flex items-center justify-between ${
                                      searchLocationHierarchy.district === district.id.toString() ? 'bg-[hsl(var(--accent))]' : ''
                                    }`}
                                  >
                                    <span>{district.name}</span>
                                    {district.localLevels.length > 0 && <span>▶</span>}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Local Level Column - appears when district is selected */}
                          {searchLocationHierarchy.district && getSearchDistrict() && (
                            <div className="min-w-[200px] max-h-96 overflow-y-auto">
                              <div className="p-2 font-semibold text-xs text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                                Local Level
                              </div>
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    handleSearchLocationChange('localLevel', '');
                                    setShowLocationDropdown(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[hsl(var(--accent))] ${
                                    !searchLocationHierarchy.localLevel ? 'bg-[hsl(var(--accent))]' : ''
                                  }`}
                                >
                                  All Local Levels
                                </button>
                                {getSearchDistrict().localLevels.map((localLevel) => (
                                  <button
                                    key={localLevel.id}
                                    onClick={() => {
                                      handleSearchLocationChange('localLevel', localLevel.id.toString());
                                      setShowLocationDropdown(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-[hsl(var(--accent))] ${
                                      searchLocationHierarchy.localLevel === localLevel.id.toString() ? 'bg-[hsl(var(--accent))]' : ''
                                    }`}
                                  >
                                    {localLevel.name} ({localLevel.type === 'municipality' ? 'M' : 'RM'})
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button className="min-w-[100px]">Search</Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Post Ad Button */}
            <div className="mt-4 flex justify-end">
              <Button>Post Ad</Button>
            </div>
          </section>
        </main>
      </div>
    </Layout>
  );
}

export default AdminPanel;
