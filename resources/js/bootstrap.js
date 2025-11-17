import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.headers.common['Accept'] = 'application/json';

// Set base URL for API requests
window.axios.defaults.baseURL = window.location.origin;

// Add token to requests if available
const token = localStorage.getItem('token');
if (token) {
  window.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}
