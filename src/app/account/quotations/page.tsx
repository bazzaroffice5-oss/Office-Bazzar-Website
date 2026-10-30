'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  ArrowRight,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Download,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Quotation, QuotationStatus } from '@/types';

export default function CustomerQuotationsPage() {
  const { user } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Guest lookup state
  const [lookupRef, setLookupRef] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCustomerQuotes() {
      if (!user?.email && !user?.id) {
        setLoading(false);
        return;
      }

      try {
        const query = user?.id ? `customerId=${user.id}` : `email=${encodeURIComponent(user?.email || '')}`;
        const res = await fetch(`/api/quotations/customer?${query}`);
        const data = await res.json();
        if (res.ok && data.quotations) {
          setQuotations(data.quotations);
        }
      } catch (err) {
        console.error('Failed to load quotations:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCustomerQuotes();
  }, [user]);

  const handleGuestLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupRef.trim()) {
      setLookupError('Please enter a quotation reference number.');
      return;
    }

    if (!lookupEmail.trim()) {
      setLookupError('Please enter the customer email address used during quotation submission.');
      return;
    }

    setLookupLoading(true);
    setLookupError(null);

    try {
      const res = await fetch(`/api/quotations/${encodeURIComponent(lookupRef.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.quotation) {
        setLookupError('Quotation reference not found. Please verify the code.');
        return;
      }

      const q = data.quotation;
      if (!q.email || q.email.toLowerCase() !== lookupEmail.trim().toLowerCase()) {
        setLookupError('Security verification failed: Email address does not match the quotation record.');
        return;
      }

      // Add to current display list if not already present
      setQuotations((prev) => {
        if (prev.some((item) => item.id === q.id)) return prev;
        return [q, ...prev];
      });
      setExpandedId(q.id);
      setLookupRef('');
      setLookupEmail('');
    } catch (err: unknown) {
      setLookupError(err instanceof Error ? err.message : 'Error looking up quotation');
    } finally {
      setLookupLoading(false);
    }
  };

  const getStatusBadge = (status: QuotationStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            New (Pending Review)
          </span>
        );
      case 'under_review':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            Under Sales Review
          </span>
        );
      case 'quotation_prepared':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
            Quotation Prepared
          </span>
        );
      case 'sent_to_customer':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Quote Sent to You
          </span>
        );
      case 'accepted':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            Quotation Accepted
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            Declined
          </span>
        );
      case 'closed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            Closed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-8">
      <div className="b2b-container">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 mb-6 gap-3">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-1">
              <Link href="/account" className="hover:text-blue-900">Account</Link>
              <span>&bull;</span>
              <span className="text-[#d9232d] font-bold">Quotations</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              My Request for Quotations (RFQs)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Track the progress, pricing approvals, and official tax quote documents for your procurement requests.
            </p>
          </div>

          <Link
            href="/products"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#d9232d] hover:bg-[#b81822] text-white font-semibold text-xs rounded-md shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
          >
            <span>+ Request New Quotation</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Lookup Box for Guest or Unlinked Quotations */}
        <div className="bg-white rounded-md p-4 sm:p-5 border border-slate-200 shadow-xs mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Search className="w-4 h-4 text-[#d9232d]" />
            <h2 className="text-xs font-semibold text-slate-900">
              Track a Specific Quotation Reference
            </h2>
          </div>

          <form onSubmit={handleGuestLookup} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={lookupRef}
              onChange={(e) => setLookupRef(e.target.value.toUpperCase())}
              placeholder="Quotation Reference (e.g. OB-RFQ-2026-00001)"
              className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-md uppercase font-mono tracking-wider focus:ring-1 focus:ring-blue-900 focus:outline-hidden"
            />
            <input
              type="email"
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.target.value)}
              placeholder="Business Email (optional verification)"
              className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-900 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={lookupLoading || !lookupRef.trim()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-md transition-colors flex items-center justify-center space-x-2 cursor-pointer"
            >
              {lookupLoading ? 'Searching...' : 'Track Quotation'}
            </button>
          </form>

          {lookupError && (
            <p className="text-xs text-red-600 font-semibold mt-2 flex items-center space-x-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{lookupError}</span>
            </p>
          )}
        </div>

        {/* Quotations List */}
        {loading ? (
          <div className="bg-white rounded-md p-10 text-center border border-slate-200">
            <div className="w-6 h-6 border-2 border-[#d9232d] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Retrieving your quotation history...</p>
          </div>
        ) : quotations.length === 0 ? (
          <div className="bg-white rounded-md p-10 text-center border border-slate-200 space-y-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">No Quotations Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                You have not submitted any quotation requests yet.
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center px-5 py-2 bg-[#d9232d] hover:bg-[#b81822] text-white font-bold text-xs rounded-md shadow-xs transition-colors cursor-pointer"
            >
              Browse Products &amp; Request Quote
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {quotations.map((quote) => {
              const isExpanded = expandedId === quote.id;

              return (
                <div
                  key={quote.id}
                  className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-slate-300"
                >
                  {/* Card Header */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : quote.id)}
                    className="p-4 sm:p-5 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-mono font-bold text-sm text-[#d9232d]">
                          {quote.quotationNumber}
                        </span>
                        {getStatusBadge(quote.status)}
                      </div>
                      <div className="text-xs text-slate-500">
                        Company: <strong className="text-slate-800">{quote.companyName}</strong> &bull; Submitted on{' '}
                        {new Date(quote.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-6">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-400 uppercase block font-medium">
                          {quote.quotedAmount ? 'Final Quoted Amount' : 'Indicative Total'}
                        </span>
                        <span className="text-sm sm:text-base font-bold text-slate-900">
                          ₹{(quote.quotedAmount || quote.indicativeTotal).toLocaleString('en-IN')}
                        </span>
                        {quote.quotedAmount && (
                          <span className="block text-[9px] text-emerald-600 font-bold">
                            ✓ Confirmed by Sales
                          </span>
                        )}
                      </div>

                      <div className="p-1 rounded-md bg-slate-100 text-slate-600">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Line Items & Details */}
                  {isExpanded && (
                    <div className="px-4 pb-5 sm:px-5 pt-2 border-t border-slate-100 bg-slate-50/40 space-y-3.5 animate-in fade-in">
                      
                      {/* Products Breakdown Table */}
                      <div className="bg-white rounded-md border border-slate-200 p-3.5">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5">
                          Requested Products ({quote.items.length} items)
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase">
                                <th className="py-2">Product</th>
                                <th className="py-2 text-center">SKU</th>
                                <th className="py-2 text-center">Pack</th>
                                <th className="py-2 text-center">Qty</th>
                                <th className="py-2 text-right">Indicative Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {quote.items.map((item) => (
                                <tr key={item.id || item.sku}>
                                  <td className="py-2.5 font-semibold text-slate-900">{item.productName}</td>
                                  <td className="py-2.5 text-center font-mono text-slate-500">{item.sku}</td>
                                  <td className="py-2.5 text-center text-slate-600">{item.packSize || 'Standard'}</td>
                                  <td className="py-2.5 text-center font-bold text-slate-900">{item.quantity}</td>
                                  <td className="py-2.5 text-right font-bold text-slate-900">
                                    ₹{item.indicativeTotalPrice.toLocaleString('en-IN')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Delivery and Notes */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="bg-white rounded-md border border-slate-200 p-3.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                            Destination Address
                          </span>
                          <p className="text-slate-700">
                            {quote.deliveryLocation} - <strong>{quote.pincode}</strong>
                          </p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Preferred Contact: <strong className="uppercase">{quote.preferredContactMethod}</strong>
                          </p>
                        </div>

                        <div className="bg-white rounded-md border border-slate-200 p-3.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                            Customer Notes
                          </span>
                          <p className="text-slate-700 italic">
                            {quote.additionalRequirements || 'No specific instructions provided.'}
                          </p>
                        </div>
                      </div>

                      {/* Official Quotation Document Link if Available */}
                      {quote.quotationDocumentUrl && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-center justify-between text-xs text-emerald-900">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-emerald-600" />
                            <span>Official Tax Quotation PDF is available for download</span>
                          </div>
                          <a
                            href={quote.quotationDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 font-bold text-emerald-700 hover:underline"
                          >
                            <span>Download PDF</span>
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}

                      {/* Direct Link to Success View */}
                      <div className="text-right pt-1">
                        <Link
                          href={`/quotation-success/${encodeURIComponent(quote.quotationNumber)}`}
                          className="inline-flex items-center space-x-1 text-xs font-bold text-[#d9232d] hover:underline"
                        >
                          <span>Open Printable Summary</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
