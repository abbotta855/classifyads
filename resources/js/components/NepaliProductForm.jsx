import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { nepaliProductAPI } from '../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import axios from 'axios';

export default function NepaliProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [categories, setCategories] = React.useState([]);
  const [formData, setFormData] = React.useState({
    title: '',
    company_name: '',
    company_history: '',
    company_address: '',
    company_latitude: '',
    company_longitude: '',
    category_id: '',
    subcategory_id: '',
    production_items: '',
    materials_use: '',
    nutrition_info: '',
    usability: '',
    quantity: '',
    size: '',
    shape: '',
    color: '',
    package_info: '',
    manufacture_date: '',
    best_before: '',
    retail_price: '',
    wholesale_price: '',
    retail_contact: '',
    wholesale_contact: '',
    is_made_in_nepal: true,
    has_nepali_address: true,
  });
  const [images, setImages] = React.useState([]);
  const [imagePreviews, setImagePreviews] = React.useState([]);
  const [error, setError] = React.useState(null);
  const [compressingImages, setCompressingImages] = React.useState(false);

  // Fetch categories
  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('/api/categories');
        // Flatten categories for simple selection
        const flatCategories = [];
        if (Array.isArray(res.data)) {
          res.data.forEach((cat) => {
            flatCategories.push({
              id: cat.id,
              name: cat.domain_category || cat.name,
              type: 'main'
            });
            if (cat.field_categories) {
              cat.field_categories.forEach((sub) => {
                flatCategories.push({
                  id: sub.id,
                  name: sub.field_category || sub.name,
                  type: 'sub',
                  parent_id: cat.id
                });
              });
            }
          });
        }
        setCategories(flatCategories);
      } catch (e) {
        console.error('Failed to load categories', e);
      }
    };
    fetchCategories();
  }, []);

  // Load product if editing
  React.useEffect(() => {
    if (id) {
      const loadProduct = async () => {
        setLoading(true);
        try {
          const res = await nepaliProductAPI.get(id);
          const product = res.data;
          setFormData({
            title: product.title || '',
            company_name: product.company_name || '',
            company_history: product.company_history || '',
            company_address: product.company_address || '',
            company_latitude: product.company_latitude || '',
            company_longitude: product.company_longitude || '',
            category_id: product.category_id || '',
            subcategory_id: product.subcategory_id || '',
            production_items: product.production_items || '',
            materials_use: product.materials_use || '',
            nutrition_info: product.nutrition_info || '',
            usability: product.usability || '',
            quantity: product.quantity || '',
            size: product.size || '',
            shape: product.shape || '',
            color: product.color || '',
            package_info: product.package_info || '',
            manufacture_date: product.manufacture_date || '',
            best_before: product.best_before || '',
            retail_price: product.retail_price || '',
            wholesale_price: product.wholesale_price || '',
            retail_contact: product.retail_contact || '',
            wholesale_contact: product.wholesale_contact || '',
            is_made_in_nepal: product.is_made_in_nepal !== false,
            has_nepali_address: product.has_nepali_address !== false,
          });
        } catch (e) {
          console.error('Failed to load product', e);
        } finally {
          setLoading(false);
        }
      };
      loadProduct();
    }
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Compress image to reduce file size
  const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Compression failed'));
                return;
              }
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files).slice(0, 8);
    
    if (files.length === 0) return;

    setCompressingImages(true);
    setError(null);

    try {
      // Compress images that are too large (> 1.5MB)
      const compressedFiles = await Promise.all(
        files.map(async (file) => {
          // Check file size (2MB = 2 * 1024 * 1024 bytes)
          const maxSize = 1.5 * 1024 * 1024; // 1.5MB threshold
          
          if (file.size > maxSize) {
            try {
              const compressed = await compressImage(file, 1200, 1200, 0.75);
              console.log(`Compressed ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressed.size / 1024 / 1024).toFixed(2)}MB`);
              return compressed;
            } catch (err) {
              console.error(`Failed to compress ${file.name}:`, err);
              // If compression fails, return original but warn user
              if (file.size > 2 * 1024 * 1024) {
                throw new Error(`${file.name} is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 2MB. Please compress the image before uploading.`);
              }
              return file;
            }
          }
          return file;
        })
      );

      setImages(compressedFiles);
      
      // Create previews
      const previews = compressedFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(previews);
    } catch (err) {
      setError(err.message || 'Failed to process images');
      console.error('Image processing error:', err);
    } finally {
      setCompressingImages(false);
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = new FormData();
      
      // Add all form fields (including empty required fields for validation)
      Object.keys(formData).forEach(key => {
        if (key !== 'is_made_in_nepal' && key !== 'has_nepali_address' && key !== 'images') {
          // Always send required fields, even if empty (for proper validation errors)
          if (['materials_use', 'usability'].includes(key)) {
            data.append(key, formData[key] || '');
          } else if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
            data.append(key, formData[key]);
          }
        }
      });
      
      // Add checkboxes as '1' or '0' (Laravel will convert)
      data.append('is_made_in_nepal', formData.is_made_in_nepal ? '1' : '0');
      data.append('has_nepali_address', formData.has_nepali_address ? '1' : '0');
      
      // Add images (required - at least 1)
      if (images.length === 0) {
        throw new Error('Please upload at least one product image');
      }

      // Final check and compression before upload
      const finalImages = await Promise.all(
        images.map(async (image) => {
          const maxSize = 2 * 1024 * 1024; // 2MB
          if (image.size > maxSize) {
            // Try one more compression pass
            try {
              return await compressImage(image, 1000, 1000, 0.7);
            } catch (err) {
              throw new Error(`Image "${image.name}" is too large (${(image.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 2MB.`);
            }
          }
          return image;
        })
      );

      finalImages.forEach((image) => {
        data.append('images[]', image);
      });

      let response;
      if (id) {
        response = await nepaliProductAPI.update(id, data);
        alert('Product updated successfully!');
      } else {
        response = await nepaliProductAPI.create(data);
        alert('Product submitted successfully! It will be reviewed by an admin before being published.');
      }

      navigate('/nepali-products');
    } catch (e) {
      // Show detailed validation errors
      if (e.response?.data?.errors) {
        const errors = e.response.data.errors;
        const errorMessages = Object.entries(errors).map(([field, messages]) => {
          // Format image errors more clearly
          if (field.startsWith('images.')) {
            const imageIndex = field.split('.')[1];
            return `Image ${parseInt(imageIndex) + 1}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
          }
          return `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
        });
        setError(errorMessages.join('\n'));
      } else if (e.message) {
        // Handle client-side errors (like image size)
        setError(e.message);
      } else {
        setError(e.response?.data?.error || e.response?.data?.message || 'Failed to save product');
      }
      console.error('Error saving product', e.response?.data || e);
    } finally {
      setLoading(false);
    }
  };

  const mainCategories = categories.filter(c => c.type === 'main');
  const subCategories = categories.filter(c => c.type === 'sub' && c.parent_id === parseInt(formData.category_id));

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {id ? 'Edit Nepali Product' : 'Add New Nepali Product'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-md">
                <strong className="block mb-2">⚠️ Validation Error:</strong>
                <div className="text-sm whitespace-pre-line space-y-1">
                  {error.split('\n').map((line, idx) => (
                    <div key={idx} className={line.includes('Image') ? 'font-semibold' : ''}>
                      {line}
                    </div>
                  ))}
                </div>
                {error.includes('images') && (
                  <div className="mt-2 text-xs bg-red-100 dark:bg-red-900/30 p-2 rounded">
                    <strong>Tip:</strong> Try compressing your images before uploading, or remove the oversized images and try again.
                  </div>
                )}
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              
              <div>
                <Label htmlFor="title">Product Title * (Max 150 characters)</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  maxLength={150}
                  required
                />
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  {formData.title.length}/150 characters
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category_id">Category *</Label>
                  <select
                    id="category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="w-full h-10 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2"
                    required
                  >
                    <option value="">Select Category</option>
                    {mainCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {subCategories.length > 0 && (
                  <div>
                    <Label htmlFor="subcategory_id">Subcategory</Label>
                    <select
                      id="subcategory_id"
                      name="subcategory_id"
                      value={formData.subcategory_id}
                      onChange={handleInputChange}
                      className="w-full h-10 rounded-md border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2"
                    >
                      <option value="">Select Subcategory</option>
                      {subCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="production_items">Production Items *</Label>
                <Input
                  id="production_items"
                  name="production_items"
                  value={formData.production_items}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Company Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Company Information</h3>
              
              <div>
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="company_history">Company History (Max 2000 characters)</Label>
                <Textarea
                  id="company_history"
                  name="company_history"
                  value={formData.company_history}
                  onChange={handleInputChange}
                  rows={4}
                  maxLength={2000}
                />
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  {formData.company_history.length}/2000 characters
                </p>
              </div>

              <div>
                <Label htmlFor="company_address">Company Address *</Label>
                <Textarea
                  id="company_address"
                  name="company_address"
                  value={formData.company_address}
                  onChange={handleInputChange}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_latitude">Latitude (optional)</Label>
                  <Input
                    id="company_latitude"
                    name="company_latitude"
                    type="number"
                    step="any"
                    value={formData.company_latitude}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="company_longitude">Longitude (optional)</Label>
                  <Input
                    id="company_longitude"
                    name="company_longitude"
                    type="number"
                    step="any"
                    value={formData.company_longitude}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Product Details</h3>
              
              <div>
                <Label htmlFor="materials_use">Materials Used *</Label>
                <Textarea
                  id="materials_use"
                  name="materials_use"
                  value={formData.materials_use}
                  onChange={handleInputChange}
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="nutrition_info">Nutrition Information</Label>
                <Textarea
                  id="nutrition_info"
                  name="nutrition_info"
                  value={formData.nutrition_info}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="usability">Usability *</Label>
                <Textarea
                  id="usability"
                  name="usability"
                  value={formData.usability}
                  onChange={handleInputChange}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="size">Size</Label>
                  <Input
                    id="size"
                    name="size"
                    value={formData.size}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shape">Shape</Label>
                  <Input
                    id="shape"
                    name="shape"
                    value={formData.shape}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="package_info">Package Information</Label>
                <Textarea
                  id="package_info"
                  name="package_info"
                  value={formData.package_info}
                  onChange={handleInputChange}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manufacture_date">Manufacture Date</Label>
                  <Input
                    id="manufacture_date"
                    name="manufacture_date"
                    type="date"
                    value={formData.manufacture_date}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="best_before">Best Before</Label>
                  <Input
                    id="best_before"
                    name="best_before"
                    type="date"
                    value={formData.best_before}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pricing</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="retail_price">Retail Price (Rs.)</Label>
                  <Input
                    id="retail_price"
                    name="retail_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.retail_price}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="wholesale_price">Wholesale Price (Rs.)</Label>
                  <Input
                    id="wholesale_price"
                    name="wholesale_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.wholesale_price}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="retail_contact">Retail Contact</Label>
                  <Input
                    id="retail_contact"
                    name="retail_contact"
                    value={formData.retail_contact}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="wholesale_contact">Wholesale Contact</Label>
                  <Input
                    id="wholesale_contact"
                    name="wholesale_contact"
                    value={formData.wholesale_contact}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Product Images (Up to 8, Max 2MB each)</h3>
              
              <div>
                <Label htmlFor="images">Upload Images</Label>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  disabled={compressingImages}
                />
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  {compressingImages ? 'Compressing images...' : `${images.length}/8 images selected`}
                  {images.length > 0 && !compressingImages && (
                    <span className="block mt-1">
                      {images.map((img, idx) => (
                        <span key={idx} className="block">
                          {img.name}: {(img.size / 1024 / 1024).toFixed(2)}MB
                          {img.size > 2 * 1024 * 1024 && (
                            <span className="text-red-500 ml-2">⚠ Too large!</span>
                          )}
                        </span>
                      ))}
                    </span>
                  )}
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Images will be automatically compressed if they exceed 1.5MB. Maximum size per image: 2MB.
                </p>
              </div>

              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full aspect-square object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Validation Checkboxes */}
            <div className="space-y-2 p-4 bg-[hsl(var(--muted))] rounded-md">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_made_in_nepal"
                  checked={formData.is_made_in_nepal}
                  onChange={handleInputChange}
                  required
                />
                <span>This product is made in Nepal *</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="has_nepali_address"
                  checked={formData.has_nepali_address}
                  onChange={handleInputChange}
                  required
                />
                <span>This product has a Nepali address *</span>
              </label>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : id ? 'Update Product' : 'Submit Product'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/nepali-products')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

