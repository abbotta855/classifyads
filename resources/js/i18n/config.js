import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslations from './locales/en.json';
import neTranslations from './locales/ne.json';

// Initialize i18next synchronously - ensure it's ready before any component uses it
const initI18n = () => {
  if (!i18n.isInitialized) {
    i18n
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        resources: {
          en: {
            translation: enTranslations,
          },
          ne: {
            translation: neTranslations,
          },
        },
        fallbackLng: 'en',
        lng: 'en', // Set default language explicitly
        debug: false,
        interpolation: {
          escapeValue: false, // React already escapes
        },
        detection: {
          order: ['localStorage', 'navigator'],
          caches: ['localStorage'],
          lookupLocalStorage: 'i18nextLng',
        },
        react: {
          useSuspense: false, // Disable suspense to prevent errors
        },
      });
  }
};

// Initialize immediately
initI18n();

export default i18n;

