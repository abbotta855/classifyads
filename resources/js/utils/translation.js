import { useTranslation as useI18nTranslation } from 'react-i18next';

// Fallback translation function
const fallbackT = (key, options) => {
  // If options are provided and there's interpolation, try to handle it
  if (options && typeof options === 'object') {
    let result = key;
    Object.keys(options).forEach(k => {
      result = result.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(options[k]));
    });
    return result;
  }
  return key;
};

/**
 * Safe wrapper for useTranslation that provides a fallback
 * if i18next is not yet initialized
 * 
 * Note: This must be called unconditionally (React hook rules)
 * React hooks cannot be wrapped in try-catch, so we handle the result
 */
export function useTranslation() {
  // Call the hook unconditionally (required by React)
  // Cannot wrap in try-catch - React hooks must be called unconditionally
  const translation = useI18nTranslation();
  
  // Ensure t function always exists and is a function
  // Multiple checks to ensure we always have a valid function
  let t = fallbackT;
  if (translation) {
    if (translation.t && typeof translation.t === 'function') {
      t = translation.t;
    }
  }
  
  // Always return a valid object with t function - this is critical!
  return {
    t: t, // Explicitly set t - guaranteed to be a function
    i18n: translation?.i18n || null,
    ready: translation?.ready || false,
  };
}

