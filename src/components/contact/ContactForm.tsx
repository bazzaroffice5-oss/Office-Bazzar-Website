'use client';

import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  // Honeypot field to trap automated spam bots
  const [website, setWebsite] = useState('');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Please enter your contact phone number.');
      return;
    }
    if (!message.trim()) {
      setErrorMessage('Please enter your message.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          companyName: companyName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          message: message.trim(),
          website, // Honeypot
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.error || 'Failed to submit contact enquiry. Please check your details and try again.'
        );
      }

      setReferenceNumber(data.referenceNumber || 'OB-CNT-CONFIRMED');
      setSubmitted(true);
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'An unexpected error occurred. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-emerald-100 text-[#16a34a] rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900">Message Sent Successfully!</h3>
          {referenceNumber && (
            <p className="text-xs font-mono font-semibold text-emerald-800 bg-emerald-100/70 inline-block px-3 py-1 rounded-md">
              Reference: {referenceNumber}
            </p>
          )}
        </div>
        <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
          Thank you for reaching out to OfficeBazzar. Our sales and support team in Royapettah, Chennai has received your details and will respond within 24 hours.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setReferenceNumber('');
            setMessage('');
            setErrorMessage(null);
          }}
          className="px-5 py-2.5 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
      {/* Error Message Banner */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700"
        >
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {/* Honeypot field (hidden from screen reader & visual users, filled by bots) */}
      <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {/* Name */}
      <div>
        <label htmlFor="contact-name" className="block text-xs font-bold text-slate-700 mb-1">
          Name <span className="text-rose-500">*</span>
        </label>
        <input
          id="contact-name"
          type="text"
          required
          disabled={loading}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errorMessage) setErrorMessage(null);
          }}
          placeholder="Your full name"
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#004b87] focus:bg-white disabled:opacity-60 transition-all"
        />
      </div>

      {/* Company Name */}
      <div>
        <label htmlFor="contact-company" className="block text-xs font-bold text-slate-700 mb-1">
          Company Name
        </label>
        <input
          id="contact-company"
          type="text"
          disabled={loading}
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Your company or business name"
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#004b87] focus:bg-white disabled:opacity-60 transition-all"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="contact-email" className="block text-xs font-bold text-slate-700 mb-1">
          Email <span className="text-rose-500">*</span>
        </label>
        <input
          id="contact-email"
          type="email"
          required
          disabled={loading}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errorMessage) setErrorMessage(null);
          }}
          placeholder="name@company.com"
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#004b87] focus:bg-white disabled:opacity-60 transition-all"
        />
      </div>

      {/* Phone Number */}
      <div>
        <label htmlFor="contact-phone" className="block text-xs font-bold text-slate-700 mb-1">
          Phone Number <span className="text-rose-500">*</span>
        </label>
        <input
          id="contact-phone"
          type="tel"
          required
          disabled={loading}
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (errorMessage) setErrorMessage(null);
          }}
          placeholder="+91 98400 XXXXX"
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#004b87] focus:bg-white disabled:opacity-60 transition-all"
        />
      </div>

      {/* Message */}
      <div>
        <label htmlFor="contact-message" className="block text-xs font-bold text-slate-700 mb-1">
          Message <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="contact-message"
          rows={4}
          required
          disabled={loading}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (errorMessage) setErrorMessage(null);
          }}
          placeholder="How can we help your business? (e.g. bulk stationery supplies, cleaning formulations, quotation request)"
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#004b87] focus:bg-white disabled:opacity-60 transition-all"
        />
      </div>

      {/* Submit Button (Brand Green) */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-6 bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-60 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-emerald-700/20 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Sending Message...</span>
          </>
        ) : (
          <>
            <span>Send Message</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
