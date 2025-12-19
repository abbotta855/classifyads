import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { publicAuctionAPI } from '../utils/api';
import axios from 'axios';

function AuctionListingPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [locationData, setLocationData] = useState({ provinces: [] });
  const [selectedLocations, setSelectedLocations] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [selectedSubcategories, setSelectedSubcategories] = useState(new Set());
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [expandedProvinces, setExpandedProvinces] = useState(new Set());
  const [expandedDistricts, setExpandedDistricts] = useState(new Set());
  const [expandedLocalLevels, setExpandedLocalLevels] = useState(new Set());
  const [expandedWards, setExpandedWards] = useState(new Set());
  const [sortBy, setSortBy] = useState('ending_soon');
  const [auctions, setAuctions] = useState([]);
  const [allAuctions, setAllAuctions] = useState([]);
  const [filteredAuctionsCount, setFilteredAuctionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const adsPerPage = 40;
  const categoryDropdownRef = useRef(null);
  const locationDropdownRef = useRef(null);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
    fetchLocations();
  }, []);

  // Fetch auctions
  useEffect(() => {
    fetchAuctions();
  }, []);

  // Filter and sort auctions
  useEffect(() => {
    filterAndSortAuctions();
  }, [searchQuery, selectedCategories, selectedSubcategories, selectedLocations, sortBy, currentPage, allAuctions]);

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

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await axios.get('/api/locations');
      setLocationData(response.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchAuctions = async () => {
    setLoading(true);
    try {
      const params = {
        page: 1,
        per_page: 1000, // Get all for client-side filtering
      };
      const response = await publicAuctionAPI.getAuctions(params);
      setAllAuctions(response.data.auctions || []);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      setAllAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortAuctions = () => {
    let filtered = [...allAuctions];

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(auction =>
        auction.title?.toLowerCase().includes(query) ||
        auction.description?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategories.size > 0 || selectedSubcategories.size > 0) {
      filtered = filtered.filter(auction => {
        if (selectedSubcategories.size > 0 && selectedSubcategories.has(auction.category_id)) {
          return true;
        }
        // Check if category matches (simplified - would need category hierarchy)
        return selectedCategories.size === 0 || selectedCategories.has(auction.category_id);
      });
    }

    // Location filter
    if (selectedLocations.size > 0) {
      filtered = filtered.filter(auction => {
        if (!auction.location_id) return false;
        return selectedLocations.has(auction.location_id.toString());
      });
    }

    // Sort
    switch (sortBy) {
      case 'ending_soon':
        filtered.sort((a, b) => new Date(a.end_time) - new Date(b.end_time));
        break;
      case 'highest_bid':
        filtered.sort((a, b) => (b.current_bid || 0) - (a.current_bid || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      default:
        break;
    }

    setFilteredAuctionsCount(filtered.length);

    // Pagination
    const startIndex = (currentPage - 1) * adsPerPage;
    const endIndex = startIndex + adsPerPage;
    setAuctions(filtered.slice(startIndex, endIndex));
  };

  const getTopLevelCategories = () => {
    return categories.filter(cat => !cat.sub_category || cat.sub_category === '');
  };

  const getSubcategories = (categoryId) => {
    return categories.filter(cat => cat.id === categoryId && cat.sub_category);
  };

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
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleSubcategoryToggle = (subcategoryId) => {
    setSelectedSubcategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subcategoryId)) {
        newSet.delete(subcategoryId);
      } else {
        newSet.add(subcategoryId);
      }
      return newSet;
    });
  };

  const handleLocationToggle = (locationId) => {
    setSelectedLocations(prev => {
      const newSet = new Set(prev);
      const idStr = locationId.toString();
      if (newSet.has(idStr)) {
        newSet.delete(idStr);
      } else {
        newSet.add(idStr);
      }
      return newSet;
    });
  };

  const handleSearch = () => {
    setCurrentPage(1);
    filterAndSortAuctions();
  };

  const handleAuctionClick = (auction) => {
    navigate(`/auctions/${auction.slug || auction.id}`);
  };

  const totalPages = Math.ceil(filteredAuctionsCount / adsPerPage);
  const startResult = filteredAuctionsCount === 0 ? 0 : (currentPage - 1) * adsPerPage + 1;
  const endResult = Math.min(currentPage * adsPerPage, filteredAuctionsCount);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Search Bar */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <Input
            type="text"
            placeholder="Search auctions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 min-w-[200px]"
          />
          
          {/* Category Dropdown */}
          <div className="relative" ref={categoryDropdownRef}>
            <Button
              variant="outline"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-[200px] justify-between"
            >
              <span>All Categories</span>
              <span>▼</span>
            </Button>
            {showCategoryDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border rounded shadow-lg z-50 w-[200px] max-h-[400px] overflow-y-auto">
                {getTopLevelCategories().map(category => (
                  <div key={category.id}>
                    <div
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                      onClick={() => toggleCategory(category.id)}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedCategories.has(category.id)}
                          onChange={() => handleCategoryToggle(category.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>{category.category}</span>
                      </div>
                    </div>
                    {expandedCategories.has(category.id) && getSubcategories(category.id).map(subcat => (
                      <div
                        key={subcat.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer ml-5 pl-2 border-l-2"
                        onClick={() => handleSubcategoryToggle(subcat.id)}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedSubcategories.has(subcat.id)}
                            onChange={() => handleSubcategoryToggle(subcat.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span>{subcat.sub_category}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Location Dropdown */}
          <div className="relative" ref={locationDropdownRef}>
            <Button
              variant="outline"
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              className="w-[200px] justify-between"
            >
              <span>All Locations</span>
              <span>▼</span>
            </Button>
            {showLocationDropdown && locationData.provinces && (
              <div className="absolute top-full left-0 mt-1 bg-white border rounded shadow-lg z-50 w-[200px] max-h-[400px] overflow-y-auto">
                {locationData.provinces.map(province => (
                  <div key={province.id}>
                    <div
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => {
                        const newSet = new Set(expandedProvinces);
                        if (newSet.has(province.id)) {
                          newSet.delete(province.id);
                        } else {
                          newSet.add(province.id);
                        }
                        setExpandedProvinces(newSet);
                      }}
                    >
                      {province.name}
                    </div>
                    {expandedProvinces.has(province.id) && province.districts?.map(district => (
                      <div key={district.id} className="ml-5 pl-2 border-l-2">
                        <div
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            const newSet = new Set(expandedDistricts);
                            if (newSet.has(district.id)) {
                              newSet.delete(district.id);
                            } else {
                              newSet.add(district.id);
                            }
                            setExpandedDistricts(newSet);
                          }}
                        >
                          {district.name}
                        </div>
                        {expandedDistricts.has(district.id) && district.localLevels?.map(localLevel => (
                          <div key={localLevel.id} className="ml-5 pl-2 border-l-2">
                            <div
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                const newSet = new Set(expandedLocalLevels);
                                if (newSet.has(localLevel.id)) {
                                  newSet.delete(localLevel.id);
                                } else {
                                  newSet.add(localLevel.id);
                                }
                                setExpandedLocalLevels(newSet);
                              }}
                            >
                              {localLevel.name}
                            </div>
                            {expandedLocalLevels.has(localLevel.id) && localLevel.wards?.map(ward => (
                              <div key={ward.id} className="ml-5 pl-2 border-l-2">
                                <div
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
                                  onClick={() => {
                                    const newSet = new Set(expandedWards);
                                    if (newSet.has(ward.id)) {
                                      newSet.delete(ward.id);
                                    } else {
                                      newSet.add(ward.id);
                                    }
                                    setExpandedWards(newSet);
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={selectedLocations.has(ward.id.toString())}
                                      onChange={() => handleLocationToggle(ward.id)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <span>Ward {ward.ward_number}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button onClick={handleSearch}>Search</Button>
        </div>

        {/* Results Summary & Sorting */}
        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {startResult}-{endResult} of {filteredAuctionsCount} results
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            <option value="ending_soon">Ending Soon</option>
            <option value="highest_bid">Highest Bid</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        {/* Auctions Grid */}
        {loading ? (
          <div className="text-center py-12">Loading auctions...</div>
        ) : auctions.length === 0 ? (
          <div className="text-center py-12">No auctions found.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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
                      <p className="text-2xl font-bold text-blue-600 mb-2">
                        Rs. {auction.current_bid?.toLocaleString() || auction.starting_price?.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        {auction.bid_count || 0} bid{auction.bid_count !== 1 ? 's' : ''}
                      </p>
                      <p className="text-sm text-gray-500">{auction.time_remaining}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="px-4 py-2">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

export default AuctionListingPage;

