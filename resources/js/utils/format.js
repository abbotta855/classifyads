import i18n from '../i18n/config';

export function getLang() {
  // Map generic 'ne' to 'ne-NP' for better number/date formatting
  const lng = i18n?.language || 'en';
  return lng === 'ne' ? 'ne-NP' : lng;
}

export function formatNumber(value) {
  const lang = getLang();
  try {
    return new Intl.NumberFormat(lang).format(Number(value) || 0);
  } catch {
    return String(value ?? '');
  }
}

export function formatPriceWithPrefix(value, prefix) {
  // We keep existing Rs. prefix strings from translations for consistency
  return `${prefix || ''} ${formatNumber(value)}`.trim();
}

export function formatDate(value, options) {
  const lang = getLang();
  try {
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat(lang, options || { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
  } catch {
    return '';
  }
}

