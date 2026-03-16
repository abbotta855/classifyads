/**
 * Timezone Utility Functions
 * Handles timezone detection, conversion, and formatting
 */

/**
 * Get user's timezone from browser
 * @returns {string} IANA timezone identifier (e.g., 'America/Los_Angeles', 'Asia/Kathmandu')
 */
export function getUserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    // Fallback to UTC if detection fails
    return 'UTC';
  }
}

/**
 * Get timezone offset in hours (e.g., -8 for PST, +5:45 for Nepal)
 * @param {string} timezone - IANA timezone identifier
 * @returns {number} Offset in hours
 */
export function getTimezoneOffset(timezone = null) {
  const tz = timezone || getUserTimezone();
  const now = new Date();
  const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const local = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  return (local - utc) / (1000 * 60 * 60); // Convert to hours
}

/**
 * Convert UTC datetime string to user's local timezone for datetime-local input
 * @param {string} utcDateTime - ISO 8601 UTC datetime string
 * @param {string} timezone - Optional timezone (defaults to browser timezone)
 * @returns {string} Format: YYYY-MM-DDTHH:mm (for datetime-local input)
 */
export function utcToLocalDateTime(utcDateTime, timezone = null) {
  if (!utcDateTime) return '';
  
  try {
    const date = new Date(utcDateTime);
    if (isNaN(date.getTime())) return '';
    
    // Get local date components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (e) {
    console.error('Error converting UTC to local datetime:', e);
    return '';
  }
}

/**
 * Convert local datetime-local value to UTC ISO string
 * @param {string} localDateTime - Format: YYYY-MM-DDTHH:mm (from datetime-local input)
 * @param {string} timezone - Optional timezone (defaults to browser timezone)
 * @returns {string} ISO 8601 UTC datetime string
 */
export function localDateTimeToUTC(localDateTime, timezone = null) {
  if (!localDateTime) return '';
  
  try {
    // datetime-local gives us local time without timezone
    // Create date object - browser will interpret as local time
    const date = new Date(localDateTime);
    if (isNaN(date.getTime())) return '';
    
    // Convert to UTC ISO string
    return date.toISOString();
  } catch (e) {
    console.error('Error converting local datetime to UTC:', e);
    return '';
  }
}

/**
 * Format datetime for display in user's timezone
 * @param {string} utcDateTime - ISO 8601 UTC datetime string
 * @param {object} options - Intl.DateTimeFormat options
 * @param {string} timezone - Optional timezone (defaults to browser timezone)
 * @returns {string} Formatted datetime string
 */
export function formatDateTime(utcDateTime, options = {}, timezone = null) {
  if (!utcDateTime) return 'N/A';
  
  try {
    const date = new Date(utcDateTime);
    if (isNaN(date.getTime())) return 'N/A';
    
    const tz = timezone || getUserTimezone();
    const defaultOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: tz,
    };
    
    return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(date);
  } catch (e) {
    console.error('Error formatting datetime:', e);
    return 'N/A';
  }
}

/**
 * Send timezone to backend to store in user profile
 * @param {string} timezone - IANA timezone identifier
 */
export async function updateUserTimezone(timezone) {
  try {
    const response = await fetch('/api/profile/timezone', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || '',
      },
      body: JSON.stringify({ timezone }),
    });
    
    if (!response.ok) {
      console.error('Failed to update timezone');
    }
  } catch (e) {
    console.error('Error updating timezone:', e);
  }
}

/**
 * Initialize timezone on page load
 * Detects and stores user's timezone if not already set
 */
export async function initializeTimezone() {
  const timezone = getUserTimezone();
  
  // Store in localStorage for quick access
  localStorage.setItem('user_timezone', timezone);
  
  // Send to backend to store in user profile (if logged in)
  // This will be called from the main app component
  return timezone;
}

