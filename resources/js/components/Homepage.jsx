import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Layout from './Layout';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';

function Homepage() {
  const [categories, setCategories] = useState([]);
  const [locationData, setLocationData] = useState({ provinces: [] }); // Location data from database
  const [showCategoryFilter, setShowCategoryFilter] = useState(false); // Track if category filter section is visible
  const [expandedCategories, setExpandedCategories] = useState([]); // Track which categories are expanded
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState(new Set()); // Multiple location selections with checkboxes (for search bar)
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [priceErrors, setPriceErrors] = useState({ min: '', max: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState(''); // Category for search dropdown
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false); // For search bar category dropdown
  const [selectedCategoryName, setSelectedCategoryName] = useState(''); // Selected category name for showing subcategories
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(''); // Selected subcategory ID
  const [showLocationDropdown, setShowLocationDropdown] = useState(false); // For search bar
  const categoryDropdownRef = useRef(null);
  const [showSidebarLocationDropdown, setShowSidebarLocationDropdown] = useState(false); // For sidebar filter
  const [expandedProvinces, setExpandedProvinces] = useState(new Set()); // For search bar location dropdown
  const [expandedDistricts, setExpandedDistricts] = useState(new Set()); // For search bar location dropdown
  const [expandedLocalLevels, setExpandedLocalLevels] = useState(new Set()); // For search bar location dropdown
  const [expandedLocationItems, setExpandedLocationItems] = useState({
    provinces: false,
    districts: {},
    localLevels: {},
    wards: {}
  }); // For sidebar location filter
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

  // Location dropdown ref for click outside detection
  const locationDropdownRef = useRef(null);

  // Fetch locations from database
  const fetchLocations = async () => {
    try {
      const response = await window.axios.get('/api/locations');
      setLocationData(response.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
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

  // Helper functions for location selection with checkboxes
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

  const handleSelectAllLocations = () => {
    setSelectedLocations(new Set());
  };

  const buildSearchLocationString = () => {
    if (selectedLocations.size === 0) {
      return 'All Locations';
    }
    if (selectedLocations.size === 1) {
      return '1 location selected';
    }
    return `${selectedLocations.size} locations selected`;
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


  useEffect(() => {
    fetchCategories();
    fetchLocations();
    fetchAds();
  }, []);

  // Fetch real ads from API
  const fetchAds = async () => {
    try {
      setLoading(true);
      const response = await window.axios.get('/api/ads');
      const adsData = response.data.ads || [];
      
      // Transform ads to match expected format
      const transformedAds = adsData.map(ad => ({
        id: ad.id,
        title: ad.title,
        description: ad.description,
        price: ad.price,
        image: ad.image || 'https://via.placeholder.com/1200x1200?text=No+Image',
        category: ad.category,
        subcategory: ad.subcategory || ad.sub_category,
        sub_category: ad.subcategory || ad.sub_category,
        location: ad.location,
        location_id: ad.location_id,
        locationHierarchy: ad.locationHierarchy,
        created_at: ad.created_at,
      }));
      
      setAllAds(transformedAds);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ads:', error);
      // Fallback to empty array if API fails
      setAllAds([]);
      setLoading(false);
    }
  };

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

    // Filter by search category (supports "Category > Subcategory" format)
    if (searchCategory) {
      if (searchCategory.includes(' > ')) {
        // Subcategory selected: "Category > Subcategory"
        const [categoryName, subcategoryName] = searchCategory.split(' > ');
        filtered = filtered.filter(ad => {
          // Check if ad matches both category and subcategory
          return ad.category === categoryName && (ad.subcategory === subcategoryName || ad.sub_category === subcategoryName);
        });
      } else {
        // Main category selected
        filtered = filtered.filter(ad => ad.category === searchCategory);
      }
    }

    // Filter by selected locations (checkboxes)
    if (selectedLocations.size > 0) {
        filtered = filtered.filter(ad => {
        // Check if ad's location matches any selected location ID
        const adLocationId = ad.location_id || ad.locationId;
        return adLocationId && selectedLocations.has(adLocationId);
        });
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
    selectedLocations, 
    selectedCategories, 
    locationHierarchy, 
    priceRange, 
    sortBy, 
    currentPage,
    categories,
    allAds.length // Only depend on length, not the array itself
  ]);

  // Reset to page 1 when filters change (except currentPage)
  const prevFiltersRef = useRef({ searchQuery, searchCategory, selectedLocations, selectedCategories, locationHierarchy, priceRange, sortBy });
  useEffect(() => {
    const prevFilters = prevFiltersRef.current;
    const filtersChanged = 
      prevFilters.searchQuery !== searchQuery ||
      prevFilters.searchCategory !== searchCategory ||
      prevFilters.selectedLocations?.size !== selectedLocations.size ||
      JSON.stringify(prevFilters.selectedCategories) !== JSON.stringify(selectedCategories) ||
      JSON.stringify(prevFilters.locationHierarchy) !== JSON.stringify(locationHierarchy) ||
      JSON.stringify(prevFilters.priceRange) !== JSON.stringify(priceRange) ||
      prevFilters.sortBy !== sortBy;
    
    if (filtersChanged && currentPage > 1) {
      setCurrentPage(1);
    }
    
    prevFiltersRef.current = { searchQuery, searchCategory, selectedLocations, selectedCategories, locationHierarchy, priceRange, sortBy };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, searchCategory, selectedLocations, selectedCategories, locationHierarchy, priceRange, sortBy]);

  const fetchCategories = async () => {
    try {
      const response = await window.axios.get('/api/categories');
      // Keep nested structure with categories and subcategories (same as AdminPanel)
      const categoriesData = Array.isArray(response.data) ? response.data : [];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for category selection (same as AdminPanel)
  const getSelectedCategory = () => {
    if (!selectedCategoryName) return null;
    return categories.find(c => c.name === selectedCategoryName);
  };

  const handleCategorySelect = (categoryName) => {
    setSelectedCategoryName(categoryName);
    setSelectedSubcategoryId(''); // Reset subcategory when category changes
    setSearchCategory(categoryName);
  };

  const handleSubcategorySelect = (subcategoryId) => {
    setSelectedSubcategoryId(subcategoryId);
    const category = getSelectedCategory();
    if (category) {
      const subcategory = category.subcategories.find(s => s.id === parseInt(subcategoryId));
      if (subcategory) {
        setSearchCategory(`${category.name} > ${subcategory.name}`);
        setShowCategoryDropdown(false);
      }
    }
  };

  const buildCategorySearchString = () => {
    if (selectedSubcategoryId) {
      const category = getSelectedCategory();
      const subcategory = category?.subcategories.find(s => s.id === parseInt(selectedSubcategoryId));
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

  const handleClearCategorySelection = () => {
    setSelectedCategoryName('');
    setSelectedSubcategoryId('');
    setSearchCategory('');
    setShowCategoryDropdown(false);
  };

  // Handle click outside category dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };

    if (showCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCategoryDropdown]);

  // Removed generateMockAds() - now using fetchAds() to get real data from API

  // Handle ad click - track view and add to recently viewed
  const handleAdClick = async (adId) => {
    try {
      // Increment view count (only if user is authenticated)
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await window.axios.post(`/api/ads/${adId}/view`);
        } catch (err) {
          // Silently fail if not authenticated or other error
          console.log('Could not increment view count:', err);
        }
      }

      // Add to recently viewed items (localStorage)
      const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      const ad = allAds.find(a => a.id === adId);
      if (ad) {
        // Remove if already exists
        const filtered = recentlyViewed.filter(item => item.id !== adId);
        // Add to beginning (most recent first)
        const updated = [{ ...ad, viewedAt: new Date().toISOString() }, ...filtered].slice(0, 20); // Keep last 20
        localStorage.setItem('recentlyViewed', JSON.stringify(updated));
      }
    } catch (err) {
      console.error('Error handling ad click:', err);
    }
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
    // The searchCategory and selectedLocations will be used in filtering
    console.log('Search:', { 
      searchQuery, 
      searchCategory,
      selectedLocations: Array.from(selectedLocations),
      selectedCategories, 
      locationHierarchy,
      priceRange, 
      sortBy 
    });
    setCurrentPage(1); // Reset to first page on new search
    
    // Apply search filters to sidebar filters
    if (searchCategory) {
      // Handle "Category > Subcategory" format
      if (searchCategory.includes(' > ')) {
        const [categoryName] = searchCategory.split(' > ');
        const category = categories.find(c => c.name === categoryName);
        if (category && !selectedCategories.includes(category.id)) {
          setSelectedCategories([category.id]);
        }
      } else {
        // Main category only
      const category = categories.find(c => c.name === searchCategory);
      if (category && !selectedCategories.includes(category.id)) {
        setSelectedCategories([category.id]);
      }
    }
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
                {/* Category Selection - Cascading two-column menu */}
                <div className="relative min-w-[150px]" ref={categoryDropdownRef}>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      className="w-full px-3 py-2 text-left border-0 rounded-md bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] flex items-center justify-between"
                    >
                      <span>{buildCategorySearchString() || 'All Categories'}</span>
                      <span className="ml-2">{showCategoryDropdown ? '▼' : '▶'}</span>
                    </button>
                    
                    {/* Cascading Category Menu */}
                    {showCategoryDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-md shadow-lg z-50 flex">
                        {/* Category Column */}
                        <div className="min-w-[200px] max-h-96 overflow-y-auto border-r border-[hsl(var(--border))]">
                          <div className="p-2 font-semibold text-xs text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                            Category
                          </div>
                          <div className="py-1">
                            <button
                              onClick={() => {
                                handleClearCategorySelection();
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-[hsl(var(--accent))] ${
                                !selectedCategoryName ? 'bg-[hsl(var(--accent))]' : ''
                              }`}
                            >
                              All Categories
                            </button>
                            {categories.map((category, index) => (
                              <button
                                key={category.id || `category-${index}`}
                                onClick={() => handleCategorySelect(category.name)}
                                onMouseEnter={() => {
                                  if (selectedCategoryName !== category.name) {
                                    handleCategorySelect(category.name);
                                  }
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-[hsl(var(--accent))] flex items-center justify-between ${
                                  selectedCategoryName === category.name ? 'bg-[hsl(var(--accent))]' : ''
                                }`}
                              >
                                <span>{category.name}</span>
                                {category.subcategories && category.subcategories.length > 0 && <span>▶</span>}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Subcategory Column - appears when category is selected */}
                        {selectedCategoryName && getSelectedCategory() && getSelectedCategory().subcategories && getSelectedCategory().subcategories.length > 0 && (
                          <div className="min-w-[200px] max-h-96 overflow-y-auto">
                            <div className="p-2 font-semibold text-xs text-[hsl(var(--muted-foreground))] border-b border-[hsl(var(--border))]">
                              Subcategory
                            </div>
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  setSelectedSubcategoryId('');
                                  setSearchCategory(getSelectedCategory().name);
                                  setShowCategoryDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-[hsl(var(--accent))] ${
                                  !selectedSubcategoryId ? 'bg-[hsl(var(--accent))]' : ''
                                }`}
                              >
                                All Subcategories
                              </button>
                              {getSelectedCategory().subcategories.map((subcategory) => (
                                <button
                                  key={subcategory.id}
                                  onClick={() => handleSubcategorySelect(subcategory.id.toString())}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-[hsl(var(--accent))] ${
                                    selectedSubcategoryId === subcategory.id.toString() ? 'bg-[hsl(var(--accent))]' : ''
                                  }`}
                                >
                                  {subcategory.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {/* Location Selection - Hierarchical checkbox dropdown */}
                <div className="relative min-w-[150px]" ref={locationDropdownRef}>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                      className="w-full px-3 py-2 text-left border-0 rounded-md bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] flex items-center justify-between"
                    >
                      <span>{buildSearchLocationString()}</span>
                      <span className="ml-2">{showLocationDropdown ? '▼' : '▶'}</span>
                    </button>
                    
                    {/* Hierarchical Checkbox Menu */}
                    {showLocationDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-md shadow-lg z-50 w-[600px] max-h-[500px] overflow-y-auto">
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[hsl(var(--border))]">
                            <span className="font-semibold text-sm text-[hsl(var(--foreground))]">Select Locations</span>
                            <button
                              onClick={handleSelectAllLocations}
                              className="text-xs text-[hsl(var(--primary))] hover:underline"
                            >
                              {selectedLocations.size > 0 ? 'Clear All' : 'Select All'}
                            </button>
                            </div>
                          
                          {/* Hierarchical Location Tree */}
                          <div className="space-y-1">
                            {locationData.provinces.map((province) => (
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
                                  <input
                                    type="checkbox"
                                    className="mr-2"
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
                                    onChange={() => {
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
                                  />
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
                                      <input
                                        type="checkbox"
                                        className="mr-2"
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
                                        onChange={() => {
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
                                      />
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
                                          <input
                                            type="checkbox"
                                            className="mr-2"
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
                                            onChange={() => {
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
                                          />
                                          <span className="text-sm text-[hsl(var(--foreground))]">
                                            {localLevel.name} ({localLevel.type === 'municipality' ? 'M' : 'RM'})
                                          </span>
                            </div>
                                        
                                        {/* Wards and Local Addresses */}
                                        {expandedLocalLevels.has(`${province.id}-${district.id}-${localLevel.id}`) && localLevel.wards && localLevel.wards.map((ward) => (
                                          <div key={ward.id} className="ml-6 mt-1">
                                            <div className="flex items-center py-1 hover:bg-[hsl(var(--accent))] rounded px-2">
                                              <input
                                                type="checkbox"
                                                className="mr-2"
                                                checked={(() => {
                                                  const allIds = [ward.id];
                                                  if (ward.local_addresses) {
                                                    ward.local_addresses.forEach((_, idx) => {
                                                      allIds.push(`${ward.id}-${idx}`);
                                                    });
                                                  }
                                                  return allIds.every(id => selectedLocations.has(id));
                                                })()}
                                                onChange={() => {
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
                                              />
                                              <span className="text-sm text-[hsl(var(--foreground))]">
                                                Ward {ward.ward_number}
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
                                                        type="checkbox"
                                                        className="mr-2"
                                                        checked={selectedLocations.has(addressId)}
                                                        onChange={() => handleLocationToggle(addressId)}
                                                      />
                                                      <span className="text-xs text-[hsl(var(--muted-foreground))]">{address}</span>
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
                  <Card 
                    key={ad.id} 
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleAdClick(ad.id)}
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
                        <p className="text-lg font-bold text-[hsl(var(--primary))]">
                          Rs. {ad.price.toLocaleString()}
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
                      <Card 
                        key={ad.id} 
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => handleAdClick(ad.id)}
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
                            <p className="text-lg font-bold text-[hsl(var(--primary))]">
                              Rs. {ad.price.toLocaleString()}
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
