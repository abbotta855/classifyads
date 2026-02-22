# SEO Testing Guide

## Quick Test Steps

### 1. Start the Development Servers

**Terminal 1 - Laravel Backend:**
```bash
php artisan serve
```
This will start the server at: `http://localhost:8000`

**Terminal 2 - Frontend Dev Server (if needed):**
```bash
npm run dev
```

### 2. Open the Homepage

Navigate to: `http://localhost:8000` or `http://127.0.0.1:8000`

### 3. View Page Source (Method 1 - Most Reliable)

1. **Right-click** on the homepage
2. Select **"View Page Source"** (or press `Ctrl+U` on Windows/Linux, `Cmd+Option+U` on Mac)
3. Look for these tags in the `<head>` section:

```html
<title>Classified advertising in Nepal | Ebyapar.com</title>
<meta name="description" content="Classified advertising in Nepal to post hassle-free ad on various categories such as sale vehicle, house, land, tools etc. Ebyapar.com is as online community to buy & sale new and used items online to connect with potential buyer of large community.">
<meta name="keywords" content="classified ad post Nepal, online advertising Nepal, ad post online Nepal, classified advertising">
<meta property="og:title" content="Classified advertising in Nepal">
<meta property="og:description" content="Classified advertising in Nepal to post hassle-free ad on various categories such as sale vehicle, house, land, tools etc. Ebyapar.com is as online community to buy & sale new and used items online to connect with potential buyer of large community.">
```

### 4. Use Browser DevTools (Method 2 - Interactive)

1. **Open DevTools**: Press `F12` or `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
2. Go to the **"Elements"** tab
3. Expand the `<head>` section
4. Look for the meta tags listed above

### 5. Check Document Title

1. Look at the **browser tab** - it should show: "Classified advertising in Nepal | Ebyapar.com"
2. Or check in DevTools Console:
   ```javascript
   document.title
   ```
   Should return: `"Classified advertising in Nepal | Ebyapar.com"`

### 6. Verify Meta Tags with JavaScript

Open the browser console (F12 → Console tab) and run:

```javascript
// Check title
console.log('Title:', document.title);

// Check description
const desc = document.querySelector('meta[name="description"]');
console.log('Description:', desc ? desc.content : 'Not found');

// Check keywords
const keywords = document.querySelector('meta[name="keywords"]');
console.log('Keywords:', keywords ? keywords.content : 'Not found');

// Check Open Graph title
const ogTitle = document.querySelector('meta[property="og:title"]');
console.log('OG Title:', ogTitle ? ogTitle.content : 'Not found');

// Check Open Graph description
const ogDesc = document.querySelector('meta[property="og:description"]');
console.log('OG Description:', ogDesc ? ogDesc.content : 'Not found');
```

### 7. Test Schema.org Structured Data

1. Open DevTools (F12)
2. Go to **Console** tab
3. Run:
   ```javascript
   const schema = document.querySelector('script[type="application/ld+json"]');
   if (schema) {
     console.log('Schema.org Data:', JSON.parse(schema.textContent));
   } else {
     console.log('Schema.org script not found');
   }
   ```

### 8. Online SEO Testing Tools

After deploying, you can test with:

1. **Google Rich Results Test**: https://search.google.com/test/rich-results
   - Enter your homepage URL
   - Check for structured data

2. **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
   - Enter your homepage URL
   - Check Open Graph tags

3. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
   - Enter your homepage URL
   - Check Twitter Card tags

4. **Meta Tags Checker**: https://metatags.io/
   - Enter your homepage URL
   - See all meta tags in a nice format

### 9. Quick Visual Check

✅ **Browser Tab Title**: Should show "Classified advertising in Nepal | Ebyapar.com"
✅ **Page Source**: Should contain all meta tags
✅ **Console**: No errors related to SEOHead component

### 10. Expected Results

When you view the page source, you should see:

```html
<head>
  <title>Classified advertising in Nepal | Ebyapar.com</title>
  <meta name="description" content="Classified advertising in Nepal to post hassle-free ad on various categories such as sale vehicle, house, land, tools etc. Ebyapar.com is as online community to buy & sale new and used items online to connect with potential buyer of large community.">
  <meta name="keywords" content="classified ad post Nepal, online advertising Nepal, ad post online Nepal, classified advertising">
  <meta property="og:title" content="Classified advertising in Nepal">
  <meta property="og:description" content="Classified advertising in Nepal to post hassle-free ad on various categories such as sale vehicle, house, land, tools etc. Ebyapar.com is as online community to buy & sale new and used items online to connect with potential buyer of large community.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="http://localhost:8000/">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Classified advertising in Nepal">
  <meta name="twitter:description" content="Classified advertising in Nepal to post hassle-free ad on various categories such as sale vehicle, house, land, tools etc. Ebyapar.com is as online community to buy & sale new and used items online to connect with potential buyer of large community.">
  <link rel="canonical" href="http://localhost:8000/">
  <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Classified advertising in Nepal",
      "description": "Classified advertising in Nepal to post hassle-free ad on various categories such as sale vehicle, house, land, tools etc. Ebyapar.com is as online community to buy & sale new and used items online to connect with potential buyer of large community.",
      "url": "http://localhost:8000/"
    }
  </script>
</head>
```

## Troubleshooting

**If meta tags don't appear:**
1. Make sure you're on the homepage (`/`)
2. Hard refresh the page (`Ctrl+F5` or `Cmd+Shift+R`)
3. Check browser console for errors
4. Verify SEOHead component is imported in Homepage.jsx

**If title is wrong:**
1. Check that SEOHead is rendered before other content
2. Verify the title prop is being passed correctly
3. Clear browser cache

## Next Steps After Testing

Once verified locally:
1. Deploy to production
2. Submit sitemap to Google Search Console
3. Test with online SEO tools (listed above)
4. Monitor search engine indexing

