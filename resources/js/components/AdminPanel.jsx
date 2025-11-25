import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const activeSection = section || null; // No section selected when on /admin
  const activeSubsection = subsection || null;
  
  // Set selectedRole based on current route and user role
  const isSuperAdminRoute = location.pathname.startsWith('/super_admin');
  const [selectedRole, setSelectedRole] = useState(
    (user?.role === 'super_admin' && isSuperAdminRoute) ? 'super-admin' : 'admin'
  );
  
  // Update selectedRole when route or user changes
  useEffect(() => {
    if (user?.role === 'super_admin' && isSuperAdminRoute) {
      setSelectedRole('super-admin');
    } else if (location.pathname.startsWith('/admin')) {
      setSelectedRole('admin');
    }
  }, [location.pathname, user?.role, isSuperAdminRoute]);
  const [showAuctionForm, setShowAuctionForm] = useState(false);
  const [showPostAdForm, setShowPostAdForm] = useState(false);
  const [showAddLocationForm, setShowAddLocationForm] = useState(false);
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [auctionFormData, setAuctionFormData] = useState({
    user_id: '',
    category_id: '',
    title: '',
    description: '',
    starting_price: '',
    reserve_price: '',
    buy_now_price: '',
    start_date_time: '',
    end_date_time: '',
  });
  const [postAdFormData, setPostAdFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '',
    user_id: '',
  });
  const [addLocationFormData, setAddLocationFormData] = useState({
    province: '',
    district: '',
    localLevel: '',
    localLevelType: 'Municipality',
  });
  const [addCategoryFormData, setAddCategoryFormData] = useState({
    categoryName: '',
    subcategoryName: '',
  });
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [categories, setCategories] = useState([]); // Main categories for search bar
  const [flattenedCategories, setFlattenedCategories] = useState([]); // All categories + subcategories for forms
  const [locationData, setLocationData] = useState({ provinces: [] }); // Location data from database
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
  const [editingAdId, setEditingAdId] = useState(null);
  const [editingAdData, setEditingAdData] = useState(null);

  // Location data - fetched from database via API
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [editingLocationData, setEditingLocationData] = useState(null);

  // Category management data - fetched from database via API
  const [categoryManagementData, setCategoryManagementData] = useState([]);
  const [categoryManagementLoading, setCategoryManagementLoading] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryData, setEditingCategoryData] = useState(null);

  // Bidding history data - fetched from database via API
  const [biddingHistoryData, setBiddingHistoryData] = useState([]);
  const [biddingHistoryLoading, setBiddingHistoryLoading] = useState(false);
  const [editingBiddingHistoryId, setEditingBiddingHistoryId] = useState(null);
  const [editingBiddingHistoryData, setEditingBiddingHistoryData] = useState(null);

  // Bid winner data - fetched from database via API
  const [bidWinnerData, setBidWinnerData] = useState([]);
  const [bidWinnerLoading, setBidWinnerLoading] = useState(false);
  const [editingBidWinnerId, setEditingBidWinnerId] = useState(null);
  const [editingBidWinnerData, setEditingBidWinnerData] = useState(null);

  // Blocked user data - fetched from database via API
  const [blockedUserData, setBlockedUserData] = useState([]);
  const [blockedUserLoading, setBlockedUserLoading] = useState(false);
  const [editingBlockedUserId, setEditingBlockedUserId] = useState(null);
  const [editingBlockedUserData, setEditingBlockedUserData] = useState(null);

  // Bidding tracking data - fetched from database via API
  const [biddingTrackingData, setBiddingTrackingData] = useState([]);
  const [biddingTrackingLoading, setBiddingTrackingLoading] = useState(false);
  const [editingBiddingTrackingId, setEditingBiddingTrackingId] = useState(null);
  const [editingBiddingTrackingData, setEditingBiddingTrackingData] = useState(null);

  // Delivery management data - fetched from database via API
  const [deliveryData, setDeliveryData] = useState([]);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [editingDeliveryId, setEditingDeliveryId] = useState(null);
  const [editingDeliveryData, setEditingDeliveryData] = useState(null);

  // Purchase verification data - fetched from database via API
  const [purchaseVerificationData, setPurchaseVerificationData] = useState([]);
  const [purchaseVerificationLoading, setPurchaseVerificationLoading] = useState(false);
  const [editingPurchaseVerificationId, setEditingPurchaseVerificationId] = useState(null);
  const [editingPurchaseVerificationData, setEditingPurchaseVerificationData] = useState(null);

  // Job management data
  const [jobCategories, setJobCategories] = useState([]);
  const [jobCategoriesLoading, setJobCategoriesLoading] = useState(false);
  const [editingJobCategoryId, setEditingJobCategoryId] = useState(null);
  const [editingJobCategoryData, setEditingJobCategoryData] = useState(null);
  const [showAddJobCategoryForm, setShowAddJobCategoryForm] = useState(false);
  const [jobCategoryFormData, setJobCategoryFormData] = useState({
    category: '',
    sub_category: '',
    posted_job: 0,
    job_status: 'draft',
  });

  const [jobApplicants, setJobApplicants] = useState([]);
  const [jobApplicantsLoading, setJobApplicantsLoading] = useState(false);
  const [editingJobApplicantId, setEditingJobApplicantId] = useState(null);
  const [editingJobApplicantData, setEditingJobApplicantData] = useState(null);
  const [showPostJobApplicantForm, setShowPostJobApplicantForm] = useState(false);
  const [showApplyJobForm, setShowApplyJobForm] = useState(false);
  const [jobApplicantFormData, setJobApplicantFormData] = useState({
    job_title: '',
    posted_date: '',
    expected_salary: '',
    applicant_name: '',
    interview_date: '',
    job_progress: 'applied',
  });
  const [applyJobFormData, setApplyJobFormData] = useState({
    job_title: '',
    applicant_name: '',
    expected_salary: '',
    posted_date: '',
    interview_date: '',
    job_progress: 'applied',
  });

  // Live chat data
  const [liveChats, setLiveChats] = useState([]);
  const [liveChatsLoading, setLiveChatsLoading] = useState(false);
  const [selectedLiveChat, setSelectedLiveChat] = useState(null);

  // Offers/Discounts data
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState(null);
  const [editingOfferData, setEditingOfferData] = useState(null);
  const [showPostDiscountForm, setShowPostDiscountForm] = useState(false);
  const [offerFormData, setOfferFormData] = useState({
    item_name: '',
    vendor_id: '',
    offer_percentage: '',
    created_date: '',
    valid_until: '',
    status: 'pending',
  });

  // Ratings/Reviews data
  const [ratings, setRatings] = useState([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [editingRatingId, setEditingRatingId] = useState(null);
  const [editingRatingData, setEditingRatingData] = useState(null);

  // Sales Report data
  const [salesReport, setSalesReport] = useState(null);
  const [salesReportLoading, setSalesReportLoading] = useState(false);
  const [editingSalesReportId, setEditingSalesReportId] = useState(null);
  const [editingSalesReportData, setEditingSalesReportData] = useState(null);

  // Stock Management data
  const [stockManagement, setStockManagement] = useState([]);
  const [stockManagementLoading, setStockManagementLoading] = useState(false);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [editingStockId, setEditingStockId] = useState(null);
  const [editingStockData, setEditingStockData] = useState(null);
  const [showStockAlert, setShowStockAlert] = useState(false);
  const [stockManagementCategories, setStockManagementCategories] = useState([]); // All categories grouped by main category
  const [stockManagementMainCategories, setStockManagementMainCategories] = useState([]); // Unique main categories
  const [chatMessages, setChatMessages] = useState([]);
  const [chatMessagesLoading, setChatMessagesLoading] = useState(false);
  const [newChatMessage, setNewChatMessage] = useState('');

  // Fetch ads data
  useEffect(() => {
    if (activeSection === 'ads-management' || !activeSection) {
      fetchAds();
      fetchUsers();
    }
  }, [activeSection, activeSubsection]);

  // Fetch users and categories for auction form
  useEffect(() => {
    if (activeSection === 'auction-management') {
      fetchUsers();
    }
  }, [activeSection]);

  // Fetch offers data
  useEffect(() => {
    if (activeSection === 'offer-discount') {
      fetchOffers();
      fetchUsers();
    }
  }, [activeSection]);

  // Fetch ratings data
  useEffect(() => {
    if (activeSection === 'rating-review') {
      fetchRatings();
      fetchUsers();
    }
  }, [activeSection]);

  // Fetch sales report data
  useEffect(() => {
    if (activeSection === 'sales-report') {
      fetchSalesReport();
      fetchUsers();
    }
  }, [activeSection]);

  // Fetch stock management data
  useEffect(() => {
    if (activeSection === 'stock-management') {
      fetchStockManagement();
      fetchUsers();
      fetchStockManagementCategories();
    }
  }, [activeSection]);

  // Check for low stock alerts periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeSection === 'stock-management') {
        fetchStockManagement();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [activeSection]);

  // Fetch job management data
  useEffect(() => {
    if (activeSection === 'job-management') {
      fetchJobCategories();
      fetchJobApplicants();
    }
  }, [activeSection]);

  useEffect(() => {
    if (activeSection === 'live-chat') {
      fetchLiveChats();
    }
  }, [activeSection]);

  // Fetch users for Post Ad form
  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getUsers();
      setUsers(response.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchJobCategories = async () => {
    setJobCategoriesLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getJobCategories();
      setJobCategories(response.data || []);
    } catch (err) {
      setError('Failed to fetch job categories: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching job categories:', err);
      setTimeout(() => setError(null), 5000);
    } finally {
      setJobCategoriesLoading(false);
    }
  };

  const fetchJobApplicants = async () => {
    setJobApplicantsLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getJobApplicants();
      setJobApplicants(response.data || []);
    } catch (err) {
      setError('Failed to fetch job applicants: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching job applicants:', err);
      setTimeout(() => setError(null), 5000);
    } finally {
      setJobApplicantsLoading(false);
    }
  };

  const fetchOffers = async () => {
    setOffersLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getOffers();
      setOffers(response.data || []);
    } catch (err) {
      setError('Failed to fetch offers: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching offers:', err);
      setTimeout(() => setError(null), 5000);
    } finally {
      setOffersLoading(false);
    }
  };

  const fetchRatings = async () => {
    setRatingsLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getRatings();
      setRatings(response.data || []);
    } catch (err) {
      setError('Failed to fetch ratings: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching ratings:', err);
      setTimeout(() => setError(null), 5000);
    } finally {
      setRatingsLoading(false);
    }
  };

  const fetchSalesReport = async () => {
    setSalesReportLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getSalesReport();
      setSalesReport(response.data);
    } catch (err) {
      setError('Failed to fetch sales report: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching sales report:', err);
      setTimeout(() => setError(null), 5000);
    } finally {
      setSalesReportLoading(false);
    }
  };

  const fetchStockManagement = async () => {
    setStockManagementLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getStockManagement();
      setStockManagement(response.data.stocks || []);
      
      // Show alert if there are low stock items
      if (response.data.low_stock_alerts && response.data.low_stock_alerts.length > 0) {
        setLowStockAlerts(response.data.low_stock_alerts);
        setShowStockAlert(true);
      } else {
        setLowStockAlerts([]);
        setShowStockAlert(false);
      }
    } catch (err) {
      setError('Failed to fetch stock management: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching stock management:', err);
      setTimeout(() => setError(null), 5000);
    } finally {
      setStockManagementLoading(false);
    }
  };

  const handleAddJobCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createJobCategory({
        category: jobCategoryFormData.category,
        sub_category: jobCategoryFormData.sub_category || null,
        posted_job: parseInt(jobCategoryFormData.posted_job, 10) || 0,
        job_status: jobCategoryFormData.job_status,
      });
      setSuccessMessage('Job category created successfully');
      setShowAddJobCategoryForm(false);
      setJobCategoryFormData({
        category: '',
        sub_category: '',
        posted_job: 0,
        job_status: 'draft',
      });
      fetchJobCategories();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to create job category: ' + (err.response?.data?.message || err.message));
      console.error('Error creating job category:', err);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleEditJobCategory = (category) => {
    setEditingJobCategoryId(category.id);
    setEditingJobCategoryData({
      category: category.category,
      sub_category: category.sub_category || '',
      posted_job: category.posted_job,
      job_status: category.job_status,
    });
  };

  const handleSaveJobCategory = async (categoryId) => {
    try {
      await adminAPI.updateJobCategory(categoryId, {
        ...editingJobCategoryData,
        sub_category: editingJobCategoryData.sub_category || null,
        posted_job: parseInt(editingJobCategoryData.posted_job, 10) || 0,
      });
      setSuccessMessage('Job category updated successfully');
      setEditingJobCategoryId(null);
      setEditingJobCategoryData(null);
      fetchJobCategories();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update job category: ' + (err.response?.data?.message || err.message));
      console.error('Error updating job category:', err);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleCancelEditJobCategory = () => {
    setEditingJobCategoryId(null);
    setEditingJobCategoryData(null);
  };

  const handleDeleteJobCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this job category?')) {
      return;
    }
    try {
      await adminAPI.deleteJobCategory(categoryId);
      setSuccessMessage('Job category deleted successfully');
      fetchJobCategories();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to delete job category: ' + (err.response?.data?.message || err.message));
      console.error('Error deleting job category:', err);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handlePostJobApplicantSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createJobApplicant({
        job_title: jobApplicantFormData.job_title,
        posted_date: jobApplicantFormData.posted_date || null,
        expected_salary: jobApplicantFormData.expected_salary ? parseFloat(jobApplicantFormData.expected_salary) : null,
        applicant_name: jobApplicantFormData.applicant_name,
        interview_date: jobApplicantFormData.interview_date || null,
        job_progress: jobApplicantFormData.job_progress,
      });
      setSuccessMessage('Job applicant posted successfully');
      setShowPostJobApplicantForm(false);
      setJobApplicantFormData({
        job_title: '',
        posted_date: '',
        expected_salary: '',
        applicant_name: '',
        interview_date: '',
        job_progress: 'applied',
      });
      fetchJobApplicants();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to post job applicant: ' + (err.response?.data?.message || err.message));
      console.error('Error posting job applicant:', err);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleApplyJobSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createJobApplicant({
        job_title: applyJobFormData.job_title,
        applicant_name: applyJobFormData.applicant_name,
        expected_salary: applyJobFormData.expected_salary ? parseFloat(applyJobFormData.expected_salary) : null,
        posted_date: applyJobFormData.posted_date || null,
        interview_date: applyJobFormData.interview_date || null,
        job_progress: applyJobFormData.job_progress,
      });
      setSuccessMessage('Job application submitted successfully');
      setShowApplyJobForm(false);
      setApplyJobFormData({
        job_title: '',
        applicant_name: '',
        expected_salary: '',
        posted_date: '',
        interview_date: '',
        job_progress: 'applied',
      });
      fetchJobApplicants();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to submit job application: ' + (err.response?.data?.message || err.message));
      console.error('Error submitting job application:', err);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleEditJobApplicant = (applicant) => {
    setEditingJobApplicantId(applicant.id);
    setEditingJobApplicantData({
      job_title: applicant.job_title,
      posted_date: applicant.posted_date || '',
      expected_salary: applicant.expected_salary ?? '',
      applicant_name: applicant.applicant_name,
      interview_date: applicant.interview_date || '',
      job_progress: applicant.job_progress,
    });
  };

  const handleSaveJobApplicant = async (applicantId) => {
    try {
      await adminAPI.updateJobApplicant(applicantId, {
        ...editingJobApplicantData,
        expected_salary: editingJobApplicantData.expected_salary !== '' && editingJobApplicantData.expected_salary !== null
          ? parseFloat(editingJobApplicantData.expected_salary)
          : null,
        posted_date: editingJobApplicantData.posted_date || null,
        interview_date: editingJobApplicantData.interview_date || null,
      });
      setSuccessMessage('Job applicant updated successfully');
      setEditingJobApplicantId(null);
      setEditingJobApplicantData(null);
      fetchJobApplicants();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update job applicant: ' + (err.response?.data?.message || err.message));
      console.error('Error updating job applicant:', err);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleCancelEditJobApplicant = () => {
    setEditingJobApplicantId(null);
    setEditingJobApplicantData(null);
  };

  const handleDeleteJobApplicant = async (applicantId) => {
    if (!window.confirm('Are you sure you want to delete this job applicant?')) {
      return;
    }
    try {
      await adminAPI.deleteJobApplicant(applicantId);
      setSuccessMessage('Job applicant deleted successfully');
      fetchJobApplicants();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to delete job applicant: ' + (err.response?.data?.message || err.message));
      console.error('Error deleting job applicant:', err);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handlePostDiscountSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createOffer({
        item_name: offerFormData.item_name,
        vendor_id: parseInt(offerFormData.vendor_id, 10),
        offer_percentage: parseFloat(offerFormData.offer_percentage),
        created_date: offerFormData.created_date,
        valid_until: offerFormData.valid_until,
        status: offerFormData.status,
      });
      setSuccessMessage('Discount/Coupon created successfully');
      setShowPostDiscountForm(false);
      setOfferFormData({
        item_name: '',
        vendor_id: '',
        offer_percentage: '',
        created_date: '',
        valid_until: '',
        status: 'pending',
      });
      fetchOffers();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to create discount/coupon: ' + (err.response?.data?.message || err.message));
      console.error('Error creating discount/coupon:', err);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleEditOffer = (offer) => {
    setEditingOfferId(offer.id);
    setEditingOfferData({
      item_name: offer.item_name,
      vendor_id: offer.vendor_id.toString(),
      offer_percentage: offer.offer_percentage.toString(),
      created_date: offer.created_date,
      valid_until: offer.valid_until,
      status: offer.status,
    });
  };

  const handleSaveOffer = async (offerId) => {
    try {
      await adminAPI.updateOffer(offerId, {
        ...editingOfferData,
        vendor_id: parseInt(editingOfferData.vendor_id, 10),
        offer_percentage: parseFloat(editingOfferData.offer_percentage),
      });
      setSuccessMessage('Offer updated successfully');
      setEditingOfferId(null);
      setEditingOfferData(null);
      fetchOffers();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update offer: ' + (err.response?.data?.message || err.message));
      console.error('Error updating offer:', err);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleCancelEditOffer = () => {
    setEditingOfferId(null);
    setEditingOfferData(null);
  };

  const handleDeleteOffer = async (offerId) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) {
      return;
    }
    try {
      await adminAPI.deleteOffer(offerId);
      setSuccessMessage('Offer deleted successfully');
      fetchOffers();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to delete offer: ' + (err.response?.data?.message || err.message));
      console.error('Error deleting offer:', err);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleApproveOffer = async (offerId) => {
    try {
      await adminAPI.approveOffer(offerId);
      setSuccessMessage('Offer approved successfully');
      fetchOffers();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to approve offer: ' + (err.response?.data?.message || err.message));
      console.error('Error approving offer:', err);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleEditRating = (rating) => {
    setEditingRatingId(rating.id);
    setEditingRatingData({
      user_id: rating.user_id.toString(),
      seller_id: rating.seller_id.toString(),
      rating: rating.rating.toString(),
      comment: rating.comment || '',
    });
  };

  const handleSaveRating = async (ratingId) => {
    try {
      await adminAPI.updateRating(ratingId, {
        ...editingRatingData,
        user_id: parseInt(editingRatingData.user_id, 10),
        seller_id: parseInt(editingRatingData.seller_id, 10),
        rating: parseInt(editingRatingData.rating, 10),
      });
      setSuccessMessage('Rating updated successfully');
      setEditingRatingId(null);
      setEditingRatingData(null);
      fetchRatings();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update rating: ' + (err.response?.data?.message || err.message));
      console.error('Error updating rating:', err);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleCancelEditRating = () => {
    setEditingRatingId(null);
    setEditingRatingData(null);
  };

  const handleDeleteRating = async (ratingId) => {
    if (!window.confirm('Are you sure you want to delete this rating?')) {
      return;
    }
    try {
      await adminAPI.deleteRating(ratingId);
      setSuccessMessage('Rating deleted successfully');
      fetchRatings();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to delete rating: ' + (err.response?.data?.message || err.message));
      console.error('Error deleting rating:', err);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleEditSalesReport = (report) => {
    setEditingSalesReportId(report.id);
    setEditingSalesReportData({
      user_id: report.user_id.toString(),
      listed_items: report.listed_items.toString(),
      sold_items: report.sold_items.toString(),
      earning: report.earning.toString(),
      total_earning: report.total_earning.toString(),
    });
  };

  const handleSaveSalesReport = async (reportId) => {
    try {
      await adminAPI.updateSalesReport(reportId, {
        ...editingSalesReportData,
        user_id: parseInt(editingSalesReportData.user_id, 10),
        listed_items: parseInt(editingSalesReportData.listed_items, 10),
        sold_items: parseInt(editingSalesReportData.sold_items, 10),
        earning: parseFloat(editingSalesReportData.earning),
        total_earning: parseFloat(editingSalesReportData.total_earning),
      });
      setSuccessMessage('Sales report updated successfully');
      setEditingSalesReportId(null);
      setEditingSalesReportData(null);
      fetchSalesReport();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update sales report: ' + (err.response?.data?.message || err.message));
      console.error('Error updating sales report:', err);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleCancelEditSalesReport = () => {
    setEditingSalesReportId(null);
    setEditingSalesReportData(null);
  };

  const handleDeleteSalesReport = async (reportId) => {
    if (!window.confirm('Are you sure you want to delete this sales report?')) {
      return;
    }
    try {
      await adminAPI.deleteSalesReport(reportId);
      setSuccessMessage('Sales report deleted successfully');
      fetchSalesReport();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to delete sales report: ' + (err.response?.data?.message || err.message));
      console.error('Error deleting sales report:', err);
      setTimeout(() => setError(null), 5000);
    }
  };

  const fetchStockManagementCategories = async () => {
    try {
      const response = await adminAPI.getCategories();
      const allCategories = response.data || [];
      
      // Get unique main categories (unique category names)
      const mainCategoriesMap = new Map();
      const categoriesByMain = new Map();
      
      // First, collect all unique category names and their first ID
      const uniqueCategoryNames = new Set();
      allCategories.forEach((cat) => {
        const categoryName = cat.categoryName || cat.category || '';
        if (categoryName) {
          uniqueCategoryNames.add(categoryName);
        }
      });
      
      // For each unique category name, find the first entry to use as main category ID
      uniqueCategoryNames.forEach((categoryName) => {
        // Find first category entry for this category name
        const firstCat = allCategories.find(c => {
          const catName = c.categoryName || c.category || '';
          return catName === categoryName;
        });
        
        if (firstCat) {
          // Use categoryId if it exists, otherwise use id
          const mainCategoryId = firstCat.categoryId || firstCat.id;
          mainCategoriesMap.set(categoryName, {
            id: mainCategoryId,
            name: categoryName,
          });
          categoriesByMain.set(categoryName, []);
        }
      });
      
      // Now collect all subcategories grouped by category name
      allCategories.forEach((cat) => {
        const categoryName = cat.categoryName || cat.category || '';
        
        if (!categoryName) return;
        
        // If it has a subcategoryId, it's a subcategory
        if (cat.subcategoryId && cat.subcategoryId !== null) {
          if (!categoriesByMain.has(categoryName)) {
            categoriesByMain.set(categoryName, []);
          }
          categoriesByMain.get(categoryName).push({
            id: cat.subcategoryId || cat.id,
            name: cat.subcategoryName || cat.sub_category || '',
          });
        }
      });
      
      // Sort main categories alphabetically
      const sortedMainCategories = Array.from(mainCategoriesMap.values()).sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      
      // Sort subcategories within each main category
      categoriesByMain.forEach((subcats, categoryName) => {
        subcats.sort((a, b) => a.name.localeCompare(b.name));
      });
      
      setStockManagementMainCategories(sortedMainCategories);
      setStockManagementCategories(categoriesByMain);
    } catch (err) {
      console.error('Error fetching categories for stock management:', err);
      setError('Failed to load categories: ' + (err.message || 'Unknown error'));
    }
  };

  const handleEditStock = async (stock) => {
    if (!stock) return;
    
    try {
      setEditingStockId(stock.id);
      
      // Fetch categories if not already loaded
      if (stockManagementMainCategories.length === 0) {
        await fetchStockManagementCategories();
      }
      
      // Wait a bit to ensure categories are loaded
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Find the main category for this stock item by matching category_name
      let selectedMainCategory = null;
      if (stock.category_name) {
        selectedMainCategory = stockManagementMainCategories.find(
          cat => cat.name === stock.category_name
        );
      }
      
      // If still not found, use the first main category as default
      if (!selectedMainCategory && stockManagementMainCategories.length > 0) {
        selectedMainCategory = stockManagementMainCategories[0];
      }
      
      const selectedMainCategoryId = selectedMainCategory?.id || stock.category_id;
      
      // Determine the final category_id
      // If subcategory_name exists, use the current category_id (which is the subcategory_id)
      // Otherwise, use the main category_id
      const finalCategoryId = (stock.subcategory_name && stock.subcategory_name.trim() !== '') 
        ? stock.category_id.toString() 
        : selectedMainCategoryId.toString();
      
      setEditingStockData({
        item_name: stock.item_name || '',
        vendor_seller_id: stock.vendor_seller_id?.toString() || '',
        main_category_id: selectedMainCategoryId.toString(),
        category_id: finalCategoryId, // This will be the final category_id (subcategory if exists, main if not)
        quantity: stock.quantity?.toString() || '0',
        sold_item_qty: stock.sold_item_qty?.toString() || '0',
        low_stock_threshold: stock.low_stock_threshold?.toString() || '10',
      });
    } catch (err) {
      console.error('Error setting up edit stock:', err);
      setError('Failed to initialize edit mode: ' + (err.message || 'Unknown error'));
      setEditingStockId(null);
      setEditingStockData(null);
    }
  };

  const handleSaveStock = async (stockId) => {
    if (!editingStockData) return;
    
    try {
      // category_id is already set correctly (either subcategory_id or main_category_id)
      await adminAPI.updateStockItem(stockId, {
        item_name: editingStockData.item_name || '',
        vendor_seller_id: parseInt(editingStockData.vendor_seller_id, 10),
        category_id: parseInt(editingStockData.category_id, 10), // Final category_id (subcategory if selected, main if not)
        quantity: parseInt(editingStockData.quantity, 10),
        sold_item_qty: parseInt(editingStockData.sold_item_qty, 10),
        low_stock_threshold: parseInt(editingStockData.low_stock_threshold, 10),
      });
      setSuccessMessage('Stock item updated successfully');
      setEditingStockId(null);
      setEditingStockData(null);
      fetchStockManagement();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update stock item: ' + (err.response?.data?.message || err.message));
      console.error('Error updating stock item:', err);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleMainCategoryChange = (mainCategoryId) => {
    const mainCategory = stockManagementMainCategories.find(cat => cat.id.toString() === mainCategoryId);
    const mainCategoryName = mainCategory?.name || '';
    
    // Reset subcategory selection when main category changes
    setEditingStockData({
      ...editingStockData,
      main_category_id: mainCategoryId,
      category_id: mainCategoryId, // Default to main category, user can select subcategory
    });
  };

  const handleSubcategoryChange = (subcategoryId) => {
    // If subcategory is selected, use it; otherwise use main category
    const finalCategoryId = subcategoryId || editingStockData.main_category_id;
    setEditingStockData({
      ...editingStockData,
      category_id: finalCategoryId,
    });
  };

  const handleCancelEditStock = () => {
    setEditingStockId(null);
    setEditingStockData(null);
  };

  const handleDeleteStock = async (stockId) => {
    if (!window.confirm('Are you sure you want to delete this stock item?')) {
      return;
    }
    try {
      await adminAPI.deleteStockItem(stockId);
      setSuccessMessage('Stock item deleted successfully');
      fetchStockManagement();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to delete stock item: ' + (err.response?.data?.message || err.message));
      console.error('Error deleting stock item:', err);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleDismissStockAlert = async (alertId) => {
    try {
      await adminAPI.markStockAlertRead(alertId);
      fetchStockManagement();
    } catch (err) {
      console.error('Error marking alert as read:', err);
    }
  };

  const handleDismissAllAlerts = () => {
    lowStockAlerts.forEach(alert => {
      handleDismissStockAlert(alert.id);
    });
    setShowStockAlert(false);
  };

  const fetchLiveChats = async () => {
    setLiveChatsLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getLiveChats();
      const chats = response.data || [];
      setLiveChats(chats);
      if (!selectedLiveChat && chats.length > 0) {
        const firstChat = chats[0];
        setSelectedLiveChat(firstChat);
        await fetchChatMessages(firstChat.id);
        await markChatAsRead(firstChat.id);
        setLiveChats((prev) =>
          prev.map((chat) => (chat.id === firstChat.id ? { ...chat, unread_admin_count: 0 } : chat))
        );
      } else if (selectedLiveChat) {
        const updated = chats.find((chat) => chat.id === selectedLiveChat.id);
        if (updated) {
          setSelectedLiveChat(updated);
        }
      } else if (chats.length === 0) {
        setSelectedLiveChat(null);
        setChatMessages([]);
      }
    } catch (err) {
      setError('Failed to fetch live chats: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching live chats:', err);
      setTimeout(() => setError(null), 5000);
    } finally {
      setLiveChatsLoading(false);
    }
  };

  const handleSelectLiveChat = async (chat) => {
    if (!chat) return;
    setSelectedLiveChat(chat);
    await fetchChatMessages(chat.id);
    await markChatAsRead(chat.id);
    setLiveChats((prev) =>
      prev.map((item) =>
        item.id === chat.id ? { ...item, unread_admin_count: 0 } : item
      )
    );
  };

  const fetchChatMessages = async (chatId) => {
    setChatMessagesLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getLiveChatMessages(chatId);
      setChatMessages(response.data || []);
    } catch (err) {
      setError('Failed to fetch chat messages: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching chat messages:', err);
      setTimeout(() => setError(null), 5000);
    } finally {
      setChatMessagesLoading(false);
    }
  };

  const markChatAsRead = async (chatId) => {
    try {
      await adminAPI.markLiveChatRead(chatId);
    } catch (err) {
      console.error('Error marking chat as read:', err);
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!selectedLiveChat || !newChatMessage.trim()) return;
    try {
      const response = await adminAPI.sendLiveChatMessage(selectedLiveChat.id, {
        message: newChatMessage,
        sender_type: 'admin',
      });
      setChatMessages((prev) => [...prev, response.data]);
      setNewChatMessage('');
      fetchLiveChats();
    } catch (err) {
      setError('Failed to send message: ' + (err.response?.data?.message || err.message));
      console.error('Error sending message:', err);
      setTimeout(() => setError(null), 5000);
    }
  };

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
        category: ad.category?.category || 'N/A',
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

  // Handle edit ad - start inline editing
  const handleEditAd = (ad) => {
    setEditingAdId(ad.id);
    setEditingAdData({
      title: ad.title,
      description: ad.description,
      price: ad.price,
    });
  };

  // Handle save ad - save changes
  const handleSaveAd = async (adId) => {
    try {
      await adminAPI.updateAd(adId, {
        title: editingAdData.title,
        description: editingAdData.description,
        price: parseFloat(editingAdData.price),
      });
      setSuccessMessage('Ad updated successfully');
      setEditingAdId(null);
      setEditingAdData(null);
      fetchAds(); // Refresh the list
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update ad: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 5000);
    }
  };

  // Handle cancel edit ad
  const handleCancelEditAd = () => {
    setEditingAdId(null);
    setEditingAdData(null);
  };

  // Handle Post Ad form submission
  const handlePostAdSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createAd({
        title: postAdFormData.title,
        description: postAdFormData.description,
        price: parseFloat(postAdFormData.price),
        category_id: parseInt(postAdFormData.category_id),
        user_id: parseInt(postAdFormData.user_id),
        posted_by: 'admin',
      });
      
      setSuccessMessage('Ad created successfully');
      setShowPostAdForm(false);
      setPostAdFormData({
        title: '',
        description: '',
        price: '',
        category_id: '',
        user_id: '',
      });
      fetchAds(); // Refresh the ads list
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to create ad: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 5000);
    }
  };

  // Handle Add Location form submission
  const handleAddLocationSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createLocation({
        province: addLocationFormData.province,
        district: addLocationFormData.district,
        local_level: addLocationFormData.localLevel,
        local_level_type: addLocationFormData.localLevelType,
        // ward_id is automatically set by the backend to match id
      });
      
      setSuccessMessage('Location created successfully');
      setShowAddLocationForm(false);
      setAddLocationFormData({
        province: '',
        district: '',
        localLevel: '',
        localLevelType: 'Municipality',
      });
      fetchLocations(); // Refresh the locations list
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to create location: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 5000);
    }
  };

  // Handle Add Category form submission
  const handleAddCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createCategory({
        categoryName: addCategoryFormData.categoryName,
        subcategoryName: addCategoryFormData.subcategoryName || null,
      });
      
      setSuccessMessage('Category created successfully');
      setShowAddCategoryForm(false);
      setAddCategoryFormData({
        categoryName: '',
        subcategoryName: '',
      });
      fetchCategoryManagement(); // Refresh the categories list
      fetchCategories(); // Also refresh the public categories for dropdowns
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to create category: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 5000);
    }
  };

  // Handle Start Auction form submission
  const handleStartAuctionSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createAuction({
        user_id: parseInt(auctionFormData.user_id),
        category_id: parseInt(auctionFormData.category_id),
        title: auctionFormData.title,
        description: auctionFormData.description,
        starting_price: parseFloat(auctionFormData.starting_price),
        reserve_price: auctionFormData.reserve_price ? parseFloat(auctionFormData.reserve_price) : null,
        buy_now_price: auctionFormData.buy_now_price ? parseFloat(auctionFormData.buy_now_price) : null,
        current_bid_price: parseFloat(auctionFormData.starting_price), // Start with starting price
        start_date_time: auctionFormData.start_date_time,
        end_date_time: auctionFormData.end_date_time,
      });
      
      setSuccessMessage('Auction created successfully');
      setShowAuctionForm(false);
      setAuctionFormData({
        user_id: '',
        category_id: '',
        title: '',
        description: '',
        starting_price: '',
        reserve_price: '',
        buy_now_price: '',
        start_date_time: '',
        end_date_time: '',
      });
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to create auction: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 5000);
    }
  };

  // Fetch locations data
  useEffect(() => {
    if (activeSection === 'location-address') {
      fetchLocations();
    }
  }, [activeSection]);

  // Fetch deliveries data
  useEffect(() => {
    if (activeSection === 'delivery-management') {
      fetchDeliveries();
      fetchPurchaseVerifications();
    }
  }, [activeSection]);

  // Fetch auction-related data
  useEffect(() => {
    if (activeSection === 'auction-management') {
      fetchBiddingHistory();
      fetchBidWinners();
      fetchBlockedUsers();
      fetchBiddingTracking();
    }
  }, [activeSection]);

  // Fetch category management data
  useEffect(() => {
    if (activeSection === 'category-management') {
      fetchCategoryManagement();
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

  // Handle edit location - start inline editing
  const handleEditLocation = (location) => {
    setEditingLocationId(location.id);
    setEditingLocationData({
      province: location.province,
      district: location.district,
      localLevel: location.localLevel,
      localLevelType: location.localLevelType,
    });
  };

  // Handle save location - save changes
  const handleSaveLocation = async (locationId) => {
    try {
      await adminAPI.updateLocation(locationId, {
        province: editingLocationData.province,
        district: editingLocationData.district,
        local_level: editingLocationData.localLevel,
        local_level_type: editingLocationData.localLevelType,
      });
      setSuccessMessage('Location updated successfully');
      setEditingLocationId(null);
      setEditingLocationData(null);
      fetchLocations(); // Refresh the list
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update location: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 5000);
    }
  };

  // Handle cancel edit location
  const handleCancelEditLocation = () => {
    setEditingLocationId(null);
    setEditingLocationData(null);
  };

  // Fetch deliveries
  const fetchDeliveries = async () => {
    setDeliveryLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getDeliveries();
      const deliveriesData = response.data || [];
      
      const transformedDeliveries = deliveriesData.map(delivery => ({
        id: delivery.id,
        sellerVendor: delivery.seller_vendor?.name || 'N/A',
        item: delivery.item,
        price: parseFloat(delivery.price) || 0,
        deliveryStatus: delivery.delivery_status,
        pickupDate: delivery.pickup_date
      }));
      
      setDeliveryData(transformedDeliveries);
    } catch (err) {
      setError('Failed to fetch deliveries: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching deliveries:', err);
    } finally {
      setDeliveryLoading(false);
    }
  };

  // Handle edit delivery
  const handleEditDelivery = (delivery) => {
    setEditingDeliveryId(delivery.id);
    setEditingDeliveryData({
      item: delivery.item,
      price: delivery.price,
      deliveryStatus: delivery.deliveryStatus,
      pickupDate: delivery.pickupDate
    });
  };

  // Handle save delivery
  const handleSaveDelivery = async (deliveryId) => {
    try {
      await adminAPI.updateDelivery(deliveryId, {
        item: editingDeliveryData.item,
        price: editingDeliveryData.price,
        delivery_status: editingDeliveryData.deliveryStatus,
        pickup_date: editingDeliveryData.pickupDate,
      });
      setSuccessMessage('Delivery updated successfully');
      setEditingDeliveryId(null);
      setEditingDeliveryData(null);
      fetchDeliveries();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update delivery: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 5000);
    }
  };

  // Handle cancel edit delivery
  const handleCancelEditDelivery = () => {
    setEditingDeliveryId(null);
    setEditingDeliveryData(null);
  };

  // Handle delete delivery
  const handleDeleteDelivery = async (id) => {
    if (!window.confirm('Are you sure you want to delete this delivery?')) {
      return;
    }
    
    try {
      await adminAPI.deleteDelivery(id);
      setSuccessMessage('Delivery deleted successfully');
      fetchDeliveries();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to delete delivery: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 5000);
    }
  };

  // Fetch purchase verifications
  const fetchPurchaseVerifications = async () => {
    setPurchaseVerificationLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getPurchaseVerifications();
      const purchaseData = response.data || [];
      
      const transformedPurchases = purchaseData.map(purchase => ({
        id: purchase.id,
        buyerUser: purchase.buyer_user?.name || 'N/A',
        item: purchase.item,
        price: parseFloat(purchase.price) || 0,
        purchaseDate: purchase.purchase_date,
        verificationCode: purchase.verification_code,
        deliveryStatus: purchase.delivery_status
      }));
      
      setPurchaseVerificationData(transformedPurchases);
    } catch (err) {
      setError('Failed to fetch purchase verifications: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching purchase verifications:', err);
    } finally {
      setPurchaseVerificationLoading(false);
    }
  };

  // Handle edit purchase verification
  const handleEditPurchaseVerification = (purchase) => {
    setEditingPurchaseVerificationId(purchase.id);
    setEditingPurchaseVerificationData({
      item: purchase.item,
      price: purchase.price,
      purchaseDate: purchase.purchaseDate,
      verificationCode: purchase.verificationCode,
      deliveryStatus: purchase.deliveryStatus
    });
  };

  // Handle save purchase verification
  const handleSavePurchaseVerification = async (purchaseId) => {
    try {
      await adminAPI.updatePurchaseVerification(purchaseId, {
        item: editingPurchaseVerificationData.item,
        price: editingPurchaseVerificationData.price,
        purchase_date: editingPurchaseVerificationData.purchaseDate,
        verification_code: editingPurchaseVerificationData.verificationCode,
        delivery_status: editingPurchaseVerificationData.deliveryStatus,
      });
      setSuccessMessage('Purchase verification updated successfully');
      setEditingPurchaseVerificationId(null);
      setEditingPurchaseVerificationData(null);
      fetchPurchaseVerifications();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update purchase verification: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 5000);
    }
  };

  // Handle cancel edit purchase verification
  const handleCancelEditPurchaseVerification = () => {
    setEditingPurchaseVerificationId(null);
    setEditingPurchaseVerificationData(null);
  };

  // Handle delete purchase verification
  const handleDeletePurchaseVerification = async (id) => {
    if (!window.confirm('Are you sure you want to delete this purchase verification?')) {
      return;
    }
    
    try {
      await adminAPI.deletePurchaseVerification(id);
      setSuccessMessage('Purchase verification deleted successfully');
      fetchPurchaseVerifications();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to delete purchase verification: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 5000);
    }
  };

  // Fetch bidding history
  const fetchBiddingHistory = async () => {
    setBiddingHistoryLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getBiddingHistory();
      const biddingData = response.data || [];
      
      const transformedBidding = biddingData.map(bid => ({
        id: bid.id,
        userName: bid.user?.name || 'N/A',
        itemName: bid.item_name,
        reservePrice: parseFloat(bid.reserve_price) || 0,
        buyNowPrice: parseFloat(bid.buy_now_price) || 0,
        paymentMethod: bid.payment_method,
        startDateTime: bid.start_date_time
      }));
      
      setBiddingHistoryData(transformedBidding);
    } catch (err) {
      setError('Failed to fetch bidding history: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching bidding history:', err);
    } finally {
      setBiddingHistoryLoading(false);
    }
  };

  // Handle edit bidding history
  const handleEditBiddingHistory = (bid) => {
    setEditingBiddingHistoryId(bid.id);
    setEditingBiddingHistoryData({
      itemName: bid.itemName,
      reservePrice: bid.reservePrice,
      buyNowPrice: bid.buyNowPrice,
      paymentMethod: bid.paymentMethod,
      startDateTime: bid.startDateTime
    });
  };

  // Handle save bidding history
  const handleSaveBiddingHistory = async (bidId) => {
    try {
      await adminAPI.updateBiddingHistory(bidId, {
        item_name: editingBiddingHistoryData.itemName,
        reserve_price: editingBiddingHistoryData.reservePrice,
        buy_now_price: editingBiddingHistoryData.buyNowPrice,
        payment_method: editingBiddingHistoryData.paymentMethod,
        start_date_time: editingBiddingHistoryData.startDateTime,
      });
      setSuccessMessage('Bidding history updated successfully');
      setEditingBiddingHistoryId(null);
      setEditingBiddingHistoryData(null);
      fetchBiddingHistory();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update bidding history: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 5000);
    }
  };

  // Handle cancel edit bidding history
  const handleCancelEditBiddingHistory = () => {
    setEditingBiddingHistoryId(null);
    setEditingBiddingHistoryData(null);
  };

  // Handle delete bidding history
  const handleDeleteBiddingHistory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bidding history?')) {
      return;
    }
    
    try {
      await adminAPI.deleteBiddingHistory(id);
      setSuccessMessage('Bidding history deleted successfully');
      fetchBiddingHistory();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to delete bidding history: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 5000);
    }
  };

  // Fetch bid winners
  const fetchBidWinners = async () => {
    setBidWinnerLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getBidWinners();
      const winnersData = response.data || [];
      
      const transformedWinners = winnersData.map(winner => ({
        id: winner.id,
        userName: winner.user?.name || 'N/A',
        biddingItem: winner.bidding_item,
        bidStartDate: winner.bid_start_date,
        bidWonDate: winner.bid_won_date,
        paymentProceedDate: winner.payment_proceed_date,
        totalPayment: parseFloat(winner.total_payment) || 0,
        sellerName: winner.seller?.name || 'N/A',
        emailSent: winner.congratulation_email_sent ? 'Yes' : 'No'
      }));
      
      setBidWinnerData(transformedWinners);
    } catch (err) {
      setError('Failed to fetch bid winners: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching bid winners:', err);
    } finally {
      setBidWinnerLoading(false);
    }
  };

  // Handle edit bid winner
  const handleEditBidWinner = (winner) => {
    setEditingBidWinnerId(winner.id);
    setEditingBidWinnerData({
      biddingItem: winner.biddingItem,
      bidStartDate: winner.bidStartDate,
      bidWonDate: winner.bidWonDate,
      paymentProceedDate: winner.paymentProceedDate,
      totalPayment: winner.totalPayment,
      emailSent: winner.emailSent === 'Yes'
    });
  };

  // Handle save bid winner
  const handleSaveBidWinner = async (winnerId) => {
    try {
      await adminAPI.updateBidWinner(winnerId, {
        bidding_item: editingBidWinnerData.biddingItem,
        bid_start_date: editingBidWinnerData.bidStartDate,
        bid_won_date: editingBidWinnerData.bidWonDate,
        payment_proceed_date: editingBidWinnerData.paymentProceedDate,
        total_payment: editingBidWinnerData.totalPayment,
        congratulation_email_sent: editingBidWinnerData.emailSent,
      });
      setSuccessMessage('Bid winner updated successfully');
      setEditingBidWinnerId(null);
      setEditingBidWinnerData(null);
      fetchBidWinners();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update bid winner: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 5000);
    }
  };

  // Handle cancel edit bid winner
  const handleCancelEditBidWinner = () => {
    setEditingBidWinnerId(null);
    setEditingBidWinnerData(null);
  };

  // Handle delete bid winner
  const handleDeleteBidWinner = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bid winner?')) {
      return;
    }
    
    try {
      await adminAPI.deleteBidWinner(id);
      setSuccessMessage('Bid winner deleted successfully');
      fetchBidWinners();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to delete bid winner: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 5000);
    }
  };

  // Fetch blocked users
  const fetchBlockedUsers = async () => {
    setBlockedUserLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getBlockedUsers();
      const blockedData = response.data || [];
      
      const transformedBlocked = blockedData.map(blocked => ({
        id: blocked.id,
        userName: blocked.user?.name || 'N/A',
        email: blocked.email,
        address: blocked.address,
        dateToBlock: blocked.date_to_block,
        reasonToBlock: blocked.reason_to_block
      }));
      
      setBlockedUserData(transformedBlocked);
    } catch (err) {
      setError('Failed to fetch blocked users: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching blocked users:', err);
    } finally {
      setBlockedUserLoading(false);
    }
  };

  // Handle edit blocked user
  const handleEditBlockedUser = (user) => {
    setEditingBlockedUserId(user.id);
    setEditingBlockedUserData({
      email: user.email,
      address: user.address,
      dateToBlock: user.dateToBlock,
      reasonToBlock: user.reasonToBlock
    });
  };

  // Handle save blocked user
  const handleSaveBlockedUser = async (userId) => {
    try {
      await adminAPI.updateBlockedUser(userId, {
        email: editingBlockedUserData.email,
        address: editingBlockedUserData.address,
        date_to_block: editingBlockedUserData.dateToBlock,
        reason_to_block: editingBlockedUserData.reasonToBlock,
      });
      setSuccessMessage('Blocked user updated successfully');
      setEditingBlockedUserId(null);
      setEditingBlockedUserData(null);
      fetchBlockedUsers();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update blocked user: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 5000);
    }
  };

  // Handle cancel edit blocked user
  const handleCancelEditBlockedUser = () => {
    setEditingBlockedUserId(null);
    setEditingBlockedUserData(null);
  };

  // Handle delete blocked user
  const handleDeleteBlockedUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blocked user?')) {
      return;
    }
    
    try {
      await adminAPI.deleteBlockedUser(id);
      setSuccessMessage('Blocked user deleted successfully');
      fetchBlockedUsers();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to delete blocked user: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 5000);
    }
  };

  // Fetch bidding tracking
  const fetchBiddingTracking = async () => {
    setBiddingTrackingLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getBiddingTracking();
      const trackingData = response.data || [];
      
      const transformedTracking = trackingData.map(tracking => ({
        id: tracking.id,
        bidWinnerName: tracking.bid_winner_name,
        bidWonItemName: tracking.bid_won_item_name,
        paymentStatus: tracking.payment_status,
        pickupStatus: tracking.pickup_status,
        completeProcessDateTime: tracking.complete_process_date_time,
        alertSent: tracking.alert_sent ? 'Yes' : 'No'
      }));
      
      setBiddingTrackingData(transformedTracking);
    } catch (err) {
      setError('Failed to fetch bidding tracking: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching bidding tracking:', err);
    } finally {
      setBiddingTrackingLoading(false);
    }
  };

  // Handle edit bidding tracking
  const handleEditBiddingTracking = (tracking) => {
    setEditingBiddingTrackingId(tracking.id);
    setEditingBiddingTrackingData({
      bidWinnerName: tracking.bidWinnerName,
      bidWonItemName: tracking.bidWonItemName,
      paymentStatus: tracking.paymentStatus,
      pickupStatus: tracking.pickupStatus,
      completeProcessDateTime: tracking.completeProcessDateTime,
      alertSent: tracking.alertSent === 'Yes'
    });
  };

  // Handle save bidding tracking
  const handleSaveBiddingTracking = async (trackingId) => {
    try {
      await adminAPI.updateBiddingTracking(trackingId, {
        bid_winner_name: editingBiddingTrackingData.bidWinnerName,
        bid_won_item_name: editingBiddingTrackingData.bidWonItemName,
        payment_status: editingBiddingTrackingData.paymentStatus,
        pickup_status: editingBiddingTrackingData.pickupStatus,
        complete_process_date_time: editingBiddingTrackingData.completeProcessDateTime,
        alert_sent: editingBiddingTrackingData.alertSent,
      });
      setSuccessMessage('Bidding tracking updated successfully');
      setEditingBiddingTrackingId(null);
      setEditingBiddingTrackingData(null);
      fetchBiddingTracking();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update bidding tracking: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 5000);
    }
  };

  // Handle cancel edit bidding tracking
  const handleCancelEditBiddingTracking = () => {
    setEditingBiddingTrackingId(null);
    setEditingBiddingTrackingData(null);
  };

  // Handle delete bidding tracking
  const handleDeleteBiddingTracking = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bidding tracking?')) {
      return;
    }
    
    try {
      await adminAPI.deleteBiddingTracking(id);
      setSuccessMessage('Bidding tracking deleted successfully');
      fetchBiddingTracking();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to delete bidding tracking: ' + (err.response?.data?.message || err.message));
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
      // For search bar dropdown: show only unique main categories (from category column in database)
      const uniqueMainCategories = response.data.map((category) => ({
        id: category.id,
        name: category.name, // Main category name from database
      }));
      
      // For forms (Post Ad, Auction): flatten to include both main categories and subcategories
      const flattenedCategoriesForForms = [];
      response.data.forEach((category) => {
        // Add main category
        flattenedCategoriesForForms.push({
          id: category.id,
          name: category.name,
        });
        // Add subcategories
        if (category.subcategories && category.subcategories.length > 0) {
          category.subcategories.forEach((subcategory) => {
            flattenedCategoriesForForms.push({
              id: subcategory.id,
              name: `${category.name} - ${subcategory.name}`,
            });
          });
        }
      });
      
      // Set unique main categories for search bar
      setCategories(uniqueMainCategories);
      // Set flattened categories for forms
      setFlattenedCategories(flattenedCategoriesForForms);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch category management data from admin API
  const fetchCategoryManagement = async () => {
    setCategoryManagementLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getCategories();
      const categoriesData = response.data || [];
      
      // Transform to match expected format
      const transformedCategories = categoriesData.map(item => ({
        id: item.subcategoryId || item.categoryId,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        subcategoryId: item.subcategoryId,
        subcategoryName: item.subcategoryName || ''
      }));
      
      setCategoryManagementData(transformedCategories);
    } catch (err) {
      setError('Failed to fetch categories: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching categories:', err);
    } finally {
      setCategoryManagementLoading(false);
    }
  };

  // Handle edit category
  const handleEditCategory = (category) => {
    setEditingCategoryId(category.id);
    setEditingCategoryData({
      categoryName: category.categoryName,
      subcategoryName: category.subcategoryName
    });
  };

  // Handle save category
  const handleSaveCategory = async (categoryId) => {
    try {
      const category = categoryManagementData.find(c => c.id === categoryId);
      
      // Update both category and subcategory
      await adminAPI.updateCategory(categoryId, {
        categoryName: editingCategoryData.categoryName,
        subcategoryName: editingCategoryData.subcategoryName || null,
      });
      
      setSuccessMessage('Category updated successfully');
      setEditingCategoryId(null);
      setEditingCategoryData(null);
      fetchCategoryManagement();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to update category: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 5000);
    }
  };

  // Handle cancel edit category
  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryData(null);
  };

  // Handle delete category
  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category/subcategory?')) {
      return;
    }
    
    try {
      await adminAPI.deleteCategory(id);
      setSuccessMessage('Category deleted successfully');
      fetchCategoryManagement();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Failed to delete category: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(null), 5000);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchLocationHierarchy();
  }, []);

  // Fetch location hierarchy from database for search bar
  const fetchLocationHierarchy = async () => {
    try {
      const response = await window.axios.get('/api/locations');
      setLocationData(response.data);
    } catch (error) {
      console.error('Error fetching location hierarchy:', error);
    }
  };

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
    { id: 'job-management', label: 'Job Management' },
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
              <div className="flex justify-end mb-6">
                <Button onClick={() => setShowPostAdForm(!showPostAdForm)}>Post Ad</Button>
              </div>

              {/* Post Ad Form - appears when Post Ad is clicked */}
              <div
                className={`mb-6 transition-all duration-400 ease-in-out ${
                  showPostAdForm 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 -translate-y-4 pointer-events-none'
                }`}
                style={{
                  transition: 'opacity 0.4s ease-in-out, transform 0.4s ease-in-out'
                }}
              >
                {showPostAdForm && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="text-md font-semibold text-[hsl(var(--foreground))] mb-4">Create New Ad</h3>
                      <form onSubmit={handlePostAdSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Title *</label>
                            <Input
                              value={postAdFormData.title}
                              onChange={(e) => setPostAdFormData({...postAdFormData, title: e.target.value})}
                              className="w-full"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Price *</label>
                            <Input
                              type="number"
                              value={postAdFormData.price}
                              onChange={(e) => setPostAdFormData({...postAdFormData, price: e.target.value})}
                              className="w-full"
                              min="0"
                              step="0.01"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Description *</label>
                          <textarea
                            value={postAdFormData.description}
                            onChange={(e) => setPostAdFormData({...postAdFormData, description: e.target.value})}
                            className="w-full min-h-[100px] px-3 py-2 border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Category *</label>
                            <select
                              value={postAdFormData.category_id}
                              onChange={(e) => setPostAdFormData({...postAdFormData, category_id: e.target.value})}
                              className="w-full px-3 py-2 border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                              required
                            >
                              <option value="">Select Category</option>
                              {flattenedCategories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">User *</label>
                            <select
                              value={postAdFormData.user_id}
                              onChange={(e) => setPostAdFormData({...postAdFormData, user_id: e.target.value})}
                              className="w-full px-3 py-2 border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                              required
                            >
                              <option value="">Select User</option>
                              {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.name} ({user.email})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setShowPostAdForm(false);
                              setPostAdFormData({
                                title: '',
                                description: '',
                                price: '',
                                category_id: '',
                                user_id: '',
                              });
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">Create Ad</Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}
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
                        <p 
                          className="text-sm text-[hsl(var(--foreground))] cursor-pointer hover:text-[hsl(var(--primary))] transition-colors"
                          onClick={() => navigate('/admin/ads-management/user-posted-ads')}
                        >
                          User posted ad total: <span className="font-semibold">{adTotals.userPosted}</span>
                        </p>
                        <p 
                          className="text-sm text-[hsl(var(--foreground))] cursor-pointer hover:text-[hsl(var(--primary))] transition-colors"
                          onClick={() => navigate('/admin/ads-management/vendor-posted-ads')}
                        >
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
                        <Button onClick={() => setShowPostAdForm(!showPostAdForm)}>Post Ad</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Post Ad Form - appears when Post Ad is clicked */}
              <div
                className={`mb-6 transition-all duration-400 ease-in-out ${
                  showPostAdForm 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 -translate-y-4 pointer-events-none'
                }`}
                style={{
                  transition: 'opacity 0.4s ease-in-out, transform 0.4s ease-in-out'
                }}
              >
                {showPostAdForm && (
                  <section>
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="text-md font-semibold text-[hsl(var(--foreground))] mb-4">Create New Ad</h3>
                        <form onSubmit={handlePostAdSubmit} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Title *</label>
                              <Input
                                value={postAdFormData.title}
                                onChange={(e) => setPostAdFormData({...postAdFormData, title: e.target.value})}
                                className="w-full"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Price *</label>
                              <Input
                                type="number"
                                value={postAdFormData.price}
                                onChange={(e) => setPostAdFormData({...postAdFormData, price: e.target.value})}
                                className="w-full"
                                min="0"
                                step="0.01"
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Description *</label>
                            <textarea
                              value={postAdFormData.description}
                              onChange={(e) => setPostAdFormData({...postAdFormData, description: e.target.value})}
                              className="w-full min-h-[100px] px-3 py-2 border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Category *</label>
                              <select
                                value={postAdFormData.category_id}
                                onChange={(e) => setPostAdFormData({...postAdFormData, category_id: e.target.value})}
                                className="w-full px-3 py-2 border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                                required
                              >
                                <option value="">Select Category</option>
                                {categories.map((category) => (
                                  <option key={category.id} value={category.id}>
                                    {category.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">User *</label>
                              <select
                                value={postAdFormData.user_id}
                                onChange={(e) => setPostAdFormData({...postAdFormData, user_id: e.target.value})}
                                className="w-full px-3 py-2 border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                                required
                              >
                                <option value="">Select User</option>
                                {users.map((user) => (
                                  <option key={user.id} value={user.id}>
                                    {user.name} ({user.email})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-6">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                setShowPostAdForm(false);
                                setPostAdFormData({
                                  title: '',
                                  description: '',
                                  price: '',
                                  category_id: '',
                                  user_id: '',
                                });
                              }}
                            >
                              Cancel
                            </Button>
                            <Button type="submit">Create Ad</Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </section>
                )}
              </div>

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
                            <tr key={ad.id} className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] ${editingAdId === ad.id ? 'bg-[hsl(var(--accent))]' : ''}`}>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{index + 1}</td>
                              <td className="p-3 text-sm">
                                {editingAdId === ad.id ? (
                                  <Input
                                    value={editingAdData.title}
                                    onChange={(e) => setEditingAdData({...editingAdData, title: e.target.value})}
                                    className="w-full text-sm"
                                  />
                                ) : (
                                  <span className="font-medium">{ad.title}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{ad.category}</td>
                              <td className="p-3 text-sm max-w-xs">
                                {editingAdId === ad.id ? (
                                  <Input
                                    value={editingAdData.description}
                                    onChange={(e) => setEditingAdData({...editingAdData, description: e.target.value})}
                                    className="w-full text-sm"
                                  />
                                ) : (
                                  <span className="text-[hsl(var(--muted-foreground))] truncate block">{ad.description}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingAdId === ad.id ? (
                                  <Input
                                    type="number"
                                    value={editingAdData.price}
                                    onChange={(e) => setEditingAdData({...editingAdData, price: e.target.value})}
                                    className="w-full text-sm"
                                  />
                                ) : (
                                  <span className="font-semibold">Rs. {ad.price.toLocaleString()}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{ad.views}</td>
                              <td className="p-3 text-sm text-[hsl(var(--muted-foreground))]">{new Date(ad.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                              <td className="p-3 text-sm">
                                <div className="flex gap-2">
                                  {editingAdId === ad.id ? (
                                    <>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleSaveAd(ad.id)}
                                      >
                                        Save
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={handleCancelEditAd}
                                      >
                                        Cancel
                                      </Button>
                                    </>
                                  ) : (
                                    <>
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
                                    </>
                                  )}
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
                        {adsLoading ? (
                          <tr>
                            <td colSpan="9" className="p-4 text-center text-[hsl(var(--muted-foreground))]">
                              Loading ads...
                            </td>
                          </tr>
                        ) : ads.filter(ad => ad.postedBy === 'admin').length === 0 ? (
                          <tr>
                            <td colSpan="9" className="p-4 text-center text-[hsl(var(--muted-foreground))]">
                              No admin posted ads found.
                            </td>
                          </tr>
                        ) : (
                          ads
                            .filter(ad => ad.postedBy === 'admin')
                            .map((ad, index) => (
                              <tr key={ad.id} className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] ${editingAdId === ad.id ? 'bg-[hsl(var(--accent))]' : ''}`}>
                                <td className="p-3 text-sm text-[hsl(var(--foreground))]">{index + 1}</td>
                                <td className="p-3 text-sm">
                                  {editingAdId === ad.id ? (
                                    <Input
                                      value={editingAdData.title}
                                      onChange={(e) => setEditingAdData({...editingAdData, title: e.target.value})}
                                      className="w-full text-sm"
                                    />
                                  ) : (
                                    <span className="font-medium">{ad.title}</span>
                                  )}
                                </td>
                                <td className="p-3 text-sm text-[hsl(var(--foreground))]">{ad.category}</td>
                                <td className="p-3 text-sm max-w-xs">
                                  {editingAdId === ad.id ? (
                                    <Input
                                      value={editingAdData.description}
                                      onChange={(e) => setEditingAdData({...editingAdData, description: e.target.value})}
                                      className="w-full text-sm"
                                    />
                                  ) : (
                                    <span className="text-[hsl(var(--muted-foreground))] truncate block">{ad.description}</span>
                                  )}
                                </td>
                                <td className="p-3 text-sm">
                                  {editingAdId === ad.id ? (
                                    <Input
                                      type="number"
                                      value={editingAdData.price}
                                      onChange={(e) => setEditingAdData({...editingAdData, price: e.target.value})}
                                      className="w-full text-sm"
                                      step="0.01"
                                    />
                                  ) : (
                                    <span className="text-[hsl(var(--foreground))]">Rs. {ad.price.toLocaleString()}</span>
                                  )}
                                </td>
                                <td className="p-3 text-sm text-[hsl(var(--foreground))]">
                                  {ad.date ? new Date(ad.date).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="p-3 text-sm text-[hsl(var(--foreground))]">{ad.views || 0}</td>
                                <td className="p-3 text-sm text-[hsl(var(--foreground))]">No</td>
                                <td className="p-3 text-sm">
                                  {editingAdId === ad.id ? (
                                    <div className="flex gap-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleSaveAd(ad.id)}
                                      >
                                        Save
                                      </Button>
                                      <Button 
                                        variant="destructive" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={handleCancelEditAd}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  ) : (
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
                                  )}
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* User Posted Ads Subsection */}
          {activeSection === 'ads-management' && activeSubsection === 'user-posted-ads' && (
            <section>
              <Card>
                <CardContent className="p-4">
                  <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">User Posted ads</h2>
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
                        {adsLoading ? (
                          <tr>
                            <td colSpan="9" className="p-4 text-center text-[hsl(var(--muted-foreground))]">
                              Loading ads...
                            </td>
                          </tr>
                        ) : ads.filter(ad => ad.postedBy === 'user').length === 0 ? (
                          <tr>
                            <td colSpan="9" className="p-4 text-center text-[hsl(var(--muted-foreground))]">
                              No user posted ads found.
                            </td>
                          </tr>
                        ) : (
                          ads
                            .filter(ad => ad.postedBy === 'user')
                            .map((ad, index) => (
                              <tr key={ad.id} className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] ${editingAdId === ad.id ? 'bg-[hsl(var(--accent))]' : ''}`}>
                                <td className="p-3 text-sm text-[hsl(var(--foreground))]">{index + 1}</td>
                                <td className="p-3 text-sm">
                                  {editingAdId === ad.id ? (
                                    <Input
                                      value={editingAdData.title}
                                      onChange={(e) => setEditingAdData({...editingAdData, title: e.target.value})}
                                      className="w-full text-sm"
                                    />
                                  ) : (
                                    <span className="font-medium">{ad.title}</span>
                                  )}
                                </td>
                                <td className="p-3 text-sm text-[hsl(var(--foreground))]">{ad.category}</td>
                                <td className="p-3 text-sm max-w-xs">
                                  {editingAdId === ad.id ? (
                                    <Input
                                      value={editingAdData.description}
                                      onChange={(e) => setEditingAdData({...editingAdData, description: e.target.value})}
                                      className="w-full text-sm"
                                    />
                                  ) : (
                                    <span className="text-[hsl(var(--muted-foreground))] truncate block">{ad.description}</span>
                                  )}
                                </td>
                                <td className="p-3 text-sm">
                                  {editingAdId === ad.id ? (
                                    <Input
                                      type="number"
                                      value={editingAdData.price}
                                      onChange={(e) => setEditingAdData({...editingAdData, price: e.target.value})}
                                      className="w-full text-sm"
                                      step="0.01"
                                    />
                                  ) : (
                                    <span className="text-[hsl(var(--foreground))]">Rs. {ad.price.toLocaleString()}</span>
                                  )}
                                </td>
                                <td className="p-3 text-sm text-[hsl(var(--foreground))]">
                                  {ad.date ? new Date(ad.date).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="p-3 text-sm text-[hsl(var(--foreground))]">{ad.views || 0}</td>
                                <td className="p-3 text-sm text-[hsl(var(--foreground))]">No</td>
                                <td className="p-3 text-sm">
                                  {editingAdId === ad.id ? (
                                    <div className="flex gap-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleSaveAd(ad.id)}
                                      >
                                        Save
                                      </Button>
                                      <Button 
                                        variant="destructive" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={handleCancelEditAd}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  ) : (
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
                                  )}
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Vendor Posted Ads Subsection */}
          {activeSection === 'ads-management' && activeSubsection === 'vendor-posted-ads' && (
            <section>
              <Card>
                <CardContent className="p-4">
                  <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Vendor Posted ads</h2>
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
                        {adsLoading ? (
                          <tr>
                            <td colSpan="9" className="p-4 text-center text-[hsl(var(--muted-foreground))]">
                              Loading ads...
                            </td>
                          </tr>
                        ) : ads.filter(ad => ad.postedBy === 'vendor').length === 0 ? (
                          <tr>
                            <td colSpan="9" className="p-4 text-center text-[hsl(var(--muted-foreground))]">
                              No vendor posted ads found.
                            </td>
                          </tr>
                        ) : (
                          ads
                            .filter(ad => ad.postedBy === 'vendor')
                            .map((ad, index) => (
                              <tr key={ad.id} className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] ${editingAdId === ad.id ? 'bg-[hsl(var(--accent))]' : ''}`}>
                                <td className="p-3 text-sm text-[hsl(var(--foreground))]">{index + 1}</td>
                                <td className="p-3 text-sm">
                                  {editingAdId === ad.id ? (
                                    <Input
                                      value={editingAdData.title}
                                      onChange={(e) => setEditingAdData({...editingAdData, title: e.target.value})}
                                      className="w-full text-sm"
                                    />
                                  ) : (
                                    <span className="font-medium">{ad.title}</span>
                                  )}
                                </td>
                                <td className="p-3 text-sm text-[hsl(var(--foreground))]">{ad.category}</td>
                                <td className="p-3 text-sm max-w-xs">
                                  {editingAdId === ad.id ? (
                                    <Input
                                      value={editingAdData.description}
                                      onChange={(e) => setEditingAdData({...editingAdData, description: e.target.value})}
                                      className="w-full text-sm"
                                    />
                                  ) : (
                                    <span className="text-[hsl(var(--muted-foreground))] truncate block">{ad.description}</span>
                                  )}
                                </td>
                                <td className="p-3 text-sm">
                                  {editingAdId === ad.id ? (
                                    <Input
                                      type="number"
                                      value={editingAdData.price}
                                      onChange={(e) => setEditingAdData({...editingAdData, price: e.target.value})}
                                      className="w-full text-sm"
                                      step="0.01"
                                    />
                                  ) : (
                                    <span className="text-[hsl(var(--foreground))]">Rs. {ad.price.toLocaleString()}</span>
                                  )}
                                </td>
                                <td className="p-3 text-sm text-[hsl(var(--foreground))]">
                                  {ad.date ? new Date(ad.date).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="p-3 text-sm text-[hsl(var(--foreground))]">{ad.views || 0}</td>
                                <td className="p-3 text-sm text-[hsl(var(--foreground))]">No</td>
                                <td className="p-3 text-sm">
                                  {editingAdId === ad.id ? (
                                    <div className="flex gap-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleSaveAd(ad.id)}
                                      >
                                        Save
                                      </Button>
                                      <Button 
                                        variant="destructive" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={handleCancelEditAd}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  ) : (
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
                                  )}
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {activeSection === 'job-management' && (
            <section className="space-y-6">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Job Categories</h3>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage available job categories.</p>
                    </div>
                    <Button onClick={() => setShowAddJobCategoryForm(!showAddJobCategoryForm)}>
                      {showAddJobCategoryForm ? 'Close Job Category Form' : 'Add Job Category'}
                    </Button>
                  </div>

                  {showAddJobCategoryForm && (
                    <div className="border border-[hsl(var(--border))] rounded-md p-4 bg-[hsl(var(--secondary))]/20">
                      <form onSubmit={handleAddJobCategorySubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Category *</label>
                            <Input
                              value={jobCategoryFormData.category}
                              onChange={(e) => setJobCategoryFormData({ ...jobCategoryFormData, category: e.target.value })}
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Sub Category</label>
                            <Input
                              value={jobCategoryFormData.sub_category}
                              onChange={(e) => setJobCategoryFormData({ ...jobCategoryFormData, sub_category: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Posted Jobs</label>
                            <Input
                              type="number"
                              min="0"
                              value={jobCategoryFormData.posted_job}
                              onChange={(e) => setJobCategoryFormData({ ...jobCategoryFormData, posted_job: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Job Status *</label>
                            <select
                              value={jobCategoryFormData.job_status}
                              onChange={(e) => setJobCategoryFormData({ ...jobCategoryFormData, job_status: e.target.value })}
                              className="w-full px-3 py-2 border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                              required
                            >
                              <option value="draft">Draft</option>
                              <option value="active">Active</option>
                              <option value="closed">Closed</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setShowAddJobCategoryForm(false);
                              setJobCategoryFormData({
                                category: '',
                                sub_category: '',
                                posted_job: 0,
                                job_status: 'draft',
                              });
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">Save</Button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[hsl(var(--border))]">
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">S.N.</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Category</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Sub Category</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Posted Jobs</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Status</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Edit/Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobCategoriesLoading ? (
                          <tr>
                            <td colSpan="6" className="p-4 text-center text-[hsl(var(--muted-foreground))]">Loading job categories...</td>
                          </tr>
                        ) : jobCategories.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="p-4 text-center text-[hsl(var(--muted-foreground))]">No job categories found.</td>
                          </tr>
                        ) : (
                          jobCategories.map((category, index) => (
                            <tr key={category.id} className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] ${editingJobCategoryId === category.id ? 'bg-[hsl(var(--accent))]' : ''}`}>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{index + 1}</td>
                              <td className="p-3 text-sm">
                                {editingJobCategoryId === category.id ? (
                                  <Input
                                    value={editingJobCategoryData.category}
                                    onChange={(e) => setEditingJobCategoryData({ ...editingJobCategoryData, category: e.target.value })}
                                  />
                                ) : (
                                  <span className="font-medium">{category.category}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingJobCategoryId === category.id ? (
                                  <Input
                                    value={editingJobCategoryData.sub_category}
                                    onChange={(e) => setEditingJobCategoryData({ ...editingJobCategoryData, sub_category: e.target.value })}
                                  />
                                ) : (
                                  <span className="text-[hsl(var(--muted-foreground))]">{category.sub_category || '-'}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">
                                {editingJobCategoryId === category.id ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    value={editingJobCategoryData.posted_job}
                                    onChange={(e) => setEditingJobCategoryData({ ...editingJobCategoryData, posted_job: e.target.value })}
                                  />
                                ) : (
                                  category.posted_job
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingJobCategoryId === category.id ? (
                                  <select
                                    value={editingJobCategoryData.job_status}
                                    onChange={(e) => setEditingJobCategoryData({ ...editingJobCategoryData, job_status: e.target.value })}
                                    className="w-full px-3 py-2 border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
                                  >
                                    <option value="draft">Draft</option>
                                    <option value="active">Active</option>
                                    <option value="closed">Closed</option>
                                  </select>
                                ) : (
                                  <span className="capitalize">{category.job_status}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingJobCategoryId === category.id ? (
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => handleSaveJobCategory(category.id)}>Save</Button>
                                    <Button variant="destructive" size="sm" className="h-7 px-2 text-xs" onClick={handleCancelEditJobCategory}>Cancel</Button>
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => handleEditJobCategory(category)}>Edit</Button>
                                    <Button variant="destructive" size="sm" className="h-7 px-2 text-xs" onClick={() => handleDeleteJobCategory(category.id)}>Delete</Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 space-y-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Job Applicants</h3>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">Post new openings or apply on behalf of candidates.</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" onClick={() => setShowPostJobApplicantForm(!showPostJobApplicantForm)}>
                          {showPostJobApplicantForm ? 'Close Post Job Form' : 'Post Job'}
                        </Button>
                        <Button onClick={() => setShowApplyJobForm(!showApplyJobForm)}>
                          {showApplyJobForm ? 'Close Apply Form' : 'Apply Job'}
                        </Button>
                      </div>
                    </div>

                    {showPostJobApplicantForm && (
                      <div className="border border-[hsl(var(--border))] rounded-md p-4 bg-[hsl(var(--secondary))]/20">
                        <h4 className="text-sm font-semibold mb-3 text-[hsl(var(--foreground))]">Post New Job</h4>
                        <form onSubmit={handlePostJobApplicantSubmit} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Job Title *</label>
                              <Input
                                value={jobApplicantFormData.job_title}
                                onChange={(e) => setJobApplicantFormData({ ...jobApplicantFormData, job_title: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Applicant Name *</label>
                              <Input
                                value={jobApplicantFormData.applicant_name}
                                onChange={(e) => setJobApplicantFormData({ ...jobApplicantFormData, applicant_name: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Posted Date</label>
                              <Input
                                type="date"
                                value={jobApplicantFormData.posted_date}
                                onChange={(e) => setJobApplicantFormData({ ...jobApplicantFormData, posted_date: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Expected Salary</label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={jobApplicantFormData.expected_salary}
                                onChange={(e) => setJobApplicantFormData({ ...jobApplicantFormData, expected_salary: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Interview Date</label>
                              <Input
                                type="date"
                                value={jobApplicantFormData.interview_date}
                                onChange={(e) => setJobApplicantFormData({ ...jobApplicantFormData, interview_date: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Job Progress *</label>
                              <select
                                value={jobApplicantFormData.job_progress}
                                onChange={(e) => setJobApplicantFormData({ ...jobApplicantFormData, job_progress: e.target.value })}
                                className="w-full px-3 py-2 border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                                required
                              >
                                <option value="applied">Applied</option>
                                <option value="screening">Screening</option>
                                <option value="interview">Interview</option>
                                <option value="offer">Offer</option>
                                <option value="hired">Hired</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                setShowPostJobApplicantForm(false);
                                setJobApplicantFormData({
                                  job_title: '',
                                  posted_date: '',
                                  expected_salary: '',
                                  applicant_name: '',
                                  interview_date: '',
                                  job_progress: 'applied',
                                });
                              }}
                            >
                              Cancel
                            </Button>
                            <Button type="submit">Submit</Button>
                          </div>
                        </form>
                      </div>
                    )}

                    {showApplyJobForm && (
                      <div className="border border-[hsl(var(--border))] rounded-md p-4 bg-[hsl(var(--secondary))]/20">
                        <h4 className="text-sm font-semibold mb-3 text-[hsl(var(--foreground))]">Apply for Job (Admin)</h4>
                        <form onSubmit={handleApplyJobSubmit} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Job Title *</label>
                              <Input
                                value={applyJobFormData.job_title}
                                onChange={(e) => setApplyJobFormData({ ...applyJobFormData, job_title: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Applicant Name *</label>
                              <Input
                                value={applyJobFormData.applicant_name}
                                onChange={(e) => setApplyJobFormData({ ...applyJobFormData, applicant_name: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Expected Salary</label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={applyJobFormData.expected_salary}
                                onChange={(e) => setApplyJobFormData({ ...applyJobFormData, expected_salary: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Application Date</label>
                              <Input
                                type="date"
                                value={applyJobFormData.posted_date}
                                onChange={(e) => setApplyJobFormData({ ...applyJobFormData, posted_date: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Interview Date</label>
                              <Input
                                type="date"
                                value={applyJobFormData.interview_date}
                                onChange={(e) => setApplyJobFormData({ ...applyJobFormData, interview_date: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Job Progress *</label>
                              <select
                                value={applyJobFormData.job_progress}
                                onChange={(e) => setApplyJobFormData({ ...applyJobFormData, job_progress: e.target.value })}
                                className="w-full px-3 py-2 border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                                required
                              >
                                <option value="applied">Applied</option>
                                <option value="screening">Screening</option>
                                <option value="interview">Interview</option>
                                <option value="offer">Offer</option>
                                <option value="hired">Hired</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                setShowApplyJobForm(false);
                                setApplyJobFormData({
                                  job_title: '',
                                  applicant_name: '',
                                  expected_salary: '',
                                  posted_date: '',
                                  interview_date: '',
                                  job_progress: 'applied',
                                });
                              }}
                            >
                              Cancel
                            </Button>
                            <Button type="submit">Apply</Button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[hsl(var(--border))]">
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">S.N.</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Job Title</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Applicant</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Posted Date</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Expected Salary</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Interview Date</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Progress</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Edit/Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobApplicantsLoading ? (
                          <tr>
                            <td colSpan="8" className="p-4 text-center text-[hsl(var(--muted-foreground))]">Loading job applicants...</td>
                          </tr>
                        ) : jobApplicants.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="p-4 text-center text-[hsl(var(--muted-foreground))]">No job applicants found.</td>
                          </tr>
                        ) : (
                          jobApplicants.map((applicant, index) => (
                            <tr key={applicant.id} className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] ${editingJobApplicantId === applicant.id ? 'bg-[hsl(var(--accent))]' : ''}`}>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{index + 1}</td>
                              <td className="p-3 text-sm">
                                {editingJobApplicantId === applicant.id ? (
                                  <Input
                                    value={editingJobApplicantData.job_title}
                                    onChange={(e) => setEditingJobApplicantData({ ...editingJobApplicantData, job_title: e.target.value })}
                                  />
                                ) : (
                                  <span className="font-medium">{applicant.job_title}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingJobApplicantId === applicant.id ? (
                                  <Input
                                    value={editingJobApplicantData.applicant_name}
                                    onChange={(e) => setEditingJobApplicantData({ ...editingJobApplicantData, applicant_name: e.target.value })}
                                  />
                                ) : (
                                  <span className="text-[hsl(var(--muted-foreground))]">{applicant.applicant_name}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">
                                {editingJobApplicantId === applicant.id ? (
                                  <Input
                                    type="date"
                                    value={editingJobApplicantData.posted_date || ''}
                                    onChange={(e) => setEditingJobApplicantData({ ...editingJobApplicantData, posted_date: e.target.value })}
                                  />
                                ) : (
                                  applicant.posted_date ? new Date(applicant.posted_date).toLocaleDateString() : 'N/A'
                                )}
                              </td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">
                                {editingJobApplicantId === applicant.id ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editingJobApplicantData.expected_salary ?? ''}
                                    onChange={(e) => setEditingJobApplicantData({ ...editingJobApplicantData, expected_salary: e.target.value })}
                                  />
                                ) : (
                                  applicant.expected_salary ? `Rs. ${Number(applicant.expected_salary).toLocaleString()}` : '-'
                                )}
                              </td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">
                                {editingJobApplicantId === applicant.id ? (
                                  <Input
                                    type="date"
                                    value={editingJobApplicantData.interview_date || ''}
                                    onChange={(e) => setEditingJobApplicantData({ ...editingJobApplicantData, interview_date: e.target.value })}
                                  />
                                ) : (
                                  applicant.interview_date ? new Date(applicant.interview_date).toLocaleDateString() : '-'
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingJobApplicantId === applicant.id ? (
                                  <select
                                    value={editingJobApplicantData.job_progress}
                                    onChange={(e) => setEditingJobApplicantData({ ...editingJobApplicantData, job_progress: e.target.value })}
                                    className="w-full px-3 py-2 border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
                                  >
                                    <option value="applied">Applied</option>
                                    <option value="screening">Screening</option>
                                    <option value="interview">Interview</option>
                                    <option value="offer">Offer</option>
                                    <option value="hired">Hired</option>
                                    <option value="rejected">Rejected</option>
                                  </select>
                                ) : (
                                  <span className="capitalize">{applicant.job_progress}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingJobApplicantId === applicant.id ? (
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => handleSaveJobApplicant(applicant.id)}>Save</Button>
                                    <Button variant="destructive" size="sm" className="h-7 px-2 text-xs" onClick={handleCancelEditJobApplicant}>Cancel</Button>
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => handleEditJobApplicant(applicant)}>Edit</Button>
                                    <Button variant="destructive" size="sm" className="h-7 px-2 text-xs" onClick={() => handleDeleteJobApplicant(applicant.id)}>Delete</Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {activeSection === 'live-chat' && (
            <section className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Live Chat</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-md font-semibold text-[hsl(var(--foreground))]">Users</h3>
                        <Button variant="ghost" size="sm" onClick={fetchLiveChats}>Refresh</Button>
                      </div>
                      <div className="border border-[hsl(var(--border))] rounded-md h-[420px] overflow-y-auto">
                        <table className="w-full">
                          <thead className="bg-[hsl(var(--secondary))]">
                            <tr>
                              <th className="text-left px-3 py-2 text-sm font-semibold text-[hsl(var(--foreground))]">User</th>
                            </tr>
                          </thead>
                          <tbody>
                            {liveChatsLoading ? (
                              <tr>
                                <td className="px-3 py-4 text-center text-[hsl(var(--muted-foreground))]">Loading chats...</td>
                              </tr>
                            ) : liveChats.length === 0 ? (
                              <tr>
                                <td className="px-3 py-4 text-center text-[hsl(var(--muted-foreground))]">No live chats found.</td>
                              </tr>
                            ) : (
                              liveChats.map((chat) => {
                                const isActive = selectedLiveChat && selectedLiveChat.id === chat.id;
                                return (
                                  <tr
                                    key={chat.id}
                                    className={`cursor-pointer border-b border-[hsl(var(--border))] ${
                                      isActive ? 'bg-[hsl(var(--accent))]' : 'hover:bg-[hsl(var(--accent))]/40'
                                    }`}
                                    onClick={() => handleSelectLiveChat(chat)}
                                  >
                                    <td className="px-3 py-3 text-sm text-[hsl(var(--foreground))] flex items-center justify-between">
                                      <div>
                                        <p className="font-semibold">{chat.user?.name || 'Unknown User'}</p>
                                        <p className="text-[hsl(var(--muted-foreground))] text-xs">
                                          {chat.last_message_at ? new Date(chat.last_message_at).toLocaleString() : 'No messages yet'}
                                        </p>
                                      </div>
                                      {chat.unread_admin_count > 0 && (
                                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded-full">
                                          {chat.unread_admin_count}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="flex flex-col h-full">
                      <h3 className="text-md font-semibold text-[hsl(var(--foreground))] mb-2">Chat</h3>
                      <div className="flex-1 border border-[hsl(var(--border))] rounded-md p-4 flex flex-col h-[420px] bg-[hsl(var(--background))]">
                        {selectedLiveChat ? (
                          <>
                            <div className="mb-3">
                              <p className="font-semibold text-[hsl(var(--foreground))]">{selectedLiveChat.user?.name || 'Unknown User'}</p>
                              <p className="text-sm text-[hsl(var(--muted-foreground))]">{selectedLiveChat.user?.email}</p>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                              {chatMessagesLoading ? (
                                <p className="text-center text-[hsl(var(--muted-foreground))]">Loading messages...</p>
                              ) : chatMessages.length === 0 ? (
                                <p className="text-center text-[hsl(var(--muted-foreground))]">No messages yet.</p>
                              ) : (
                                chatMessages.map((message) => (
                                  <div
                                    key={message.id}
                                    className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                                  >
                                    <div
                                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                                        message.sender_type === 'admin'
                                          ? 'bg-[hsl(var(--primary))] text-white'
                                          : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]'
                                      }`}
                                    >
                                      <p>{message.message}</p>
                                      <span className="block text-[10px] mt-1 opacity-80">
                                        {message.sent_at ? new Date(message.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                      </span>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                            <form className="mt-3 pt-3 border-t border-[hsl(var(--border))]" onSubmit={handleSendChatMessage}>
                              <div className="flex gap-2">
                                <Input
                                  value={newChatMessage}
                                  onChange={(e) => setNewChatMessage(e.target.value)}
                                  placeholder="Type your message..."
                                />
                                <Button type="submit" disabled={!newChatMessage.trim()}>
                                  Send
                                </Button>
                              </div>
                            </form>
                          </>
                        ) : (
                          <div className="flex-1 flex items-center justify-center text-[hsl(var(--muted-foreground))]">
                            Select a user to view the conversation.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {activeSection === 'offer-discount' && (
            <section className="space-y-6">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Offer/Discount Management</h3>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowPostDiscountForm(!showPostDiscountForm)}
                      className="border-black"
                    >
                      Post discount/coupon
                    </Button>
                  </div>

                  {/* Post Discount/Coupon Form */}
                  {showPostDiscountForm && (
                    <div className="border border-[hsl(var(--border))] rounded-md p-4 bg-[hsl(var(--secondary))]/20">
                      <h4 className="text-md font-semibold text-[hsl(var(--foreground))] mb-4">Post Discount/Coupon</h4>
                      <form onSubmit={handlePostDiscountSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Item Name *</label>
                            <Input
                              value={offerFormData.item_name}
                              onChange={(e) => setOfferFormData({...offerFormData, item_name: e.target.value})}
                              className="w-full"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Vendor *</label>
                            <select
                              value={offerFormData.vendor_id}
                              onChange={(e) => setOfferFormData({...offerFormData, vendor_id: e.target.value})}
                              className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
                              required
                            >
                              <option value="">Select Vendor</option>
                              {users.filter(u => u.role === 'user' || u.role === 'vendor').map((user) => (
                                <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Offer % *</label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={offerFormData.offer_percentage}
                              onChange={(e) => setOfferFormData({...offerFormData, offer_percentage: e.target.value})}
                              className="w-full"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Created Date *</label>
                            <Input
                              type="date"
                              value={offerFormData.created_date}
                              onChange={(e) => setOfferFormData({...offerFormData, created_date: e.target.value})}
                              className="w-full"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Valid Until *</label>
                            <Input
                              type="date"
                              value={offerFormData.valid_until}
                              onChange={(e) => setOfferFormData({...offerFormData, valid_until: e.target.value})}
                              className="w-full"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Status</label>
                            <select
                              value={offerFormData.status}
                              onChange={(e) => setOfferFormData({...offerFormData, status: e.target.value})}
                              className="w-full px-3 py-2 border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
                            >
                              <option value="pending">Pending</option>
                              <option value="approved">Approved</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit">Submit</Button>
                          <Button type="button" variant="outline" onClick={() => {
                            setShowPostDiscountForm(false);
                            setOfferFormData({
                              item_name: '',
                              vendor_id: '',
                              offer_percentage: '',
                              created_date: '',
                              valid_until: '',
                              status: 'pending',
                            });
                          }}>Cancel</Button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[hsl(var(--border))]">
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">S.N.</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Item Name</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Vendor</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Offer %</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Created Date</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Valid until</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Status</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Edit/Delete/Approve</th>
                        </tr>
                      </thead>
                      <tbody>
                        {offersLoading ? (
                          <tr>
                            <td colSpan="8" className="p-4 text-center text-[hsl(var(--muted-foreground))]">Loading offers...</td>
                          </tr>
                        ) : offers.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="p-4 text-center text-[hsl(var(--muted-foreground))]">No offers found.</td>
                          </tr>
                        ) : (
                          offers.map((offer, index) => (
                            <tr key={offer.id} className="border-b border-[hsl(var(--border))]">
                              <td className="p-3 text-sm">{index + 1}</td>
                              <td className="p-3 text-sm">
                                {editingOfferId === offer.id ? (
                                  <Input
                                    value={editingOfferData.item_name}
                                    onChange={(e) => setEditingOfferData({...editingOfferData, item_name: e.target.value})}
                                    className="w-full"
                                  />
                                ) : (
                                  offer.item_name
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingOfferId === offer.id ? (
                                  <select
                                    value={editingOfferData.vendor_id}
                                    onChange={(e) => setEditingOfferData({...editingOfferData, vendor_id: e.target.value})}
                                    className="w-full px-2 py-1 border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                                  >
                                    {users.filter(u => u.role === 'user' || u.role === 'vendor').map((user) => (
                                      <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                  </select>
                                ) : (
                                  offer.vendor?.name || 'N/A'
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingOfferId === offer.id ? (
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={editingOfferData.offer_percentage}
                                    onChange={(e) => setEditingOfferData({...editingOfferData, offer_percentage: e.target.value})}
                                    className="w-full"
                                  />
                                ) : (
                                  `${offer.offer_percentage}%`
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingOfferId === offer.id ? (
                                  <Input
                                    type="date"
                                    value={editingOfferData.created_date}
                                    onChange={(e) => setEditingOfferData({...editingOfferData, created_date: e.target.value})}
                                    className="w-full"
                                  />
                                ) : (
                                  offer.created_date ? new Date(offer.created_date).toLocaleDateString() : 'N/A'
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingOfferId === offer.id ? (
                                  <Input
                                    type="date"
                                    value={editingOfferData.valid_until}
                                    onChange={(e) => setEditingOfferData({...editingOfferData, valid_until: e.target.value})}
                                    className="w-full"
                                  />
                                ) : (
                                  offer.valid_until ? new Date(offer.valid_until).toLocaleDateString() : 'N/A'
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingOfferId === offer.id ? (
                                  <select
                                    value={editingOfferData.status}
                                    onChange={(e) => setEditingOfferData({...editingOfferData, status: e.target.value})}
                                    className="w-full px-2 py-1 border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                  </select>
                                ) : (
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    offer.status === 'approved' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {offer.status === 'approved' ? 'Approved' : 'Pending'}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingOfferId === offer.id ? (
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => handleSaveOffer(offer.id)}>Save</Button>
                                    <Button variant="destructive" size="sm" className="h-7 px-2 text-xs" onClick={handleCancelEditOffer}>Cancel</Button>
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => handleEditOffer(offer)}>Edit</Button>
                                    <Button variant="destructive" size="sm" className="h-7 px-2 text-xs" onClick={() => handleDeleteOffer(offer.id)}>Delete</Button>
                                    {offer.status === 'pending' && (
                                      <Button variant="default" size="sm" className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700" onClick={() => handleApproveOffer(offer.id)}>Approve</Button>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4">
                    <a href="#" className="text-sm text-[hsl(var(--primary))] hover:underline">Download report</a>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {activeSection === 'rating-review' && (
            <section className="space-y-6">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Rating Review Management</h3>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[hsl(var(--border))]">
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">S.N.</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">User Name</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Rating</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Rating as Seller</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Rating as Buyer</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Overall rating</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Edit/Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ratingsLoading ? (
                          <tr>
                            <td colSpan="7" className="p-4 text-center text-[hsl(var(--muted-foreground))]">Loading ratings...</td>
                          </tr>
                        ) : ratings.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="p-4 text-center text-[hsl(var(--muted-foreground))]">No ratings found.</td>
                          </tr>
                        ) : (
                          ratings.map((rating, index) => (
                            <tr key={rating.id} className="border-b border-[hsl(var(--border))]">
                              <td className="p-3 text-sm">{index + 1}</td>
                              <td className="p-3 text-sm">
                                {editingRatingId === rating.id ? (
                                  <select
                                    value={editingRatingData.user_id}
                                    onChange={(e) => setEditingRatingData({...editingRatingData, user_id: e.target.value})}
                                    className="w-full px-2 py-1 border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                                  >
                                    {users.map((user) => (
                                      <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                  </select>
                                ) : (
                                  rating.user_name || 'N/A'
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingRatingId === rating.id ? (
                                  <select
                                    value={editingRatingData.rating}
                                    onChange={(e) => setEditingRatingData({...editingRatingData, rating: e.target.value})}
                                    className="w-full px-2 py-1 border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                                  >
                                    <option value="1">1 Star</option>
                                    <option value="2">2 Stars</option>
                                    <option value="3">3 Stars</option>
                                    <option value="4">4 Stars</option>
                                    <option value="5">5 Stars</option>
                                  </select>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <span>{rating.rating}</span>
                                    <span className="text-yellow-500">★</span>
                                  </div>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingRatingId === rating.id ? (
                                  <select
                                    value={editingRatingData.seller_id}
                                    onChange={(e) => setEditingRatingData({...editingRatingData, seller_id: e.target.value})}
                                    className="w-full px-2 py-1 border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                                  >
                                    {users.map((user) => (
                                      <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <span>{rating.rating_as_seller}</span>
                                    <span className="text-yellow-500">★</span>
                                    <span className="text-xs text-[hsl(var(--muted-foreground))] ml-1">({rating.seller_name})</span>
                                  </div>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                <div className="flex items-center gap-1">
                                  <span>{rating.rating_as_buyer}</span>
                                  <span className="text-yellow-500">★</span>
                                </div>
                              </td>
                              <td className="p-3 text-sm">
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold">{rating.overall_rating}</span>
                                  <span className="text-yellow-500">★</span>
                                </div>
                              </td>
                              <td className="p-3 text-sm">
                                {editingRatingId === rating.id ? (
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => handleSaveRating(rating.id)}>Save</Button>
                                    <Button variant="destructive" size="sm" className="h-7 px-2 text-xs" onClick={handleCancelEditRating}>Cancel</Button>
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => handleEditRating(rating)}>Edit</Button>
                                    <Button variant="destructive" size="sm" className="h-7 px-2 text-xs" onClick={() => handleDeleteRating(rating.id)}>Delete</Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {activeSection === 'sales-report' && (
            <section className="space-y-6">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Sales report</h3>
                    </div>
                  </div>

                  {/* Earnings Summary */}
                  <div className="space-y-2 mb-4">
                    <div className="text-sm text-[hsl(var(--foreground))]">
                      Vendor wise total earning: Rs {salesReport?.vendor_wise_total_earning?.toLocaleString() || '0.00'}
                    </div>
                    <div className="text-sm text-[hsl(var(--foreground))]">
                      User wise total earning: Rs {salesReport?.user_wise_total_earning?.toLocaleString() || '0.00'}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[hsl(var(--border))]">
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">S.N.</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Vendor/User name</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Listed Item</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Sold Item</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Earning</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Email</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Total Earning</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Edit/Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesReportLoading ? (
                          <tr>
                            <td colSpan="8" className="p-4 text-center text-[hsl(var(--muted-foreground))]">Loading sales report...</td>
                          </tr>
                        ) : !salesReport?.sales_report || salesReport.sales_report.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="p-4 text-center text-[hsl(var(--muted-foreground))]">No sales data found.</td>
                          </tr>
                        ) : (
                          salesReport.sales_report.map((item, index) => (
                            <tr key={item.id} className="border-b border-[hsl(var(--border))]">
                              <td className="p-3 text-sm">{index + 1}</td>
                              <td className="p-3 text-sm">
                                {editingSalesReportId === item.id ? (
                                  <select
                                    value={editingSalesReportData.user_id}
                                    onChange={(e) => setEditingSalesReportData({...editingSalesReportData, user_id: e.target.value})}
                                    className="w-full px-2 py-1 border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                                  >
                                    {users.map((user) => (
                                      <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                  </select>
                                ) : (
                                  item.name || 'N/A'
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingSalesReportId === item.id ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    value={editingSalesReportData.listed_items}
                                    onChange={(e) => setEditingSalesReportData({...editingSalesReportData, listed_items: e.target.value})}
                                    className="w-full"
                                  />
                                ) : (
                                  item.listed_items || 0
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingSalesReportId === item.id ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    value={editingSalesReportData.sold_items}
                                    onChange={(e) => setEditingSalesReportData({...editingSalesReportData, sold_items: e.target.value})}
                                    className="w-full"
                                  />
                                ) : (
                                  item.sold_items || 0
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingSalesReportId === item.id ? (
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editingSalesReportData.earning}
                                    onChange={(e) => setEditingSalesReportData({...editingSalesReportData, earning: e.target.value})}
                                    className="w-full"
                                  />
                                ) : (
                                  `Rs ${item.earning?.toLocaleString() || '0.00'}`
                                )}
                              </td>
                              <td className="p-3 text-sm">{item.email || 'N/A'}</td>
                              <td className="p-3 text-sm">
                                {editingSalesReportId === item.id ? (
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editingSalesReportData.total_earning}
                                    onChange={(e) => setEditingSalesReportData({...editingSalesReportData, total_earning: e.target.value})}
                                    className="w-full"
                                  />
                                ) : (
                                  <span className="font-semibold">Rs {item.total_earning?.toLocaleString() || '0.00'}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingSalesReportId === item.id ? (
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => handleSaveSalesReport(item.id)}>Save</Button>
                                    <Button variant="destructive" size="sm" className="h-7 px-2 text-xs" onClick={handleCancelEditSalesReport}>Cancel</Button>
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => handleEditSalesReport(item)}>Edit</Button>
                                    <Button variant="destructive" size="sm" className="h-7 px-2 text-xs" onClick={() => handleDeleteSalesReport(item.id)}>Delete</Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4">
                    <a href="#" className="text-sm text-[hsl(var(--primary))] hover:underline">Download report</a>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {activeSection === 'stock-management' && (
            <section className="space-y-6">
              {/* Low Stock Alert Banner */}
              {showStockAlert && lowStockAlerts.length > 0 && (
                <Card className="border-orange-500 bg-orange-50 dark:bg-orange-900/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">⚠️</div>
                        <div>
                          <h3 className="font-semibold text-orange-800 dark:text-orange-200">Low Stock Alert!</h3>
                          <p className="text-sm text-orange-700 dark:text-orange-300">
                            {lowStockAlerts.length} item{lowStockAlerts.length > 1 ? 's' : ''} {lowStockAlerts.length > 1 ? 'are' : 'is'} running low on stock.
                          </p>
                          <ul className="mt-2 text-sm text-orange-700 dark:text-orange-300">
                            {lowStockAlerts.map((alert) => (
                              <li key={alert.id}>
                                • {alert.item_name} (Vendor: {alert.vendor_seller_name}) - Only {alert.quantity} left (Threshold: {alert.threshold})
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDismissAllAlerts}
                          className="text-orange-800 border-orange-300 hover:bg-orange-100 dark:text-orange-200 dark:border-orange-700 dark:hover:bg-orange-900/40"
                        >
                          Dismiss All
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowStockAlert(false)}
                          className="text-orange-800 hover:bg-orange-100 dark:text-orange-200 dark:hover:bg-orange-900/40"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Stock Management</h3>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-[hsl(var(--border))]">
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">S.N.</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Item Name</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Vendor/Seller</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Category/Subcategory</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Quantity</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Sold Item Qty</th>
                          <th className="text-left p-3 text-sm font-semibold text-[hsl(var(--foreground))]">Edit/Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockManagementLoading ? (
                          <tr>
                            <td colSpan="7" className="p-4 text-center text-[hsl(var(--muted-foreground))]">Loading stock management...</td>
                          </tr>
                        ) : stockManagement.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="p-4 text-center text-[hsl(var(--muted-foreground))]">No stock items found.</td>
                          </tr>
                        ) : (
                          stockManagement.map((stock, index) => (
                            <tr 
                              key={stock.id} 
                              className={`border-b border-[hsl(var(--border))] ${
                                stock.is_low_stock ? 'bg-orange-50 dark:bg-orange-900/10' : ''
                              }`}
                            >
                              <td className="p-3 text-sm">{index + 1}</td>
                              <td className="p-3 text-sm">
                                {editingStockId === stock.id && editingStockData ? (
                                  <Input
                                    value={editingStockData.item_name || ''}
                                    onChange={(e) => setEditingStockData({...editingStockData, item_name: e.target.value})}
                                    className="w-full"
                                  />
                                ) : (
                                  <span className={stock.is_low_stock ? 'font-semibold text-orange-600 dark:text-orange-400' : ''}>
                                    {stock.item_name}
                                    {stock.is_low_stock && ' ⚠️'}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingStockId === stock.id && editingStockData ? (
                                  <select
                                    value={editingStockData.vendor_seller_id || ''}
                                    onChange={(e) => setEditingStockData({...editingStockData, vendor_seller_id: e.target.value})}
                                    className="w-full px-2 py-1 border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                                  >
                                    {users.map((user) => (
                                      <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                  </select>
                                ) : (
                                  stock.vendor_seller_name || 'N/A'
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingStockId === stock.id && editingStockData ? (
                                  <div className="flex gap-2">
                                    {/* Main Category Dropdown */}
                                    <select
                                      value={editingStockData.main_category_id || ''}
                                      onChange={(e) => handleMainCategoryChange(e.target.value)}
                                      className="flex-1 px-2 py-1 border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                                    >
                                      <option value="">Select Category</option>
                                      {stockManagementMainCategories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                          {cat.name}
                                        </option>
                                      ))}
                                    </select>
                                    {/* Subcategory Dropdown */}
                                    <select
                                      value={editingStockData.category_id === editingStockData.main_category_id ? '' : (editingStockData.category_id || '')}
                                      onChange={(e) => handleSubcategoryChange(e.target.value)}
                                      className="flex-1 px-2 py-1 border border-[hsl(var(--border))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm"
                                      disabled={!editingStockData.main_category_id}
                                    >
                                      <option value="">Select Subcategory (Optional)</option>
                                      {editingStockData.main_category_id && (() => {
                                        const selectedMainCategory = stockManagementMainCategories.find(
                                          c => c.id.toString() === editingStockData.main_category_id
                                        );
                                        if (!selectedMainCategory) return null;
                                        
                                        // Get all subcategories for the selected main category
                                        const subcategories = stockManagementCategories.get(selectedMainCategory.name) || [];
                                        
                                        return subcategories.length > 0 ? (
                                          subcategories.map((subcat) => (
                                            <option key={subcat.id} value={subcat.id}>
                                              {subcat.name}
                                            </option>
                                          ))
                                        ) : (
                                          <option value="" disabled>No subcategories available</option>
                                        );
                                      })()}
                                    </select>
                                  </div>
                                ) : (
                                  `${stock.category_name || 'N/A'}${stock.subcategory_name ? ` / ${stock.subcategory_name}` : ''}`
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingStockId === stock.id && editingStockData ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    value={editingStockData.quantity || ''}
                                    onChange={(e) => setEditingStockData({...editingStockData, quantity: e.target.value})}
                                    className="w-full"
                                  />
                                ) : (
                                  <span className={stock.is_low_stock ? 'font-semibold text-orange-600 dark:text-orange-400' : ''}>
                                    {stock.quantity}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingStockId === stock.id && editingStockData ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    value={editingStockData.sold_item_qty || ''}
                                    onChange={(e) => setEditingStockData({...editingStockData, sold_item_qty: e.target.value})}
                                    className="w-full"
                                  />
                                ) : (
                                  stock.sold_item_qty || 0
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingStockId === stock.id && editingStockData ? (
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => handleSaveStock(stock.id)}>Save</Button>
                                    <Button variant="destructive" size="sm" className="h-7 px-2 text-xs" onClick={handleCancelEditStock}>Cancel</Button>
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => handleEditStock(stock)}>Edit</Button>
                                    <Button variant="destructive" size="sm" className="h-7 px-2 text-xs" onClick={() => handleDeleteStock(stock.id)}>Delete</Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
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
                    <Button variant="outline" onClick={() => setShowAddLocationForm(!showAddLocationForm)}>Add Location</Button>
                  </div>

                  {/* Add Location Form - appears when Add Location is clicked */}
                  <div
                    className={`mb-4 transition-all duration-400 ease-in-out ${
                      showAddLocationForm 
                        ? 'opacity-100 translate-y-0' 
                        : 'opacity-0 -translate-y-4 pointer-events-none'
                    }`}
                    style={{
                      transition: 'opacity 0.4s ease-in-out, transform 0.4s ease-in-out'
                    }}
                  >
                    {showAddLocationForm && (
                      <Card className="mb-4">
                        <CardContent className="p-6">
                          <h3 className="text-md font-semibold text-[hsl(var(--foreground))] mb-4">Add New Location</h3>
                          <form onSubmit={handleAddLocationSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Province *</label>
                                <Input
                                  value={addLocationFormData.province}
                                  onChange={(e) => setAddLocationFormData({...addLocationFormData, province: e.target.value})}
                                  className="w-full"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">District *</label>
                                <Input
                                  value={addLocationFormData.district}
                                  onChange={(e) => setAddLocationFormData({...addLocationFormData, district: e.target.value})}
                                  className="w-full"
                                  required
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Local Level *</label>
                                <Input
                                  value={addLocationFormData.localLevel}
                                  onChange={(e) => setAddLocationFormData({...addLocationFormData, localLevel: e.target.value})}
                                  className="w-full"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Local Level Type *</label>
                                <select
                                  value={addLocationFormData.localLevelType}
                                  onChange={(e) => setAddLocationFormData({...addLocationFormData, localLevelType: e.target.value})}
                                  className="w-full px-3 py-2 border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                                  required
                                >
                                  <option value="Metropolitan City">Metropolitan City</option>
                                  <option value="Sub-Metropolitan City">Sub-Metropolitan City</option>
                                  <option value="Municipality">Municipality</option>
                                  <option value="Rural Municipality">Rural Municipality</option>
                                </select>
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                  setShowAddLocationForm(false);
                                  setAddLocationFormData({
                                    province: '',
                                    district: '',
                                    localLevel: '',
                                    localLevelType: 'Municipality',
                                  });
                                }}
                              >
                                Cancel
                              </Button>
                              <Button type="submit">Add Location</Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    )}
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
                          <tr key={location.id} className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] ${editingLocationId === location.id ? 'bg-[hsl(var(--accent))]' : ''}`}>
                            <td className="p-3 text-sm text-[hsl(var(--foreground))]">{index + 1}</td>
                            <td className="p-3 text-sm">
                              {editingLocationId === location.id ? (
                                <Input
                                  value={editingLocationData.province}
                                  onChange={(e) => setEditingLocationData({...editingLocationData, province: e.target.value})}
                                  className="w-full text-sm"
                                />
                              ) : (
                                <span>{location.province}</span>
                              )}
                            </td>
                            <td className="p-3 text-sm">
                              {editingLocationId === location.id ? (
                                <Input
                                  value={editingLocationData.district}
                                  onChange={(e) => setEditingLocationData({...editingLocationData, district: e.target.value})}
                                  className="w-full text-sm"
                                />
                              ) : (
                                <span>{location.district}</span>
                              )}
                            </td>
                            <td className="p-3 text-sm">
                              {editingLocationId === location.id ? (
                                <div className="flex gap-2">
                                  <Input
                                    value={editingLocationData.localLevel}
                                    onChange={(e) => setEditingLocationData({...editingLocationData, localLevel: e.target.value})}
                                    className="flex-1 text-sm"
                                    placeholder="Local Level"
                                  />
                                  <select
                                    value={editingLocationData.localLevelType}
                                    onChange={(e) => setEditingLocationData({...editingLocationData, localLevelType: e.target.value})}
                                    className="px-2 py-1 text-sm border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                                  >
                                    <option value="Metropolitan City">Metropolitan City</option>
                                    <option value="Sub-Metropolitan City">Sub-Metropolitan City</option>
                                    <option value="Municipality">Municipality</option>
                                    <option value="Rural Municipality">Rural Municipality</option>
                                  </select>
                                </div>
                              ) : (
                                <span>{location.localLevel} ({location.localLevelType === 'Municipality' ? 'M' : location.localLevelType === 'Rural Municipality' ? 'RM' : location.localLevelType === 'Metropolitan City' ? 'MC' : 'SMC'})</span>
                              )}
                            </td>
                            <td className="p-3 text-sm text-[hsl(var(--foreground))]">{index + 1}</td>
                            <td className="p-3 text-sm">
                              <div className="flex gap-2">
                                {editingLocationId === location.id ? (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-7 px-2 text-xs"
                                      onClick={() => handleSaveLocation(location.id)}
                                    >
                                      Save
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 px-2 text-xs"
                                      onClick={handleCancelEditLocation}
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                ) : (
                                  <>
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
                                  </>
                                )}
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
                      <h3 className="text-md font-semibold text-[hsl(var(--foreground))] mb-4">Create New Auction</h3>
                      <form 
                        className="grid grid-cols-2 gap-4"
                        onSubmit={handleStartAuctionSubmit}
                      >
                        {/* Left Column */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">User *</label>
                            <select
                              value={auctionFormData.user_id}
                              onChange={(e) => setAuctionFormData({...auctionFormData, user_id: e.target.value})}
                              className="w-full px-3 py-2 border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                              required
                            >
                              <option value="">Select User</option>
                              {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.name} ({user.email})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Auction Item Name (Title) *</label>
                            <Input
                              value={auctionFormData.title}
                              onChange={(e) => setAuctionFormData({...auctionFormData, title: e.target.value})}
                              className="w-full"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Description *</label>
                            <textarea
                              value={auctionFormData.description}
                              onChange={(e) => setAuctionFormData({...auctionFormData, description: e.target.value})}
                              className="w-full min-h-[100px] px-3 py-2 border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Starting Price *</label>
                            <Input
                              type="number"
                              value={auctionFormData.starting_price}
                              onChange={(e) => setAuctionFormData({...auctionFormData, starting_price: e.target.value})}
                              className="w-full"
                              min="0"
                              step="0.01"
                              required
                            />
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Category/Subcategory *</label>
                            <select
                              value={auctionFormData.category_id}
                              onChange={(e) => setAuctionFormData({...auctionFormData, category_id: e.target.value})}
                              className="w-full px-3 py-2 border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                              required
                            >
                              <option value="">Select Category</option>
                              {flattenedCategories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Reserve Price (Optional)</label>
                            <Input
                              type="number"
                              value={auctionFormData.reserve_price}
                              onChange={(e) => setAuctionFormData({...auctionFormData, reserve_price: e.target.value})}
                              className="w-full"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Buy Now Price (Optional)</label>
                            <Input
                              type="number"
                              value={auctionFormData.buy_now_price}
                              onChange={(e) => setAuctionFormData({...auctionFormData, buy_now_price: e.target.value})}
                              className="w-full"
                              min="0"
                              step="0.01"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Auction Start Date and Time *</label>
                            <Input
                              type="datetime-local"
                              value={auctionFormData.start_date_time}
                              onChange={(e) => setAuctionFormData({...auctionFormData, start_date_time: e.target.value})}
                              className="w-full"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Auction End Date and Time *</label>
                            <Input
                              type="datetime-local"
                              value={auctionFormData.end_date_time}
                              onChange={(e) => setAuctionFormData({...auctionFormData, end_date_time: e.target.value})}
                              className="w-full"
                              required
                            />
                          </div>
                        </div>
                        <div className="col-span-2 flex justify-end gap-2 mt-6">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              setShowAuctionForm(false);
                              setAuctionFormData({
                                user_id: '',
                                category_id: '',
                                title: '',
                                description: '',
                                starting_price: '',
                                reserve_price: '',
                                buy_now_price: '',
                                start_date_time: '',
                                end_date_time: '',
                              });
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">Submit</Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                  </section>
                )}
              </div>

              {biddingHistoryLoading && (
                <div className="mb-4 text-center text-[hsl(var(--muted-foreground))]">
                  Loading bidding history...
                </div>
              )}
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
                            <tr key={bid.id} className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] ${editingBiddingHistoryId === bid.id ? 'bg-[hsl(var(--accent))]' : ''}`}>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{index + 1}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{bid.userName}</td>
                              <td className="p-3 text-sm">
                                {editingBiddingHistoryId === bid.id ? (
                                  <Input
                                    value={editingBiddingHistoryData.itemName}
                                    onChange={(e) => setEditingBiddingHistoryData({...editingBiddingHistoryData, itemName: e.target.value})}
                                    className="w-full text-sm"
                                  />
                                ) : (
                                  <span>{bid.itemName}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingBiddingHistoryId === bid.id ? (
                                  <Input
                                    type="number"
                                    value={editingBiddingHistoryData.reservePrice}
                                    onChange={(e) => setEditingBiddingHistoryData({...editingBiddingHistoryData, reservePrice: e.target.value})}
                                    className="w-full text-sm"
                                  />
                                ) : (
                                  <span className="font-semibold">Rs. {bid.reservePrice.toLocaleString()}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingBiddingHistoryId === bid.id ? (
                                  <Input
                                    type="number"
                                    value={editingBiddingHistoryData.buyNowPrice}
                                    onChange={(e) => setEditingBiddingHistoryData({...editingBiddingHistoryData, buyNowPrice: e.target.value})}
                                    className="w-full text-sm"
                                  />
                                ) : (
                                  <span className="font-semibold">Rs. {bid.buyNowPrice.toLocaleString()}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingBiddingHistoryId === bid.id ? (
                                  <Input
                                    value={editingBiddingHistoryData.paymentMethod}
                                    onChange={(e) => setEditingBiddingHistoryData({...editingBiddingHistoryData, paymentMethod: e.target.value})}
                                    className="w-full text-sm"
                                  />
                                ) : (
                                  <span>{bid.paymentMethod}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingBiddingHistoryId === bid.id ? (
                                  <Input
                                    type="datetime-local"
                                    value={editingBiddingHistoryData.startDateTime}
                                    onChange={(e) => setEditingBiddingHistoryData({...editingBiddingHistoryData, startDateTime: e.target.value})}
                                    className="w-full text-sm"
                                  />
                                ) : (
                                  <span className="text-[hsl(var(--muted-foreground))]">{new Date(bid.startDateTime).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                <div className="flex gap-2">
                                  {editingBiddingHistoryId === bid.id ? (
                                    <>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleSaveBiddingHistory(bid.id)}
                                      >
                                        Save
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={handleCancelEditBiddingHistory}
                                      >
                                        Cancel
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleEditBiddingHistory(bid)}
                                      >
                                        Edit
                                      </Button>
                                      <Button 
                                        variant="destructive" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleDeleteBiddingHistory(bid.id)}
                                      >
                                        Delete
                                      </Button>
                                    </>
                                  )}
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

              {bidWinnerLoading && (
                <div className="mb-4 text-center text-[hsl(var(--muted-foreground))]">
                  Loading bid winners...
                </div>
              )}
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
                            <tr key={winner.id} className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] ${editingBidWinnerId === winner.id ? 'bg-[hsl(var(--accent))]' : ''}`}>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{index + 1}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{winner.userName}</td>
                              <td className="p-3 text-sm">
                                {editingBidWinnerId === winner.id ? (
                                  <Input
                                    value={editingBidWinnerData.biddingItem}
                                    onChange={(e) => setEditingBidWinnerData({...editingBidWinnerData, biddingItem: e.target.value})}
                                    className="w-full text-sm"
                                  />
                                ) : (
                                  <span>{winner.biddingItem}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingBidWinnerId === winner.id ? (
                                  <Input
                                    type="date"
                                    value={editingBidWinnerData.bidStartDate}
                                    onChange={(e) => setEditingBidWinnerData({...editingBidWinnerData, bidStartDate: e.target.value})}
                                    className="w-full text-sm"
                                  />
                                ) : (
                                  <span className="text-[hsl(var(--muted-foreground))]">{new Date(winner.bidStartDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingBidWinnerId === winner.id ? (
                                  <Input
                                    type="date"
                                    value={editingBidWinnerData.bidWonDate}
                                    onChange={(e) => setEditingBidWinnerData({...editingBidWinnerData, bidWonDate: e.target.value})}
                                    className="w-full text-sm"
                                  />
                                ) : (
                                  <span className="text-[hsl(var(--muted-foreground))]">{new Date(winner.bidWonDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingBidWinnerId === winner.id ? (
                                  <Input
                                    type="date"
                                    value={editingBidWinnerData.paymentProceedDate}
                                    onChange={(e) => setEditingBidWinnerData({...editingBidWinnerData, paymentProceedDate: e.target.value})}
                                    className="w-full text-sm"
                                  />
                                ) : (
                                  <span className="text-[hsl(var(--muted-foreground))]">{new Date(winner.paymentProceedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingBidWinnerId === winner.id ? (
                                  <Input
                                    type="number"
                                    value={editingBidWinnerData.totalPayment}
                                    onChange={(e) => setEditingBidWinnerData({...editingBidWinnerData, totalPayment: e.target.value})}
                                    className="w-full text-sm"
                                  />
                                ) : (
                                  <span className="font-semibold">Rs. {winner.totalPayment.toLocaleString()}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{winner.sellerName}</td>
                              <td className="p-3 text-sm">
                                {editingBidWinnerId === winner.id ? (
                                  <select
                                    value={editingBidWinnerData.emailSent ? 'Yes' : 'No'}
                                    onChange={(e) => setEditingBidWinnerData({...editingBidWinnerData, emailSent: e.target.value === 'Yes'})}
                                    className="px-2 py-1 text-sm border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                                  >
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                  </select>
                                ) : (
                                  <span>{winner.emailSent}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                <div className="flex gap-2">
                                  {editingBidWinnerId === winner.id ? (
                                    <>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleSaveBidWinner(winner.id)}
                                      >
                                        Save
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={handleCancelEditBidWinner}
                                      >
                                        Cancel
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleEditBidWinner(winner)}
                                      >
                                        Edit
                                      </Button>
                                      <Button 
                                        variant="destructive" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleDeleteBidWinner(winner.id)}
                                      >
                                        Delete
                                      </Button>
                                    </>
                                  )}
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

              {blockedUserLoading && (
                <div className="mb-4 text-center text-[hsl(var(--muted-foreground))]">
                  Loading blocked users...
                </div>
              )}
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
                            <tr key={user.id} className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] ${editingBlockedUserId === user.id ? 'bg-[hsl(var(--accent))]' : ''}`}>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{index + 1}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{user.userName}</td>
                              <td className="p-3 text-sm">
                                {editingBlockedUserId === user.id ? (
                                  <Input
                                    type="email"
                                    value={editingBlockedUserData.email}
                                    onChange={(e) => setEditingBlockedUserData({...editingBlockedUserData, email: e.target.value})}
                                    className="w-full text-sm"
                                  />
                                ) : (
                                  <span>{user.email}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingBlockedUserId === user.id ? (
                                  <Input
                                    value={editingBlockedUserData.address}
                                    onChange={(e) => setEditingBlockedUserData({...editingBlockedUserData, address: e.target.value})}
                                    className="w-full text-sm"
                                  />
                                ) : (
                                  <span>{user.address}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingBlockedUserId === user.id ? (
                                  <Input
                                    type="date"
                                    value={editingBlockedUserData.dateToBlock}
                                    onChange={(e) => setEditingBlockedUserData({...editingBlockedUserData, dateToBlock: e.target.value})}
                                    className="w-full text-sm"
                                  />
                                ) : (
                                  <span className="text-[hsl(var(--muted-foreground))]">{new Date(user.dateToBlock).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingBlockedUserId === user.id ? (
                                  <Input
                                    value={editingBlockedUserData.reasonToBlock}
                                    onChange={(e) => setEditingBlockedUserData({...editingBlockedUserData, reasonToBlock: e.target.value})}
                                    className="w-full text-sm"
                                  />
                                ) : (
                                  <span>{user.reasonToBlock}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                <div className="flex gap-2">
                                  {editingBlockedUserId === user.id ? (
                                    <>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleSaveBlockedUser(user.id)}
                                      >
                                        Save
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={handleCancelEditBlockedUser}
                                      >
                                        Cancel
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleEditBlockedUser(user)}
                                      >
                                        Edit
                                      </Button>
                                      <Button 
                                        variant="destructive" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleDeleteBlockedUser(user.id)}
                                      >
                                        Delete
                                      </Button>
                                    </>
                                  )}
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
                            <tr key={tracking.id} className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] ${editingBiddingTrackingId === tracking.id ? 'bg-[hsl(var(--accent))]' : ''}`}>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{index + 1}</td>
                              <td className="p-3 text-sm">
                                {editingBiddingTrackingId === tracking.id ? (
                                  <Input
                                    value={editingBiddingTrackingData.bidWinnerName}
                                    onChange={(e) => setEditingBiddingTrackingData({...editingBiddingTrackingData, bidWinnerName: e.target.value})}
                                    className="w-full text-sm"
                                  />
                                ) : (
                                  <span>{tracking.bidWinnerName}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingBiddingTrackingId === tracking.id ? (
                                  <Input
                                    value={editingBiddingTrackingData.bidWonItemName}
                                    onChange={(e) => setEditingBiddingTrackingData({...editingBiddingTrackingData, bidWonItemName: e.target.value})}
                                    className="w-full text-sm"
                                  />
                                ) : (
                                  <span>{tracking.bidWonItemName}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingBiddingTrackingId === tracking.id ? (
                                  <select
                                    value={editingBiddingTrackingData.paymentStatus}
                                    onChange={(e) => setEditingBiddingTrackingData({...editingBiddingTrackingData, paymentStatus: e.target.value})}
                                    className="px-2 py-1 text-sm border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Failed">Failed</option>
                                  </select>
                                ) : (
                                  <span>{tracking.paymentStatus}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingBiddingTrackingId === tracking.id ? (
                                  <select
                                    value={editingBiddingTrackingData.pickupStatus}
                                    onChange={(e) => setEditingBiddingTrackingData({...editingBiddingTrackingData, pickupStatus: e.target.value})}
                                    className="px-2 py-1 text-sm border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                                  >
                                    <option value="Not Started">Not Started</option>
                                    <option value="Scheduled">Scheduled</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Picked Up">Picked Up</option>
                                  </select>
                                ) : (
                                  <span>{tracking.pickupStatus}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingBiddingTrackingId === tracking.id ? (
                                  <Input
                                    type="datetime-local"
                                    value={editingBiddingTrackingData.completeProcessDateTime || ''}
                                    onChange={(e) => setEditingBiddingTrackingData({...editingBiddingTrackingData, completeProcessDateTime: e.target.value})}
                                    className="w-full text-sm"
                                  />
                                ) : (
                                  <span className="text-[hsl(var(--muted-foreground))]">
                                    {tracking.completeProcessDateTime 
                                      ? new Date(tracking.completeProcessDateTime).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                      : '-'}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingBiddingTrackingId === tracking.id ? (
                                  <select
                                    value={editingBiddingTrackingData.alertSent ? 'Yes' : 'No'}
                                    onChange={(e) => setEditingBiddingTrackingData({...editingBiddingTrackingData, alertSent: e.target.value === 'Yes'})}
                                    className="px-2 py-1 text-sm border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                                  >
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                  </select>
                                ) : (
                                  <span>{tracking.alertSent}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                <div className="flex gap-2">
                                  {editingBiddingTrackingId === tracking.id ? (
                                    <>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleSaveBiddingTracking(tracking.id)}
                                      >
                                        Save
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={handleCancelEditBiddingTracking}
                                      >
                                        Cancel
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleEditBiddingTracking(tracking)}
                                      >
                                        Edit
                                      </Button>
                                      <Button 
                                        variant="destructive" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleDeleteBiddingTracking(tracking.id)}
                                      >
                                        Delete
                                      </Button>
                                    </>
                                  )}
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
              {categoryManagementLoading && (
                <div className="mb-4 text-center text-[hsl(var(--muted-foreground))]">
                  Loading categories...
                </div>
              )}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Category Management</h2>
                    <Button variant="outline" onClick={() => setShowAddCategoryForm(!showAddCategoryForm)}>Add Category/subcategory</Button>
                  </div>

                  {/* Add Category Form - appears when Add Category/subcategory is clicked */}
                  <div
                    className={`mb-4 transition-all duration-400 ease-in-out ${
                      showAddCategoryForm 
                        ? 'opacity-100 translate-y-0' 
                        : 'opacity-0 -translate-y-4 pointer-events-none'
                    }`}
                    style={{
                      transition: 'opacity 0.4s ease-in-out, transform 0.4s ease-in-out'
                    }}
                  >
                    {showAddCategoryForm && (
                      <Card className="mb-4">
                        <CardContent className="p-6">
                          <h3 className="text-md font-semibold text-[hsl(var(--foreground))] mb-4">Add New Category/Subcategory</h3>
                          <form onSubmit={handleAddCategorySubmit} className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Category Name *</label>
                              <Input
                                value={addCategoryFormData.categoryName}
                                onChange={(e) => setAddCategoryFormData({...addCategoryFormData, categoryName: e.target.value})}
                                className="w-full"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">Subcategory Name (Optional)</label>
                              <Input
                                value={addCategoryFormData.subcategoryName}
                                onChange={(e) => setAddCategoryFormData({...addCategoryFormData, subcategoryName: e.target.value})}
                                className="w-full"
                                placeholder="Leave empty for main category"
                              />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => {
                                  setShowAddCategoryForm(false);
                                  setAddCategoryFormData({
                                    categoryName: '',
                                    subcategoryName: '',
                                  });
                                }}
                              >
                                Cancel
                              </Button>
                              <Button type="submit">Add Category</Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    )}
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
                          <tr key={category.id} className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] ${editingCategoryId === category.id ? 'bg-[hsl(var(--accent))]' : ''}`}>
                            <td className="p-3 text-sm text-[hsl(var(--foreground))]">{index + 1}</td>
                            <td className="p-3 text-sm">
                              {editingCategoryId === category.id ? (
                                <Input
                                  value={editingCategoryData.categoryName}
                                  onChange={(e) => setEditingCategoryData({...editingCategoryData, categoryName: e.target.value})}
                                  className="w-full text-sm"
                                />
                              ) : (
                                <span>{category.categoryName}</span>
                              )}
                            </td>
                            <td className="p-3 text-sm">
                              {editingCategoryId === category.id ? (
                                <Input
                                  value={editingCategoryData.subcategoryName || ''}
                                  onChange={(e) => setEditingCategoryData({...editingCategoryData, subcategoryName: e.target.value})}
                                  className="w-full text-sm"
                                  placeholder="Subcategory (optional)"
                                />
                              ) : (
                                <span>{category.subcategoryName || '-'}</span>
                              )}
                            </td>
                            <td className="p-3 text-sm">
                              <div className="flex gap-2">
                                {editingCategoryId === category.id ? (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-7 px-2 text-xs"
                                      onClick={() => handleSaveCategory(category.id)}
                                    >
                                      Save
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 px-2 text-xs"
                                      onClick={handleCancelEditCategory}
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-7 px-2 text-xs"
                                      onClick={() => handleEditCategory(category)}
                                    >
                                      Edit
                                    </Button>
                                    <Button 
                                      variant="destructive" 
                                      size="sm" 
                                      className="h-7 px-2 text-xs"
                                      onClick={() => handleDeleteCategory(category.id)}
                                    >
                                      Delete
                                    </Button>
                                  </>
                                )}
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
              {deliveryLoading && (
                <div className="mb-4 text-center text-[hsl(var(--muted-foreground))]">
                  Loading deliveries...
                </div>
              )}
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
                            <tr key={delivery.id} className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] ${editingDeliveryId === delivery.id ? 'bg-[hsl(var(--accent))]' : ''}`}>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{index + 1}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{delivery.sellerVendor}</td>
                              <td className="p-3 text-sm">
                                {editingDeliveryId === delivery.id ? (
                                  <Input
                                    value={editingDeliveryData.item}
                                    onChange={(e) => setEditingDeliveryData({...editingDeliveryData, item: e.target.value})}
                                    className="w-full text-sm"
                                  />
                                ) : (
                                  <span>{delivery.item}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingDeliveryId === delivery.id ? (
                                  <Input
                                    type="number"
                                    value={editingDeliveryData.price}
                                    onChange={(e) => setEditingDeliveryData({...editingDeliveryData, price: e.target.value})}
                                    className="w-full text-sm"
                                  />
                                ) : (
                                  <span className="font-semibold">Rs. {delivery.price.toLocaleString()}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingDeliveryId === delivery.id ? (
                                  <select
                                    value={editingDeliveryData.deliveryStatus}
                                    onChange={(e) => setEditingDeliveryData({...editingDeliveryData, deliveryStatus: e.target.value})}
                                    className="px-2 py-1 text-sm border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="In Transit">In Transit</option>
                                    <option value="Delivered">Delivered</option>
                                  </select>
                                ) : (
                                  <span>{delivery.deliveryStatus}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingDeliveryId === delivery.id ? (
                                  <Input
                                    type="date"
                                    value={editingDeliveryData.pickupDate}
                                    onChange={(e) => setEditingDeliveryData({...editingDeliveryData, pickupDate: e.target.value})}
                                    className="w-full text-sm"
                                  />
                                ) : (
                                  <span className="text-[hsl(var(--muted-foreground))]">{new Date(delivery.pickupDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                <div className="flex gap-2">
                                  {editingDeliveryId === delivery.id ? (
                                    <>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleSaveDelivery(delivery.id)}
                                      >
                                        Save
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={handleCancelEditDelivery}
                                      >
                                        Cancel
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleEditDelivery(delivery)}
                                      >
                                        Edit
                                      </Button>
                                      <Button 
                                        variant="destructive" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleDeleteDelivery(delivery.id)}
                                      >
                                        Delete
                                      </Button>
                                    </>
                                  )}
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

              {purchaseVerificationLoading && (
                <div className="mb-4 text-center text-[hsl(var(--muted-foreground))]">
                  Loading purchase verifications...
                </div>
              )}
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
                            <tr key={purchase.id} className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))] ${editingPurchaseVerificationId === purchase.id ? 'bg-[hsl(var(--accent))]' : ''}`}>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{index + 1}</td>
                              <td className="p-3 text-sm text-[hsl(var(--foreground))]">{purchase.buyerUser}</td>
                              <td className="p-3 text-sm">
                                {editingPurchaseVerificationId === purchase.id ? (
                                  <Input
                                    value={editingPurchaseVerificationData.item}
                                    onChange={(e) => setEditingPurchaseVerificationData({...editingPurchaseVerificationData, item: e.target.value})}
                                    className="w-full text-sm"
                                  />
                                ) : (
                                  <span>{purchase.item}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingPurchaseVerificationId === purchase.id ? (
                                  <Input
                                    type="number"
                                    value={editingPurchaseVerificationData.price}
                                    onChange={(e) => setEditingPurchaseVerificationData({...editingPurchaseVerificationData, price: e.target.value})}
                                    className="w-full text-sm"
                                  />
                                ) : (
                                  <span className="font-semibold">Rs. {purchase.price.toLocaleString()}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingPurchaseVerificationId === purchase.id ? (
                                  <Input
                                    type="date"
                                    value={editingPurchaseVerificationData.purchaseDate}
                                    onChange={(e) => setEditingPurchaseVerificationData({...editingPurchaseVerificationData, purchaseDate: e.target.value})}
                                    className="w-full text-sm"
                                  />
                                ) : (
                                  <span className="text-[hsl(var(--muted-foreground))]">{new Date(purchase.purchaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingPurchaseVerificationId === purchase.id ? (
                                  <Input
                                    value={editingPurchaseVerificationData.verificationCode}
                                    onChange={(e) => setEditingPurchaseVerificationData({...editingPurchaseVerificationData, verificationCode: e.target.value})}
                                    className="w-full text-sm font-mono"
                                  />
                                ) : (
                                  <span className="font-mono">{purchase.verificationCode}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                {editingPurchaseVerificationId === purchase.id ? (
                                  <select
                                    value={editingPurchaseVerificationData.deliveryStatus}
                                    onChange={(e) => setEditingPurchaseVerificationData({...editingPurchaseVerificationData, deliveryStatus: e.target.value})}
                                    className="px-2 py-1 text-sm border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="In Transit">In Transit</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Failed">Failed</option>
                                  </select>
                                ) : (
                                  <span>{purchase.deliveryStatus}</span>
                                )}
                              </td>
                              <td className="p-3 text-sm">
                                <div className="flex gap-2">
                                  {editingPurchaseVerificationId === purchase.id ? (
                                    <>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleSavePurchaseVerification(purchase.id)}
                                      >
                                        Save
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={handleCancelEditPurchaseVerification}
                                      >
                                        Cancel
                                      </Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleEditPurchaseVerification(purchase)}
                                      >
                                        Edit
                                      </Button>
                                      <Button 
                                        variant="destructive" 
                                        size="sm" 
                                        className="h-7 px-2 text-xs"
                                        onClick={() => handleDeletePurchaseVerification(purchase.id)}
                                      >
                                        Delete
                                      </Button>
                                    </>
                                  )}
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
