'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductPhoto } from '@/types';

interface PhotoCarouselProps {
  photos: ProductPhoto[];
  fallbackUrl?: string;
  alt: string;
  className?: string;
}

export default function PhotoCarousel({ 
  photos, 
  fallbackUrl, 
  alt, 
  className = "w-16 h-16" 
}: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Use photos array, fallback to single photo, or default placeholder
  const displayPhotos = photos && photos.length > 0 
    ? photos.map(photo => photo.large_url || photo.url)
    : fallbackUrl 
    ? [fallbackUrl]
    : [];

  const hasMultiplePhotos = displayPhotos.length > 1;

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % displayPhotos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + displayPhotos.length) % displayPhotos.length);
  };

  if (displayPhotos.length === 0) {
    // No photos available - show placeholder
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0`}>
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden rounded-lg flex-shrink-0 group`}>
      <img
        src={displayPhotos[currentIndex]}
        alt={alt}
        className="w-full h-full object-cover"
        onError={(e) => {
          // If image fails to load, try next photo or show placeholder
          if (currentIndex < displayPhotos.length - 1) {
            setCurrentIndex(currentIndex + 1);
          } else {
            // Show placeholder by hiding image
            e.currentTarget.style.display = 'none';
          }
        }}
      />
      
      {hasMultiplePhotos && (
        <>
          {/* Navigation buttons - only show on hover */}
          <button
            onClick={prevPhoto}
            className="absolute left-1 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-75"
            type="button"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          
          <button
            onClick={nextPhoto}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-75"
            type="button"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
          
          {/* Photo indicators */}
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {displayPhotos.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-1.5 h-1.5 rounded-full ${
                  index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                }`}
                type="button"
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
} 