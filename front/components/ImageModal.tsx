import React, { useEffect } from 'react';
import { X, TrendingDown, FileImage, Zap } from 'lucide-react';

interface ImageModalProps {
  image: {
    url: string;
    name: string;
    isEncoded: boolean;
    originalSize?: number; // Size in bytes
    encodedSize?: number; // Size in bytes
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

  const formatFileSize = (bytes?: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const calculateSavings = () => {
    if (!image.originalSize || !image.encodedSize || image.originalSize <= 0) return null;
    const savings = ((image.originalSize - image.encodedSize) / image.originalSize) * 100;
    return {
      percentage: Math.round(savings),
      absoluteSaving: image.originalSize - image.encodedSize
    };
  };

  const savings = calculateSavings();
  const isEffectiveEncoding = savings && savings.percentage >= 5;

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
          !image.isEncoded 
            ? 'bg-gray-900/70 text-gray-300 border border-gray-700/50' 
            : isEffectiveEncoding
              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
              : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
        }`}
      >
        <div
          className={`w-3 h-3 rounded-full ${
            !image.isEncoded 
              ? 'bg-gray-300' 
              : isEffectiveEncoding
                ? 'bg-green-500'
                : 'bg-gray-500'
          }`}
        />
        <span className="text-sm font-medium">
          {!image.isEncoded 
            ? 'Original' 
            : isEffectiveEncoding
              ? 'Effectively Encoded (-' + (savings?.percentage || 0) + '%)'
              : 'Encoded (Minimal Savings)'}
        </span>
      </div>

      {/* Size Comparison Card */}
      {image.isEncoded && image.originalSize && image.encodedSize && (
        <div className="absolute top-4 right-20 z-10 bg-black/80 backdrop-blur-sm rounded-lg border border-white/20 p-4 min-w-[280px]">
          <div className="flex items-center gap-2 mb-3">
            <Zap className={`w-4 h-4 ${isEffectiveEncoding ? 'text-yellow-400' : 'text-gray-400'}`} />
            <h4 className="text-white font-semibold text-sm">Compression Results</h4>
          </div>
          
          <div className="space-y-3">
            {/* Original Size */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileImage className="w-4 h-4 text-blue-400" />
                <span className="text-gray-300 text-sm">Original</span>
              </div>
              <span className="text-white font-mono text-sm">
                {formatFileSize(image.originalSize)}
              </span>
            </div>

            {/* Encoded Size */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileImage className={`w-4 h-4 ${isEffectiveEncoding ? 'text-green-400' : 'text-gray-400'}`} />
                <span className="text-gray-300 text-sm">Encoded</span>
              </div>
              <span className="text-white font-mono text-sm">
                {formatFileSize(image.encodedSize)}
              </span>
            </div>

            {/* Divider */}
            <div className="border-t border-white/20"></div>

            {/* Savings */}
            {savings && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingDown className={`w-4 h-4 ${isEffectiveEncoding ? 'text-green-400' : 'text-gray-400'}`} />
                  <span className="text-gray-300 text-sm">Saved</span>
                </div>
                <div className="text-right">
                  <div className={`font-semibold text-sm ${
                    isEffectiveEncoding ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    -{savings.percentage}%
                  </div>
                  <div className="text-gray-400 text-xs">
                    -{formatFileSize(savings.absoluteSaving)}
                  </div>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {savings && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Size Reduction</span>
                  <span>{savings.percentage}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`${isEffectiveEncoding 
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                      : 'bg-gray-500'} h-2 rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${Math.min(savings.percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
