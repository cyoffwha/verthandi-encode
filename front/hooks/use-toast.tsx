import React from 'react';

// Types
type ToastProps = {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
};

type ToastContextType = {
  toast: (props: ToastProps) => void;
};

// Create a context
const ToastContext = React.createContext<ToastContextType | null>(null);

// Provider component
export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = React.useState<(ToastProps & { id: string })[]>([]);

  const toast = ({ title, description, variant = 'default' }: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed bottom-0 right-0 p-4 space-y-2 z-50">
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className={`p-4 rounded-lg shadow-lg max-w-md transform transition-all duration-300 animate-in slide-in-from-right-5 ${
              t.variant === 'destructive' 
                ? 'bg-red-600 text-white' 
                : 'bg-white text-gray-800 border border-gray-200'
            }`}
          >
            <h3 className="font-semibold text-sm">{t.title}</h3>
            <p className="text-sm mt-1">{t.description}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Hook to use the toast
export const useToast = () => {
  const context = React.useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
};
