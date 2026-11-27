'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  RefreshCw,
  LogOut,
  ExternalLink,
  Eye,
  Users,
  FileText,
  Mail,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  Calendar,
  Building2,
  Phone,
  MapPin,
  Package,
  Layers,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Info,
  Clock,
} from 'lucide-react';
import {
  AnalyticsKPIs,
  DateRangePreset,
  QuoteLogRecord,
} from '@/lib/analytics/types';

interface AnalyticsDashboardClientProps {
  initialData: AnalyticsKPIs;
  adminEmail: string;
}

export default function AnalyticsDashboardClient({
  initialData,
  adminEmail,
}: AnalyticsDashboardClientProps) {
  const [data, setData] = useState<AnalyticsKPIs>(initialData);
  const [dateRange, setDateRange] = useState<DateRangePreset>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'delivered' | 'r1_only' | 'r2_only' | 'failed'>('all');
  const [selectedQuote, setSelectedQuote] = useState<QuoteLogRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch updated metrics when dateRange changes or refresh is clicked
  const loadData = async (range: DateRangePreset) => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/analytics-admin/data?range=${range}`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setData(json.data);
        showToast('success', `Metrics synchronized for "${range.toUpperCase()}" range.`);
      } else {
        showToast('error', json.error || 'Failed to refresh analytics data.');
      }
    } catch {
      showToast('error', 'Network error while contacting analytics API.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRangeChange = (range: DateRangePreset) => {
    setDateRange(range);
    loadData(range);
  };

  const handleRefresh = () => {
    loadData(dateRange);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/analytics-admin/logout', { method: 'POST' });
    } catch (err) {
      console.warn('[Logout Notice]:', err);
    } finally {
      window.location.replace('/analytics-admin-panel?t=' + Date.now());
    }
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Filter quotes by search and status
  const filteredQuotes = useMemo(() => {
    return data.quotes.filter((q) => {
      // 1. Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = q.customer_name.toLowerCase().includes(query);
        const matchCompany = (q.company_name || '').toLowerCase().includes(query);
        const matchEmail = q.email.toLowerCase().includes(query);
        const matchPhone = q.phone.includes(query);
        const matchNumber = (q.quotation_number || q.id).toLowerCase().includes(query);
        const matchProduct = q.products.some((p) => p.name.toLowerCase().includes(query) || (p.sku && p.sku.toLowerCase().includes(query)));

        if (!matchName && !matchCompany && !matchEmail && !matchPhone && !matchNumber && !matchProduct) {
          return false;
        }
      }

      // 2. Status filter
      if (statusFilter === 'delivered') {
        return q.recipient_1_status === 'sent' && q.recipient_2_status === 'sent';
      }
      if (statusFilter === 'r1_only') {
        return q.recipient_1_status === 'sent' && q.recipient_2_status !== 'sent';
      }
      if (statusFilter === 'r2_only') {
        return q.recipient_2_status === 'sent' && q.recipient_1_status !== 'sent';
      }
      if (statusFilter === 'failed') {
        return q.recipient_1_status === 'failed' || q.recipient_2_status === 'failed';
      }

      return true;
    });
  }, [data.quotes, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-[#ea580c] selection:text-white">
      {/* 1. Official Office Bazzar Navigation Bar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <Link href="/" className="flex items-center shrink-0" title="Return to Storefront">
              <Image
                src="/images/officebazzar-logo-transparent.webp"
                alt="OfficeBazzar Logo"
                width={160}
                height={45}
                className="w-[110px] sm:w-[130px] h-auto object-contain"
                priority
              />
            </Link>

            <div className="h-6 w-px bg-slate-200 hidden sm:block shrink-0" />

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate">
                Quote &amp; Traffic Analytics
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#057a3b] border border-emerald-200 shrink-0">
                Live Cloud Metrics
              </span>
            </div>

            <div className="h-6 w-px bg-slate-200 hidden xl:block shrink-0" />

            <nav className="hidden xl:flex items-center gap-1 text-xs font-semibold shrink-0">
              <span className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white shadow-2xs">
                Analytics
              </span>
              <a
                href="/product-admin-panel"
                className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Products
              </a>
              <a
                href="/blog-admin-panel"
                className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Blog
              </a>
              <a
                href="/admin"
                className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                Orders
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Date range filter pills */}
            <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              {(['today', '7d', '30d', 'all'] as DateRangePreset[]).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRangeChange(r)}
                  className={`px-3 py-1.5 rounded-lg transition-all capitalize cursor-pointer ${
                    dateRange === r
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r === 'all' ? 'All Time' : r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : 'Today'}
                </button>
              ))}
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer border border-slate-200"
              title="Refresh Live Analytics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#ea580c]' : 'text-slate-600'}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <a
              href="/products"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#ea580c] bg-white px-3 py-2 rounded-xl border border-slate-200 hover:border-[#ea580c]/40 transition-colors shadow-2xs"
            >
              <span>Live Store</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            <div className="h-5 w-px bg-slate-200 hidden sm:block shrink-0" />

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
              title="Sign Out of Analytics Dashboard"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Toast message */}
        {toastMessage && (
          <div
            className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 border backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-200 max-w-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                : 'bg-rose-50 text-rose-900 border-rose-300'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-[#057a3b] shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-medium">{toastMessage.text}</span>
            <button onClick={() => setToastMessage(null)} className="ml-auto text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Mobile Date Range selector */}
        <div className="flex md:hidden items-center justify-between bg-white p-3 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Date Period:</span>
          <div className="flex items-center gap-1 text-xs">
            {(['today', '7d', '30d', 'all'] as DateRangePreset[]).map((r) => (
              <button
                key={r}
                onClick={() => handleRangeChange(r)}
                className={`px-2.5 py-1 rounded-lg capitalize ${
                  dateRange === r ? 'bg-slate-900 text-white font-bold' : 'text-slate-600'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* 2. 4 Core KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Website Views & Unique Visitors */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Website Views &amp; Visitors
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Eye className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {data.totalPageViews.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-600 font-medium">
              <Users className="w-3.5 h-3.5 text-blue-500" />
              <span>
                <strong>{data.uniqueVisitors.toLocaleString()}</strong> unique visitors
              </span>
            </div>
          </div>

          {/* KPI 2: Total Quote Requests Received */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Total Quote Requests
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#ea580c] flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {data.totalQuoteRequests.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium">
              Real customer RFQ submissions
            </p>
          </div>

          {/* KPI 3: Quotes Sent to Recipient 1 (Sales) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 truncate max-w-[190px]" title={data.recipient1.email}>
                Quotes: {data.recipient1.email}
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#057a3b] flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-[#057a3b] tracking-tight">
              {data.recipient1.sentCount.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-xs mt-2 text-slate-600 font-medium">
              <span>{data.recipient1.role}</span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold text-[10px]">
                {data.recipient1.failedCount > 0 ? `${data.recipient1.failedCount} Failed` : '100% OK'}
              </span>
            </div>
          </div>

          {/* KPI 4: Quotes Sent to Recipient 2 (Marketing) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 truncate max-w-[190px]" title={data.recipient2.email}>
                Quotes: {data.recipient2.email}
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-purple-700 tracking-tight">
              {data.recipient2.sentCount.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-xs mt-2 text-slate-600 font-medium">
              <span>{data.recipient2.role}</span>
              <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-bold text-[10px]">
                {data.recipient2.failedCount > 0 ? `${data.recipient2.failedCount} Failed` : '100% OK'}
              </span>
            </div>
          </div>
        </section>

        {/* 3. 2-Email Delivery Status Panel */}
        <section className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#004b87]" />
                Dual-Email Delivery Status Summary
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time tracking of quotation notification dispatch to designated company mailboxes
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full self-start sm:self-auto">
              Period: {dateRange.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recipient 1 Box */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Recipient 1 (Commercial Sales Desk)
                </span>
                <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                  {data.recipient1.email}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 my-3 text-center">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Sent</span>
                  <span className="text-lg font-bold text-[#057a3b]">{data.recipient1.sentCount}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Failed</span>
                  <span className={`text-lg font-bold ${data.recipient1.failedCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                    {data.recipient1.failedCount}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Success Rate</span>
                  <span className="text-lg font-bold text-slate-900">{data.recipient1.successRate}%</span>
                </div>
              </div>

              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#057a3b] h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, data.recipient1.successRate)}%` }}
                />
              </div>
            </div>

            {/* Recipient 2 Box */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Recipient 2 (Marketing Lead Desk)
                </span>
                <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                  {data.recipient2.email}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 my-3 text-center">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Sent</span>
                  <span className="text-lg font-bold text-purple-700">{data.recipient2.sentCount}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Failed</span>
                  <span className={`text-lg font-bold ${data.recipient2.failedCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                    {data.recipient2.failedCount}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Success Rate</span>
                  <span className="text-lg font-bold text-slate-900">{data.recipient2.successRate}%</span>
                </div>
              </div>

              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, data.recipient2.successRate)}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* 4. Quote Requests Table Section */}
        <section className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#ea580c]" />
                Customer Quote Requests ({filteredQuotes.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every real quotation submission recorded with customer details, requested products, and email dispatch status
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Search */}
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search customer, phone, quote..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#ea580c] focus:bg-white transition-all"
                />
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-[#ea580c]"
              >
                <option value="all">All Delivery Statuses</option>
                <option value="delivered">Both Recipients Sent</option>
                <option value="r1_only">Sales Desk Sent Only</option>
                <option value="r2_only">Marketing Lead Sent Only</option>
                <option value="failed">Delivery Issues</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Date / Time (IST)</th>
                  <th className="py-3 px-4">Quote Ref</th>
                  <th className="py-3 px-4">Customer &amp; Company</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Requested Products</th>
                  <th className="py-3 px-4 text-center">Sales Email Status</th>
                  <th className="py-3 px-4 text-center">Marketing Email Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredQuotes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <div className="max-w-xs mx-auto flex flex-col items-center">
                        <FileText className="w-8 h-8 text-slate-300 mb-2" />
                        <span className="text-sm font-semibold text-slate-700">No quote requests found</span>
                        <span className="text-xs text-slate-500 mt-1">
                          {searchQuery
                            ? 'Try clearing the search query or status filter.'
                            : 'Real customer quote requests will appear here as soon as they are submitted.'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredQuotes.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{q.created_at_ist.split(',')[0]}</div>
                        <div className="text-[10px] text-slate-400">{q.created_at_ist.split(',')[1] || ''}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-[#004b87] bg-blue-50/80 px-2 py-0.5 rounded-md border border-blue-200/60">
                          {q.quotation_number || q.id}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{q.customer_name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[150px]">{q.company_name || 'Individual / Enterprise'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-[11px]">
                        <div><a href={`tel:${q.phone}`} className="text-slate-800 hover:text-[#004b87]">{q.phone}</a></div>
                        <div className="text-slate-500 truncate max-w-[160px]"><a href={`mailto:${q.email}`} className="hover:underline">{q.email}</a></div>
                      </td>
                      <td className="py-3 px-4 max-w-[200px]">
                        <div className="font-semibold text-slate-900 truncate">
                          {q.products.length > 0 ? q.products[0].name : 'Custom Item'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {q.products.length} item{q.products.length !== 1 ? 's' : ''} total
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {q.recipient_1_status === 'sent' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#057a3b] border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Sent
                          </span>
                        ) : q.recipient_1_status === 'failed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200" title={q.recipient_1_error}>
                            <AlertCircle className="w-3 h-3" /> Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Skipped
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {q.recipient_2_status === 'sent' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <CheckCircle2 className="w-3 h-3" /> Sent
                          </span>
                        ) : q.recipient_2_status === 'failed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200" title={q.recipient_2_error}>
                            <AlertCircle className="w-3 h-3" /> Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Skipped
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedQuote(q)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:text-[#ea580c] hover:border-[#ea580c]/50 transition-colors shadow-2xs cursor-pointer"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. Page Views Breakdown Section */}
        <section className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#004b87]" />
                Page Views Breakdown ({data.pageBreakdown.length} Paths)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real anonymous visitor volume and unique sessions per website route
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1 rounded-full border border-slate-200 self-start sm:self-auto">
              Total Recorded Views: <strong>{data.totalPageViews}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3">Page Path</th>
                  <th className="py-2.5 px-3 text-right">Views</th>
                  <th className="py-2.5 px-3 text-right">Unique Visitors</th>
                  <th className="py-2.5 px-3 w-40">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {data.pageBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No page views recorded yet in this time window.
                    </td>
                  </tr>
                ) : (
                  data.pageBreakdown.slice(0, 15).map((p) => (
                    <tr key={p.path} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 truncate max-w-xs sm:max-w-md">
                        {p.path}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        {p.views.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600">
                        {p.uniqueVisitors.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#004b87] h-full rounded-full"
                              style={{ width: `${Math.min(100, p.percentage)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 font-bold w-7 text-right">
                            {p.percentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Quote Details Slide-Over Drawer / Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-bold text-base text-[#004b87] bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {selectedQuote.quotation_number || selectedQuote.id}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {selectedQuote.created_at_ist}
                </span>
              </div>
              <button
                onClick={() => setSelectedQuote(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              {/* Customer Info Grid */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                  Customer &amp; Enterprise Procurement Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Customer Name:</span>
                    <span className="font-bold text-slate-900 text-sm">{selectedQuote.customer_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Company Name:</span>
                    <span className="font-bold text-slate-900">{selectedQuote.company_name || 'Individual Enterprise'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Phone:</span>
                    <a href={`tel:${selectedQuote.phone}`} className="font-bold text-[#004b87] hover:underline">
                      {selectedQuote.phone}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Email:</span>
                    <a href={`mailto:${selectedQuote.email}`} className="font-bold text-[#004b87] hover:underline">
                      {selectedQuote.email}
                    </a>
                  </div>
                  {selectedQuote.delivery_location && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block text-[11px]">Delivery Location:</span>
                      <span className="font-medium text-slate-800">
                        {selectedQuote.delivery_location} {selectedQuote.pincode ? `(PIN: ${selectedQuote.pincode})` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Message */}
              {selectedQuote.message && (
                <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl">
                  <span className="text-[11px] font-bold text-amber-900 uppercase block mb-1">
                    Customer Requirements / Notes:
                  </span>
                  <p className="text-xs text-amber-950 whitespace-pre-wrap">{selectedQuote.message}</p>
                </div>
              )}

              {/* Products Table */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                  Requested Items ({selectedQuote.products.length})
                </h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Item &amp; SKU</th>
                        <th className="p-2.5 text-center">Quantity</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {selectedQuote.products.map((p, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5">
                            <div className="font-semibold text-slate-900">{p.name}</div>
                            {p.sku && <div className="text-[10px] font-mono text-slate-400">{p.sku}</div>}
                          </td>
                          <td className="p-2.5 text-center font-bold">
                            {p.quantity} {p.packSize || 'Units'}
                          </td>
                          <td className="p-2.5 text-right text-slate-600">
                            ₹{p.unitPrice?.toLocaleString('en-IN') || '0'}
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-900">
                            ₹{p.totalPrice?.toLocaleString('en-IN') || '0'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    {selectedQuote.total_amount !== undefined && (
                      <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                        <tr>
                          <td colSpan={3} className="p-2.5 text-right text-slate-700">Total Indicative Amount:</td>
                          <td className="p-2.5 text-right text-[#004b87] text-sm font-extrabold">
                            ₹{selectedQuote.total_amount.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* 2-Email Delivery Log Audit */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                  2-Email Dispatch Audit Log
                </h3>

                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-bold text-slate-900 text-[11px]">{selectedQuote.recipient_1_email}</div>
                      <div className="text-[10px] text-slate-500">Sales Desk (ADMIN 1)</div>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedQuote.recipient_1_status === 'sent'
                        ? 'bg-emerald-50 text-[#057a3b] border border-emerald-200'
                        : selectedQuote.recipient_1_status === 'failed'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {selectedQuote.recipient_1_status.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-600" />
                    <div>
                      <div className="font-bold text-slate-900 text-[11px]">{selectedQuote.recipient_2_email}</div>
                      <div className="text-[10px] text-slate-500">Marketing Desk (ADMIN 2)</div>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedQuote.recipient_2_status === 'sent'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : selectedQuote.recipient_2_status === 'failed'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {selectedQuote.recipient_2_status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setSelectedQuote(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
