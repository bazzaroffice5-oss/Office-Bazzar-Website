'use client';

import React, { useState } from 'react';
import { MapPin, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLocation } from '@/context/LocationContext';

export default function PincodeModal() {
  const { location, isModalOpen, closeModal, setPincode } = useLocation();
  const [inputPin, setInputPin] = useState(location.pincode);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = setPincode(inputPin);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => {
        closeModal();
        setFeedback(null);
      }, 1000);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleQuickSelect = (pin: string) => {
    setInputPin(pin);
    const res = setPincode(pin);
    if (res.success) {
      closeModal();
      setFeedback(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-md shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <div className="p-1.5 bg-blue-50 rounded-sm text-blue-900">
              <MapPin className="w-4 h-4" />
            </div>
            <span>Select Delivery Location</span>
          </div>
          <button
            onClick={closeModal}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close delivery location modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600">
            Enter your 6-digit PIN code to check shipping rates, same-day dispatch availability, and exact delivery dates.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                maxLength={6}
                value={inputPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setInputPin(val);
                  setFeedback(null);
                }}
                placeholder="Enter 6-Digit PIN Code"
                className="w-full pl-3.5 pr-20 py-2 text-xs font-semibold tracking-wider text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-900"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-3.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-sm transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>
          </form>

          {feedback && (
            <div
              className={`p-2.5 rounded-md flex items-center space-x-2 text-xs font-medium ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Quick Select Buttons */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Popular Delivery Hubs
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickSelect('600014')}
                className={`p-2 text-left border rounded-md transition-all cursor-pointer ${
                  location.pincode === '600014'
                    ? 'border-blue-900 bg-blue-50/50 text-blue-950 font-semibold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50'
                }`}
              >
                <div className="font-bold text-slate-900 text-xs">Royapettah, Chennai</div>
                <div className="text-[10px] text-slate-500">600014 • Express Same Day</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('600119')}
                className={`p-2 text-left border rounded-md transition-all cursor-pointer ${
                  location.pincode === '600119'
                    ? 'border-blue-900 bg-blue-50/50 text-blue-950 font-semibold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50'
                }`}
              >
                <div className="font-bold text-slate-900 text-xs">OMR / Sholinganallur</div>
                <div className="text-[10px] text-slate-500">600119 • Express Same Day</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('641001')}
                className={`p-2 text-left border rounded-md transition-all cursor-pointer ${
                  location.pincode === '641001'
                    ? 'border-blue-900 bg-blue-50/50 text-blue-950 font-semibold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50'
                }`}
              >
                <div className="font-bold text-slate-900 text-xs">Coimbatore Central</div>
                <div className="text-[10px] text-slate-500">641001 • 1-2 Days</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSelect('560001')}
                className={`p-2 text-left border rounded-md transition-all cursor-pointer ${
                  location.pincode === '560001'
                    ? 'border-blue-900 bg-blue-50/50 text-blue-950 font-semibold'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50'
                }`}
              >
                <div className="font-bold text-slate-900 text-xs">Bengaluru Hub</div>
                <div className="text-[10px] text-slate-500">560001 • 2 Days</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-500">
          Delivery rates and tax estimates automatically revalidate based on chosen pincode.
        </div>
      </div>
    </div>
  );
}
