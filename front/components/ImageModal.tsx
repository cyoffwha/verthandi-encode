import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ImageModalProps {
  image: {
    url: string;
    name: string;
    isEncoded: boolean;
  };
  onClose: () => void;
}

export const ImageModal = ({ image, onClose }: ImageModalProps) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 group"
      >
        <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </button>

      <div
        className={`absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-sm ${
          image.isEncoded 
            ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
            : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
        }`}
      >
        <div
          className={`w-3 h-3 rounded-full ${
            image.isEncoded ? 'bg-green-500' : 'bg-gray-500'
          }`}
        />
        <span className="text-sm font-medium">
          {image.isEncoded ? 'Encoded' : 'Original'}
        </span>
      </div>

      <div 
        className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={image.url}
          alt={image.name}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
        />
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 rounded-b-lg">
          <h3 className="text-white text-lg font-semibold mb-1 truncate">
            {image.name}
          </h3>
          <p className="text-gray-300 text-sm">
            Click outside or press ESC to close
          </p>
        </div>
      </div>
    </div>
  );
};
