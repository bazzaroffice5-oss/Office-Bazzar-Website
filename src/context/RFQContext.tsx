'use client';

import React, { createContext, useContext, useState } from 'react';
import RFQModal from '@/components/modals/RFQModal';

interface RFQContextType {
  isRFQOpen: boolean;
  prefilledProduct?: string;
  openRFQ: (productName?: string) => void;
  closeRFQ: () => void;
}

const RFQContext = createContext<RFQContextType>({
  isRFQOpen: false,
  openRFQ: () => {},
  closeRFQ: () => {},
});

export function RFQProvider({ children }: { children: React.ReactNode }) {
  const [isRFQOpen, setIsRFQOpen] = useState(false);
  const [prefilledProduct, setPrefilledProduct] = useState<string | undefined>(undefined);

  const openRFQ = (productName?: string) => {
    setPrefilledProduct(productName);
    setIsRFQOpen(true);
  };

  const closeRFQ = () => {
    setIsRFQOpen(false);
    setPrefilledProduct(undefined);
  };

  return (
    <RFQContext.Provider value={{ isRFQOpen, prefilledProduct, openRFQ, closeRFQ }}>
      {children}
      <RFQModal
        isOpen={isRFQOpen}
        onClose={closeRFQ}
        prefilledProduct={prefilledProduct}
      />
    </RFQContext.Provider>
  );
}

export function useRFQ() {
  const context = useContext(RFQContext);
  if (!context) {
    throw new Error('useRFQ must be used within an RFQProvider');
  }
  return context;
}
