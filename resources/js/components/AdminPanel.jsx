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
  const activeSection = section || null; // No section selected when on /admin
  const [selectedRole, setSelectedRole] = useState('admin'); // 'super-admin' or 'admin'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const locationDropdownRef = useRef(null);
  const [adSort, setAdSort] = useState(''); // Sort option: 'price', 'date', 'alphabetical'

  // Mock ad totals
  const [adTotals, setAdTotals] = useState({
    userPosted: 245,
    vendorPosted: 128,
    adminPosted: 32,
    total: 405
  });

  // Mock location data
  const [locations, setLocations] = useState([
    {
      id: 1,
      province: 'Bagmati Province',
      district: 'Kathmandu',
      localLevel: 'Kathmandu',
      localLevelType: 'Municipality'
    },
    {
      id: 2,
      province: 'Bagmati Province',
      district: 'Kathmandu',
      localLevel: 'Kathmandu',
      localLevelType: 'Municipality'
    },
    {
      id: 3,
      province: 'Bagmati Province',
      district: 'Lalitpur',
      localLevel: 'Lalitpur',
      localLevelType: 'Municipality'
    },
    {
      id: 4,
      province: 'Bagmati Province',
      district: 'Bhaktapur',
      localLevel: 'Bhaktapur',
      localLevelType: 'Municipality'
    },
    {
      id: 5,
      province: 'Province 1',
      district: 'Morang',
      localLevel: 'Biratnagar',
      localLevelType: 'Municipality'
    },
    {
      id: 6,
      province: 'Province 1',
      district: 'Morang',
      localLevel: 'Biratnagar',
      localLevelType: 'Municipality'
    },
    {
      id: 7,
      province: 'Province 1',
      district: 'Morang',
      localLevel: 'Itahari',
      localLevelType: 'Municipality'
    },
    {
      id: 8,
      province: 'Province 1',
      district: 'Morang',
      localLevel: 'Ratuwamai',
      localLevelType: 'Rural Municipality'
    },
    {
      id: 9,
      province: 'Province 2',
      district: 'Dhanusha',
      localLevel: 'Janakpur',
      localLevelType: 'Municipality'
    },
    {
      id: 10,
      province: 'Province 2',
      district: 'Dhanusha',
      localLevel: 'Dhanusadham',
      localLevelType: 'Rural Municipality'
    },
    {
      id: 11,
      province: 'Gandaki Province',
      district: 'Kaski',
      localLevel: 'Pokhara',
      localLevelType: 'Municipality'
    },
    {
      id: 12,
      province: 'Gandaki Province',
      district: 'Kaski',
      localLevel: 'Pokhara',
      localLevelType: 'Municipality'
    },
    {
      id: 13,
      province: 'Lumbini Province',
      district: 'Rupandehi',
      localLevel: 'Butwal',
      localLevelType: 'Municipality'
    },
    {
      id: 14,
      province: 'Karnali Province',
      district: 'Surkhet',
      localLevel: 'Birendranagar',
      localLevelType: 'Municipality'
    },
    {
      id: 15,
      province: 'Sudurpashchim Province',
      district: 'Kailali',
      localLevel: 'Dhangadhi',
      localLevelType: 'Municipality'
    }
  ]);

  // Category management data - will be populated from API
  const [categoryManagementData, setCategoryManagementData] = useState([]);

  // Mock ads data
  const [ads, setAds] = useState([
    {
      id: 1,
      sn: 1,
      title: 'Beautiful Land for Sale in Kathmandu',
      category: 'Land for sale',
      description: 'Prime location land with excellent connectivity and all amenities nearby.',
      price: 15000000,
      views: 234,
      date: '2024-01-15',
      postedBy: 'user'
    },
    {
      id: 2,
      sn: 2,
      title: 'Toyota Corolla 2020 - Excellent Condition',
      category: 'Car for sale',
      description: 'Well maintained car with low mileage. Single owner. All service records available.',
      price: 2800000,
      views: 567,
      date: '2024-01-18',
      postedBy: 'vendor'
    },
    {
      id: 3,
      sn: 3,
      title: 'Honda CB 150R - Like New',
      category: 'Motorbike for sale',
      description: 'Barely used motorbike, perfect condition. All documents ready.',
      price: 350000,
      views: 189,
      date: '2024-01-20',
      postedBy: 'user'
    },
    {
      id: 4,
      sn: 4,
      title: 'Modern House in Lalitpur',
      category: 'House for sale',
      description: '3 BHK house with garden, parking space, and modern amenities.',
      price: 12000000,
      views: 445,
      date: '2024-01-22',
      postedBy: 'admin'
    },
    {
      id: 5,
      sn: 5,
      title: 'Isuzu Bus - Commercial Vehicle',
      category: 'Bus for sale',
      description: 'Perfect for commercial use. Recently serviced and ready to use.',
      price: 4500000,
      views: 123,
      date: '2024-01-25',
      postedBy: 'vendor'
    },
    {
      id: 6,
      sn: 6,
      title: 'Tata Truck - Heavy Duty',
      category: 'Truck for sale',
      description: 'Heavy duty truck in excellent working condition. Ideal for logistics business.',
      price: 3200000,
      views: 98,
      date: '2024-01-28',
      postedBy: 'user'
    },
    {
      id: 7,
      sn: 7,
      title: 'Luxury Apartment in Baneshwor',
      category: 'House for sale',
      description: 'Fully furnished apartment with modern facilities and security.',
      price: 8500000,
      views: 312,
      date: '2024-02-01',
      postedBy: 'admin'
    },
    {
      id: 8,
      sn: 8,
      title: 'Yamaha FZ - Sports Edition',
      category: 'Motorbike for sale',
      description: 'Sports edition bike with all accessories. Low mileage.',
      price: 420000,
      views: 256,
      date: '2024-02-03',
      postedBy: 'user'
    }
  ]);

  // Sort ads based on selected option
  const sortedAds = React.useMemo(() => {
    const adsCopy = [...ads];
    switch (adSort) {
      case 'price':
        return adsCopy.sort((a, b) => a.price - b.price);
      case 'date':
        return adsCopy.sort((a, b) => new Date(a.date) - new Date(b.date));
      case 'alphabetical':
        return adsCopy.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return adsCopy;
    }
  }, [ads, adSort]);

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

  // Mock subcategories for each category
  const getMockSubcategories = (categoryName) => {
    const subcategoriesMap = {
      'Art & Craft': ['Digital art', 'Painting', 'Sculpture', 'Drawing', 'Handicrafts', 'Pottery'],
      'Bicycle & Accessories': ['Mountain Bikes', 'Road Bikes', 'Electric Bikes', 'Bike Parts', 'Bike Accessories'],
      'Books & Magazine': ['Fiction', 'Non-Fiction', 'Textbooks', 'Comics', 'Magazines', 'E-books'],
      'Building & Construction': ['Construction Materials', 'Tools', 'Hardware', 'Plumbing', 'Electrical Supplies'],
      'Business for Sale': ['Retail Business', 'Restaurant', 'Service Business', 'Manufacturing', 'Online Business'],
      'Clothes & Fashion': ['Men\'s Clothing', 'Women\'s Clothing', 'Kids Clothing', 'Shoes', 'Accessories'],
      'Events/Tickets': ['Concert Tickets', 'Sports Tickets', 'Theater Tickets', 'Event Planning'],
      'Farming & Agriculture': ['Seeds', 'Fertilizers', 'Farm Equipment', 'Livestock', 'Crops'],
      'Furniture': ['Living Room', 'Bedroom', 'Kitchen & Dining', 'Office Furniture', 'Outdoor Furniture'],
      'Health & Beauty': ['Skincare', 'Makeup', 'Hair Care', 'Fitness Equipment', 'Supplements'],
      'Home & Garden': ['Garden Tools', 'Plants', 'Home Decor', 'Kitchenware', 'Cleaning Supplies'],
      'IT & Computers': ['Laptops', 'Desktops', 'Computer Parts', 'Software', 'Networking Equipment'],
      'Jewelers': ['Gold Jewelry', 'Silver Jewelry', 'Diamond Jewelry', 'Watches', 'Gemstones'],
      'Jobs': ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'],
      'Mobile phone & Gadgets': ['Smartphones', 'Tablets', 'Accessories', 'Wearables', 'Cases & Covers'],
      'Music & Musical instrument': ['Guitars', 'Pianos', 'Drums', 'Wind Instruments', 'Audio Equipment'],
      'Office Supply': ['Stationery', 'Office Furniture', 'Printers', 'Office Equipment', 'Supplies'],
      'Pets & Animal': ['Dogs', 'Cats', 'Birds', 'Pet Supplies', 'Pet Food'],
      'Photography': ['Cameras', 'Lenses', 'Accessories', 'Photo Equipment', 'Studio Equipment'],
      'Property': ['Land for Sale', 'House for Sale', 'Apartments', 'Commercial Property', 'Rentals'],
      'Sports & Recreation': ['Sports Equipment', 'Fitness Gear', 'Outdoor Gear', 'Sports Apparel', 'Games'],
      'Travel & Tourism': ['Travel Packages', 'Hotel Bookings', 'Travel Guides', 'Travel Accessories'],
      'Vehicle': ['Cars', 'Motorcycles', 'Trucks', 'Buses', 'Boats', 'RVs']
    };
    return subcategoriesMap[categoryName] || [];
  };

  const fetchCategories = async () => {
    try {
      const response = await window.axios.get('/api/categories');
      setCategories(response.data);
      
      // Transform categories data for Category Management table with mock subcategories
      // Flatten categories with subcategories into rows
      const categoryManagementRows = [];
      response.data.forEach((category) => {
        // Get mock subcategories for this category
        const mockSubcategories = getMockSubcategories(category.name);
        
        if (mockSubcategories.length > 0) {
          mockSubcategories.forEach((subcategoryName, index) => {
            categoryManagementRows.push({
              id: `${category.id}-${index}`,
              categoryName: category.name,
              subcategoryName: subcategoryName
            });
          });
        } else {
          // If no mock subcategories, show category as a row with empty subcategory
          categoryManagementRows.push({
            id: category.id,
            categoryName: category.name,
            subcategoryName: ''
          });
        }
      });
      setCategoryManagementData(categoryManagementRows);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback to mock data if API fails
      const fallbackCategories = [
        'Art & Craft', 'Bicycle & Accessories', 'Books & Magazine', 'Building & Construction',
        'Business for Sale', 'Clothes & Fashion', 'Events/Tickets', 'Farming & Agriculture',
        'Furniture', 'Health & Beauty', 'Home & Garden', 'IT & Computers', 'Jewelers',
        'Jobs', 'Mobile phone & Gadgets', 'Music & Musical instrument', 'Office Supply',
        'Pets & Animal', 'Photography', 'Property', 'Sports & Recreation', 'Travel & Tourism', 'Vehicle'
      ];
      const fallbackRows = [];
      fallbackCategories.forEach((categoryName) => {
        const mockSubcategories = getMockSubcategories(categoryName);
        if (mockSubcategories.length > 0) {
          mockSubcategories.forEach((subcategoryName, index) => {
            fallbackRows.push({
              id: `${categoryName}-${index}`,
              categoryName: categoryName,
              subcategoryName: subcategoryName
            });
          });
        }
      });
      setCategoryManagementData(fallbackRows);
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
    { id: 'ad-management', label: 'Ad management' },
    { id: 'auction-management', label: 'Auction Management' },
    { id: 'category-management', label: 'Category Management' },
    { id: 'change-password', label: 'Change Password' },
    { id: 'email-subscriber', label: 'Email Subscriber List' },
    { id: 'job', label: 'Job' },
    { id: 'location-address', label: 'Location/Address' },
    { id: 'offer-discount', label: 'Offer/Discount' },
    { id: 'rating-review', label: 'Rating/Review' },
    { id: 'sales-report', label: 'Sales Report' },
    { id: 'stock-management', label: 'Stock Management' },
    { id: 'support-management', label: 'Support Management' },
    { id: 'transaction-management', label: 'Transaction Management' },
    { id: 'user-management', label: 'User Management' },
  ];

  return (
    <Layout showFooter={false}>
      <div className="flex gap-6 max-w-7xl mx-auto">
        {/* Left Sidebar - Admin Navigation */}
        <aside className="w-64 flex-shrink-0 hidden lg:block">
          <Card>
            <CardContent className="p-4">
              <h2 className="text-lg font-bold text-[hsl(var(--foreground))] mb-4">Admin Dashboard</h2>
              
              {/* Role Selection */}
              <div className="mb-4 space-y-1">
                <button
                  onClick={() => setSelectedRole('super-admin')}
                  className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                    selectedRole === 'super-admin'
                      ? 'bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] font-medium'
                      : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]'
                  }`}
                >
                  Super Admin
                </button>
                <button
                  onClick={() => setSelectedRole('admin')}
                  className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                    selectedRole === 'admin'
                      ? 'bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] font-medium'
                      : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]'
                  }`}
                >
                  Admin
                </button>
              </div>

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
          </section>

          {/* Default view when no section is selected */}
          {!activeSection && (
            <section>
              <div className="flex justify-end">
                <Button>Post Ad</Button>
              </div>
            </section>
          )}

          {/* Section-specific content */}
          {activeSection === 'ad-management' && (
            <>
              {/* Ad Totals Summary and Post Ad Button */}
              <section className="mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <p className="text-sm text-[hsl(var(--foreground))]">
                          User posted ad total: <span className="font-semibold">{adTotals.userPosted}</span>
                        </p>
                        <p className="text-sm text-[hsl(var(--foreground))]">
                          Vendor posted ad total: <span className="font-semibold">{adTotals.vendorPosted}</span>
                        </p>
                        <p className="text-sm text-[hsl(var(--foreground))]">
                          Admin posted ad total: <span className="font-semibold">{adTotals.adminPosted}</span>
                        </p>
                        <p className="text-sm text-[hsl(var(--foreground))]">
                          Total All ads: <span className="font-semibold">{adTotals.total}</span>
                        </p>
                      </div>
                      <div className="ml-4">
                        <Button>Post Ad</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Ad Management Table */}
              <section>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Ad Management</h2>
                      <div className="flex items-center gap-2">
                        
                        <select
                          value={adSort}
                          onChange={(e) => setAdSort(e.target.value)}
                          className="px-2 py-1 text-sm border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                        >
                          <option value="">Ad sort</option>
                          <option value="price">Price</option>
                          <option value="date">Posted date</option>
                          <option value="alphabetical">Alphabetical</option>
                        </select>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-[hsl(var(--border))]">
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">S.N.</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Title</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Category</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Description</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Price</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">View</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Data</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Edit/Delete</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedAds.map((ad, index) => (
                            <tr key={ad.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]">
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{index + 1}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))] font-medium">{ad.title}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{ad.category}</td>
                              <td className="p-3 text-sm text-[hsl(var(--muted-foreground))] max-w-xs truncate">{ad.description}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))] font-semibold">Rs. {ad.price.toLocaleString()}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{ad.views}</td>
                              <td className="p-3 text-sm text-[hsl(var(--muted-foreground))]">{new Date(ad.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                              <td className="p-3 text-sm">
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                                    Edit
                                  </Button>
                                  <Button variant="destructive" size="sm" className="h-7 px-2 text-xs">
                                    Delete
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </>
          )}

          {activeSection === 'location-address' && (
            <section>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Location/address Management</h2>
                    <Button variant="outline">Add Place</Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[hsl(var(--border))]">
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">S.N.</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Province</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">District</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Local level (Municipality or Rural Municipality)</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Ward_id</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Edit/Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {locations.map((location, index) => (
                          <tr key={location.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]">
                            <td className="p-3 text-sm text-[hsl(var(--foreground))]">{index + 1}</td>
                            <td className="p-3 text-sm text-[hsl(var(--foreground))]">{location.province}</td>
                            <td className="p-3 text-sm text-[hsl(var(--foreground))]">{location.district}</td>
                            <td className="p-3 text-sm text-[hsl(var(--foreground))]">
                              {location.localLevel} ({location.localLevelType === 'Municipality' ? 'M' : 'RM'})
                            </td>
                            <td className="p-3 text-sm text-[hsl(var(--foreground))]">{index + 1}</td>
                            <td className="p-3 text-sm">
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                                  Edit
                                </Button>
                                <Button variant="destructive" size="sm" className="h-7 px-2 text-xs">
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {activeSection === 'category-management' && (
            <section>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Category Management</h2>
                    <Button variant="outline">Add Category/subcategory</Button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[hsl(var(--border))]">
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">S.N.</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Category Name</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Subcategory Name</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryManagementData.map((category, index) => (
                          <tr key={category.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]">
                            <td className="p-3 text-sm text-[hsl(var(--foreground))]">{index + 1}</td>
                            <td className="p-3 text-sm text-[hsl(var(--foreground))]">{category.categoryName}</td>
                            <td className="p-3 text-sm text-[hsl(var(--foreground))]">{category.subcategoryName}</td>
                            <td className="p-3 text-sm">
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                                  Edit
                                </Button>
                                <Button variant="destructive" size="sm" className="h-7 px-2 text-xs">
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}
        </main>
      </div>
    </Layout>
  );
}

export default AdminPanel;
