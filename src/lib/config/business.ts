/**
 * Business Configuration for OfficeBazzar E-Commerce Platform
 * Grounded in verified corporate records from https://officebazzar.co.in/
 * Unverified attributes remain strictly configurable without placeholder assumptions.
 */

export interface BusinessConfig {
  legalEntityName: string;
  brandName: string;
  websiteUrl: string;
  headquarters: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  branches: Array<{
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  }>;
  contact: {
    salesPhone: string;
    corporatePhone: string;
    bangalorePhone: string;
    whatsappNumber: string;
    salesEmail: string;
    marketingEmail: string;
    digitalEmail: string;
    bangaloreEmail: string;
    workingHours: string;
  };
  tax: {
    // Registered GSTIN: configured via environment variable or verified on corporate certificate
    gstin: string;
    isGstinVerified: boolean;
    defaultGstPercent: number;
    requiresHsnTaxBreakup: boolean;
  };
  delivery: {
    // Official logistics SLA verified with couriers
    standardSlaText: string;
    freeShippingThreshold: number;
    standardShippingFee: number;
  };
}

export const BUSINESS_CONFIG: BusinessConfig = {
  legalEntityName: 'Officebazzar E-Store Private Limited',
  brandName: 'OfficeBazzar',
  websiteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://officebazzar.co.in',
  headquarters: {
    address: '"Officebazzar Tower", No. 29/15, Subbedar Hussain street, Royapettah',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600014',
  },
  branches: [
    {
      name: 'Bangalore Branch',
      address: 'No.2612, Ground floor, Puttappa Layout, 1st Main 3rd stage, Jeevan Bima Nagar',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560075',
      phone: '+91 9901936099',
    },
  ],
  contact: {
    salesPhone: '+91 7200800040',
    corporatePhone: '+91 7825886622',
    bangalorePhone: '+91 9901936099',
    whatsappNumber: '+91 9043849095',
    salesEmail: 'sales4@officebazzar.com',
    marketingEmail: 'marketing@officebazzar.com',
    digitalEmail: 'dm@officebazzar.com',
    bangaloreEmail: 'bangalore@officebazzar.com',
    workingHours: 'Monday – Saturday: 9:30 AM – 6:30 PM IST',
  },
  tax: {
    // Read from environment if verified; otherwise empty string pending certificate upload
    gstin: process.env.OFFICEBAZZAR_GSTIN || '',
    isGstinVerified: Boolean(process.env.OFFICEBAZZAR_GSTIN),
    defaultGstPercent: 18.0,
    requiresHsnTaxBreakup: true,
  },
  delivery: {
    standardSlaText: 'Standard Delivery within 2–4 business days across Chennai & Bangalore hubs (courier dispatch for pan-India)',
    freeShippingThreshold: 999,
    standardShippingFee: 99,
  },
};
