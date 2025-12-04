import axios from 'axios';

const API_BASE = '/api/admin';

export const adminAPI = {
  // Ads
  getAds: () => axios.get(`${API_BASE}/ads`),
  getAd: (id) => axios.get(`${API_BASE}/ads/${id}`),
  createAd: (data) => axios.post(`${API_BASE}/ads`, data),
  updateAd: (id, data) => axios.put(`${API_BASE}/ads/${id}`, data),
  deleteAd: (id) => axios.delete(`${API_BASE}/ads/${id}`),

  // Locations
  getLocations: () => axios.get(`${API_BASE}/locations`),
  getLocation: (id) => axios.get(`${API_BASE}/locations/${id}`),
  createLocation: (data) => axios.post(`${API_BASE}/locations`, data),
  updateLocation: (id, data) => axios.put(`${API_BASE}/locations/${id}`, data),
  deleteLocation: (id) => axios.delete(`${API_BASE}/locations/${id}`),

  // Auctions
  getAuctions: () => axios.get(`${API_BASE}/auctions`),
  getAuction: (id) => axios.get(`${API_BASE}/auctions/${id}`),
  createAuction: (data) => axios.post(`${API_BASE}/auctions`, data),
  updateAuction: (id, data) => axios.put(`${API_BASE}/auctions/${id}`, data),
  deleteAuction: (id) => axios.delete(`${API_BASE}/auctions/${id}`),

  // Deliveries
  getDeliveries: () => axios.get(`${API_BASE}/deliveries`),
  getDelivery: (id) => axios.get(`${API_BASE}/deliveries/${id}`),
  createDelivery: (data) => axios.post(`${API_BASE}/deliveries`, data),
  updateDelivery: (id, data) => axios.put(`${API_BASE}/deliveries/${id}`, data),
  deleteDelivery: (id) => axios.delete(`${API_BASE}/deliveries/${id}`),

  // Purchase Verifications
  getPurchaseVerifications: () => axios.get(`${API_BASE}/purchase-verifications`),
  getPurchaseVerification: (id) => axios.get(`${API_BASE}/purchase-verifications/${id}`),
  createPurchaseVerification: (data) => axios.post(`${API_BASE}/purchase-verifications`, data),
  updatePurchaseVerification: (id, data) => axios.put(`${API_BASE}/purchase-verifications/${id}`, data),
  deletePurchaseVerification: (id) => axios.delete(`${API_BASE}/purchase-verifications/${id}`),

  // Bidding History
  getBiddingHistory: () => axios.get(`${API_BASE}/bidding-history`),
  getBiddingHistoryItem: (id) => axios.get(`${API_BASE}/bidding-history/${id}`),
  createBiddingHistory: (data) => axios.post(`${API_BASE}/bidding-history`, data),
  updateBiddingHistory: (id, data) => axios.put(`${API_BASE}/bidding-history/${id}`, data),
  deleteBiddingHistory: (id) => axios.delete(`${API_BASE}/bidding-history/${id}`),

  // Bid Winners
  getBidWinners: () => axios.get(`${API_BASE}/bid-winners`),
  getBidWinner: (id) => axios.get(`${API_BASE}/bid-winners/${id}`),
  createBidWinner: (data) => axios.post(`${API_BASE}/bid-winners`, data),
  updateBidWinner: (id, data) => axios.put(`${API_BASE}/bid-winners/${id}`, data),
  deleteBidWinner: (id) => axios.delete(`${API_BASE}/bid-winners/${id}`),

  // Blocked Users
  getBlockedUsers: () => axios.get(`${API_BASE}/blocked-users`),
  getBlockedUser: (id) => axios.get(`${API_BASE}/blocked-users/${id}`),
  createBlockedUser: (data) => axios.post(`${API_BASE}/blocked-users`, data),
  updateBlockedUser: (id, data) => axios.put(`${API_BASE}/blocked-users/${id}`, data),
  deleteBlockedUser: (id) => axios.delete(`${API_BASE}/blocked-users/${id}`),

  // Bidding Tracking
  getBiddingTracking: () => axios.get(`${API_BASE}/bidding-tracking`),
  getBiddingTrackingItem: (id) => axios.get(`${API_BASE}/bidding-tracking/${id}`),
  createBiddingTracking: (data) => axios.post(`${API_BASE}/bidding-tracking`, data),
  updateBiddingTracking: (id, data) => axios.put(`${API_BASE}/bidding-tracking/${id}`, data),
  deleteBiddingTracking: (id) => axios.delete(`${API_BASE}/bidding-tracking/${id}`),

  // Users
  getUsers: () => axios.get(`${API_BASE}/users`),
  getUser: (id) => axios.get(`${API_BASE}/users/${id}`),
  createUser: (data) => axios.post(`${API_BASE}/users`, data),
  updateUser: (id, data) => axios.put(`${API_BASE}/users/${id}`, data),
  deleteUser: (id) => axios.delete(`${API_BASE}/users/${id}`),
  addUserComment: (id, data) => axios.post(`${API_BASE}/users/${id}/comment`, data),

  // Categories
  getCategories: () => axios.get(`${API_BASE}/categories`),
  getCategory: (id) => axios.get(`${API_BASE}/categories/${id}`),
  createCategory: (data) => axios.post(`${API_BASE}/categories`, data),
  updateCategory: (id, data) => axios.put(`${API_BASE}/categories/${id}`, data),
  deleteCategory: (id) => axios.delete(`${API_BASE}/categories/${id}`),

  // Job Categories
  getJobCategories: () => axios.get(`${API_BASE}/job-categories`),
  createJobCategory: (data) => axios.post(`${API_BASE}/job-categories`, data),
  updateJobCategory: (id, data) => axios.put(`${API_BASE}/job-categories/${id}`, data),
  deleteJobCategory: (id) => axios.delete(`${API_BASE}/job-categories/${id}`),

  // Job Applicants
  getJobApplicants: () => axios.get(`${API_BASE}/job-applicants`),
  createJobApplicant: (data) => {
    const formData = data instanceof FormData ? data : new FormData();
    if (!(data instanceof FormData)) {
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          if (data[key] instanceof File) {
            formData.append(key, data[key]);
          } else {
            formData.append(key, data[key]);
          }
        }
      });
    }
    return axios.post(`${API_BASE}/job-applicants`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  updateJobApplicant: (id, data) => {
    const formData = data instanceof FormData ? data : new FormData();
    if (!(data instanceof FormData)) {
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          if (data[key] instanceof File) {
            formData.append(key, data[key]);
          } else {
            formData.append(key, data[key]);
          }
        }
      });
    }
    return axios.post(`${API_BASE}/job-applicants/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      params: { _method: 'PUT' },
    });
  },
  deleteJobApplicant: (id) => axios.delete(`${API_BASE}/job-applicants/${id}`),

  // Live Chats
  getLiveChats: () => axios.get(`${API_BASE}/live-chats`),
  getLiveChat: (id) => axios.get(`${API_BASE}/live-chats/${id}`),
  getLiveChatMessages: (id) => axios.get(`${API_BASE}/live-chats/${id}/messages`),
  sendLiveChatMessage: (id, data) => axios.post(`${API_BASE}/live-chats/${id}/messages`, data),
  markLiveChatRead: (id) => axios.post(`${API_BASE}/live-chats/${id}/mark-read`),

  // Offers/Discounts
  getOffers: () => axios.get(`${API_BASE}/offers`),
  getOffer: (id) => axios.get(`${API_BASE}/offers/${id}`),
  createOffer: (data) => axios.post(`${API_BASE}/offers`, data),
  updateOffer: (id, data) => axios.put(`${API_BASE}/offers/${id}`, data),
  deleteOffer: (id) => axios.delete(`${API_BASE}/offers/${id}`),
  approveOffer: (id) => axios.post(`${API_BASE}/offers/${id}/approve`),

  // Ratings/Reviews
  getRatings: () => axios.get(`${API_BASE}/ratings`),
  getRating: (id) => axios.get(`${API_BASE}/ratings/${id}`),
  getRatingCriteria: () => axios.get(`${API_BASE}/rating-criteria`),
  createRatingCriteria: (data) => axios.post(`${API_BASE}/rating-criteria`, data),
  updateRatingCriteria: (id, data) => axios.put(`${API_BASE}/rating-criteria/${id}`, data),
  deleteRatingCriteria: (id) => axios.delete(`${API_BASE}/rating-criteria/${id}`),
  createRating: (data) => axios.post(`${API_BASE}/ratings`, data),
  updateRating: (id, data) => axios.put(`${API_BASE}/ratings/${id}`, data),
  deleteRating: (id) => axios.delete(`${API_BASE}/ratings/${id}`),

  // Sales Report
  getSalesReport: () => axios.get(`${API_BASE}/sales-report`),
  getSalesReportItem: (id) => axios.get(`${API_BASE}/sales-report/${id}`),
  createSalesReport: (data) => axios.post(`${API_BASE}/sales-report`, data),
  updateSalesReport: (id, data) => axios.put(`${API_BASE}/sales-report/${id}`, data),
  deleteSalesReport: (id) => axios.delete(`${API_BASE}/sales-report/${id}`),

  // Stock Management
  getStockManagement: () => axios.get(`${API_BASE}/stock-management`),
  getStockItem: (id) => axios.get(`${API_BASE}/stock-management/${id}`),
  createStockItem: (data) => axios.post(`${API_BASE}/stock-management`, data),
  updateStockItem: (id, data) => axios.put(`${API_BASE}/stock-management/${id}`, data),
  deleteStockItem: (id) => axios.delete(`${API_BASE}/stock-management/${id}`),
  markStockAlertRead: (id) => axios.post(`${API_BASE}/stock-management/${id}/mark-alert-read`),

  // Email Subscribers
  getEmailSubscribers: () => axios.get(`${API_BASE}/email-subscribers`),
  createEmailSubscriber: (data) => axios.post(`${API_BASE}/email-subscribers`, data),
  updateEmailSubscriber: (id, data) => axios.put(`${API_BASE}/email-subscribers/${id}`, data),
  deleteEmailSubscriber: (id) => axios.delete(`${API_BASE}/email-subscribers/${id}`),

  // Support Management
  getSupportManagement: () => axios.get(`${API_BASE}/support-management`),
  getSupportItem: (id) => axios.get(`${API_BASE}/support-management/${id}`),
  createSupportItem: (data) => axios.post(`${API_BASE}/support-management`, data),
  updateSupportItem: (id, data) => axios.put(`${API_BASE}/support-management/${id}`, data),
  deleteSupportItem: (id) => axios.delete(`${API_BASE}/support-management/${id}`),

  // Transaction Management
  getTransactionManagement: () => axios.get(`${API_BASE}/transaction-management`),
  getTransactionItem: (id) => axios.get(`${API_BASE}/transaction-management/${id}`),
  createTransactionItem: (data) => axios.post(`${API_BASE}/transaction-management`, data),
  updateTransactionItem: (id, data) => axios.put(`${API_BASE}/transaction-management/${id}`, data),
  deleteTransactionItem: (id) => axios.delete(`${API_BASE}/transaction-management/${id}`),

  // Change Password (Super Admin only)
  changePassword: (data) => axios.post('/api/change-password', data),
};

// OTP API functions
export const otpAPI = {
  generate: (email) => axios.post('/api/otp/generate', { email }),
  verify: (email, otpCode) => axios.post('/api/otp/verify', { email, otp_code: otpCode }),
  resend: (email) => axios.post('/api/otp/resend', { email }),
};

