import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function SEOHead({ title, description, image, type = 'website', keywords }) {
  const location = useLocation();

  useEffect(() => {
    // Update document title
    if (title) {
      // If title already contains a pipe, use it as is, otherwise add site name
      const siteName = 'Ebyapar.com';
      document.title = title.includes('|') ? title : `${title} | ${siteName}`;
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

    // Keywords meta tag
    if (keywords) {
      updateMetaTag('keywords', keywords);
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

    // Schema.org structured data
    let schemaScript = document.querySelector('script[type="application/ld+json"]');
    if (!schemaScript) {
      schemaScript = document.createElement('script');
      schemaScript.setAttribute('type', 'application/ld+json');
      document.head.appendChild(schemaScript);
    }

    // Generate Schema.org based on type
    const schema = {
      '@context': 'https://schema.org',
      '@type': type === 'product' ? 'Product' : type === 'article' ? 'Article' : 'WebPage',
      'name': title || document.title,
      'description': description || '',
      'url': window.location.href,
    };

    if (image) {
      schema.image = image;
    }

    if (type === 'product') {
      schema['@type'] = 'Product';
    } else if (type === 'article') {
      schema['@type'] = 'Article';
      schema.publisher = {
        '@type': 'Organization',
        name: 'Ebyapar.com',
      };
    }

    schemaScript.textContent = JSON.stringify(schema);
  }, [title, description, image, type, keywords, location]);

  return null;
}

