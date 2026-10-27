'use client';

import React, { useState } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !message) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-emerald-100 text-[#16a34a] rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Message Sent Successfully!</h3>
        <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
          Thank you for reaching out to OfficeBazzar. Our sales and support team in Royapettah, Chennai will respond within 24 hours.
        </p>
        <button
          type="button"
          onClick={() => {
            setSubmitted(false);
            setMessage('');
          }}
          className="px-5 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold rounded-xl transition-colors"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Name <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your full name"
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#004b87] focus:bg-white transition-all"
        />
      </div>

      {/* Company Name */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Company Name
        </label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Your company or business name"
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#004b87] focus:bg-white transition-all"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Email <span className="text-rose-500">*</span>
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#004b87] focus:bg-white transition-all"
        />
      </div>

      {/* Phone Number */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Phone Number <span className="text-rose-500">*</span>
        </label>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 98400 XXXXX"
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#004b87] focus:bg-white transition-all"
        />
      </div>

      {/* Message */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Message <span className="text-rose-500">*</span>
        </label>
        <textarea
          rows={4}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help your business?"
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-[#004b87] focus:bg-white transition-all"
        />
      </div>

      {/* Submit Button (Brand Green) */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-6 bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-60 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-emerald-700/20 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
      >
        {loading ? (
          <span>Sending...</span>
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
