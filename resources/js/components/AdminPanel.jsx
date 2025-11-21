import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from './Layout';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { adminAPI } from '../utils/api';
import axios from 'axios';

function AdminPanel() {
  const { user } = useAuth();
  const { section, subsection } = useParams();
  const navigate = useNavigate();
  const activeSection = section || null; // No section selected when on /admin
  const activeSubsection = subsection || null;
  const [selectedRole, setSelectedRole] = useState('admin'); // 'super-admin' or 'admin'
  const [showAuctionForm, setShowAuctionForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const locationDropdownRef = useRef(null);
  const [adSort, setAdSort] = useState(''); // Sort option: 'price', 'date', 'alphabetical'

  // Ad totals and ads data
  const [adTotals, setAdTotals] = useState({
    userPosted: 0,
    vendorPosted: 0,
    adminPosted: 0,
    total: 0
  });
  const [ads, setAds] = useState([]);
  const [adsLoading, setAdsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Location data
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  
  // Mock location data (for search dropdown - will be replaced with real data later)
  const [mockLocations, setMockLocations] = useState([
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

  // Mock bidding history data
  const [biddingHistoryData, setBiddingHistoryData] = useState([
    {
      id: 1,
      userName: 'John Doe',
      itemName: 'Vintage Watch Collection',
      reservePrice: 50000,
      buyNowPrice: 75000,
      paymentMethod: 'Credit Card',
      startDateTime: '2024-01-15T10:00:00'
    },
    {
      id: 2,
      userName: 'Jane Smith',
      itemName: 'Antique Painting',
      reservePrice: 120000,
      buyNowPrice: 180000,
      paymentMethod: 'Bank Transfer',
      startDateTime: '2024-01-18T14:30:00'
    },
    {
      id: 3,
      userName: 'Mike Johnson',
      itemName: 'Rare Coin Set',
      reservePrice: 25000,
      buyNowPrice: 40000,
      paymentMethod: 'Digital Wallet',
      startDateTime: '2024-01-20T09:15:00'
    }
  ]);

  // Mock bid winner data
  const [bidWinnerData, setBidWinnerData] = useState([
    {
      id: 1,
      userName: 'Sarah Williams',
      biddingItem: 'Vintage Watch Collection',
      bidStartDate: '2024-01-15',
      bidWonDate: '2024-01-22',
      paymentProceedDate: '2024-01-23',
      totalPayment: 65000,
      sellerName: 'ABC Collectibles',
      emailSent: 'Yes'
    },
    {
      id: 2,
      userName: 'David Brown',
      biddingItem: 'Antique Painting',
      bidStartDate: '2024-01-18',
      bidWonDate: '2024-01-25',
      paymentProceedDate: '2024-01-26',
      totalPayment: 150000,
      sellerName: 'Art Gallery Plus',
      emailSent: 'Yes'
    },
    {
      id: 3,
      userName: 'Emily Davis',
      biddingItem: 'Rare Coin Set',
      bidStartDate: '2024-01-20',
      bidWonDate: '2024-01-27',
      paymentProceedDate: '2024-01-28',
      totalPayment: 35000,
      sellerName: 'Numismatic Store',
      emailSent: 'Yes'
    },
    {
      id: 4,
      userName: 'Robert Wilson',
      biddingItem: 'Classic Car Model',
      bidStartDate: '2024-01-22',
      bidWonDate: '2024-01-29',
      paymentProceedDate: '2024-01-30',
      totalPayment: 85000,
      sellerName: 'Auto Collectors',
      emailSent: 'Pending'
    }
  ]);

  // Mock blocked user data
  const [blockedUserData, setBlockedUserData] = useState([
    {
      id: 1,
      userName: 'Tom Anderson',
      email: 'tom.anderson@example.com',
      address: 'Kathmandu, Bagmati Province',
      dateToBlock: '2024-01-15',
      reasonToBlock: 'Fraudulent bidding activity'
    },
    {
      id: 2,
      userName: 'Lisa Chen',
      email: 'lisa.chen@example.com',
      address: 'Lalitpur, Bagmati Province',
      dateToBlock: '2024-01-18',
      reasonToBlock: 'Non-payment after winning bid'
    },
    {
      id: 3,
      userName: 'Mark Taylor',
      email: 'mark.taylor@example.com',
      address: 'Pokhara, Gandaki Province',
      dateToBlock: '2024-01-20',
      reasonToBlock: 'Violation of auction terms'
    },
    {
      id: 4,
      userName: 'Anna Martinez',
      email: 'anna.martinez@example.com',
      address: 'Biratnagar, Province 1',
      dateToBlock: '2024-01-22',
      reasonToBlock: 'Multiple account creation'
    }
  ]);

  // Mock bidding tracking data
  const [biddingTrackingData, setBiddingTrackingData] = useState([
    {
      id: 1,
      bidWinnerName: 'Sarah Williams',
      bidWonItemName: 'Vintage Watch Collection',
      paymentStatus: 'Completed',
      pickupStatus: 'Picked Up',
      completeProcessDateTime: '2024-01-24T15:30:00',
      alertSent: 'No'
    },
    {
      id: 2,
      bidWinnerName: 'David Brown',
      bidWonItemName: 'Antique Painting',
      paymentStatus: 'Completed',
      pickupStatus: 'Pending',
      completeProcessDateTime: null,
      alertSent: 'Yes'
    },
    {
      id: 3,
      bidWinnerName: 'Emily Davis',
      bidWonItemName: 'Rare Coin Set',
      paymentStatus: 'Pending',
      pickupStatus: 'Not Started',
      completeProcessDateTime: null,
      alertSent: 'Yes'
    },
    {
      id: 4,
      bidWinnerName: 'Robert Wilson',
      bidWonItemName: 'Classic Car Model',
      paymentStatus: 'Completed',
      pickupStatus: 'Scheduled',
      completeProcessDateTime: null,
      alertSent: 'No'
    }
  ]);

  // Mock delivery management data
  const [deliveryData, setDeliveryData] = useState([
    {
      id: 1,
      sellerVendor: 'ABC Electronics',
      item: 'iPhone 15 Pro',
      price: 120000,
      deliveryStatus: 'Pending',
      pickupDate: '2024-01-15'
    },
    {
      id: 2,
      sellerVendor: 'XYZ Motors',
      item: 'Honda CB 150R',
      price: 350000,
      deliveryStatus: 'In Transit',
      pickupDate: '2024-01-18'
    },
    {
      id: 3,
      sellerVendor: 'Home Decor Plus',
      item: 'Modern Sofa Set',
      price: 85000,
      deliveryStatus: 'Delivered',
      pickupDate: '2024-01-20'
    },
    {
      id: 4,
      sellerVendor: 'Tech World',
      item: 'MacBook Pro M3',
      price: 250000,
      deliveryStatus: 'Pending',
      pickupDate: '2024-01-22'
    },
    {
      id: 5,
      sellerVendor: 'Fashion Hub',
      item: 'Designer Handbag',
      price: 15000,
      deliveryStatus: 'In Transit',
      pickupDate: '2024-01-25'
    },
    {
      id: 6,
      sellerVendor: 'Auto Dealer',
      item: 'Toyota Corolla',
      price: 2800000,
      deliveryStatus: 'Delivered',
      pickupDate: '2024-01-28'
    }
  ]);

  // Mock purchase verification data
  const [purchaseVerificationData, setPurchaseVerificationData] = useState([
    {
      id: 1,
      buyerUser: 'John Doe',
      item: 'iPhone 15 Pro',
      price: 120000,
      purchaseDate: '2024-01-10',
      verificationCode: 'PV-2024-001',
      deliveryStatus: 'Pending'
    },
    {
      id: 2,
      buyerUser: 'Jane Smith',
      item: 'Honda CB 150R',
      price: 350000,
      purchaseDate: '2024-01-12',
      verificationCode: 'PV-2024-002',
      deliveryStatus: 'In Transit'
    },
    {
      id: 3,
      buyerUser: 'Mike Johnson',
      item: 'Modern Sofa Set',
      price: 85000,
      purchaseDate: '2024-01-14',
      verificationCode: 'PV-2024-003',
      deliveryStatus: 'Delivered'
    },
    {
      id: 4,
      buyerUser: 'Sarah Williams',
      item: 'MacBook Pro M3',
      price: 250000,
      purchaseDate: '2024-01-16',
      verificationCode: 'PV-2024-004',
      deliveryStatus: 'Pending'
    },
    {
      id: 5,
      buyerUser: 'David Brown',
      item: 'Designer Handbag',
      price: 15000,
      purchaseDate: '2024-01-18',
      verificationCode: 'PV-2024-005',
      deliveryStatus: 'In Transit'
    },
    {
      id: 6,
      buyerUser: 'Emily Davis',
      item: 'Toyota Corolla',
      price: 2800000,
      purchaseDate: '2024-01-20',
      verificationCode: 'PV-2024-006',
      deliveryStatus: 'Delivered'
    }
  ]);

  // Fetch ads data
  useEffect(() => {
    if (activeSection === 'ads-management' || !activeSection) {
      fetchAds();
    }
  }, [activeSection]);

  const fetchAds = async () => {
    setAdsLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getAds();
      const adsData = response.data.ads || [];
      const totals = response.data.totals || {
        userPosted: 0,
        vendorPosted: 0,
        adminPosted: 0,
        total: 0
      };
      
      // Transform ads data to match the expected format
      const transformedAds = adsData.map(ad => ({
        id: ad.id,
        sn: ad.id,
        title: ad.title,
        category: ad.category?.name || 'N/A',
        description: ad.description,
        price: parseFloat(ad.price) || 0,
        views: ad.views || 0,
        date: ad.created_at,
        postedBy: ad.posted_by || 'user'
      }));
      
      setAds(transformedAds);
      setAdTotals(totals);
    } catch (err) {
      setError('Failed to fetch ads: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching ads:', err);
    } finally {
      setAdsLoading(false);
    }
  };

  // Handle delete ad
  const handleDeleteAd = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ad?')) {
      return;
    }
    
    try {
      await adminAPI.deleteAd(id);
      setSuccessMessage('Ad deleted successfully');
      fetchAds(); // Refresh the list
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to delete ad: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 5000);
    }
  };

  // Handle edit ad - inline editing
  const handleEditAd = async (ad) => {
    const newTitle = prompt('Edit Title:', ad.title);
    if (newTitle === null) return; // User cancelled
    
    const newDescription = prompt('Edit Description:', ad.description);
    if (newDescription === null) return;
    
    const newPrice = prompt('Edit Price:', ad.price);
    if (newPrice === null) return;
    
    try {
      await adminAPI.updateAd(ad.id, {
        title: newTitle,
        description: newDescription,
        price: parseFloat(newPrice),
      });
      setSuccessMessage('Ad updated successfully');
      fetchAds(); // Refresh the list
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update ad: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 5000);
    }
  };

  // Mock ads data (removed - now using real data)
  const [oldMockAds, setOldMockAds] = useState([
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

  // Fetch locations data
  useEffect(() => {
    if (activeSection === 'location-address') {
      fetchLocations();
    }
  }, [activeSection]);

  const fetchLocations = async () => {
    setLocationsLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getLocations();
      const locationsData = response.data || [];
      
      // Transform locations data to match the expected format
      const transformedLocations = locationsData.map(location => ({
        id: location.id,
        province: location.province,
        district: location.district,
        localLevel: location.local_level,
        localLevelType: location.local_level_type,
        wardId: location.ward_id
      }));
      
      setLocations(transformedLocations);
    } catch (err) {
      setError('Failed to fetch locations: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching locations:', err);
    } finally {
      setLocationsLoading(false);
    }
  };

  // Handle delete location
  const handleDeleteLocation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this location?')) {
      return;
    }
    
    try {
      await adminAPI.deleteLocation(id);
      setSuccessMessage('Location deleted successfully');
      fetchLocations(); // Refresh the list
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to delete location: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 5000);
    }
  };

  // Handle edit location - inline editing
  const handleEditLocation = async (location) => {
    const newProvince = prompt('Edit Province:', location.province);
    if (newProvince === null) return; // User cancelled
    
    const newDistrict = prompt('Edit District:', location.district);
    if (newDistrict === null) return;
    
    const newLocalLevel = prompt('Edit Local Level:', location.localLevel);
    if (newLocalLevel === null) return;
    
    const newLocalLevelType = prompt('Edit Local Level Type (Metropolitan City, Sub-Metropolitan City, Municipality, Rural Municipality):', location.localLevelType);
    if (newLocalLevelType === null) return;
    
    try {
      await adminAPI.updateLocation(location.id, {
        province: newProvince,
        district: newDistrict,
        local_level: newLocalLevel,
        local_level_type: newLocalLevelType,
      });
      setSuccessMessage('Location updated successfully');
      fetchLocations(); // Refresh the list
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update location: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 5000);
    }
  };

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
    { id: 'ads-management', label: 'Ads management' },
    { id: 'auction-management', label: 'Auction Management' },
    { id: 'category-management', label: 'Category Management' },
    { id: 'change-password', label: 'Change Password' },
    { id: 'delivery-management', label: 'Delivery Management' },
    { id: 'email-subscriber', label: 'Email Subscriber List' },
    { id: 'job', label: 'Job' },
    { id: 'live-chat', label: 'Live Chat' },
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

          {/* Error and Success Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              {successMessage}
            </div>
          )}

          {/* Section-specific content */}
          {activeSection === 'ads-management' && !activeSubsection && (
            <>
              {adsLoading && (
                <div className="mb-4 text-center text-[hsl(var(--muted-foreground))]">
                  Loading ads...
                </div>
              )}
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
                        <p 
                          className="text-sm text-[hsl(var(--foreground))] cursor-pointer hover:text-[hsl(var(--primary))] transition-colors"
                          onClick={() => navigate('/admin/ads-management/admin-posted-ads')}
                        >
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
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-7 px-2 text-xs"
                                    onClick={() => handleEditAd(ad)}
                                  >
                                    Edit
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    className="h-7 px-2 text-xs"
                                    onClick={() => handleDeleteAd(ad.id)}
                                  >
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

          {/* Admin Posted Ads Subsection */}
          {activeSection === 'ads-management' && activeSubsection === 'admin-posted-ads' && (
            <section>
              <Card>
                <CardContent className="p-4">
                  <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Admin Posted ads</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[hsl(var(--border))]">
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">S.N.</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Ad title</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Category</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Description</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Price</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Posted date</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Total view</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Item sold</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Edit/Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Empty rows - 6 rows as shown in the image */}
                        {Array.from({ length: 6 }, (_, index) => (
                          <tr key={index + 1} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]">
                            <td className="p-3 text-sm text-[hsl(var(--foreground))]">{index + 1}</td>
                            <td className="p-3 text-sm text-[hsl(var(--foreground))]"></td>
                            <td className="p-3 text-sm text-[hsl(var(--foreground))]"></td>
                            <td className="p-3 text-sm text-[hsl(var(--foreground))]"></td>
                            <td className="p-3 text-sm text-[hsl(var(--foreground))]"></td>
                            <td className="p-3 text-sm text-[hsl(var(--foreground))]"></td>
                            <td className="p-3 text-sm text-[hsl(var(--foreground))]"></td>
                            <td className="p-3 text-sm text-[hsl(var(--foreground))]"></td>
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

          {activeSection === 'location-address' && (
            <section>
              {locationsLoading && (
                <div className="mb-4 text-center text-[hsl(var(--muted-foreground))]">
                  Loading locations...
                </div>
              )}
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
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="h-7 px-2 text-xs"
                                  onClick={() => handleEditLocation(location)}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  className="h-7 px-2 text-xs"
                                  onClick={() => handleDeleteLocation(location.id)}
                                >
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

          {activeSection === 'auction-management' && (
            <>
              {/* Auction Management Header */}
              <section className="mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">Auction Management</h2>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">The form of auction is submitted by super admin</p>
                      </div>
                      <Button onClick={() => setShowAuctionForm(!showAuctionForm)}>Start Auction</Button>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Auction Form - appears when Start Auction is clicked */}
              <div
                className={`mb-6 transition-all duration-400 ease-in-out ${
                  showAuctionForm 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 -translate-y-4 pointer-events-none'
                }`}
                style={{
                  transition: 'opacity 0.4s ease-in-out, transform 0.4s ease-in-out'
                }}
              >
                {showAuctionForm && (
                  <section>
                    <Card>
                    <CardContent className="p-6">
                      <h3 className="text-md font-semibold text-[hsl(var(--foreground))] mb-4">Auction Item Name</h3>
                      <form 
                        className="grid grid-cols-2 gap-4"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          // Simulate form submission
                          try {
                            // TODO: Replace with actual API call
                            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
                            
                            // On success, close the form with fade-up animation
                            setShowAuctionForm(false);
                            
                            // Optional: Show success message or reset form
                            // You can add a toast notification here if needed
                          } catch (error) {
                            console.error('Form submission error:', error);
                            // Handle error (show error message, etc.)
                          }
                        }}
                      >
                        {/* Left Column */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">First Name</label>
                            <Input className="w-full" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Last Name</label>
                            <Input className="w-full" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Date of Birth</label>
                            <Input type="date" className="w-full" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Username or our system suggest username</label>
                            <Input className="w-full" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Mobile number</label>
                            <Input type="tel" className="w-full" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Auction Item Name</label>
                            <Input className="w-full" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Description</label>
                            <textarea className="w-full min-h-[100px] px-3 py-2 border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" />
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Category/Sub category</label>
                            <Input className="w-full" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Reserve price</label>
                            <Input type="number" className="w-full" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Buy Now Price</label>
                            <Input type="number" className="w-full" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Auction start date and time</label>
                            <Input type="datetime-local" className="w-full" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Auction finish date and time</label>
                            <Input type="datetime-local" className="w-full" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Must pick up Or provide delivery service by the seller</label>
                            <textarea className="w-full min-h-[100px] px-3 py-2 border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" />
                          </div>
                        </div>
                        <div className="col-span-2 flex justify-end mt-6">
                          <Button type="submit">Submit</Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                  </section>
                )}
              </div>

              {/* Bidding history tracking Table */}
              <section className="mb-6">
                <Card>
                  <CardContent className="p-4">
                    <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Bidding history tracking:</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-[hsl(var(--border))]">
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">S.N.</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">User Name</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Item Name</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Reserve Price</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Buy Now Price</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Payment Method</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Start Date Time</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Edit/Delete</th>
                          </tr>
                        </thead>
                        <tbody>
                          {biddingHistoryData.map((bid, index) => (
                            <tr key={bid.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]">
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{index + 1}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{bid.userName}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{bid.itemName}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))] font-semibold">Rs. {bid.reservePrice.toLocaleString()}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))] font-semibold">Rs. {bid.buyNowPrice.toLocaleString()}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{bid.paymentMethod}</td>
                              <td className="p-3 text-sm text-[hsl(var(--muted-foreground))]">{new Date(bid.startDateTime).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
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

              {/* Bid winner tracking Table */}
              <section className="mb-6">
                <Card>
                  <CardContent className="p-4">
                    <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Bid winner tracking</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-[hsl(var(--border))]">
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">S.N.</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">User Name</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Bidding Item</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Bid Start Date</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Bid Won Date</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Payment Proceed Date</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Total Payment</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Seller Name</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Congratulation email send to the winner</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Edit/Delete</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bidWinnerData.map((winner, index) => (
                            <tr key={winner.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]">
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{index + 1}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{winner.userName}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{winner.biddingItem}</td>
                              <td className="p-3 text-sm text-[hsl(var(--muted-foreground))]">{new Date(winner.bidStartDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                              <td className="p-3 text-sm text-[hsl(var(--muted-foreground))]">{new Date(winner.bidWonDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                              <td className="p-3 text-sm text-[hsl(var(--muted-foreground))]">{new Date(winner.paymentProceedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))] font-semibold">Rs. {winner.totalPayment.toLocaleString()}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{winner.sellerName}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{winner.emailSent}</td>
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

              {/* Block or backlist user Table */}
              <section className="mb-6">
                <Card>
                  <CardContent className="p-4">
                    <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Block or backlist user who violate the rule:</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-[hsl(var(--border))]">
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">S.N.</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">User Name</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Email</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Address</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Date to block</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Reason to block</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Edit/Delete</th>
                          </tr>
                        </thead>
                        <tbody>
                          {blockedUserData.map((user, index) => (
                            <tr key={user.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]">
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{index + 1}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{user.userName}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{user.email}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{user.address}</td>
                              <td className="p-3 text-sm text-[hsl(var(--muted-foreground))]">{new Date(user.dateToBlock).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{user.reasonToBlock}</td>
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

              {/* Bidding Tracking Table */}
              <section>
                <Card>
                  <CardContent className="p-4">
                    <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Bidding Tracking:</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-[hsl(var(--border))]">
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">S.N.</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Bid Winner Name</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Bid Won Item Name</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Payment Status</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Pickup Status</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Complete the Process(date time)</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Send alert to bid winner in case of pending status</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Edit/Delete</th>
                          </tr>
                        </thead>
                        <tbody>
                          {biddingTrackingData.map((tracking, index) => (
                            <tr key={tracking.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]">
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{index + 1}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{tracking.bidWinnerName}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{tracking.bidWonItemName}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{tracking.paymentStatus}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{tracking.pickupStatus}</td>
                              <td className="p-3 text-sm text-[hsl(var(--muted-foreground))]">
                                {tracking.completeProcessDateTime 
                                  ? new Date(tracking.completeProcessDateTime).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                  : '-'}
                              </td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{tracking.alertSent}</td>
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

          {activeSection === 'delivery-management' && (
            <>
              {/* Delivery Management Table */}
              <section className="mb-6">
                <Card>
                  <CardContent className="p-4">
                    <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Delivery Management</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-[hsl(var(--border))]">
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">S.N.</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Seller/Vendor</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Item</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Price</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Delivery Status</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Pick up date</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Edit/Delete</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deliveryData.map((delivery, index) => (
                            <tr key={delivery.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]">
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{index + 1}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{delivery.sellerVendor}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{delivery.item}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))] font-semibold">Rs. {delivery.price.toLocaleString()}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{delivery.deliveryStatus}</td>
                              <td className="p-3 text-sm text-[hsl(var(--muted-foreground))]">{new Date(delivery.pickupDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
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

              {/* Purchase Verification info Table */}
              <section>
                <Card>
                  <CardContent className="p-4">
                    <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Purchase Verification info:</h2>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-[hsl(var(--border))]">
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">S.N.</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Buyer/User</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Item</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Price</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Purchase Date</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Purchase verification code</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Delivery Status</th>
                            <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Edit/Delete</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchaseVerificationData.map((purchase, index) => (
                            <tr key={purchase.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]">
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{index + 1}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{purchase.buyerUser}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{purchase.item}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))] font-semibold">Rs. {purchase.price.toLocaleString()}</td>
                              <td className="p-3 text-sm text-[hsl(var(--muted-foreground))]">{new Date(purchase.purchaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))] font-mono">{purchase.verificationCode}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{purchase.deliveryStatus}</td>
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
        </main>
      </div>
    </Layout>
  );
}

export default AdminPanel;
