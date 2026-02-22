import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { getAdUrl } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../utils/translation';
import SEOHead from './SEOHead';

function Homepage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const translation = useTranslation();
  // Ensure t is always defined
  const t = translation?.t || ((key) => key);
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
  const [expandedCategories, setExpandedCategories] = useState(new Set()); // For domain categories (using name as key)
  const [expandedFieldCategories, setExpandedFieldCategories] = useState(new Set()); // For field categories (using name as key)
  const [selectedCategories, setSelectedCategories] = useState(new Set()); // Selected domain category IDs
  const [selectedSubcategories, setSelectedSubcategories] = useState(new Set()); // Selected field category IDs
  const [selectedItemCategories, setSelectedItemCategories] = useState(new Set()); // Selected item category IDs
  const [showLocationDropdown, setShowLocationDropdown] = useState(false); // For search bar
  const categoryDropdownRef = useRef(null);
  const [showSidebarLocationDropdown, setShowSidebarLocationDropdown] = useState(false); // For sidebar filter
  const [expandedProvinces, setExpandedProvinces] = useState(new Set()); // For search bar location dropdown
  const [expandedDistricts, setExpandedDistricts] = useState(new Set()); // For search bar location dropdown
  const [expandedLocalLevels, setExpandedLocalLevels] = useState(new Set()); // For search bar location dropdown
  const [expandedWards, setExpandedWards] = useState(new Set()); // For search bar location dropdown - ward expansion
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
    // Count only addresses (leaf level) and wards without addresses - matching UserDashboard logic
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
      return t('homepage.allLocations');
    }
    if (totalCount === 1) {
      return '1 location selected';
    }
    return `${totalCount} locations selected`;
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

  // Category toggle functions (matching UserDashboard logic)
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
    // Use a single state update to avoid race conditions
    setSelectedSubcategories(prev => {
      const newSet = new Set(prev);
      fieldCategories.forEach(fieldCat => {
        if (isCurrentlySelected) {
          newSet.delete(fieldCat.id);
        } else {
          newSet.add(fieldCat.id);
        }
      });
      return newSet;
    });
    
    // Select/deselect all item categories under field categories
    // Use a single state update to avoid race conditions
    setSelectedItemCategories(prev => {
      const newSet = new Set(prev);
      fieldCategories.forEach(fieldCat => {
        const itemCategories = fieldCat.item_categories || [];
        itemCategories.forEach(itemCat => {
          if (isCurrentlySelected) {
            newSet.delete(itemCat.id);
          } else {
            newSet.add(itemCat.id);
          }
        });
      });
      return newSet;
    });
    
    // Also handle direct item categories (under domain, no field)
    // Use a single state update to avoid race conditions
    const directItemCategories = domainCategory.item_categories || [];
    if (directItemCategories.length > 0) {
      setSelectedItemCategories(prev => {
        const newSet = new Set(prev);
        directItemCategories.forEach(itemCat => {
          if (isCurrentlySelected) {
            newSet.delete(itemCat.id);
          } else {
            newSet.add(itemCat.id);
          }
        });
        return newSet;
      });
    }
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
      // IMPORTANT: Only auto-deselect domain if it was auto-selected (all fields were selected)
      // Don't deselect if the domain was manually selected by the user
      const allFieldCategories = domainCategory.field_categories || [];
      const allFieldSelected = allFieldCategories.every(fc => {
        if (fc.id === subcategoryId) {
          // Use the new state (after toggle)
          return !isCurrentlySelected;
        }
        return newSet.has(fc.id);
      });
      
      // Only update domain selection if it has field categories
      if (allFieldCategories.length > 0) {
        setSelectedCategories(prevCats => {
          const newCats = new Set(prevCats);
          if (allFieldSelected) {
            // Auto-select domain when all fields are selected
            newCats.add(domainCategory.id);
          } else {
            // Only deselect if ALL field categories are now deselected
            // This prevents accidentally deselecting a manually selected domain
            const hasAnyFieldSelected = Array.from(newSet).some(id => 
              allFieldCategories.some(fc => fc.id === id)
            );
            if (!hasAnyFieldSelected) {
              // All fields are deselected, safe to deselect domain
              newCats.delete(domainCategory.id);
            }
            // Otherwise, keep domain selected (it was manually selected)
          }
          return newCats;
        });
      }
      
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

  const handleSelectAllCategories = () => {
    setSelectedCategories(new Set());
    setSelectedSubcategories(new Set());
    setSelectedItemCategories(new Set());
  };

  const buildCategorySearchString = () => {
    // Count only item categories (leaf level) - matching UserDashboard logic
    if (selectedItemCategories.size === 0) {
      return t('homepage.allCategories');
    }
    if (selectedItemCategories.size === 1) {
      return '1 category selected';
    }
    return `${selectedItemCategories.size} categories selected`;
  };

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
    selectedSubcategories,
    selectedItemCategories, // Add this - it was missing!
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


  // Removed generateMockAds() - now using fetchAds() to get real data from API

  // Handle ad click - navigate to detail page
  const handleAdClick = async (ad) => {
    // Track click (fire and forget - don't wait for response)
    try {
      await window.axios.post(`/api/ads/${ad.id}/click`);
    } catch (err) {
      // Silently fail - don't block navigation
      console.error('Failed to track click:', err);
    }
    
    // Navigate to ad detail page using category slug + ad slug format
    navigate(getAdUrl(ad));
  };


  // Calculate ad count for a category in the 3-level hierarchy (domain → field → item)
  const getCategoryAdCount = (categoryId, categoryName) => {
    if (!allAds || allAds.length === 0) return 0;
    
    // CRITICAL: Check item categories by NAME first (before any ID matching)
    // This prevents conflicts where item category ID matches domain/field category IDs
    let itemCategory = null;
    let itemCategoryFound = false;
    let fieldCategory = null;
    let fieldCategoryFound = false;
    
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
    
    // Priority 2: Check if it's a field category by NAME first (before domain category check)
    // CRITICAL: Check field categories by name BEFORE domain categories to prevent misidentification
    // Field categories have sequential IDs (1, 2, 3...) that might match domain category database IDs
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
        // Use Set for consistency with filtering logic
        const itemCategoryIds = new Set();
        fieldCategory.item_categories.forEach(item => {
          if (item && item.id != null) {
            itemCategoryIds.add(item.id);
          }
        });
        if (itemCategoryIds.size > 0) {
          return allAds.filter(ad => {
            if (!ad.category_id) return false;
            const adCategoryId = typeof ad.category_id === 'string' ? parseInt(ad.category_id, 10) : Number(ad.category_id);
            return itemCategoryIds.has(adCategoryId);
          }).length;
        }
      }
      // If field category has no item_categories, return 0
      return 0;
    }
    
    // Priority 3: Check if it's a domain category (by name first, then by ID and structure)
    // Domain categories have field_categories or item_categories structure
    // CRITICAL: Only check domain if we haven't found item or field category
    // IMPORTANT: Check by name FIRST before ID to prevent ID conflicts
    const domainCategory = categories.find(c => {
      // First, check by name (most reliable - prevents ID conflicts)
      if (categoryName && (
        (c.domain_category && c.domain_category === categoryName) ||
        (c.name && c.name === categoryName)
      )) {
        // Verify it has the structure of a domain category
        return c.field_categories || c.item_categories;
      }
      // Then check by ID, but only if it has domain category structure and we haven't found field category
      if (!itemCategoryFound && !fieldCategoryFound && c.id === categoryId && (c.field_categories || c.item_categories)) {
        // Double-check it's not just an item category that happens to have the same ID
        // A domain category should have field_categories or item_categories array
        return true;
      }
      return false;
    });
    
    if (domainCategory) {
      // Collect all item category IDs under this domain - MUST match filtering logic exactly
      const allItemCategoryIds = new Set();
      
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
      
      // Count ads that match any of these item category IDs - using Set.has() like filtering logic
      if (allItemCategoryIds.size > 0) {
      const count = allAds.filter(ad => {
        if (!ad.category_id) return false;
        const adCategoryId = typeof ad.category_id === 'string' ? parseInt(ad.category_id, 10) : Number(ad.category_id);
          return allItemCategoryIds.has(adCategoryId);
      }).length;
      return count;
      }
      return 0;
    }
    
    // Priority 4: Check if it's a field category by ID (fallback if name matching didn't work)
    // Field category IDs are sequential (1, 2, 3...) not database IDs
    // IMPORTANT: Only check if we haven't found an item or field category
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
          // Use Set for consistency with filtering logic
          const itemCategoryIds = new Set();
          fieldCategory.item_categories.forEach(item => {
            if (item && item.id != null) {
              itemCategoryIds.add(item.id);
            }
          });
          if (itemCategoryIds.size > 0) {
            return allAds.filter(ad => {
              if (!ad.category_id) return false;
              const adCategoryId = typeof ad.category_id === 'string' ? parseInt(ad.category_id, 10) : Number(ad.category_id);
              return itemCategoryIds.has(adCategoryId);
            }).length;
          }
        }
        // If field category has no item_categories, return 0
        return 0;
      }
    }
    
    // Priority 5: Check if it's an item category by ID (last resort)
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

  // Get subcategories for a parent category
  // Get top-level categories (domain categories)
  const getTopLevelCategories = () => {
    // Return domain categories (top level)
    return categories.filter(cat => cat.domain_category || cat.name);
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
          setSelectedCategories(prev => {
            const newSet = new Set(prev);
            newSet.add(category.id);
            return newSet;
          });
        }
      } else {
        // Main category only
        const category = categories.find(c => c.name === searchCategory);
        if (category && !selectedCategories.has(category.id)) {
          setSelectedCategories(prev => {
            const newSet = new Set(prev);
            newSet.add(category.id);
            return newSet;
          });
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
      <SEOHead
        title="Classified advertising in Nepal"
        description="Classified advertising in Nepal to post hassle-free ad on various categories such as sale vehicle, house, land, tools etc. Ebyapar.com is as online community to buy & sale new and used items online to connect with potential buyer of large community."
        keywords="classified ad post Nepal, online advertising Nepal, ad post online Nepal, classified advertising"
        type="website"
      />
      <div className="max-w-7xl mx-auto">
        {/* Search Part */}
        <section className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2 flex-wrap items-center">
                {/* Search Keyword Input */}
                <Input
                  type="text"
                  placeholder={t('homepage.enterKeyword')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1 min-w-[200px] bg-[hsl(var(--background))]"
                />
                {/* Category Selection - Matching sidebar filter design */}
                <div className="relative min-w-[150px]" ref={categoryDropdownRef}>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      className="w-full px-3 py-2 text-left border-0 rounded-md bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] flex items-center"
                    >
                      <span>{buildCategorySearchString() || t('homepage.allCategories')}</span>
                    </button>
                    
                    {/* Category Menu - Matching sidebar filter design */}
                    {showCategoryDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-md shadow-lg z-50 w-[250px] max-h-[500px] overflow-y-auto">
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
                                          onClick={(e) => {
                                            // Only toggle expansion if clicking the button/span, not the checkbox
                                            if (e.target.type !== 'checkbox') {
                                              toggleCategory(domainCategoryName);
                                            }
                                          }}
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
                                                      checked={selectedSubcategories.has(fieldCategory.id) || selectedSubcategories.has(String(fieldCategory.id)) || selectedSubcategories.has(Number(fieldCategory.id))}
                                                      onChange={(e) => {
                                                        e.stopPropagation();
                                                        handleSubcategoryToggle(fieldCategory.id);
                                                      }}
                                                      onClick={(e) => e.stopPropagation()}
                                                      className="w-4 h-4"
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
                                                          checked={selectedItemCategories.has(itemCategory.id) || selectedItemCategories.has(String(itemCategory.id)) || selectedItemCategories.has(Number(itemCategory.id))}
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
                {/* Location Selection - Matching sidebar filter design */}
                <div className="relative min-w-[150px]" ref={locationDropdownRef}>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                      className="w-full px-3 py-2 text-left border-0 rounded-md bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] flex items-center"
                    >
                      <span>{buildSearchLocationString()}</span>
                    </button>
                    
                    {/* Location Menu - Matching sidebar filter design */}
                    {showLocationDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-md shadow-lg z-50 w-[325px] max-h-[500px] overflow-y-auto">
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
                                                                            // Check if ward.id is selected OR all addresses are selected
                                                                            const wardSelected = selectedLocations.has(ward.id);
                                                                            if (wardSelected) return true;
                                                                            
                                                                            // Check if all addresses are selected
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
                                                                
                                                                {/* Local Addresses - Only show when ward is expanded */}
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
                <Button onClick={handleSearch} className="min-w-[100px]">{t('homepage.search')}</Button>
          </div>
            </CardContent>
          </Card>
        </section>

        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <Card>
              <CardContent className="p-4">
                <h2 className="text-lg font-bold text-[hsl(var(--foreground))] mb-4">{t('homepage.filters')}</h2>

                {/* Category Filter */}
                <div className="mb-6">
                  <button
                    onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                    className="flex items-center justify-between w-full font-semibold text-[hsl(var(--foreground))] mb-2 hover:text-[hsl(var(--primary))] transition-colors"
                  >
                    <span>{t('homepage.category')}</span>
                  </button>
                  {showCategoryFilter && (
                    <div className="space-y-1 max-h-96 overflow-y-auto">
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
                                                checked={selectedSubcategories.has(fieldCategory.id) || selectedSubcategories.has(String(fieldCategory.id)) || selectedSubcategories.has(Number(fieldCategory.id))}
                                                onChange={(e) => {
                                                  e.stopPropagation();
                                                  handleSubcategoryToggle(fieldCategory.id);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-4 h-4"
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
                                                    checked={selectedItemCategories.has(itemCategory.id) || selectedItemCategories.has(String(itemCategory.id)) || selectedItemCategories.has(Number(itemCategory.id))}
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
                  )}
                </div>

                {/* Location Filter - Same design as Category filter */}
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={() => setShowSidebarLocationDropdown(!showSidebarLocationDropdown)}
                    className="flex items-center justify-between w-full font-semibold text-[hsl(var(--foreground))] mb-2 hover:text-[hsl(var(--primary))] transition-colors"
                  >
                    <span>{t('homepage.location')}</span>
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
                    {t('homepage.priceRange')}
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={t('homepage.from')}
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
                        placeholder={t('homepage.to')}
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
                {t('homepage.showingResults', { from: startResult, to: endResult, total: filteredAdsCount })}
                    </p>
              <div className="flex items-center gap-2">
                <label className="text-sm text-[hsl(var(--foreground))]">{t('homepage.sortingOption')}</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm transition-all duration-200 hover:border-[hsl(var(--primary))]/50 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2"
                >
                  <option value="most relevant">{t('homepage.mostRelevant')}</option>
                  <option value="lowest price">{t('homepage.priceLowToHigh')}</option>
                  <option value="highest price">{t('homepage.priceHighToLow')}</option>
                  <option value="ascending order">{t('homepage.newestFirst')}</option>
                  <option value="descending order">{t('homepage.oldestFirst')}</option>
                  <option value="latest listing">{t('homepage.newestFirst')}</option>
                  <option value="top review">{t('homepage.mostRelevant')}</option>
                </select>
                <Button
                  onClick={() => {
                    if (!user) {
                      navigate('/login', { state: { from: '/user_dashboard/ad-post' } });
                    } else {
                      navigate('/user_dashboard/ad-post');
                    }
                  }}
                  className="px-6"
                >
                  {t('homepage.postAd')}
                </Button>
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
                          {t('homepage.pricePrefix')} {ad.price.toLocaleString()}
                        </p>
                        {ad.user_id && (
                          <Link
                            to={`/profile/${ad.user_id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-[hsl(var(--primary))] hover:underline"
                          >
                            {t('homepage.viewSellerProfile')}
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
            {[
              { key: 'landForSale', name: 'Land for sale' },
              { key: 'carForSale', name: 'Car for sale' },
              { key: 'motorbikeForSale', name: 'Motorbike for sale' },
              { key: 'busForSale', name: 'Bus for sale' },
              { key: 'truckForSale', name: 'Truck for sale' },
              { key: 'houseForSale', name: 'House for sale' }
            ].map((section) => {
              const categoryAds = getCategoryAds(section.name);
              const sectionTitle = t(`homepage.categorySections.${section.key}`);

              return (
                <div key={section.key} className="mb-8">
                  <h3 className="text-xl font-bold text-[hsl(var(--foreground))] mb-4">{sectionTitle}</h3>
                  {categoryAds.length === 0 ? (
                    <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                      <p>{t('homepage.zeroItems')}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {categoryAds.map((ad, index) => (
                        <Card 
                          key={ad.id} 
                          className="card-hover group cursor-pointer animate-fade-in"
                          style={{ animationDelay: `${index * 30}ms` }}
                          onClick={() => handleAdClick(ad.id)}
                        >
                          <CardContent className="p-0">
                            <div className="relative overflow-hidden">
                              <img
                                src={ad.image}
                                alt={ad.title}
                                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            </div>
                            <div className="p-3">
                              <h3 className="font-semibold text-sm text-[hsl(var(--foreground))] mb-1 line-clamp-2 group-hover:text-[hsl(var(--primary))] transition-colors">
                                {ad.title}
                              </h3>
                              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2 line-clamp-2">
                                {ad.description}
                              </p>
                              <p className="text-lg font-bold text-[hsl(var(--primary))] mb-2">
                                {t('homepage.pricePrefix')} {ad.price.toLocaleString()}
                              </p>
                              {ad.user_id && (
                                <Link
                                  to={`/profile/${ad.user_id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs text-[hsl(var(--primary))] hover:underline"
                                >
                                  {t('homepage.viewSellerProfile')}
                                </Link>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      <Card className="hover:shadow-lg transition-shadow flex items-center justify-center">
                        <CardContent className="p-4 text-center">
                          <Link
                            to={getCategoryRoute(section.name)}
                            className="text-[hsl(var(--primary))] hover:underline font-semibold"
                          >
                            {t('homepage.moreAd')}
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
