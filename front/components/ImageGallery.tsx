import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ImageModal } from './ImageModal';
import { useToast } from '@/hooks/use-toast';
import { FolderOpen, RefreshCw } from 'lucide-react';

interface ImageData {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  isEncoded: boolean;
  size?: string;
  type?: string;
  originalSize?: number; // Size in bytes
  encodedSize?: number; // Size in bytes
}

export const ImageGallery = () => {
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [isEncoding, setIsEncoding] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Function to launch the native folder selector via the backend API
  const handleSelectFolder = async () => {
    try {
      const response = await fetch('http://localhost:3001/launch-folder-selector', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to launch folder selector');
      }

      const data = await response.json();
      if (data.folderName) {
        setSelectedFolder(data.folderName);
        await loadImagesFromFolder(data.folderName);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to launch folder selector: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  // Load images from the selected folder
  const loadImagesFromFolder = async (folderPath: string) => {
    try {
      const response = await fetch('http://localhost:3001/list-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderPath })
      });

      if (!response.ok) {
        throw new Error('Failed to list files');
      }

      const data = await response.json();
      const imageFiles = data.files.filter((file: any) => 
        file.type === 'file' && 
        /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(file.name)
      );

      if (imageFiles.length === 0) {
        toast({
          title: "No images found",
          description: "The selected folder doesn't contain any supported image files.",
          variant: "destructive"
        });
        return;
      }

      // Check if there's a reencoded subfolder
      const hasReencodedFolder = data.files.some((file: any) => 
        file.type === 'folder' && file.name === 'reencoded'
      );

      // Get the list of reencoded files if the folder exists
      let reencodedFiles: any[] = [];
      if (hasReencodedFolder) {
        const reencodedResponse = await fetch('http://localhost:3001/list-files', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ folderPath: `${folderPath}/reencoded` })
        });

        if (reencodedResponse.ok) {
          const reencodedData = await reencodedResponse.json();
          reencodedFiles = reencodedData.files.filter((file: any) => file.type === 'file');
        }
      }

      // Create image data objects
      const imageData = imageFiles.map((file: any, index: number) => {
        const fileName = file.name;
        const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
        
        // Check if this image has been reencoded
        const matchingReencodedFile = reencodedFiles.find(reencoded => 
          reencoded.name === `${fileName}.jxl` || reencoded.name === `${baseName}.jxl`
        );
        
        const isEncoded = !!matchingReencodedFile;
        
        const originalSize = typeof file.size === 'number' ? file.size : undefined;
        const encodedSize = isEncoded && typeof matchingReencodedFile.size === 'number' 
          ? matchingReencodedFile.size 
          : undefined;

        return {
          id: `img-${index}`,
          name: fileName,
          url: `http://localhost:3001/get-image/${encodeURIComponent(folderPath)}/${encodeURIComponent(fileName)}`,
          thumbnailUrl: `http://localhost:3001/get-image/${encodeURIComponent(folderPath)}/${encodeURIComponent(fileName)}`,
          isEncoded,
          size: originalSize ? formatFileSize(originalSize) : 'Unknown',
          type: getFileType(fileName),
          originalSize,
          encodedSize
        };
      });

      setImages(imageData);
      
      toast({
        title: "Folder loaded successfully",
        description: `Found ${imageData.length} images`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to load images: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return ext;
  };

  const handleReencode = async () => {
    if (images.length === 0 || !selectedFolder) {
      toast({
        title: "No images to encode",
        description: "Please select a folder with images first.",
        variant: "destructive"
      });
      return;
    }

    setIsEncoding(true);
    
    try {
      const response = await fetch('http://localhost:3001/reencode-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderPath: selectedFolder })
      });

      if (!response.ok) {
        throw new Error('Failed to start re-encoding process');
      }

      const result = await response.json();          // Update UI based on results
          const updatedImages = [...images];
          result.results.forEach((result: any) => {
            if (result.status === 'success') {
              const imageIndex = updatedImages.findIndex(img => img.name === result.file);
              if (imageIndex !== -1) {
                updatedImages[imageIndex] = {
                  ...updatedImages[imageIndex],
                  isEncoded: true,
                  originalSize: result.oldSize,
                  encodedSize: result.newSize
                };
              }
            }
          });
      
      setImages(updatedImages);
      
      toast({
        title: "Encoding completed",
        description: `Successfully processed ${result.results.filter((r: any) => r.status === 'success').length} images.`,
      });
    } catch (error) {
      toast({
        title: "Encoding failed",
        description: `There was an error during the encoding process: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsEncoding(false);
    }
  };

  const openModal = (image: ImageData) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Image Gallery</h1>
          <div className="flex gap-4 items-center flex-wrap">
            <Button
              onClick={handleSelectFolder}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-all duration-200"
            >
              <FolderOpen className="w-5 h-5" />
              Select Folder
            </Button>
            
            <Button
              onClick={handleReencode}
              disabled={images.length === 0 || isEncoding}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition-all duration-200"
            >
              <RefreshCw className={`w-5 h-5 ${isEncoding ? 'animate-spin' : ''}`} />
              {isEncoding ? 'Encoding...' : 'Reencode'}
            </Button>
            
            {selectedFolder && (
              <span className="text-gray-600 bg-white px-4 py-2 rounded-lg shadow-sm">
                {selectedFolder}
              </span>
            )}
          </div>
        </div>

        {images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {images.map((image) => (
              <Card
                key={image.id}
                className="relative group cursor-pointer overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={() => openModal(image)}
              >
                <div className="aspect-square relative">
                  <img
                    src={image.thumbnailUrl}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-20 transition-opacity duration-200" />
                  
                  <div
                    className={`absolute top-2 right-2 w-4 h-4 rounded-full border-2 border-white shadow-lg transition-all duration-300 ${
                      !image.isEncoded 
                        ? 'bg-black shadow-black/50'
                        : image.originalSize && image.encodedSize && 
                          ((image.originalSize - image.encodedSize) / image.originalSize * 100 >= 5)
                          ? 'bg-green-500 shadow-green-500/50' 
                          : 'bg-gray-500 shadow-gray-500/50'
                    }`}
                  />
                  
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-white text-xs truncate font-medium">
                      {image.name}
                    </p>
                    {image.size && (
                      <p className="text-white/70 text-xs">
                        {image.size}
                        {image.isEncoded && image.originalSize && image.encodedSize && (
                          <span className={`ml-1 ${
                            (image.originalSize - image.encodedSize) / image.originalSize * 100 >= 5
                              ? 'text-green-400'
                              : 'text-gray-400'
                          }`}>
                            ({Math.round((image.originalSize - image.encodedSize) / image.originalSize * 100)}% smaller)
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-32 h-32 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
              <FolderOpen className="w-16 h-16 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-600 mb-2">No Images Selected</h2>
            <p className="text-gray-500">Choose a folder to view your image gallery</p>
          </div>
        )}
      </div>

      {selectedImage && (
        <ImageModal
          image={{
            ...selectedImage,
            originalSize: selectedImage.originalSize,
            encodedSize: selectedImage.encodedSize
          }}
          onClose={closeModal}
        />
      )}
    </div>
  );
};
