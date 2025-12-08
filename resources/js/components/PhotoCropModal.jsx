import React, { useState, useRef, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

function PhotoCropModal({ imageFile, onCropComplete: onCropCompleteCallback, onCancel, aspectRatio = null, minWidth = 200, minHeight = 200 }) {
  const [crop, setCrop] = useState({ unit: '%', width: 90, aspect: aspectRatio });
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
    
    // Set initial crop to cover most of the image
    const cropWidth = Math.min(90, (naturalWidth / naturalWidth) * 100);
    const cropHeight = aspectRatio 
      ? cropWidth / aspectRatio 
      : Math.min(90, (naturalHeight / naturalHeight) * 100);
    
    setCrop({
      unit: '%',
      width: cropWidth,
      height: aspectRatio ? undefined : cropHeight,
      aspect: aspectRatio,
    });
  };

  const makeClientCrop = async (crop) => {
    if (imgRef.current && crop.width && crop.height) {
      const croppedImage = await getCroppedImg(imgRef.current, crop, imageFile.name);
      setCroppedImageUrl(croppedImage);
    }
  };

  const onCropChange = (crop) => {
    setCrop(crop);
  };

  const onCropComplete = (crop) => {
    setCompletedCrop(crop);
    makeClientCrop(crop);
  };

  const getCroppedImg = (image, crop, fileName) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Canvas is empty');
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
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Canvas is empty');
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
          <div className="flex flex-col items-center space-y-4">
            <ReactCrop
              crop={crop}
              onChange={onCropChange}
              onComplete={onCropComplete}
              aspect={aspectRatio}
              minWidth={minWidth}
              minHeight={minHeight}
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imageSrc}
                style={{ maxHeight: '70vh', maxWidth: '100%' }}
                onLoad={onImageLoad}
              />
            </ReactCrop>
            
            {croppedImageUrl && (
              <div className="mt-4">
                <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">Preview:</p>
                <img
                  src={croppedImageUrl}
                  alt="Cropped preview"
                  className="max-w-xs border border-[hsl(var(--border))] rounded-md"
                />
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

