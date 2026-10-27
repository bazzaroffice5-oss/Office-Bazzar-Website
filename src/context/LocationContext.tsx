'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface DeliveryLocation {
  pincode: string;
  city: string;
  state: string;
  deliveryDays: string;
  isExpressAvailable: boolean;
}

interface LocationContextType {
  location: DeliveryLocation;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  setPincode: (pin: string) => { success: boolean; message: string };
  checkPincodeDelivery: (pin: string) => DeliveryLocation | null;
}

const DEFAULT_LOCATION: DeliveryLocation = {
  pincode: '600014',
  city: 'Royapettah, Chennai',
  state: 'Tamil Nadu',
  deliveryDays: 'Same Day / Next Day',
  isExpressAvailable: true,
};

const PINCODE_MAP: Record<string, Omit<DeliveryLocation, 'pincode'>> = {
  '600014': { city: 'Royapettah, Chennai', state: 'Tamil Nadu', deliveryDays: 'Same Day Dispatch', isExpressAvailable: true },
  '600001': { city: 'Parrys, Chennai', state: 'Tamil Nadu', deliveryDays: 'Same Day Dispatch', isExpressAvailable: true },
  '600096': { city: 'Perungudi / OMR, Chennai', state: 'Tamil Nadu', deliveryDays: 'Same Day Dispatch', isExpressAvailable: true },
  '600119': { city: 'Sholinganallur, Chennai', state: 'Tamil Nadu', deliveryDays: 'Same Day Dispatch', isExpressAvailable: true },
  '641001': { city: 'Coimbatore', state: 'Tamil Nadu', deliveryDays: '1-2 Days', isExpressAvailable: true },
  '625001': { city: 'Madurai', state: 'Tamil Nadu', deliveryDays: '1-2 Days', isExpressAvailable: true },
  '560001': { city: 'Bengaluru Central', state: 'Karnataka', deliveryDays: '2 Days', isExpressAvailable: false },
  '500001': { city: 'Hyderabad', state: 'Telangana', deliveryDays: '2-3 Days', isExpressAvailable: false },
  '400001': { city: 'Mumbai', state: 'Maharashtra', deliveryDays: '2-3 Days', isExpressAvailable: false },
  '110001': { city: 'New Delhi', state: 'Delhi NCR', deliveryDays: '3-4 Days', isExpressAvailable: false },
  '700001': { city: 'Kolkata', state: 'West Bengal', deliveryDays: '3-4 Days', isExpressAvailable: false },
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<DeliveryLocation>(DEFAULT_LOCATION);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('officebazzar_pincode');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.pincode) setLocation(parsed);
      }
    } catch {
      // Ignore
    }
  }, []);

  const checkPincodeDelivery = (pin: string): DeliveryLocation | null => {
    const cleanPin = pin.trim();
    if (!/^\d{6}$/.test(cleanPin)) return null;

    if (PINCODE_MAP[cleanPin]) {
      return { pincode: cleanPin, ...PINCODE_MAP[cleanPin] };
    }

    // Default pan-India logic
    if (cleanPin.startsWith('60') || cleanPin.startsWith('61') || cleanPin.startsWith('62') || cleanPin.startsWith('63') || cleanPin.startsWith('64')) {
      return {
        pincode: cleanPin,
        city: 'Tamil Nadu Region',
        state: 'Tamil Nadu',
        deliveryDays: '1-2 Days',
        isExpressAvailable: true,
      };
    }

    return {
      pincode: cleanPin,
      city: 'India Hub',
      state: 'National Delivery',
      deliveryDays: '3-5 Days',
      isExpressAvailable: false,
    };
  };

  const setPincode = (pin: string) => {
    const checked = checkPincodeDelivery(pin);
    if (!checked) {
      return { success: false, message: 'Please enter a valid 6-digit Indian PIN code.' };
    }
    setLocation(checked);
    try {
      localStorage.setItem('officebazzar_pincode', JSON.stringify(checked));
    } catch {
      // Ignore
    }
    setIsModalOpen(false);
    return {
      success: true,
      message: `Delivery set to ${checked.city} (${checked.pincode}). Delivery in ${checked.deliveryDays}.`,
    };
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        isModalOpen,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
        setPincode,
        checkPincodeDelivery,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
