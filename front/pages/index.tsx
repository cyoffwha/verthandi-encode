import React from 'react';
import { ImageGallery } from "@/components/ImageGallery";
import { ToastProvider } from '@/hooks/use-toast';

const Index = () => {
  return (
    <ToastProvider>
      <ImageGallery />
    </ToastProvider>
  );
};

export default Index;
