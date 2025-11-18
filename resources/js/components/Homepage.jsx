import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from './Layout';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';

function Homepage() {
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState(['All Locations', 'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix']);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('most relevant');
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Popular ads categories
  const popularAds = [
    'Bus for sale',
    'Car for sale',
    'Construction Materials',
    'House for sale',
    'Jobs',
    'Land for sale',
    'Motorbike for sale',
    'Truck for sale'
  ];

  useEffect(() => {
    fetchCategories();
    // TODO: Fetch ads when API is ready
    // fetchAds();
    generateMockAds();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await window.axios.get('/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate mock ads for demonstration (39 ads as per wireframe)
  const generateMockAds = () => {
    const mockAds = [];
    const categories = ['Land for sale', 'Car for sale', 'Motorbike for sale', 'Construction Materials', 'Job'];
    
    for (let i = 0; i < 39; i++) {
      const category = categories[i % categories.length];
      mockAds.push({
        id: i + 1,
        title: `${category} - Item ${i + 1}`.substring(0, 80),
        description: `This is a detailed description for item ${i + 1}. It contains important information about the product.`.substring(0, 200),
        price: Math.floor(Math.random() * 10000) + 100,
        image: `https://via.placeholder.com/1200x1200?text=Ad+${i + 1}`,
        category: category,
        location: locations[Math.floor(Math.random() * locations.length)]
      });
    }
    setAds(mockAds);
    setLoading(false);
  };

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleLocationToggle = (location) => {
    setSelectedLocations(prev =>
      prev.includes(location)
        ? prev.filter(loc => loc !== location)
        : [...prev, location]
    );
  };

  const handleSearch = () => {
    // TODO: Implement search functionality when API is ready
    console.log('Search:', { searchQuery, selectedCategories, selectedLocations, priceRange, sortBy });
  };

  const getCategoryAds = (categoryName) => {
    return ads.filter(ad => ad.category === categoryName).slice(0, 4);
  };

  const getCategoryRoute = (categoryName) => {
    const routeMap = {
      'Land for sale': '/categories/land-for-sale',
      'Car for sale': '/categories/vehicle-for-sale',
      'Motorbike for sale': '/categories/motor-bike-for-sale',
      'Construction Materials': '/categories/construction-material-for-sale',
      'Job': '/categories/land-for-sale' // Note: wireframe shows this redirects to land for sale
    };
    return routeMap[categoryName] || '/categories';
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-[hsl(var(--muted-foreground))]">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Search Part */}
        <section className="mb-6">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search part"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch}>Search button</Button>
          </div>
        </section>

        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <Card>
              <CardContent className="p-4">
                <h2 className="text-lg font-bold text-[hsl(var(--foreground))] mb-4">Filters</h2>

                {/* Category Filter */}
                <div className="mb-6">
                  <h3 className="font-semibold text-[hsl(var(--foreground))] mb-2">
                    Category(all displayed for filter)
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {categories.map((category) => (
                      <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.id)}
                          onChange={() => handleCategoryToggle(category.id)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-[hsl(var(--foreground))]">{category.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Location Filter */}
                <div className="mb-6">
                  <h3 className="font-semibold text-[hsl(var(--foreground))] mb-2">
                    Location area and the logic is same as category
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {locations.map((location) => (
                      <label key={location} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedLocations.includes(location)}
                          onChange={() => handleLocationToggle(location)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-[hsl(var(--foreground))]">{location}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <h3 className="font-semibold text-[hsl(var(--foreground))] mb-2">
                    Price area and here we can set min & max price
                  </h3>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Min price"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                      className="w-full"
                    />
                    <Input
                      type="number"
                      placeholder="Max price"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* More Options */}
                <div className="mb-6">
                  <button
                    onClick={() => setShowMoreOptions(!showMoreOptions)}
                    className="font-semibold text-[hsl(var(--foreground))] mb-2 w-full text-left"
                  >
                    More options {showMoreOptions ? '▼' : '▶'}
                  </button>
                  {showMoreOptions && (
                    <div className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
                      <p>Here is different Specification filter area to display based on relevancy.</p>
                      <p>Examples: Men Pant(category, subcategory), Size, Color, Price range, Brand</p>
                    </div>
                  )}
                </div>

                {/* Popular Ads */}
                <div>
                  <h3 className="font-semibold text-[hsl(var(--foreground))] mb-2">Popular Ads</h3>
                  <ul className="space-y-1 text-sm">
                    {popularAds.map((ad, index) => (
                      <li key={index}>
                        <Link
                          to={getCategoryRoute(ad)}
                          className="text-[hsl(var(--primary))] hover:underline"
                        >
                          {ad}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">
                Search and filter result
              </h2>
              <div className="flex items-center gap-2">
                <label className="text-sm text-[hsl(var(--foreground))]">Sorting option:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-[hsl(var(--input))] rounded-md bg-[hsl(var(--background))] text-[hsl(var(--foreground))]"
                >
                  <option value="most relevant">most relevant</option>
                  <option value="lowest price">lowest price</option>
                  <option value="highest price">highest price</option>
                  <option value="ascending order">ascending order</option>
                  <option value="descending order">descending order</option>
                  <option value="latest listing">latest listing</option>
                  <option value="top review">top review</option>
                </select>
              </div>
            </div>

            {/* Display 39 ads with "more" button */}
            <div className="mb-8">
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                This is Display 39 ads page area and put more button. When user click more on ads button after 39 ads need to redirect to all categories page where user can choose relevant category/subcategory which ads size are 1200 by 1200 pixel and contain 80 character title, 200 character description, price and more.
              </p>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                We can see search and filter result ads here.
              </p>

              {/* Display ads in grid (4 per row) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {ads.slice(0, 39).map((ad) => (
                  <Card key={ad.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <img
                        src={ad.image}
                        alt={ad.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-3">
                        <h3 className="font-semibold text-sm text-[hsl(var(--foreground))] mb-1 line-clamp-2">
                          {ad.title}
                        </h3>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2 line-clamp-2">
                          {ad.description}
                        </p>
                        <p className="text-lg font-bold text-[hsl(var(--primary))]">
                          ${ad.price.toLocaleString()}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center">
                <Link to="/categories">
                  <Button>More ads</Button>
                </Link>
              </div>
            </div>

            {/* Category-specific ad sections (4 ads per row, then "more ad" link) */}
            {['Land for sale', 'Car for sale', 'Motorbike for sale', 'Construction Materials', 'Job'].map((categoryName) => {
              const categoryAds = getCategoryAds(categoryName);
              if (categoryAds.length === 0) return null;

              return (
                <div key={categoryName} className="mb-8">
                  <h3 className="text-xl font-bold text-[hsl(var(--foreground))] mb-4">{categoryName}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {categoryAds.map((ad) => (
                      <Card key={ad.id} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-0">
                          <img
                            src={ad.image}
                            alt={ad.title}
                            className="w-full h-48 object-cover"
                          />
                          <div className="p-3">
                            <h3 className="font-semibold text-sm text-[hsl(var(--foreground))] mb-1 line-clamp-2">
                              {ad.title}
                            </h3>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2 line-clamp-2">
                              {ad.description}
                            </p>
                            <p className="text-lg font-bold text-[hsl(var(--primary))]">
                              ${ad.price.toLocaleString()}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Card className="hover:shadow-lg transition-shadow flex items-center justify-center">
                      <CardContent className="p-4 text-center">
                        <Link
                          to={getCategoryRoute(categoryName)}
                          className="text-[hsl(var(--primary))] hover:underline font-semibold"
                        >
                          more ad
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
            })}
          </main>
        </div>
      </div>
    </Layout>
  );
}

export default Homepage;
