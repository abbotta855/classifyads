import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Layout from './Layout';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';

function Homepage() {
  const [categories, setCategories] = useState([]);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false); // Track if category filter section is visible
  const [expandedCategories, setExpandedCategories] = useState([]); // Track which categories are expanded
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [priceErrors, setPriceErrors] = useState({ min: '', max: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState(''); // Category for search dropdown
  const [showLocationDropdown, setShowLocationDropdown] = useState(false); // For search bar
  const [showSidebarLocationDropdown, setShowSidebarLocationDropdown] = useState(false); // For sidebar filter
  const [expandedLocationItems, setExpandedLocationItems] = useState({
    provinces: false,
    districts: {},
    localLevels: {},
    wards: {}
  }); // Track expanded items in tree view
  const [sortBy, setSortBy] = useState('most relevant');
  const [ads, setAds] = useState([]);
  const [allAds, setAllAds] = useState([]); // All ads for pagination
  const [filteredAdsCount, setFilteredAdsCount] = useState(0); // Count of filtered ads for pagination
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const adsPerPage = 39;

  // Hierarchical location structure (Nepal administrative divisions)
  // New structure: Province → District → Local Level → Ward
  const [locationHierarchy, setLocationHierarchy] = useState({
    province: '',
    district: '',
    localLevel: '',
    ward: ''
  });

  // Search location hierarchy state
  const [searchLocationHierarchy, setSearchLocationHierarchy] = useState({
    province: '',
    district: '',
    localLevel: '',
    ward: ''
  });

  // Mock location data structure - Replace with API call later
  // New structure: Province → District → Local Level (Municipality/Rural Municipality) → Ward
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

  // Helper functions to get filtered options based on selections (sidebar)
  const getSelectedProvince = () => {
    if (!locationHierarchy.province) return null;
    return locationData.provinces.find(p => p.id === parseInt(locationHierarchy.province));
  };

  const getSelectedDistrict = () => {
    const province = getSelectedProvince();
    if (!province || !locationHierarchy.district) return null;
    return province.districts.find(d => d.id === parseInt(locationHierarchy.district));
  };

  const getSelectedLocalLevel = () => {
    const district = getSelectedDistrict();
    if (!district || !locationHierarchy.localLevel) return null;
    return district.localLevels.find(ll => ll.id === parseInt(locationHierarchy.localLevel));
  };

  const handleLocationHierarchyChange = (level, value) => {
    setLocationHierarchy(prev => {
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


  useEffect(() => {
    fetchCategories();
    // TODO: Fetch ads when API is ready
    // fetchAds();
    generateMockAds();
  }, []);

  // Filter ads based on search query, category, location, and sidebar filters
  useEffect(() => {
    // Don't filter if we don't have ads yet
    if (!allAds || allAds.length === 0) {
      setAds([]);
      setFilteredAdsCount(0);
      return;
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

    // Filter by search category
    if (searchCategory) {
      filtered = filtered.filter(ad => ad.category === searchCategory);
    }

    // Filter by search location hierarchy
    if (searchLocationHierarchy.province) {
      const province = getSearchProvince();
      if (province) {
        filtered = filtered.filter(ad => {
          const adProvince = ad.locationHierarchy?.province;
          return adProvince && parseInt(adProvince) === parseInt(searchLocationHierarchy.province);
        });
      }
    }
    if (searchLocationHierarchy.zone) {
      const zone = getSearchZone();
      if (zone) {
        filtered = filtered.filter(ad => {
          const adZone = ad.locationHierarchy?.zone;
          return adZone && parseInt(adZone) === parseInt(searchLocationHierarchy.zone);
        });
      }
    }
    if (searchLocationHierarchy.district) {
      const district = getSearchDistrict();
      if (district) {
        filtered = filtered.filter(ad => {
          const adDistrict = ad.locationHierarchy?.district;
          return adDistrict && parseInt(adDistrict) === parseInt(searchLocationHierarchy.district);
        });
      }
    }
    if (searchLocationHierarchy.municipality) {
      const municipality = getSearchMunicipality();
      if (municipality) {
        filtered = filtered.filter(ad => {
          const adMunicipality = ad.locationHierarchy?.municipality;
          return adMunicipality && parseInt(adMunicipality) === parseInt(searchLocationHierarchy.municipality);
        });
      }
    }
    if (searchLocationHierarchy.ruralMunicipality) {
      const ruralMunicipality = getSearchRuralMunicipality();
      if (ruralMunicipality) {
        filtered = filtered.filter(ad => {
          const adRuralMunicipality = ad.locationHierarchy?.ruralMunicipality;
          return adRuralMunicipality && parseInt(adRuralMunicipality) === parseInt(searchLocationHierarchy.ruralMunicipality);
        });
      }
    }

    // Filter by sidebar category filters (including subcategories)
    if (selectedCategories.length > 0) {
      // Get all selected category IDs including their subcategories
      const getAllCategoryIds = (categoryIds) => {
        let allIds = [...categoryIds];
        categoryIds.forEach(catId => {
          const subcategories = categories.filter(cat => cat.parent_id === catId);
          if (subcategories.length > 0) {
            allIds = allIds.concat(subcategories.map(sub => sub.id));
            // Recursively get subcategories of subcategories
            const subIds = subcategories.map(sub => sub.id);
            allIds = allIds.concat(getAllCategoryIds(subIds).filter(id => !allIds.includes(id)));
          }
        });
        return allIds;
      };

      const allSelectedIds = getAllCategoryIds(selectedCategories);
      const categoryNames = categories
        .filter(cat => allSelectedIds.includes(cat.id))
        .map(cat => cat.name);
      
      filtered = filtered.filter(ad => {
        // Check if ad matches by category name (for mock data)
        if (ad.category && categoryNames.includes(ad.category)) {
          return true;
        }
        // Check if ad matches by category_id (for real data)
        if (ad.category_id && allSelectedIds.includes(ad.category_id)) {
          return true;
        }
        return false;
      });
    }

    // Filter by sidebar location hierarchy (new structure: province → district → localLevel → ward)
    if (locationHierarchy.province) {
      const province = getSelectedProvince();
      if (province) {
        filtered = filtered.filter(ad => {
          const adProvince = ad.locationHierarchy?.province;
          return adProvince && parseInt(adProvince) === parseInt(locationHierarchy.province);
        });
      }
    }
    if (locationHierarchy.district) {
      const district = getSelectedDistrict();
      if (district) {
        filtered = filtered.filter(ad => {
          const adDistrict = ad.locationHierarchy?.district;
          return adDistrict && parseInt(adDistrict) === parseInt(locationHierarchy.district);
        });
      }
    }
    if (locationHierarchy.localLevel) {
      const localLevel = getSelectedLocalLevel();
      if (localLevel) {
        filtered = filtered.filter(ad => {
          const adLocalLevel = ad.locationHierarchy?.localLevel;
          return adLocalLevel && parseInt(adLocalLevel) === parseInt(locationHierarchy.localLevel);
        });
      }
    }
    if (locationHierarchy.ward) {
      filtered = filtered.filter(ad => {
        const adWard = ad.locationHierarchy?.ward;
        return adWard && adWard === locationHierarchy.ward;
      });
    }

    // Filter by price range
    if (priceRange.min !== '') {
      const minPrice = parseFloat(priceRange.min);
      if (!isNaN(minPrice)) {
        filtered = filtered.filter(ad => ad.price >= minPrice);
      }
    }
    if (priceRange.max !== '') {
      const maxPrice = parseFloat(priceRange.max);
      if (!isNaN(maxPrice)) {
        filtered = filtered.filter(ad => ad.price <= maxPrice);
      }
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
          return b.id - a.id; // Assuming higher ID = newer
        case 'top review':
          // TODO: Implement when review system is ready
          return 0;
        default: // 'most relevant'
          return 0;
      }
    });

    // Update displayed ads with pagination
    const startIndex = (currentPage - 1) * adsPerPage;
    const endIndex = startIndex + adsPerPage;
    setAds(sorted.slice(startIndex, endIndex));
    
    // Store filtered ads count for pagination display
    setFilteredAdsCount(sorted.length);
  }, [
    searchQuery, 
    searchCategory, 
    searchLocationHierarchy, 
    selectedCategories, 
    locationHierarchy, 
    priceRange, 
    sortBy, 
    currentPage,
    categories,
    allAds.length // Only depend on length, not the array itself
  ]);

  // Reset to page 1 when filters change (except currentPage)
  const prevFiltersRef = useRef({ searchQuery, searchCategory, searchLocationHierarchy, selectedCategories, locationHierarchy, priceRange, sortBy });
  useEffect(() => {
    const prevFilters = prevFiltersRef.current;
    const filtersChanged = 
      prevFilters.searchQuery !== searchQuery ||
      prevFilters.searchCategory !== searchCategory ||
      JSON.stringify(prevFilters.searchLocationHierarchy) !== JSON.stringify(searchLocationHierarchy) ||
      JSON.stringify(prevFilters.selectedCategories) !== JSON.stringify(selectedCategories) ||
      JSON.stringify(prevFilters.locationHierarchy) !== JSON.stringify(locationHierarchy) ||
      JSON.stringify(prevFilters.priceRange) !== JSON.stringify(priceRange) ||
      prevFilters.sortBy !== sortBy;
    
    if (filtersChanged && currentPage > 1) {
      setCurrentPage(1);
    }
    
    prevFiltersRef.current = { searchQuery, searchCategory, searchLocationHierarchy, selectedCategories, locationHierarchy, priceRange, sortBy };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, searchCategory, searchLocationHierarchy, selectedCategories, locationHierarchy, priceRange, sortBy]);

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

  // Generate mock ads for demonstration (more than 39 to show pagination)
  const generateMockAds = () => {
    const mockAds = [];
    const categories = ['Land for sale', 'Car for sale', 'Motorbike for sale', 'Bus for sale', 'Truck for sale', 'House for sale'];
    
    // Generate sample locations from the hierarchy
    const sampleLocations = [
      'Bagmati Province, Bagmati Zone, Kathmandu, Kathmandu, Ward 1, Thamel',
      'Bagmati Province, Bagmati Zone, Kathmandu, Kathmandu, Ward 2, Durbar Square',
      'Bagmati Province, Bagmati Zone, Kathmandu, Lalitpur, Ward 1, Patan',
      'Province 1, Koshi Zone, Morang, Biratnagar, Ward 1, Biratnagar-1',
      'Province 2, Janakpur Zone, Dhanusha, Janakpur, Ward 1, Janakpur-1'
    ];
    
    // Generate 150 ads to demonstrate pagination
    for (let i = 0; i < 150; i++) {
      const category = categories[i % categories.length];
      mockAds.push({
        id: i + 1,
        title: `${category} - Item ${i + 1}`.substring(0, 80),
        description: `This is a detailed description for item ${i + 1}. It contains important information about the product.`.substring(0, 200),
        price: Math.floor(Math.random() * 10000) + 100,
        image: `https://via.placeholder.com/1200x1200?text=Ad+${i + 1}`,
        category: category,
        location: sampleLocations[i % sampleLocations.length],
        locationHierarchy: {
          province: (i % 3) + 1,
          zone: (i % 3) + 1,
          district: (i % 3) + 1,
          municipality: (i % 2) + 1,
          wardNumber: (i % 5) + 1,
          place: `Place ${(i % 3) + 1}`
        }
      });
    }
    setAllAds(mockAds);
    setLoading(false);
    // The filtering useEffect will handle displaying ads
  };

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleCategoryExpand = (categoryId) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Calculate ad count for a category (including its subcategories)
  const getCategoryAdCount = (categoryId, categoryName) => {
    // Get all subcategory IDs for this category
    const getSubcategoryIds = (parentId) => {
      const subcategories = categories.filter(cat => cat.parent_id === parentId);
      let ids = [parentId];
      subcategories.forEach(sub => {
        ids = ids.concat(getSubcategoryIds(sub.id));
      });
      return ids;
    };

    const allCategoryIds = getSubcategoryIds(categoryId);
    
    // Count ads that match this category or any of its subcategories
    return allAds.filter(ad => {
      // Match by category name (for mock data) or by category ID (for real data)
      if (ad.category_id) {
        return allCategoryIds.includes(ad.category_id);
      } else if (ad.category) {
        // For mock data, check if category name matches
        const category = categories.find(c => c.id === categoryId);
        if (category && category.name === ad.category) {
          return true;
        }
        // Check subcategories
        const subcategories = categories.filter(c => c.parent_id === categoryId);
        return subcategories.some(sub => sub.name === ad.category);
      }
      return false;
    }).length;
  };

  // Get subcategories for a parent category
  const getSubcategories = (parentId) => {
    return categories.filter(cat => cat.parent_id === parentId);
  };

  // Get top-level categories (categories without parent)
  const getTopLevelCategories = () => {
    return categories.filter(cat => !cat.parent_id || cat.parent_id === null);
  };

  // Build location string from hierarchy for filtering/searching
  const buildLocationString = () => {
    const parts = [];
    if (locationHierarchy.province) {
      const province = getSelectedProvince();
      if (province) parts.push(province.name);
    }
    if (locationHierarchy.district) {
      const district = getSelectedDistrict();
      if (district) parts.push(district.name);
    }
    if (locationHierarchy.localLevel) {
      const localLevel = getSelectedLocalLevel();
      if (localLevel) {
        // Add type indicator for local level
        const typeLabel = localLevel.type === 'municipality' ? ' (M)' : ' (RM)';
        parts.push(localLevel.name + typeLabel);
      }
    }
    if (locationHierarchy.ward) {
      const [wardId, wardNumber] = locationHierarchy.ward.split('-');
      parts.push(`Ward ${wardId}-${wardNumber}`);
    }
    return parts.length > 0 ? parts.join(' / ') : '';
  };

  const handlePriceChange = (field, value) => {
    const numValue = value === '' ? '' : parseFloat(value);
    const errors = { ...priceErrors };

    if (value !== '' && (isNaN(numValue) || numValue <= 0)) {
      errors[field] = 'Price must be greater than 0';
    } else {
      errors[field] = '';
    }

    // Validate max >= min if both are set
    if (field === 'max' && priceRange.min !== '' && value !== '') {
      const minValue = parseFloat(priceRange.min);
      if (!isNaN(numValue) && !isNaN(minValue) && numValue < minValue) {
        errors.max = 'Max price must be greater than or equal to min price';
      }
    }
    if (field === 'min' && priceRange.max !== '' && value !== '') {
      const maxValue = parseFloat(priceRange.max);
      if (!isNaN(numValue) && !isNaN(maxValue) && numValue > maxValue) {
        errors.min = 'Min price must be less than or equal to max price';
      }
    }

    setPriceErrors(errors);
    setPriceRange({ ...priceRange, [field]: value });
  };

  const handleSearch = () => {
    // Apply search filters from search bar
    // The searchCategory and searchLocationHierarchy will be used in filtering
    console.log('Search:', { 
      searchQuery, 
      searchCategory,
      searchLocationHierarchy,
      selectedCategories, 
      locationHierarchy,
      priceRange, 
      sortBy 
    });
    setCurrentPage(1); // Reset to first page on new search
    
    // Apply search filters to sidebar filters
    if (searchCategory) {
      const category = categories.find(c => c.name === searchCategory);
      if (category && !selectedCategories.includes(category.id)) {
        setSelectedCategories([category.id]);
      }
    }
    
    // Apply search location to sidebar location hierarchy
    if (searchLocationHierarchy.province || searchLocationHierarchy.district || 
        searchLocationHierarchy.localLevel || searchLocationHierarchy.ward) {
      setLocationHierarchy({
        ...locationHierarchy,
        province: searchLocationHierarchy.province || locationHierarchy.province,
        district: searchLocationHierarchy.district || locationHierarchy.district,
        localLevel: searchLocationHierarchy.localLevel || locationHierarchy.localLevel,
        ward: searchLocationHierarchy.ward || locationHierarchy.ward,
      });
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // The filtering useEffect will handle updating displayed ads
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(filteredAdsCount / adsPerPage);
  const startResult = filteredAdsCount > 0 ? (currentPage - 1) * adsPerPage + 1 : 0;
  const endResult = Math.min(currentPage * adsPerPage, filteredAdsCount);

  const getCategoryAds = (categoryName) => {
    return allAds.filter(ad => ad.category === categoryName).slice(0, 4);
  };

  const getCategoryRoute = (categoryName) => {
    const routeMap = {
      'Land for sale': '/categories/land-for-sale',
      'Car for sale': '/categories/vehicle-for-sale',
      'Motorbike for sale': '/categories/motor-bike-for-sale',
      'Bus for sale': '/categories/bus-for-sale',
      'Truck for sale': '/categories/truck-for-sale',
      'House for sale': '/categories/house-for-sale'
    };
    return routeMap[categoryName] || '/categories';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-[hsl(var(--muted-foreground))]">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Search Part */}
        <section className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2 flex-wrap items-center">
                {/* Search Keyword Input */}
                <Input
                  type="text"
                  placeholder="Enter keyword"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 min-w-[200px] bg-[hsl(var(--background))]"
                />
                {/* Category Selection */}
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
                <div className="relative min-w-[150px]">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                      className="w-full px-3 py-2 text-left border-0 rounded-md bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] flex items-center justify-between"
                    >
                      <span>{buildSearchLocationString() || 'All Locations'}</span>
                      <span className="ml-2">{showLocationDropdown ? '▲' : '▼'}</span>
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
                <Button onClick={handleSearch} className="min-w-[100px]">Search</Button>
          </div>
            </CardContent>
          </Card>
        </section>

        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <Card>
              <CardContent className="p-4">
                <h2 className="text-lg font-bold text-[hsl(var(--foreground))] mb-4">Filters</h2>

                {/* Category Filter */}
                <div className="mb-6">
                  <button
                    onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                    className="flex items-center justify-between w-full font-semibold text-[hsl(var(--foreground))] mb-2 hover:text-[hsl(var(--primary))] transition-colors"
                  >
                    <span>Category</span>
                    <span className="text-sm">{showCategoryFilter ? '▼' : '▶'}</span>
                  </button>
                  {showCategoryFilter && (
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                    {getTopLevelCategories().map((category) => {
                      const subcategories = getSubcategories(category.id);
                      const hasSubcategories = subcategories.length > 0;
                      const isExpanded = expandedCategories.includes(category.id);
                      const adCount = getCategoryAdCount(category.id, category.name);
                      
                      return (
                        <div key={category.id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 flex-1">
                              {hasSubcategories && (
                                <button
                                  onClick={() => handleCategoryExpand(category.id)}
                                  className="w-4 h-4 flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                                  aria-label={isExpanded ? "Collapse" : "Expand"}
                                >
                                  {isExpanded ? '▼' : '▶'}
                                </button>
                              )}
                              {!hasSubcategories && <span className="w-4"></span>}
                              <label className="flex items-center space-x-2 cursor-pointer flex-1">
                                <input
                                  type="checkbox"
                                  checked={selectedCategories.includes(category.id)}
                                  onChange={() => handleCategoryToggle(category.id)}
                                  className="w-4 h-4"
                                />
                                <span className="text-sm text-[hsl(var(--foreground))]">{category.name}</span>
                              </label>
                            </div>
                            <span className="text-xs text-[hsl(var(--muted-foreground))] ml-2">
                              ({adCount})
                            </span>
                          </div>
                          
                          {/* Show subcategories when expanded */}
                          {hasSubcategories && isExpanded && (
                            <div className="ml-6 space-y-1">
                              {subcategories.map((subcategory) => {
                                const subAdCount = getCategoryAdCount(subcategory.id, subcategory.name);
                                return (
                                  <div key={subcategory.id} className="flex items-center justify-between">
                                    <label className="flex items-center space-x-2 cursor-pointer flex-1">
                                      <input
                                        type="checkbox"
                                        checked={selectedCategories.includes(subcategory.id)}
                                        onChange={() => handleCategoryToggle(subcategory.id)}
                                        className="w-4 h-4"
                                      />
                                      <span className="text-sm text-[hsl(var(--muted-foreground))]">{subcategory.name}</span>
                                    </label>
                                    <span className="text-xs text-[hsl(var(--muted-foreground))] ml-2">
                                      ({subAdCount})
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

                {/* Location Filter - Tree View (Windows Explorer style) */}
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={() => setExpandedLocationItems(prev => ({ ...prev, provinces: !prev.provinces }))}
                    className="flex items-center justify-between w-full font-semibold text-[hsl(var(--foreground))] mb-2 hover:text-[hsl(var(--primary))] transition-colors"
                  >
                    <span>Location</span>
                    <span className="text-sm">{expandedLocationItems.provinces ? '▼' : '▶'}</span>
                  </button>
                  
                  {/* Current Location Path Display */}
                  {buildLocationString() && (
                    <div className="mb-2 px-2 py-1.5 text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--accent))] rounded border border-[hsl(var(--border))]">
                      {buildLocationString()}
                    </div>
                  )}
                  
                  {/* Provinces - shown when Location is expanded */}
                  {expandedLocationItems.provinces && (
                    <div className="space-y-1 ml-4">
                      {locationData.provinces.map((province) => {
                        const isProvinceExpanded = expandedLocationItems.districts[province.id] || false;
                        const isProvinceSelected = locationHierarchy.province === province.id.toString();
                        
                        return (
                          <div key={province.id} className="space-y-1">
                            {/* Province Item */}
                            <div className="flex items-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setExpandedLocationItems(prev => ({
                                    ...prev,
                                    districts: {
                                      ...prev.districts,
                                      [province.id]: !prev.districts[province.id]
                                    }
                                  }));
                                }}
                                className="w-4 h-4 flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mr-1"
                              >
                                {province.districts.length > 0 ? (isProvinceExpanded ? '▼' : '▶') : '•'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleLocationHierarchyChange('province', province.id.toString());
                                  handleLocationHierarchyChange('district', '');
                                  handleLocationHierarchyChange('localLevel', '');
                                  handleLocationHierarchyChange('ward', '');
                                }}
                                className={`flex-1 text-left text-sm px-2 py-1 rounded hover:bg-[hsl(var(--accent))] ${
                                  isProvinceSelected ? 'bg-[hsl(var(--accent))] font-medium' : ''
                                }`}
                              >
                                {province.name}
                              </button>
                            </div>
                            
                            {/* Districts - shown when province is expanded */}
                            {isProvinceExpanded && (
                              <div className="space-y-1 ml-6">
                                {province.districts.map((district) => {
                                  const isDistrictExpanded = expandedLocationItems.localLevels[district.id] || false;
                                  const isDistrictSelected = locationHierarchy.district === district.id.toString() && 
                                                             locationHierarchy.province === province.id.toString();
                                  
                                  return (
                                    <div key={district.id} className="space-y-1">
                                      {/* District Item */}
                                      <div className="flex items-center">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setExpandedLocationItems(prev => ({
                                              ...prev,
                                              localLevels: {
                                                ...prev.localLevels,
                                                [district.id]: !prev.localLevels[district.id]
                                              }
                                            }));
                                          }}
                                          className="w-4 h-4 flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mr-1"
                                        >
                                          {district.localLevels.length > 0 ? (isDistrictExpanded ? '▼' : '▶') : '•'}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleLocationHierarchyChange('province', province.id.toString());
                                            handleLocationHierarchyChange('district', district.id.toString());
                                            handleLocationHierarchyChange('localLevel', '');
                                            handleLocationHierarchyChange('ward', '');
                                          }}
                                          className={`flex-1 text-left text-sm px-2 py-1 rounded hover:bg-[hsl(var(--accent))] ${
                                            isDistrictSelected ? 'bg-[hsl(var(--accent))] font-medium' : ''
                                          }`}
                                        >
                                          {district.name}
                                        </button>
                                      </div>
                                      
                                      {/* Local Levels - shown when district is expanded */}
                                      {isDistrictExpanded && (
                                        <div className="space-y-1 ml-6">
                                          {district.localLevels.map((localLevel) => {
                                            const isLocalLevelExpanded = expandedLocationItems.wards[localLevel.id] || false;
                                            const isLocalLevelSelected = locationHierarchy.localLevel === localLevel.id.toString() &&
                                                                         locationHierarchy.district === district.id.toString();
                                            
                                            return (
                                              <div key={localLevel.id} className="space-y-1">
                                                {/* Local Level Item */}
                                                <div className="flex items-center">
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      setExpandedLocationItems(prev => ({
                                                        ...prev,
                                                        wards: {
                                                          ...prev.wards,
                                                          [localLevel.id]: !prev.wards[localLevel.id]
                                                        }
                                                      }));
                                                    }}
                                                    className="w-4 h-4 flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] mr-1"
                                                  >
                                                    {localLevel.wards.length > 0 ? (isLocalLevelExpanded ? '▼' : '▶') : '•'}
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      handleLocationHierarchyChange('province', province.id.toString());
                                                      handleLocationHierarchyChange('district', district.id.toString());
                                                      handleLocationHierarchyChange('localLevel', localLevel.id.toString());
                                                      handleLocationHierarchyChange('ward', '');
                                                    }}
                                                    className={`flex-1 text-left text-sm px-2 py-1 rounded hover:bg-[hsl(var(--accent))] ${
                                                      isLocalLevelSelected ? 'bg-[hsl(var(--accent))] font-medium' : ''
                                                    }`}
                                                  >
                                                    {localLevel.name} ({localLevel.type === 'municipality' ? 'M' : 'RM'})
                                                  </button>
                                                </div>
                                                
                                                {/* Wards - shown when local level is expanded */}
                                                {isLocalLevelExpanded && (
                                                  <div className="space-y-1 ml-6">
                                                    {localLevel.wards.map((ward) => {
                                                      const wardValue = `${ward.ward_id}-${ward.ward_number}`;
                                                      const isWardSelected = locationHierarchy.ward === wardValue &&
                                                                             locationHierarchy.localLevel === localLevel.id.toString();
                                                      
                                                      return (
                                                        <div key={wardValue} className="flex items-center">
                                                          <span className="w-4 h-4 mr-1">•</span>
                                                          <button
                                                            type="button"
                                                            onClick={() => {
                                                              handleLocationHierarchyChange('province', province.id.toString());
                                                              handleLocationHierarchyChange('district', district.id.toString());
                                                              handleLocationHierarchyChange('localLevel', localLevel.id.toString());
                                                              handleLocationHierarchyChange('ward', wardValue);
                                                            }}
                                                            className={`flex-1 text-left text-sm px-2 py-1 rounded hover:bg-[hsl(var(--accent))] ${
                                                              isWardSelected ? 'bg-[hsl(var(--accent))] font-medium' : ''
                                                            }`}
                                                          >
                                                            Ward {ward.ward_id}-{ward.ward_number}
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
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <h3 className="font-semibold text-[hsl(var(--foreground))] mb-2">
                    Price range
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="From"
                        value={priceRange.min}
                        onChange={(e) => handlePriceChange('min', e.target.value)}
                        className={`w-full ${priceErrors.min ? 'border-red-500' : ''}`}
                      />
                      {priceErrors.min && (
                        <p className="text-xs text-red-500 mt-1">{priceErrors.min}</p>
                      )}
                    </div>
                    <div>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="To"
                        value={priceRange.max}
                        onChange={(e) => handlePriceChange('max', e.target.value)}
                        className={`w-full ${priceErrors.max ? 'border-red-500' : ''}`}
                      />
                      {priceErrors.max && (
                        <p className="text-xs text-red-500 mt-1">{priceErrors.max}</p>
                      )}
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Showing {startResult}-{endResult} of {filteredAdsCount} results
                    </p>
              <div className="flex items-center gap-2">
                <label className="text-sm text-[hsl(var(--foreground))]">Sorting option:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
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

            {/* Display ads with pagination */}
            <div className="mb-8">

              {/* Display ads in grid (4 per row) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {ads.map((ad) => (
                  <Card key={ad.id} className="hover:shadow-lg transition-shadow">
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
                        <p className="text-lg font-bold text-[hsl(var(--primary))]">
                          ${ad.price.toLocaleString()}
                        </p>
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
                      // Show first page, last page, current page, and pages around current
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
            </div>

            {/* Separator between search results and category sections */}
            <div className="my-8 border-t-2 border-[hsl(var(--border))]"></div>

            {/* Category-specific ad sections (4 ads per row, then "more ad" link) */}
            {['Land for sale', 'Car for sale', 'Motorbike for sale', 'Bus for sale', 'Truck for sale', 'House for sale'].map((categoryName) => {
              const categoryAds = getCategoryAds(categoryName);
              if (categoryAds.length === 0) return null;

              return (
                <div key={categoryName} className="mb-8">
                  <h3 className="text-xl font-bold text-[hsl(var(--foreground))] mb-4">{categoryName}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {categoryAds.map((ad) => (
                      <Card key={ad.id} className="hover:shadow-lg transition-shadow">
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
                            <p className="text-lg font-bold text-[hsl(var(--primary))]">
                              ${ad.price.toLocaleString()}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Card className="hover:shadow-lg transition-shadow flex items-center justify-center">
                      <CardContent className="p-4 text-center">
                        <Link
                          to={getCategoryRoute(categoryName)}
                          className="text-[hsl(var(--primary))] hover:underline font-semibold"
                        >
                          more ad
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
            })}
          </main>
        </div>
      </div>
    </Layout>
  );
}

export default Homepage;
