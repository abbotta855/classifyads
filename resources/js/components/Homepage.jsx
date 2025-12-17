import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';

function Homepage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [locationData, setLocationData] = useState({ provinces: [] }); // Location data from database
  const [showCategoryFilter, setShowCategoryFilter] = useState(false); // Track if category filter section is visible
  const [selectedLocations, setSelectedLocations] = useState(new Set()); // Multiple location selections with checkboxes (for search bar)
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [priceErrors, setPriceErrors] = useState({ min: '', max: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState(''); // Category for search dropdown
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false); // For search bar category dropdown
  const [selectedCategoryName, setSelectedCategoryName] = useState(''); // Selected category name for showing subcategories
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(''); // Selected subcategory ID
  const [expandedCategories, setExpandedCategories] = useState(new Set()); // For category dropdown - track expanded categories
  const [selectedCategories, setSelectedCategories] = useState(new Set()); // Selected category IDs (checkboxes)
  const [selectedSubcategories, setSelectedSubcategories] = useState(new Set()); // Selected subcategory IDs (checkboxes)
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
  const adsPerPage = 40;

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

  // Category toggle functions (similar to location toggles)
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleCategoryToggle = (categoryId) => {
    // Find the category to get its subcategories
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    const isCurrentlySelected = selectedCategories.has(categoryId);
    
    // Update selectedCategories
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (isCurrentlySelected) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });

    // Update selectedSubcategories - select/unselect all subcategories of this category
    if (category.subcategories && category.subcategories.length > 0) {
      setSelectedSubcategories(prev => {
        const newSet = new Set(prev);
        category.subcategories.forEach(sub => {
          if (isCurrentlySelected) {
            newSet.delete(sub.id);
          } else {
            newSet.add(sub.id);
          }
        });
        return newSet;
      });
    }
  };

  const handleSubcategoryToggle = (subcategoryId) => {
    // Find which category this subcategory belongs to
    const parentCategory = categories.find(cat => 
      cat.subcategories && cat.subcategories.some(sub => sub.id === subcategoryId)
    );
    
    const isCurrentlySelected = selectedSubcategories.has(subcategoryId);
    
    // Update selectedSubcategories
    setSelectedSubcategories(prev => {
      const newSet = new Set(prev);
      if (isCurrentlySelected) {
        newSet.delete(subcategoryId);
      } else {
        newSet.add(subcategoryId);
      }
      
      // If unselecting a subcategory, check if parent category should also be unselected
      if (parentCategory && !isCurrentlySelected) {
        // After adding, check if all subcategories are now selected
        const allSubcategoriesSelected = parentCategory.subcategories.every(sub => 
          newSet.has(sub.id)
        );
        if (allSubcategoriesSelected && !selectedCategories.has(parentCategory.id)) {
          // Select parent category if all subcategories are selected
          setSelectedCategories(prevCat => {
            const newCatSet = new Set(prevCat);
            newCatSet.add(parentCategory.id);
            return newCatSet;
          });
        }
      } else if (parentCategory && isCurrentlySelected) {
        // After removing, check if parent category should be unselected
        const allSubcategoriesSelected = parentCategory.subcategories.every(sub => 
          newSet.has(sub.id)
        );
        if (!allSubcategoriesSelected && selectedCategories.has(parentCategory.id)) {
          // Unselect parent category if not all subcategories are selected
          setSelectedCategories(prevCat => {
            const newCatSet = new Set(prevCat);
            newCatSet.delete(parentCategory.id);
            return newCatSet;
          });
        }
      }
      
      return newSet;
    });
  };

  const handleSelectAllCategories = () => {
    setSelectedCategories(new Set());
    setSelectedSubcategories(new Set());
  };

  const buildCategorySearchString = () => {
    if (selectedCategories.size === 0 && selectedSubcategories.size === 0) {
      return 'All Categories';
    }
    const total = selectedCategories.size + selectedSubcategories.size;
    if (total === 1) {
      return '1 category selected';
    }
    return `${total} categories selected`;
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
        category_id: ad.category_id, // Include category_id for proper matching
        category: ad.category,
        subcategory: ad.subcategory || ad.sub_category,
        sub_category: ad.subcategory || ad.sub_category,
        location: ad.location,
        location_id: ad.location_id,
        selected_local_address_index: ad.selected_local_address_index !== undefined ? ad.selected_local_address_index : null,
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

    // Filter by selected categories and subcategories from search bar dropdown
    if (selectedCategories.size > 0 || selectedSubcategories.size > 0) {
      // Normalize selected IDs to numbers for comparison
      const selectedCategoryIds = Array.from(selectedCategories).map(id => typeof id === 'string' ? parseInt(id, 10) : Number(id));
      const selectedSubcategoryIds = Array.from(selectedSubcategories).map(id => typeof id === 'string' ? parseInt(id, 10) : Number(id));
      
      filtered = filtered.filter(ad => {
        // Method 1: Check if ad's category_id matches any selected category or subcategory ID
        // This is the primary method - ads should be linked to subcategory records when subcategory is selected
        if (ad.category_id) {
          const categoryId = typeof ad.category_id === 'string' ? parseInt(ad.category_id, 10) : Number(ad.category_id);
          
          // Check if it matches a selected subcategory ID (prioritize subcategory match)
          if (selectedSubcategoryIds.includes(categoryId)) {
            return true;
          }
          
          // Check if it matches a selected main category ID
          if (selectedCategoryIds.includes(categoryId)) {
            return true;
          }
        }
        
        // Method 2: Check by category/subcategory names (fallback for legacy data or name-based matching)
        if (ad.category) {
          // Find the category object that matches the ad's category name
          const category = categories.find(cat => 
            cat.name === ad.category || 
            cat.category === ad.category
          );
          
          if (category) {
            // Check if this main category is selected
            if (selectedCategoryIds.includes(category.id)) {
              return true;
            }
            
            // Check if any of its subcategories are selected
            if (category.subcategories && category.subcategories.length > 0) {
              // If ad has a subcategory name, match by subcategory name
              if (ad.subcategory || ad.sub_category) {
                const adSubcategoryName = (ad.subcategory || ad.sub_category).trim();
                const matchingSubcategory = category.subcategories.find(sub => {
                  // Check if this subcategory is selected (by ID)
                  if (!selectedSubcategoryIds.includes(sub.id)) {
                    return false;
                  }
                  
                  // Match by name (case-insensitive comparison)
                  const subName = (sub.name || '').trim();
                  const subSlug = (sub.slug || '').trim();
                  return subName.toLowerCase() === adSubcategoryName.toLowerCase() || 
                         subSlug.toLowerCase() === adSubcategoryName.toLowerCase();
                });
                if (matchingSubcategory) {
                  return true;
                }
              }
            }
          }
        }
        
        return false;
      });
    }

    // Filter by selected locations (checkboxes)
    if (selectedLocations.size > 0) {
        filtered = filtered.filter(ad => {
        // Check if ad's location matches any selected location ID
        const adLocationId = ad.location_id || ad.locationId;
        if (!adLocationId) return false;
        
        // Normalize ad location ID to both string and number
        const adLocationIdStr = String(adLocationId);
        const adLocationIdNum = Number(adLocationId);
        
        // Get ad's address index
        let adAddressIndex = null;
        if (ad.selected_local_address_index !== null && ad.selected_local_address_index !== undefined) {
          const indexValue = Number(ad.selected_local_address_index);
          if (!isNaN(indexValue)) {
            adAddressIndex = indexValue;
          }
        }
        
        // Check all selected location IDs
        for (const selectedId of selectedLocations) {
          // If selectedId is a number, it's a ward ID - match all ads in that ward
          if (typeof selectedId === 'number') {
            if (selectedId === adLocationIdNum) {
              return true;
            }
          }
          // If selectedId is a string
          else if (typeof selectedId === 'string') {
            // Check exact match (string comparison) - ward ID as string
            if (selectedId === adLocationIdStr) {
              return true;
            }
            // Check if it's an address ID (format: "wardId-index")
            if (selectedId.includes('-')) {
              const parts = selectedId.split('-');
              const wardIdStr = parts[0];
              const addressIndexStr = parts.slice(1).join('-');
              const wardIdNum = parseInt(wardIdStr, 10);
              const addressIndex = parseInt(addressIndexStr, 10);
              
              // Check if ward ID matches
              if (!isNaN(wardIdNum) && (wardIdNum === adLocationIdNum || String(wardIdNum) === adLocationIdStr)) {
                // If it's a specific address (has index), also check the address index
                if (!isNaN(addressIndex)) {
                  // For address index 0: match new ads with index 0 OR old ads with null (backward compatibility)
                  if (addressIndex === 0) {
                    if (adAddressIndex === 0 || adAddressIndex === null) {
                      return true;
                    }
                  } else {
                    // For address index > 0: only match new ads with that specific index
                    if (adAddressIndex === addressIndex) {
                      return true;
                    }
                  }
                } else {
                  // Invalid address index format, just match by ward
                  return true;
                }
              }
            }
            // Try parsing as number and comparing (ward ID as string)
            else {
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

    // Note: Sidebar category filters use the same selectedCategories/selectedSubcategories Sets
    // Note: Both search bar and sidebar location filters now use the same selectedLocations Set
    // The old locationHierarchy filtering has been removed since we're using checkbox-based selection

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
    selectedLocations, 
    selectedCategories, 
    selectedSubcategories, // Add this - it was missing!
    priceRange, 
    sortBy, 
    currentPage,
    categories,
    allAds.length // Only depend on length, not the array itself
  ]);

  // Reset to page 1 when filters change (except currentPage)
  const prevFiltersRef = useRef({ searchQuery, searchCategory, selectedLocations, selectedCategories, priceRange, sortBy });
  useEffect(() => {
    const prevFilters = prevFiltersRef.current;
    const filtersChanged = 
      prevFilters.searchQuery !== searchQuery ||
      prevFilters.searchCategory !== searchCategory ||
      prevFilters.selectedLocations?.size !== selectedLocations.size ||
      JSON.stringify(prevFilters.selectedCategories) !== JSON.stringify(selectedCategories) ||
      JSON.stringify(prevFilters.priceRange) !== JSON.stringify(priceRange) ||
      prevFilters.sortBy !== sortBy;
    
    if (filtersChanged && currentPage > 1) {
      setCurrentPage(1);
    }
    
    prevFiltersRef.current = { searchQuery, searchCategory, selectedLocations, selectedCategories, priceRange, sortBy };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, searchCategory, selectedLocations, selectedCategories, priceRange, sortBy]);

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

  // Helper functions for category selection - keeping for backward compatibility
  const getSelectedCategory = () => {
    if (!selectedCategoryName) return null;
    return categories.find(c => c.name === selectedCategoryName);
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

  // Handle ad click - navigate to detail page
  const handleAdClick = async (adId) => {
    // Track click (fire and forget - don't wait for response)
    try {
      await window.axios.post(`/api/ads/${adId}/click`);
    } catch (err) {
      // Silently fail - don't block navigation
      console.error('Failed to track click:', err);
    }
    
    // Navigate to ad detail page
    navigate(`/ads/${adId}`);
  };


  // Calculate ad count for a category (including its subcategories) or a subcategory (only itself)
  const getCategoryAdCount = (categoryId, categoryName) => {
    // First, check if this ID is a subcategory by searching in all categories' subcategories arrays
    let isSubcategory = false;
    let subcategory = null;
    
    for (const parentCat of categories) {
      if (parentCat.subcategories && Array.isArray(parentCat.subcategories)) {
        const foundSub = parentCat.subcategories.find(sub => sub.id === categoryId);
        if (foundSub) {
          isSubcategory = true;
          subcategory = foundSub;
          break;
        }
      }
    }
    
    // If it's a subcategory, count only ads directly linked to this subcategory
    if (isSubcategory && subcategory) {
      return allAds.filter(ad => {
        if (ad.category_id !== null && ad.category_id !== undefined) {
          // Normalize both IDs to numbers for comparison
          const adCategoryId = typeof ad.category_id === 'string' ? parseInt(ad.category_id, 10) : Number(ad.category_id);
          const targetCategoryId = typeof categoryId === 'string' ? parseInt(categoryId, 10) : Number(categoryId);
          return adCategoryId === targetCategoryId;
        }
        // Match by subcategory name (for backward compatibility)
        if (ad.category || ad.sub_category) {
          const adCategoryName = (ad.category || ad.sub_category || '').trim().toLowerCase();
          const subcategoryName = (subcategory.name || categoryName || '').trim().toLowerCase();
          return adCategoryName === subcategoryName;
        }
        return false;
      }).length;
    }
    
    // Find the category (for main categories)
    const category = categories.find(c => c.id === categoryId);
    if (!category) return 0;
    
    // For main categories, count ads in this category AND all its subcategories
    const getAllSubcategoryIds = (cat) => {
      let ids = [cat.id];
      if (cat.subcategories && cat.subcategories.length > 0) {
        cat.subcategories.forEach(sub => {
          ids.push(sub.id);
          // Recursively get nested subcategories if they exist
          const nestedSub = categories.find(c => c.id === sub.id);
          if (nestedSub && nestedSub.subcategories) {
            ids = ids.concat(nestedSub.subcategories.map(s => s.id));
          }
        });
      }
      return ids;
    };

    const allCategoryIds = getAllSubcategoryIds(category);
    
    // Count ads that match this category or any of its subcategories
    return allAds.filter(ad => {
      // Match by category ID (primary method)
      if (ad.category_id) {
        const adCategoryId = typeof ad.category_id === 'string' ? parseInt(ad.category_id, 10) : ad.category_id;
        return allCategoryIds.includes(adCategoryId);
      } 
      // Match by category name (for backward compatibility)
      else if (ad.category || ad.sub_category) {
        const adCategoryName = (ad.category || ad.sub_category || '').trim();
        // Check if main category name matches
        if (category.name === adCategoryName) {
          return true;
        }
        // Check if any subcategory name matches
        if (category.subcategories && category.subcategories.length > 0) {
          return category.subcategories.some(sub => sub.name === adCategoryName);
        }
      }
      return false;
    }).length;
  };

  // Get subcategories for a parent category
  const getSubcategories = (parentId) => {
    const category = categories.find(cat => cat.id === parentId);
    return category && category.subcategories ? category.subcategories : [];
  };

  // Get top-level categories (categories without parent)
  const getTopLevelCategories = () => {
    return categories.filter(cat => !cat.parent_id || cat.parent_id === null);
  };

  // Calculate ad count for a location (province, district, local level, ward, or address)
  const getLocationAdCount = (locationId) => {
    if (!locationId) return 0;
    
    // Check if it's an address ID (format: "wardId-index")
    if (typeof locationId === 'string' && locationId.includes('-')) {
      const parts = locationId.split('-');
      const wardId = parseInt(parts[0], 10);
      const addressIndex = parseInt(parts.slice(1).join('-'), 10); // Handle multi-part indices if needed
      
      if (isNaN(wardId) || isNaN(addressIndex)) return 0;
      
      // For specific addresses: match both location_id (ward) AND selected_local_address_index
      // Backward compatibility: For address index 0, also count old ads with null index
      // (Old ads always show the first address, so we assume null = index 0)
      return allAds.filter(ad => {
        const adLocationId = ad.location_id || ad.locationId;
        if (!adLocationId) return false;
        
        const adLocationIdNum = typeof adLocationId === 'string' ? parseInt(adLocationId, 10) : Number(adLocationId);
        if (adLocationIdNum !== wardId) return false;
        
        // Handle selected_local_address_index (can be null, undefined, or a number)
        let adAddressIndex = null;
        if (ad.selected_local_address_index !== null && ad.selected_local_address_index !== undefined) {
          const indexValue = Number(ad.selected_local_address_index);
          if (!isNaN(indexValue)) {
            adAddressIndex = indexValue;
          }
        }
        
        // For address index 0: match new ads with index 0 OR old ads with null (backward compatibility)
        // Old ads (null index) are assumed to belong to the first address (index 0)
        if (addressIndex === 0) {
          return adAddressIndex === 0 || adAddressIndex === null;
        }
        
        // For address index > 0: only match new ads with that specific index
        // Old ads (null index) are NOT counted for addresses other than index 0
        return adAddressIndex === addressIndex;
      }).length;
    }
    
    // For ward-level locations (no address index): count all ads in that ward
    const locationIdNum = typeof locationId === 'string' ? parseInt(locationId, 10) : Number(locationId);
    if (isNaN(locationIdNum)) return 0;
    
    return allAds.filter(ad => {
      const adLocationId = ad.location_id || ad.locationId;
      if (!adLocationId) return false;
      
      const adLocationIdNum = typeof adLocationId === 'string' ? parseInt(adLocationId, 10) : Number(adLocationId);
      return adLocationIdNum === locationIdNum;
    }).length;
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
        if (category && !selectedCategories.has(category.id)) {
          setSelectedCategories(new Set([category.id]));
        }
      } else {
        // Main category only
      const category = categories.find(c => c.name === searchCategory);
      if (category && !selectedCategories.has(category.id)) {
        setSelectedCategories(new Set([category.id]));
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

  const getCategoryAds = (sectionName) => {
    // Extract keyword from section name (e.g., "Land for sale" -> "land", "Car for sale" -> "car")
    const keyword = sectionName.toLowerCase().split(' ')[0]; // Get first word as keyword
    
    // Match ads by keyword in title or description (case-insensitive)
    return allAds.filter(ad => {
      const title = (ad.title || '').toLowerCase();
      const description = (ad.description || '').toLowerCase();
      return title.includes(keyword) || description.includes(keyword);
    }).slice(0, 4);
  };

  const getCategoryRoute = (sectionName) => {
    // Route to search page with the keyword
    const keyword = sectionName.toLowerCase().split(' ')[0];
    return `/search?q=${encodeURIComponent(keyword)}`;
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
                      className="w-full px-3 py-2 text-left border-0 rounded-md bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] flex items-center"
                    >
                      <span className="mr-2 flex-shrink-0">{showCategoryDropdown ? '▼' : '▶'}</span>
                      <span>{buildCategorySearchString() || 'All Categories'}</span>
                    </button>
                    
                    {/* Hierarchical Category Menu - Following location dropdown pattern */}
                    {showCategoryDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-md shadow-lg z-50 w-[400px] max-h-[500px] overflow-y-auto">
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[hsl(var(--border))]">
                            <span className="font-semibold text-sm text-[hsl(var(--foreground))]">Select Categories</span>
                            <button
                              onClick={handleSelectAllCategories}
                              className="text-xs text-[hsl(var(--primary))] hover:underline"
                            >
                              {selectedCategories.size > 0 || selectedSubcategories.size > 0 ? 'Clear All' : 'Select All'}
                            </button>
                          </div>
                          
                          {/* Hierarchical Category Tree */}
                          <div className="space-y-1">
                            {/* All Categories button - expands to show all categories */}
                            <div className="border-b border-[hsl(var(--border))] pb-1 mb-1">
                              <div className="flex items-center py-1 hover:bg-[hsl(var(--accent))] rounded px-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    // Toggle "All Categories" expansion - use a special key
                                    const allCategoriesExpanded = expandedCategories.has('all');
                                    if (allCategoriesExpanded) {
                                      setExpandedCategories(prev => {
                                        const newSet = new Set(prev);
                                        newSet.delete('all');
                                        // Also collapse all individual categories
                                        categories.forEach(cat => newSet.delete(cat.id));
                                        return newSet;
                                      });
                                    } else {
                                      setExpandedCategories(prev => {
                                        const newSet = new Set(prev);
                                        newSet.add('all');
                                        return newSet;
                                      });
                                    }
                                  }}
                                  className="mr-2 text-xs"
                                >
                                  {expandedCategories.has('all') ? '▼' : '▶'}
                                </button>
                                <input
                                  type="checkbox"
                                  className="mr-2"
                                  checked={categories.length > 0 && categories.every(cat => selectedCategories.has(cat.id))}
                                  onChange={() => {
                                    const allSelected = categories.length > 0 && categories.every(cat => selectedCategories.has(cat.id));
                                    setSelectedCategories(prev => {
                                      const newSet = new Set(prev);
                                      categories.forEach(cat => {
                                        if (allSelected) {
                                          // Unselect category and all its subcategories
                                          newSet.delete(cat.id);
                                          if (cat.subcategories && cat.subcategories.length > 0) {
                                            cat.subcategories.forEach(sub => {
                                              newSet.delete(sub.id);
                                            });
                                          }
                                        } else {
                                          // Select category and all its subcategories
                                          newSet.add(cat.id);
                                          if (cat.subcategories && cat.subcategories.length > 0) {
                                            cat.subcategories.forEach(sub => {
                                              newSet.add(sub.id);
                                            });
                                          }
                                        }
                                      });
                                      return newSet;
                                    });
                                    // Also update selectedSubcategories
                                    setSelectedSubcategories(prev => {
                                      const newSet = new Set(prev);
                                      categories.forEach(cat => {
                                        if (cat.subcategories && cat.subcategories.length > 0) {
                                          cat.subcategories.forEach(sub => {
                                            if (allSelected) {
                                              newSet.delete(sub.id);
                                            } else {
                                              newSet.add(sub.id);
                                            }
                                          });
                                        }
                                      });
                                      return newSet;
                                    });
                                  }}
                                />
                                <span className="text-sm font-medium text-[hsl(var(--foreground))]">All Categories</span>
                              </div>
                              
                              {/* All Categories - shown when expanded */}
                              {expandedCategories.has('all') && (
                                <div className="ml-6 mt-1 space-y-1">
                                  {categories.map((category) => (
                                    <div key={category.id} className="border-b border-[hsl(var(--border))] pb-1 mb-1">
                                      {/* Category Level */}
                                      <div className="flex items-center py-1 hover:bg-[hsl(var(--accent))] rounded px-2">
                                        <button
                                          type="button"
                                          onClick={() => toggleCategory(category.id)}
                                          className="mr-2 text-xs"
                                        >
                                          {expandedCategories.has(category.id) ? '▼' : '▶'}
                                        </button>
                                        <input
                                          type="checkbox"
                                          className="mr-2"
                                          checked={selectedCategories.has(category.id)}
                                          onChange={() => handleCategoryToggle(category.id)}
                                          title={category.subcategories && category.subcategories.length > 0 
                                            ? `Selecting this will also select all ${category.subcategories.length} subcategories` 
                                            : ''}
                                        />
                                        <span className="text-sm text-[hsl(var(--foreground))]">{category.name}</span>
                                      </div>
                                      
                                      {/* Subcategories - shown when category is expanded */}
                                      {expandedCategories.has(category.id) && category.subcategories && category.subcategories.length > 0 && (
                                        <div className="ml-6 mt-1 space-y-1">
                                          {category.subcategories.map((subcategory) => (
                                            <div key={subcategory.id} className="flex items-center py-1 hover:bg-[hsl(var(--accent))] rounded px-2">
                                              <input
                                                type="checkbox"
                                                className="mr-2"
                                                checked={selectedSubcategories.has(subcategory.id)}
                                                onChange={() => handleSubcategoryToggle(subcategory.id)}
                                              />
                                              <span className="text-sm text-[hsl(var(--foreground))]">{subcategory.name}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
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
                      className="w-full px-3 py-2 text-left border-0 rounded-md bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] flex items-center"
                    >
                      <span className="mr-2 flex-shrink-0">{showLocationDropdown ? '▼' : '▶'}</span>
                      <span>{buildSearchLocationString()}</span>
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
                      const isExpanded = expandedCategories.has(category.id);
                      const adCount = getCategoryAdCount(category.id, category.name);
                      
                      return (
                        <div key={category.id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 flex-1">
                              {hasSubcategories ? (
                                <button
                                  onClick={() => toggleCategory(category.id)}
                                  className="flex items-center space-x-2 flex-1 text-left"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedCategories.has(category.id)}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleCategoryToggle(category.id);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4"
                                  />
                                  <span className="text-sm text-[hsl(var(--foreground))] hover:text-[hsl(var(--primary))] cursor-pointer">
                                    {category.name}
                                  </span>
                                </button>
                              ) : (
                                <label className="flex items-center space-x-2 flex-1 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedCategories.has(category.id)}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleCategoryToggle(category.id);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4"
                                  />
                                  <span className="text-sm text-[hsl(var(--foreground))]">
                                    {category.name}
                                  </span>
                                </label>
                              )}
                            </div>
                            <span className="text-xs text-[hsl(var(--muted-foreground))] ml-2">
                              ({adCount})
                            </span>
                          </div>
                          
                          {/* Show subcategories when expanded */}
                          {hasSubcategories && isExpanded && (
                            <div className="ml-5 pl-2 border-l-2 border-[hsl(var(--border))] space-y-1 mt-1">
                              {subcategories.map((subcategory) => {
                                const subAdCount = getCategoryAdCount(subcategory.id, subcategory.name);
                                return (
                                  <div key={subcategory.id} className="flex items-center justify-between">
                                    <label className="flex items-center space-x-2 cursor-pointer flex-1">
                                      <input
                                        type="checkbox"
                                        checked={selectedSubcategories.has(subcategory.id) || selectedSubcategories.has(String(subcategory.id)) || selectedSubcategories.has(Number(subcategory.id))}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          handleSubcategoryToggle(subcategory.id);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
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

                {/* Location Filter - Same design as Category filter */}
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={() => setShowSidebarLocationDropdown(!showSidebarLocationDropdown)}
                    className="flex items-center justify-between w-full font-semibold text-[hsl(var(--foreground))] mb-2 hover:text-[hsl(var(--primary))] transition-colors"
                  >
                    <span>Location</span>
                    <span className="text-sm">{showSidebarLocationDropdown ? '▼' : '▶'}</span>
                  </button>
                  
                  {showSidebarLocationDropdown && (
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                      {locationData.provinces.map((province) => {
                        const hasDistricts = province.districts && province.districts.length > 0;
                        const isProvinceExpanded = expandedProvinces.has(province.id);
                        const provinceAdCount = (() => {
                          let count = 0;
                          province.districts.forEach(d => {
                            d.localLevels.forEach(ll => {
                              if (ll.wards) {
                                ll.wards.forEach(w => {
                                  // Only count ward-level ads, not address-level (addresses are subsets of wards)
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
                            
                            {/* Show districts when expanded */}
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
                                          // Only count ward-level ads, not address-level (addresses are subsets of wards)
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
                                      
                                      {/* Show local levels when expanded */}
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
                                                // Only count ward-level ads, not address-level (addresses are subsets of wards)
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
                                                
                                                {/* Show wards when expanded */}
                                                {hasWards && isLocalLevelExpanded && (
                                                  <div className="ml-5 pl-2 border-l-2 border-[hsl(var(--border))] space-y-1 mt-1">
                                                    {localLevel.wards.map((ward) => {
                                                      const hasAddresses = ward.local_addresses && ward.local_addresses.length > 0;
                                                      const wardAdCount = getLocationAdCount(ward.id);
                                                      
                                                      return (
                                                        <div key={ward.id} className="space-y-1">
                                                          <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-2 flex-1">
                                                              {hasAddresses ? (
                                                                <button
                                                                  onClick={() => {
                                                                    const wardKey = `${localLevelKey}-${ward.id}`;
                                                                    setExpandedLocationItems(prev => ({
                                                                      ...prev,
                                                                      wards: {
                                                                        ...prev.wards,
                                                                        [wardKey]: !prev.wards[wardKey]
                                                                      }
                                                                    }));
                                                                  }}
                                                                  className="flex items-center space-x-2 flex-1 text-left"
                                                                >
                                                                  <input
                                                                    type="checkbox"
                                                                    checked={(() => {
                                                                      const allIds = [ward.id];
                                                                      if (ward.local_addresses) {
                                                                        ward.local_addresses.forEach((_, idx) => {
                                                                          allIds.push(`${ward.id}-${idx}`);
                                                                        });
                                                                      }
                                                                      return allIds.every(id => selectedLocations.has(id));
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
                                                          
                                                          {/* Show local addresses when expanded */}
                                                          {hasAddresses && expandedLocationItems.wards[`${localLevelKey}-${ward.id}`] && (
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
                                                                      <span className="text-sm text-[hsl(var(--muted-foreground))]">{address}</span>
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

            {/* Popular ad sections (4 ads per row, then "more ad" link) */}
            {['Land for sale', 'Car for sale', 'Motorbike for sale', 'Bus for sale', 'Truck for sale', 'House for sale'].map((sectionName) => {
              const categoryAds = getCategoryAds(sectionName);

              return (
                <div key={sectionName} className="mb-8">
                  <h3 className="text-xl font-bold text-[hsl(var(--foreground))] mb-4">{sectionName}</h3>
                  {categoryAds.length === 0 ? (
                    <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                      <p>0 items</p>
                    </div>
                  ) : (
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
                      <Card className="hover:shadow-lg transition-shadow flex items-center justify-center">
                        <CardContent className="p-4 text-center">
                          <Link
                            to={getCategoryRoute(sectionName)}
                            className="text-[hsl(var(--primary))] hover:underline font-semibold"
                          >
                            more ad
                          </Link>
                        </CardContent>
                      </Card>
                    </div>
                  )}
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
