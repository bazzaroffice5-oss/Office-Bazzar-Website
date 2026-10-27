'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { CartItem, Product, Coupon } from '@/types';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedPackSize?: string, openDrawer?: boolean) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  appliedCoupon: Coupon | null;
  applyCoupon: (coupon: Coupon) => void;
  removeCoupon: () => void;
  itemCount: number;
  subtotal: number;
  gstAmount: number;
  discountAmount: number;
  shippingCharge: number;
  total: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const FREE_SHIPPING_THRESHOLD = 999;
const STANDARD_SHIPPING_FEE = 99;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('officebazzar_cart');
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
      const savedCoupon = localStorage.getItem('officebazzar_coupon');
      if (savedCoupon) {
        setAppliedCoupon(JSON.parse(savedCoupon));
      }
    } catch {
      // Ignore localStorage errors
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem('officebazzar_cart', JSON.stringify(items));
      if (appliedCoupon) {
        localStorage.setItem('officebazzar_coupon', JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem('officebazzar_coupon');
      }
    } catch {
      // Ignore error
    }
  }, [items, appliedCoupon, isInitialized]);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const addToCart = (product: Product, quantity = 1, selectedPackSize?: string, openDrawer = false) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        updated[existingIndex].quantity = Math.min(newQty, product.stockQuantity || 999);
        return updated;
      } else {
        return [
          ...prev,
          {
            id: `item-${Date.now()}-${product.id}`,
            product,
            quantity: Math.min(quantity, product.stockQuantity || 999),
            selectedPackSize: selectedPackSize || product.packSize,
          },
        ];
      }
    });

    // Subtle success notification
    showToast('Product added to quote cart');

    if (openDrawer) {
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const maxStock = item.product.stockQuantity || 999;
          return { ...item, quantity: Math.min(quantity, maxStock) };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = (coupon: Coupon) => {
    setAppliedCoupon(coupon);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Calculations
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (item.product.price ?? 0) * item.quantity, 0);

  // Discount calculation
  let discountAmount = 0;
  if (appliedCoupon && subtotal >= appliedCoupon.minCartAmount) {
    if (appliedCoupon.discountType === 'percentage') {
      discountAmount = (subtotal * appliedCoupon.discountValue) / 100;
      if (appliedCoupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, appliedCoupon.maxDiscountAmount);
      }
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
  }

  // GST Calculation (18% standard across corporate workplace supplies)
  const gstAmount = Math.round((subtotal - discountAmount) * 0.18 * 100) / 100;

  // Shipping Calculation: Free above threshold if cart not empty
  const shippingCharge = subtotal >= FREE_SHIPPING_THRESHOLD || items.length === 0 ? 0 : STANDARD_SHIPPING_FEE;

  // Total payable
  const total = Math.max(0, Math.round((subtotal - discountAmount + gstAmount + shippingCharge) * 100) / 100);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        itemCount,
        subtotal,
        gstAmount,
        discountAmount,
        shippingCharge,
        total,
        isCartOpen,
        setIsCartOpen,
        toastMessage,
        showToast,
      }}
    >
      {children}
      {toastMessage && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900/95 text-white text-xs sm:text-sm font-medium px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/60 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span className="text-slate-100">{toastMessage}</span>
          <Link
            href="/cart"
            onClick={() => setToastMessage(null)}
            className="ml-1.5 font-bold text-[#38bdf8] hover:text-white underline cursor-pointer transition-colors"
          >
            View Cart
          </Link>
        </aside>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
