import React, { createContext, useContext, useState, ReactNode } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  loadingText: string;
  setLoadingText: (text: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading, loadingText, setLoadingText }}>
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 shadow-xl">
            <LoadingSpinner size="lg" text={loadingText} />
          </div>
        </div>
      )}
      {children}
    </LoadingContext.Provider>
  );
}; 