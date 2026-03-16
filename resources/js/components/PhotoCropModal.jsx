import React, { useState, useRef, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

function PhotoCropModal({ imageFile, onCropComplete: onCropCompleteCallback, onCancel, aspectRatio = 1, minWidth = 400, minHeight = 400, fixedSize = { width: 400, height: 400 } }) {
  // Default to 1:1 aspect ratio and 400x400px for ad/auction images
  // Start with percentage-based crop (ReactCrop works better with percentages)
  // Initialize with valid x, y coordinates
  const [crop, setCrop] = useState({ unit: '%', x: 10, y: 10, width: 50, height: 50, aspect: aspectRatio || 1 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const imgRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);

  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target.result);
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  const onImageLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const img = e.currentTarget;
    const displayedWidth = img.width;
    const displayedHeight = img.height;
    
    // If fixed size is specified, calculate crop in percentage relative to displayed size
    if (fixedSize) {
      // Calculate what percentage of the displayed image the fixed size represents
      // Make the crop area more visible - use at least 60% of the smaller dimension
      const minCropSize = Math.min(displayedWidth, displayedHeight) * 0.6;
      const targetCropSize = Math.max(fixedSize.width, fixedSize.height, minCropSize);
      
      // Calculate crop dimensions as percentage of displayed image
      // Use the larger of: fixed size requirement or 60% of image
      const cropWidthPercent = Math.max(
        (fixedSize.width / displayedWidth) * 100,
        (targetCropSize / displayedWidth) * 100
      );
      const cropHeightPercent = Math.max(
        (fixedSize.height / displayedHeight) * 100,
        (targetCropSize / displayedHeight) * 100
      );
      
      // Ensure we don't exceed 100% and maintain aspect ratio
      const finalWidth = Math.min(cropWidthPercent, 90);
      const finalHeight = Math.min(cropHeightPercent, 90);
      
      // Center the crop
      const cropXPercent = Math.max(0, (100 - finalWidth) / 2);
      const cropYPercent = Math.max(0, (100 - finalHeight) / 2);
      
      const newCrop = {
        unit: '%',
        x: cropXPercent,
        y: cropYPercent,
        width: finalWidth,
        height: finalHeight,
        aspect: aspectRatio || 1,
      };
      setCrop(newCrop);
      
      // Trigger preview generation after image is loaded
      setTimeout(() => {
        if (imgRef.current && imgRef.current.complete) {
          makeClientCrop(newCrop);
        }
      }, 200);
    } else {
      // Fallback to percentage-based for other use cases
      const cropWidth = Math.min(80, (naturalWidth / naturalWidth) * 100);
      const cropHeight = aspectRatio 
        ? cropWidth / aspectRatio 
        : Math.min(80, (naturalHeight / naturalHeight) * 100);
      
      const newCrop = {
        unit: '%',
        x: (100 - cropWidth) / 2,
        y: (100 - (aspectRatio ? cropWidth / aspectRatio : cropHeight)) / 2,
        width: cropWidth,
        height: aspectRatio ? undefined : cropHeight,
        aspect: aspectRatio || 1,
      };
      setCrop(newCrop);
      
      // Trigger preview generation
      setTimeout(() => {
        if (imgRef.current && imgRef.current.complete) {
          makeClientCrop(newCrop);
        }
      }, 200);
    }
  };

  const makeClientCrop = async (crop) => {
    if (!imgRef.current || !crop) {
      return;
    }
    
    // Validate crop has required properties
    if (crop.width === undefined || crop.height === undefined || crop.width <= 0 || crop.height <= 0) {
      console.warn('Invalid crop for preview:', crop);
      return;
    }
    
    // Ensure x and y are defined (default to 0 if not)
    if (crop.x === undefined) crop.x = 0;
    if (crop.y === undefined) crop.y = 0;
    
    try {
      const croppedImage = await getCroppedImg(imgRef.current, crop, imageFile.name);
      if (croppedImage) {
        setCroppedImageUrl(croppedImage);
      } else {
        // Don't log warning for every failed attempt - only if crop seems valid
        setCroppedImageUrl(null);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      setCroppedImageUrl(null);
    }
  };

  const onCropChange = (crop) => {
    setCrop(crop);
    // Update preview in real-time as user drags (debounced via onComplete)
  };

  const onCropComplete = (crop) => {
    setCompletedCrop(crop);
    makeClientCrop(crop);
  };

  const getCroppedImg = (image, crop, fileName) => {
    const canvas = document.createElement('canvas');
    
    // Validate crop values
    if (!crop || crop.width === undefined || crop.height === undefined || crop.width <= 0 || crop.height <= 0) {
      console.error('Invalid crop values:', crop);
      return Promise.resolve(null);
    }
    
    // Handle both pixel and percentage units
    let sourceX, sourceY, sourceWidth, sourceHeight;
    
    if (crop.unit === 'px') {
      // Pixel-based crop - need to scale to natural image size
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      
      sourceX = Math.max(0, (crop.x || 0) * scaleX);
      sourceY = Math.max(0, (crop.y || 0) * scaleY);
      sourceWidth = crop.width * scaleX;
      sourceHeight = crop.height * scaleY;
    } else {
      // Percentage-based crop (default)
      sourceX = Math.max(0, ((crop.x || 0) / 100) * image.naturalWidth);
      sourceY = Math.max(0, ((crop.y || 0) / 100) * image.naturalHeight);
      sourceWidth = (crop.width / 100) * image.naturalWidth;
      sourceHeight = (crop.height / 100) * image.naturalHeight;
    }
    
    // Ensure crop doesn't exceed image boundaries
    sourceWidth = Math.min(sourceWidth, image.naturalWidth - sourceX);
    sourceHeight = Math.min(sourceHeight, image.naturalHeight - sourceY);
    
    // Validate calculated dimensions
    if (sourceWidth <= 0 || sourceHeight <= 0 || sourceX >= image.naturalWidth || sourceY >= image.naturalHeight) {
      console.error('Invalid source dimensions:', { 
        crop, 
        sourceX, 
        sourceY, 
        sourceWidth, 
        sourceHeight, 
        naturalWidth: image.naturalWidth, 
        naturalHeight: image.naturalHeight,
        displayedWidth: image.width,
        displayedHeight: image.height
      });
      return Promise.resolve(null);
    }
    
    // For preview, use actual crop size; for final file, use fixed size if specified
    const outputWidth = fixedSize?.width || Math.max(1, Math.round(sourceWidth));
    const outputHeight = fixedSize?.height || Math.max(1, Math.round(sourceHeight));
    
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');

    // Fill with white background first (in case of transparency)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, outputWidth, outputHeight);

    try {
      ctx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );
    } catch (error) {
      console.error('Error drawing image to canvas:', error);
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Canvas is empty - crop may be invalid');
          resolve(null);
          return;
        }
        blob.name = fileName;
        const file = new File([blob], fileName, { type: 'image/jpeg' });
        resolve(URL.createObjectURL(file));
      }, 'image/jpeg', 0.95);
    });
  };

  const handleSave = async () => {
    if (imgRef.current && completedCrop) {
      const croppedFile = await getCroppedImgAsFile(imgRef.current, completedCrop, imageFile.name);
      onCropCompleteCallback(croppedFile);
    }
  };

  const getCroppedImgAsFile = (image, crop, fileName) => {
    const canvas = document.createElement('canvas');
    
    // Validate crop values
    if (!crop || crop.width === undefined || crop.height === undefined || crop.width <= 0 || crop.height <= 0) {
      console.error('Invalid crop values for file:', crop);
      return Promise.reject(new Error('Invalid crop values'));
    }
    
    // Handle both pixel and percentage units
    let sourceX, sourceY, sourceWidth, sourceHeight;
    
    if (crop.unit === 'px') {
      // Pixel-based crop - need to scale to natural image size
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      
      sourceX = Math.max(0, (crop.x || 0) * scaleX);
      sourceY = Math.max(0, (crop.y || 0) * scaleY);
      sourceWidth = crop.width * scaleX;
      sourceHeight = crop.height * scaleY;
    } else {
      // Percentage-based crop (default)
      sourceX = Math.max(0, ((crop.x || 0) / 100) * image.naturalWidth);
      sourceY = Math.max(0, ((crop.y || 0) / 100) * image.naturalHeight);
      sourceWidth = (crop.width / 100) * image.naturalWidth;
      sourceHeight = (crop.height / 100) * image.naturalHeight;
    }
    
    // Ensure crop doesn't exceed image boundaries
    sourceWidth = Math.min(sourceWidth, image.naturalWidth - sourceX);
    sourceHeight = Math.min(sourceHeight, image.naturalHeight - sourceY);
    
    // Validate calculated dimensions
    if (sourceWidth <= 0 || sourceHeight <= 0) {
      console.error('Invalid source dimensions for file:', { 
        crop,
        sourceX, 
        sourceY, 
        sourceWidth, 
        sourceHeight,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight
      });
      return Promise.reject(new Error('Invalid source dimensions'));
    }
    
    const outputWidth = fixedSize?.width || Math.max(1, Math.round(sourceWidth));
    const outputHeight = fixedSize?.height || Math.max(1, Math.round(sourceHeight));
    
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');

    // Fill with white background first
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, outputWidth, outputHeight);

    try {
      ctx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );
    } catch (error) {
      console.error('Error drawing image to canvas for file:', error);
      return Promise.reject(error);
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Canvas is empty - cannot create file');
          reject(new Error('Canvas is empty'));
          return;
        }
        const file = new File([blob], fileName, { type: 'image/jpeg', lastModified: Date.now() });
        resolve(file);
      }, 'image/jpeg', 0.95);
    });
  };

  if (!imageSrc) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Crop Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">
            Drag to reposition • Resize corners to adjust • Image will be cropped to exactly 400x400 pixels
          </p>
          <div className="flex flex-col items-center space-y-4">
            <div className="w-full flex justify-center">
              <ReactCrop
                crop={crop}
                onChange={onCropChange}
                onComplete={onCropComplete}
                aspect={aspectRatio || 1}
                minWidth={fixedSize ? undefined : minWidth}
                minHeight={fixedSize ? undefined : minHeight}
                className="max-w-full"
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imageSrc}
                  style={{ maxHeight: '60vh', maxWidth: '100%', display: 'block' }}
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            </div>
            
            {croppedImageUrl && (
              <div className="mt-4 w-full">
                <p className="text-sm font-medium text-[hsl(var(--foreground))] mb-2">Preview (400x400px):</p>
                <div className="flex justify-center">
                  <img
                    src={croppedImageUrl}
                    alt="Cropped preview"
                    className="w-48 h-48 object-cover border-2 border-[hsl(var(--border))] rounded-md shadow-md"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-[hsl(var(--border))]">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!completedCrop}
            >
              Save Cropped Image
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PhotoCropModal;

