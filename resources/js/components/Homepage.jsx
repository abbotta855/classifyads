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
  const [searchLocationHierarchy, setSearchLocationHierarchy] = useState({
    province: '',
    zone: '',
    district: '',
    municipality: '',
    ruralMunicipality: ''
  });
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [sortBy, setSortBy] = useState('most relevant');
  const [ads, setAds] = useState([]);
  const [allAds, setAllAds] = useState([]); // All ads for pagination
  const [filteredAdsCount, setFilteredAdsCount] = useState(0); // Count of filtered ads for pagination
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const adsPerPage = 39;

  // Hierarchical location structure (Nepal administrative divisions)
  const [locationHierarchy, setLocationHierarchy] = useState({
    province: '',
    zone: '',
    district: '',
    municipality: '',
    ruralMunicipality: '',
    wardNumber: '',
    place: ''
  });

  // Mock location data structure - Replace with API call later
  // This represents Nepal's administrative structure
  const locationData = {
    provinces: [
      {
        id: 1,
        name: 'Province 1',
        zones: [
          {
            id: 1,
            name: 'Koshi Zone',
            districts: [
              {
                id: 1,
                name: 'Morang',
                municipalities: [
                  { id: 1, name: 'Biratnagar', wards: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], places: ['Biratnagar-1', 'Biratnagar-2', 'Biratnagar-3'] },
                  { id: 2, name: 'Itahari', wards: [1, 2, 3, 4, 5], places: ['Itahari-1', 'Itahari-2'] }
                ],
                ruralMunicipalities: [
                  { id: 1, name: 'Ratuwamai', wards: [1, 2, 3, 4, 5], places: ['Ratuwamai-1', 'Ratuwamai-2'] }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 2,
        name: 'Province 2',
        zones: [
          {
            id: 2,
            name: 'Janakpur Zone',
            districts: [
              {
                id: 2,
                name: 'Dhanusha',
                municipalities: [
                  { id: 3, name: 'Janakpur', wards: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], places: ['Janakpur-1', 'Janakpur-2', 'Janakpur-3'] }
                ],
                ruralMunicipalities: [
                  { id: 2, name: 'Dhanusadham', wards: [1, 2, 3, 4, 5], places: ['Dhanusadham-1'] }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 3,
        name: 'Bagmati Province',
        zones: [
          {
            id: 3,
            name: 'Bagmati Zone',
            districts: [
              {
                id: 3,
                name: 'Kathmandu',
                municipalities: [
                  { id: 4, name: 'Kathmandu', wards: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32], places: ['Thamel', 'Durbar Square', 'New Road', 'Lazimpat', 'Baneshwor'] },
                  { id: 5, name: 'Lalitpur', wards: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29], places: ['Patan', 'Pulchowk', 'Jawalakhel'] }
                ],
                ruralMunicipalities: []
              }
            ]
          }
        ]
      }
    ]
  };

  // Helper functions to get filtered options based on selections
  const getSelectedProvince = () => {
    if (!locationHierarchy.province) return null;
    return locationData.provinces.find(p => p.id === parseInt(locationHierarchy.province));
  };

  const getSelectedZone = () => {
    const province = getSelectedProvince();
    if (!province || !locationHierarchy.zone) return null;
    return province.zones.find(z => z.id === parseInt(locationHierarchy.zone));
  };

  const getSelectedDistrict = () => {
    const zone = getSelectedZone();
    if (!zone || !locationHierarchy.district) return null;
    return zone.districts.find(d => d.id === parseInt(locationHierarchy.district));
  };

  const getSelectedMunicipality = () => {
    const district = getSelectedDistrict();
    if (!district || !locationHierarchy.municipality) return null;
    return district.municipalities.find(m => m.id === parseInt(locationHierarchy.municipality));
  };

  const getSelectedRuralMunicipality = () => {
    const district = getSelectedDistrict();
    if (!district || !locationHierarchy.ruralMunicipality) return null;
    return district.ruralMunicipalities.find(rm => rm.id === parseInt(locationHierarchy.ruralMunicipality));
  };

  const handleLocationHierarchyChange = (level, value) => {
    setLocationHierarchy(prev => {
      const newHierarchy = { ...prev };
      newHierarchy[level] = value;
      
      // Reset all dependent levels when a parent level changes
      const levels = ['province', 'zone', 'district', 'municipality', 'ruralMunicipality', 'wardNumber', 'place'];
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

  const getSearchZone = () => {
    const province = getSearchProvince();
    if (!province || !searchLocationHierarchy.zone) return null;
    return province.zones.find(z => z.id === parseInt(searchLocationHierarchy.zone));
  };

  const getSearchDistrict = () => {
    const zone = getSearchZone();
    if (!zone || !searchLocationHierarchy.district) return null;
    return zone.districts.find(d => d.id === parseInt(searchLocationHierarchy.district));
  };

  const getSearchMunicipality = () => {
    const district = getSearchDistrict();
    if (!district || !searchLocationHierarchy.municipality) return null;
    return district.municipalities.find(m => m.id === parseInt(searchLocationHierarchy.municipality));
  };

  const getSearchRuralMunicipality = () => {
    const district = getSearchDistrict();
    if (!district || !searchLocationHierarchy.ruralMunicipality) return null;
    return district.ruralMunicipalities.find(rm => rm.id === parseInt(searchLocationHierarchy.ruralMunicipality));
  };

  const handleSearchLocationChange = (level, value) => {
    setSearchLocationHierarchy(prev => {
      const newHierarchy = { ...prev };
      newHierarchy[level] = value;
      
      // Reset all dependent levels when a parent level changes
      const levels = ['province', 'zone', 'district', 'municipality', 'ruralMunicipality'];
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
    if (searchLocationHierarchy.zone) {
      const zone = getSearchZone();
      if (zone) parts.push(zone.name);
    }
    if (searchLocationHierarchy.district) {
      const district = getSearchDistrict();
      if (district) parts.push(district.name);
    }
    if (searchLocationHierarchy.municipality) {
      const municipality = getSearchMunicipality();
      if (municipality) parts.push(municipality.name);
    }
    if (searchLocationHierarchy.ruralMunicipality) {
      const ruralMunicipality = getSearchRuralMunicipality();
      if (ruralMunicipality) parts.push(ruralMunicipality.name);
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

    // Filter by sidebar location hierarchy
    if (locationHierarchy.province) {
      const province = getSelectedProvince();
      if (province) {
        filtered = filtered.filter(ad => {
          const adProvince = ad.locationHierarchy?.province;
          return adProvince && parseInt(adProvince) === parseInt(locationHierarchy.province);
        });
      }
    }
    if (locationHierarchy.zone) {
      const zone = getSelectedZone();
      if (zone) {
        filtered = filtered.filter(ad => {
          const adZone = ad.locationHierarchy?.zone;
          return adZone && parseInt(adZone) === parseInt(locationHierarchy.zone);
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
    if (locationHierarchy.municipality) {
      const municipality = getSelectedMunicipality();
      if (municipality) {
        filtered = filtered.filter(ad => {
          const adMunicipality = ad.locationHierarchy?.municipality;
          return adMunicipality && parseInt(adMunicipality) === parseInt(locationHierarchy.municipality);
        });
      }
    }
    if (locationHierarchy.ruralMunicipality) {
      const ruralMunicipality = getSelectedRuralMunicipality();
      if (ruralMunicipality) {
        filtered = filtered.filter(ad => {
          const adRuralMunicipality = ad.locationHierarchy?.ruralMunicipality;
          return adRuralMunicipality && parseInt(adRuralMunicipality) === parseInt(locationHierarchy.ruralMunicipality);
        });
      }
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
    const categories = ['Land for sale', 'Car for sale', 'Motorbike for sale', 'Construction Materials', 'Job'];
    
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
    if (locationHierarchy.zone) {
      const zone = getSelectedZone();
      if (zone) parts.push(zone.name);
    }
    if (locationHierarchy.district) {
      const district = getSelectedDistrict();
      if (district) parts.push(district.name);
    }
    if (locationHierarchy.municipality) {
      const municipality = getSelectedMunicipality();
      if (municipality) parts.push(municipality.name);
    }
    if (locationHierarchy.ruralMunicipality) {
      const ruralMunicipality = getSelectedRuralMunicipality();
      if (ruralMunicipality) parts.push(ruralMunicipality.name);
    }
    if (locationHierarchy.wardNumber) {
      parts.push(`Ward ${locationHierarchy.wardNumber}`);
    }
    if (locationHierarchy.place) {
      parts.push(locationHierarchy.place);
    }
    return parts.join(', ');
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
    if (searchLocationHierarchy.province || searchLocationHierarchy.zone || 
        searchLocationHierarchy.district || searchLocationHierarchy.municipality || 
        searchLocationHierarchy.ruralMunicipality) {
      setLocationHierarchy({
        ...locationHierarchy,
        province: searchLocationHierarchy.province || locationHierarchy.province,
        zone: searchLocationHierarchy.zone || locationHierarchy.zone,
        district: searchLocationHierarchy.district || locationHierarchy.district,
        municipality: searchLocationHierarchy.municipality || locationHierarchy.municipality,
        ruralMunicipality: searchLocationHierarchy.ruralMunicipality || locationHierarchy.ruralMunicipality,
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
      'Construction Materials': '/categories/construction-material-for-sale',
      'Job': '/categories/land-for-sale' // Note: wireframe shows this redirects to land for sale
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
                {/* Location Selection - Cascading dropdowns */}
                <div className="relative min-w-[150px] flex gap-1">
                  {/* Province */}
                  <select
                    value={searchLocationHierarchy.province || ''}
                    onChange={(e) => handleSearchLocationChange('province', e.target.value)}
                    className="px-3 py-2 border-0 rounded-md bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                  >
                    <option value="">All Locations</option>
                    {locationData.provinces.map((province) => (
                      <option key={province.id} value={province.id}>
                        {province.name}
                      </option>
                    ))}
                  </select>
                  
                  {/* Zone - appears when Province is selected */}
                  {searchLocationHierarchy.province && getSearchProvince() && (
                    <select
                      value={searchLocationHierarchy.zone || ''}
                      onChange={(e) => handleSearchLocationChange('zone', e.target.value)}
                      className="px-3 py-2 border-0 rounded-md bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                    >
                      <option value="">Zone</option>
                      {getSearchProvince().zones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.name}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {/* District - appears when Zone is selected */}
                  {searchLocationHierarchy.zone && getSearchZone() && (
                    <select
                      value={searchLocationHierarchy.district || ''}
                      onChange={(e) => handleSearchLocationChange('district', e.target.value)}
                      className="px-3 py-2 border-0 rounded-md bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                    >
                      <option value="">District</option>
                      {getSearchZone().districts.map((district) => (
                        <option key={district.id} value={district.id}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {/* Municipality - appears when District is selected */}
                  {searchLocationHierarchy.district && getSearchDistrict() && getSearchDistrict().municipalities.length > 0 && (
                    <select
                      value={searchLocationHierarchy.municipality || ''}
                      onChange={(e) => {
                        handleSearchLocationChange('municipality', e.target.value);
                        handleSearchLocationChange('ruralMunicipality', '');
                      }}
                      className="px-3 py-2 border-0 rounded-md bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                    >
                      <option value="">Municipality</option>
                      {getSearchDistrict().municipalities.map((municipality) => (
                        <option key={municipality.id} value={municipality.id}>
                          {municipality.name}
                        </option>
                      ))}
                    </select>
                  )}
                  
                  {/* Rural Municipality - appears when District is selected */}
                  {searchLocationHierarchy.district && getSearchDistrict() && getSearchDistrict().ruralMunicipalities.length > 0 && (
                    <select
                      value={searchLocationHierarchy.ruralMunicipality || ''}
                      onChange={(e) => {
                        handleSearchLocationChange('ruralMunicipality', e.target.value);
                        handleSearchLocationChange('municipality', '');
                      }}
                      className="px-3 py-2 border-0 rounded-md bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                    >
                      <option value="">Rural Municipality</option>
                      {getSearchDistrict().ruralMunicipalities.map((ruralMunicipality) => (
                        <option key={ruralMunicipality.id} value={ruralMunicipality.id}>
                          {ruralMunicipality.name}
                        </option>
                      ))}
                    </select>
                  )}
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

                {/* Location Filter - Hierarchical */}
                <div className="mb-6">
                  <h3 className="font-semibold text-[hsl(var(--foreground))] mb-2">
                    Location
                  </h3>
                  <div className="space-y-2">
                    {/* Province */}
                    <div>
                      <label className="text-xs text-[hsl(var(--muted-foreground))] mb-1 block">Province</label>
                      <select
                        value={locationHierarchy.province}
                        onChange={(e) => handleLocationHierarchyChange('province', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
                      >
                        <option value="">Select Province</option>
                        {locationData.provinces.map((province) => (
                          <option key={province.id} value={province.id}>
                            {province.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Zone */}
                    {locationHierarchy.province && getSelectedProvince() && (
                      <div>
                        <label className="text-xs text-[hsl(var(--muted-foreground))] mb-1 block">Zone</label>
                        <select
                          value={locationHierarchy.zone}
                          onChange={(e) => handleLocationHierarchyChange('zone', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
                        >
                          <option value="">Select Zone</option>
                          {getSelectedProvince().zones.map((zone) => (
                            <option key={zone.id} value={zone.id}>
                              {zone.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* District */}
                    {locationHierarchy.zone && getSelectedZone() && (
                      <div>
                        <label className="text-xs text-[hsl(var(--muted-foreground))] mb-1 block">District</label>
                        <select
                          value={locationHierarchy.district}
                          onChange={(e) => handleLocationHierarchyChange('district', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
                        >
                          <option value="">Select District</option>
                          {getSelectedZone().districts.map((district) => (
                            <option key={district.id} value={district.id}>
                              {district.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Municipality or Rural Municipality */}
                    {locationHierarchy.district && getSelectedDistrict() && (
                      <>
                        {/* Municipality */}
                        {getSelectedDistrict().municipalities.length > 0 && (
                          <div>
                            <label className="text-xs text-[hsl(var(--muted-foreground))] mb-1 block">Municipality</label>
                            <select
                              value={locationHierarchy.municipality}
                              onChange={(e) => {
                                handleLocationHierarchyChange('municipality', e.target.value);
                                handleLocationHierarchyChange('ruralMunicipality', ''); // Clear rural municipality when municipality is selected
                              }}
                              className="w-full px-2 py-1.5 text-sm border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
                            >
                              <option value="">Select Municipality</option>
                              {getSelectedDistrict().municipalities.map((municipality) => (
                                <option key={municipality.id} value={municipality.id}>
                                  {municipality.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Rural Municipality */}
                        {getSelectedDistrict().ruralMunicipalities.length > 0 && (
                          <div>
                            <label className="text-xs text-[hsl(var(--muted-foreground))] mb-1 block">Rural Municipality</label>
                            <select
                              value={locationHierarchy.ruralMunicipality}
                              onChange={(e) => {
                                handleLocationHierarchyChange('ruralMunicipality', e.target.value);
                                handleLocationHierarchyChange('municipality', ''); // Clear municipality when rural municipality is selected
                              }}
                              className="w-full px-2 py-1.5 text-sm border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
                            >
                              <option value="">Select Rural Municipality</option>
                              {getSelectedDistrict().ruralMunicipalities.map((ruralMunicipality) => (
                                <option key={ruralMunicipality.id} value={ruralMunicipality.id}>
                                  {ruralMunicipality.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </>
                    )}

                    {/* Ward Number */}
                    {(locationHierarchy.municipality || locationHierarchy.ruralMunicipality) && (
                      <div>
                        <label className="text-xs text-[hsl(var(--muted-foreground))] mb-1 block">Ward Number</label>
                        <select
                          value={locationHierarchy.wardNumber}
                          onChange={(e) => handleLocationHierarchyChange('wardNumber', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
                        >
                          <option value="">Select Ward Number</option>
                          {(() => {
                            const selected = locationHierarchy.municipality 
                              ? getSelectedMunicipality() 
                              : getSelectedRuralMunicipality();
                            return selected?.wards.map((ward) => (
                              <option key={ward} value={ward}>
                                Ward {ward}
                              </option>
                            ));
                          })()}
                        </select>
                      </div>
                    )}

                    {/* Place */}
                    {locationHierarchy.wardNumber && (
                      <div>
                        <label className="text-xs text-[hsl(var(--muted-foreground))] mb-1 block">Place</label>
                        <select
                          value={locationHierarchy.place}
                          onChange={(e) => handleLocationHierarchyChange('place', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
                        >
                          <option value="">Select Place</option>
                          {(() => {
                            const selected = locationHierarchy.municipality 
                              ? getSelectedMunicipality() 
                              : getSelectedRuralMunicipality();
                            return selected?.places.map((place) => (
                              <option key={place} value={place}>
                                {place}
                              </option>
                            ));
                          })()}
                        </select>
                      </div>
                    )}
                  </div>
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
              <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">
                Search and filter result
              </h2>
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
              {/* Results count */}
              <div className="mb-4">
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Showing {startResult}-{endResult} of {filteredAdsCount} results
                </p>
              </div>

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

            {/* Category-specific ad sections (4 ads per row, then "more ad" link) */}
            {['Land for sale', 'Car for sale', 'Motorbike for sale', 'Construction Materials', 'Job'].map((categoryName) => {
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
