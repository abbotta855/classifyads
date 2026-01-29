import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function SEOHead({ title, description, image, type = 'website' }) {
  const location = useLocation();

  useEffect(() => {
    // Update document title
    if (title) {
      document.title = `${title} | ${document.title.split('|')[1] || 'MyApp'}`;
    }

    // Update or create meta tags
    const updateMetaTag = (name, content, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    if (description) {
      updateMetaTag('description', description);
      updateMetaTag('og:description', description, true);
    }

    // Open Graph tags
    updateMetaTag('og:title', title || document.title, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:url', window.location.href, true);
    if (image) {
      updateMetaTag('og:image', image, true);
    }

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title || document.title);
    if (description) {
      updateMetaTag('twitter:description', description);
    }
    if (image) {
      updateMetaTag('twitter:image', image);
    }

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href);
  }, [title, description, image, type, location]);

  return null;
}

