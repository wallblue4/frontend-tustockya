import React, { useState } from 'react';
import { Camera } from 'lucide-react';

interface ProductImageProps {
  image?: string;
  alt: string;
  className?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  image,
  alt,
  className = 'w-20 h-20 object-cover rounded-md flex-shrink-0',
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  if (!image || imageError) {
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center`}>
        <Camera className="h-8 w-8 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={image}
      alt={alt}
      className={className}
      onError={() => {
        console.log(`Error cargando imagen: ${image}`);
        setImageError(true);
        setImageLoading(false);
      }}
      onLoad={() => setImageLoading(false)}
      style={{ display: imageLoading ? 'none' : 'block' }}
    />
  );
};
