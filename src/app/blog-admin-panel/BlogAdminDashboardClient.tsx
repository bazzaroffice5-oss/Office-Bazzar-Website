'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  LogOut,
  ExternalLink,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  Globe,
  Share2,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Save,
  Check,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { AdminBlogPost } from '@/lib/blog-admin/storage';

interface Props {
  initialPosts: AdminBlogPost[];
  username: string;
}

const CATEGORIES = [
  'Housekeeping & Hygiene',
  'Office Stationery',
  'Workplace Procurement',
  'Printers & Technology',
  'Packaging Supplies',
  'Corporate Facility Management',
  'Procurement Advisory',
];

export default function BlogAdminDashboardClient({ initialPosts, username }: Props) {
  const [posts, setPosts] = useState<AdminBlogPost[]>(initialPosts);
  const [currentView, setCurrentView] = useState<'list' | 'editor'>('list');
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content');
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'published' | 'draft'>('ALL');

  // Editor form state
  const [formData, setFormData] = useState<AdminBlogPost>({
    slug: '',
    title: '',
    status: 'published',
    publishedDate: new Date().toISOString().split('T')[0],
    author: 'Office Bazzar Team',
    category: 'Housekeeping & Hygiene',
    tags: [],
    featuredImage: '/images/categories/office-supplies-stationery.jpg',
    imageAlt: '',
    excerpt: '',
    seoTitle: '',
    seoDescription: '',
    focusKeyword: '',
    secondaryKeywords: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    indexRobots: true,
    content: '',
  });

  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteModalSlug, setDeleteModalSlug] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'mobile'>('desktop');

  // Filtered posts for list view
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = categoryFilter === 'ALL' || post.category === categoryFilter;
      const matchStatus = statusFilter === 'ALL' || post.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [posts, searchQuery, categoryFilter, statusFilter]);

  const publishedCount = useMemo(() => posts.filter((p) => p.status === 'published').length, [posts]);
  const draftCount = useMemo(() => posts.filter((p) => p.status === 'draft').length, [posts]);

  // Open New Post Editor
  const handleNewPost = () => {
    setEditingSlug(null);
    setFormData({
      slug: '',
      title: '',
      status: 'published',
      publishedDate: new Date().toISOString().split('T')[0],
      author: 'Office Bazzar Team',
      category: 'Housekeeping & Hygiene',
      tags: ['Housekeeping & Hygiene'],
      featuredImage: '/images/categories/office-supplies-stationery.jpg',
      imageAlt: '',
      excerpt: '',
      seoTitle: '',
      seoDescription: '',
      focusKeyword: '',
      secondaryKeywords: '',
      canonicalUrl: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      indexRobots: true,
      content: '',
    });
    setTagInput('Housekeeping & Hygiene');
    setActiveTab('content');
    setSaveMessage(null);
    setCurrentView('editor');
  };

  // Open Edit Post Editor
  const handleEditPost = (post: AdminBlogPost) => {
    setEditingSlug(post.slug);
    setFormData({ ...post });
    setTagInput((post.tags || []).join(', '));
    setActiveTab('content');
    setSaveMessage(null);
    setCurrentView('editor');
  };

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const updates: Partial<AdminBlogPost> = { title };
    if (!editingSlug) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      updates.slug = slug;
      updates.canonicalUrl = `https://www.officebazzar.com/blog/${slug}`;
    }
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  // Insert markdown syntax helper
  const insertMarkdown = (prefix: string, suffix = '') => {
    const textarea = document.getElementById('blog-content-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end) || 'text';
    const replacement = prefix + selected + suffix;
    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setFormData((prev) => ({ ...prev, content: newContent }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  // Save / Publish
  const handleSave = async (forceStatus?: 'published' | 'draft') => {
    if (!formData.title.trim()) {
      setSaveMessage({ type: 'error', text: 'Article title is required.' });
      return;
    }
    if (!formData.slug.trim()) {
      setSaveMessage({ type: 'error', text: 'URL slug is required.' });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    const postPayload: AdminBlogPost = {
      ...formData,
      status: forceStatus || formData.status,
      tags: tagInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };

    try {
      const res = await fetch('/api/blog-admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save post.');
      }

      setSaveMessage({
        type: 'success',
        text: data.message || 'Article successfully saved and committed.',
      });

      // Update local state list
      setPosts((prev) => {
        const idx = prev.findIndex((p) => p.slug === postPayload.slug);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = postPayload;
          return next;
        }
        return [postPayload, ...prev];
      });

      setFormData(postPayload);
      setEditingSlug(postPayload.slug);
    } catch (err) {
      setSaveMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error saving article.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete article
  const handleDeleteConfirm = async () => {
    if (!deleteModalSlug) return;
    try {
      const res = await fetch(`/api/blog-admin/posts/${deleteModalSlug}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.slug !== deleteModalSlug));
        setDeleteModalSlug(null);
        if (currentView === 'editor' && editingSlug === deleteModalSlug) {
          setCurrentView('list');
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Quick toggle status in list view
  const handleToggleStatus = async (post: AdminBlogPost) => {
    const nextStatus = post.status === 'published' ? 'draft' : 'published';
    const updated = { ...post, status: nextStatus as 'published' | 'draft' };
    try {
      await fetch('/api/blog-admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      setPosts((prev) => prev.map((p) => (p.slug === post.slug ? updated : p)));
    } catch (e) {
      console.error(e);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await fetch('/api/blog-admin/logout', { method: 'POST' });
    window.location.reload();
  };

  // SEO Snippet calculations
  const displaySeoTitle = formData.seoTitle || `${formData.title} | OfficeBazzar`;
  const displaySeoDesc = formData.seoDescription || formData.excerpt;
  const titleCharCount = displaySeoTitle.length;
  const descCharCount = displaySeoDesc.length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Top Private Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
            <span className="text-sm font-bold text-slate-900 tracking-tight">OfficeBazzar</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-xs font-semibold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md">
            Private Blog Admin Panel
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500 hidden sm:inline">
            Logged in as <strong className="text-slate-800 font-semibold">{username}</strong>
          </span>
          <Link
            href="/blog"
            target="_blank"
            className="flex items-center gap-1 px-3 py-1.5 text-slate-600 hover:text-[#004b87] bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors"
          >
            <span>Live Blog</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg font-medium transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ===================== LIST VIEW ===================== */}
        {currentView === 'list' && (
          <div className="space-y-6">
            {/* Header & Metrics */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Blog Management</h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage corporate guides, housekeeping manuals, and procurement articles.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                  <span className="flex items-center gap-1 font-semibold text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {publishedCount} Published
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-semibold text-amber-600">
                    <Clock className="w-3.5 h-3.5" />
                    {draftCount} Drafts
                  </span>
                </div>

                <button
                  onClick={handleNewPost}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-[#004b87] hover:bg-[#003866] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Blog</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search articles by title, slug or summary..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#004b87] focus:bg-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Status Toggle */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors ${
                      statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
                    }`}
                  >
                    All ({posts.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('published')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors ${
                      statusFilter === 'published' ? 'bg-white text-emerald-700 shadow-2xs font-semibold' : 'text-slate-600'
                    }`}
                  >
                    Published ({publishedCount})
                  </button>
                  <button
                    onClick={() => setStatusFilter('draft')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors ${
                      statusFilter === 'draft' ? 'bg-white text-amber-700 shadow-2xs font-semibold' : 'text-slate-600'
                    }`}
                  >
                    Drafts ({draftCount})
                  </button>
                </div>

                {/* Category Dropdown */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-[#004b87]"
                >
                  <option value="ALL">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Articles Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
              {filteredPosts.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No blog articles found</p>
                  <p className="text-xs text-slate-400 mt-0.5">Try clearing filters or search query.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Article</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPosts.map((post) => (
                        <tr key={post.slug} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 max-w-md">
                            <div className="flex items-center gap-3">
                              <div className="relative w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                <Image
                                  src={post.featuredImage || '/images/categories/office-supplies-stationery.jpg'}
                                  alt={post.title}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 truncate leading-snug">{post.title}</p>
                                <p className="text-[11px] text-slate-400 font-mono truncate">/blog/{post.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md font-medium text-[11px]">
                              {post.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleStatus(post)}
                              title="Click to toggle status"
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold text-[11px] transition-colors ${
                                post.status === 'published'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  post.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                              />
                              {post.status === 'published' ? 'Published' : 'Draft'}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">{post.publishedDate}</td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                            {post.status === 'published' ? (
                              <Link
                                href={`/blog/${post.slug}`}
                                target="_blank"
                                className="p-1.5 text-slate-500 hover:text-[#004b87] hover:bg-slate-100 rounded-md inline-block"
                                title="View public post"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                            ) : (
                              <button
                                onClick={() => handleEditPost(post)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md"
                                title="Draft preview in editor"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => handleEditPost(post)}
                              className="p-1.5 text-slate-600 hover:text-[#004b87] hover:bg-slate-100 rounded-md"
                              title="Edit post"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setDeleteModalSlug(post.slug)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md"
                              title="Delete post"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================== EDITOR VIEW ===================== */}
        {currentView === 'editor' && (
          <div className="space-y-6">
            {/* Editor Top Bar */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentView('list')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Articles</span>
                </button>
                <span className="text-xs font-bold text-slate-900">
                  {editingSlug ? `Editing: ${formData.title || editingSlug}` : 'Create New Article'}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    formData.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {formData.status === 'published' ? 'Will Publish' : 'Draft'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSave('draft')}
                  disabled={isSaving}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Save as Draft
                </button>

                <button
                  onClick={() => handleSave('published')}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#004b87] hover:bg-[#003866] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{formData.status === 'published' ? 'Update & Publish' : 'Publish Live'}</span>
                </button>
              </div>
            </div>

            {/* Save Status Banner */}
            {saveMessage && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center justify-between ${
                  saveMessage.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                <span>{saveMessage.text}</span>
                <button onClick={() => setSaveMessage(null)} className="text-xs font-bold px-2">
                  ×
                </button>
              </div>
            )}

            {/* Navigation Tabs: Content vs SEO */}
            <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-2 gap-4 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('content')}
                className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'content'
                    ? 'border-[#004b87] text-[#004b87]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>1. Content &amp; Editorial</span>
              </button>

              <button
                onClick={() => setActiveTab('seo')}
                className={`pb-3 px-2 flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'seo'
                    ? 'border-[#004b87] text-[#004b87]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>2. SEO &amp; Search Preview</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  Recommended
                </span>
              </button>
            </div>

            {/* TAB 1: CONTENT & EDITORIAL */}
            {activeTab === 'content' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Main Editor */}
                <div className="lg:col-span-2 space-y-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                  {/* Article Title */}
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1.5">Article Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Complete Guide to Industrial Housekeeping Chemicals"
                      value={formData.title}
                      onChange={handleTitleChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#004b87] focus:bg-white"
                    />
                  </div>

                  {/* URL Slug */}
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1.5">
                      URL Slug * <span className="font-normal text-slate-400">(/blog/[slug])</span>
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
                          canonicalUrl: `https://www.officebazzar.com/blog/${e.target.value}`,
                        }))
                      }
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-[#004b87] focus:bg-white"
                    />
                  </div>

                  {/* Excerpt */}
                  <div>
                    <label className="block text-xs font-bold text-slate-900 mb-1.5">
                      Article Summary / Excerpt *
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Brief overview of this guide for listing cards and search engine snippets..."
                      value={formData.excerpt}
                      onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#004b87] focus:bg-white leading-relaxed"
                    />
                  </div>

                  {/* Content Editor Toolbar */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-900">Article Content (Markdown Supported)</label>
                      <button
                        type="button"
                        onClick={() => setPreviewMode(!previewMode)}
                        className="text-xs font-semibold text-[#004b87] hover:underline"
                      >
                        {previewMode ? 'Hide Preview' : 'Show Live Preview'}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-100 border border-slate-200 rounded-t-xl text-slate-700">
                      <button
                        type="button"
                        onClick={() => insertMarkdown('# ')}
                        className="p-1.5 hover:bg-white rounded font-bold text-xs"
                        title="Heading 1"
                      >
                        H1
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('## ')}
                        className="p-1.5 hover:bg-white rounded font-bold text-xs"
                        title="Heading 2"
                      >
                        H2
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('### ')}
                        className="p-1.5 hover:bg-white rounded font-bold text-xs"
                        title="Heading 3"
                      >
                        H3
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('**', '**')}
                        className="p-1.5 hover:bg-white rounded"
                        title="Bold"
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('*', '*')}
                        className="p-1.5 hover:bg-white rounded"
                        title="Italic"
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('- ')}
                        className="p-1.5 hover:bg-white rounded"
                        title="Bullet List"
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('1. ')}
                        className="p-1.5 hover:bg-white rounded"
                        title="Numbered List"
                      >
                        <ListOrdered className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('> ')}
                        className="p-1.5 hover:bg-white rounded"
                        title="Quote"
                      >
                        <Quote className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('[Link Text](', ')')}
                        className="p-1.5 hover:bg-white rounded"
                        title="Insert Link"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('![Image Alt Text](', ')')}
                        className="p-1.5 hover:bg-white rounded"
                        title="Insert Image"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      id="blog-content-textarea"
                      rows={16}
                      value={formData.content}
                      onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                      placeholder="Write your article in formatted Markdown..."
                      className="w-full p-4 font-mono text-xs text-slate-900 bg-slate-50 border-x border-b border-slate-200 rounded-b-xl focus:outline-none focus:border-[#004b87] focus:bg-white leading-relaxed"
                    />

                    {previewMode && (
                      <div className="mt-4 p-5 bg-white border border-slate-200 rounded-xl">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Live Body Preview</h4>
                        <div className="prose prose-slate max-w-none text-xs sm:text-sm whitespace-pre-line leading-relaxed">
                          {formData.content}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right 1 Col: Sidebar Metadata */}
                <div className="space-y-5">
                  {/* Publishing Status Card */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Publishing Status</h3>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, status: e.target.value as 'published' | 'draft' }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                      >
                        <option value="published">Published (Live on Website)</option>
                        <option value="draft">Draft (Private)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Publication Date</label>
                      <input
                        type="date"
                        value={formData.publishedDate}
                        onChange={(e) => setFormData((prev) => ({ ...prev, publishedDate: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Author Name</label>
                      <input
                        type="text"
                        value={formData.author}
                        onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Tags (Comma-separated)</label>
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Housekeeping, Office, Procurement"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Featured Image Card */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Featured Image</h3>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Image URL or Local Path</label>
                      <input
                        type="text"
                        value={formData.featuredImage}
                        onChange={(e) => setFormData((prev) => ({ ...prev, featuredImage: e.target.value }))}
                        placeholder="/images/blog/example.jpeg"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Image Alt Text *
                        {!formData.imageAlt && (
                          <span className="text-[11px] text-amber-600 font-normal ml-1">
                            (Missing: Required for SEO)
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={formData.imageAlt}
                        onChange={(e) => setFormData((prev) => ({ ...prev, imageAlt: e.target.value }))}
                        placeholder="Descriptive alt text for Google Image SEO"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                      />
                    </div>

                    {formData.featuredImage && (
                      <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                        <Image
                          src={formData.featuredImage}
                          alt={formData.imageAlt || 'Hero preview'}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SEO & GOOGLE PREVIEW */}
            {activeTab === 'seo' && (
              <div className="space-y-6">
                {/* Google Snippet Live Preview */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <h3 className="text-sm font-bold text-slate-900">Google Search Snippet Preview</h3>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
                      <button
                        type="button"
                        onClick={() => setDevicePreview('desktop')}
                        className={`px-2.5 py-1 rounded font-semibold ${
                          devicePreview === 'desktop' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                        }`}
                      >
                        Desktop
                      </button>
                      <button
                        type="button"
                        onClick={() => setDevicePreview('mobile')}
                        className={`px-2.5 py-1 rounded font-semibold ${
                          devicePreview === 'mobile' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                        }`}
                      >
                        Mobile
                      </button>
                    </div>
                  </div>

                  {/* Google Card Representation */}
                  <div className="max-w-xl p-4 bg-white rounded-xl border border-slate-200 font-sans">
                    <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                      <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                        OB
                      </div>
                      <span className="font-semibold text-slate-800">OfficeBazzar</span>
                      <span className="text-slate-400">›</span>
                      <span className="text-slate-500 font-mono text-[11px]">blog › {formData.slug || 'url-slug'}</span>
                    </div>

                    <h4 className="text-base sm:text-lg text-[#1a0dab] hover:underline font-normal cursor-pointer leading-snug line-clamp-1">
                      {displaySeoTitle}
                    </h4>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                      {displaySeoDesc || 'Your article summary will be displayed here in Google search engine result pages.'}
                    </p>
                  </div>
                </div>

                {/* SEO Input Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Col: Titles & Description */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Search Engine Tags</h3>

                    {/* SEO Title */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">SEO Title</label>
                        <span
                          className={`text-[11px] font-mono ${
                            titleCharCount >= 45 && titleCharCount <= 60 ? 'text-emerald-600 font-bold' : 'text-amber-600'
                          }`}
                        >
                          {titleCharCount}/60 chars
                        </span>
                      </div>
                      <input
                        type="text"
                        value={formData.seoTitle || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, seoTitle: e.target.value }))}
                        placeholder={formData.title ? `${formData.title} | OfficeBazzar` : 'Enter SEO title'}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Recommended: 50–60 characters.</p>
                    </div>

                    {/* SEO Meta Description */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">Meta Description</label>
                        <span
                          className={`text-[11px] font-mono ${
                            descCharCount >= 120 && descCharCount <= 160 ? 'text-emerald-600 font-bold' : 'text-amber-600'
                          }`}
                        >
                          {descCharCount}/155 chars
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={formData.seoDescription || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, seoDescription: e.target.value }))}
                        placeholder={formData.excerpt || 'Enter meta description'}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Recommended: 120–155 characters.</p>
                    </div>

                    {/* Canonical URL */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Canonical URL Override</label>
                      <input
                        type="text"
                        value={formData.canonicalUrl || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, canonicalUrl: e.target.value }))}
                        placeholder={`https://www.officebazzar.com/blog/${formData.slug}`}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono"
                      />
                    </div>
                  </div>

                  {/* Right Col: Keywords & Indexing */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Keywords &amp; Robots</h3>

                    {/* Focus Keyword */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Focus Keyword</label>
                      <input
                        type="text"
                        value={formData.focusKeyword || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, focusKeyword: e.target.value }))}
                        placeholder="e.g. industrial housekeeping dustbins"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Used for internal content auditing and editorial alignment.
                      </p>
                    </div>

                    {/* Secondary Keywords */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Secondary Keywords</label>
                      <input
                        type="text"
                        value={formData.secondaryKeywords || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, secondaryKeywords: e.target.value }))}
                        placeholder="waste segregation bins, office dustbins wholesale"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                      />
                    </div>

                    {/* Robots Indexing */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Search Engine Indexing</label>
                      <select
                        value={formData.indexRobots ? 'true' : 'false'}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, indexRobots: e.target.value === 'true' }))
                        }
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                      >
                        <option value="true">index, follow (Allow Google indexing)</option>
                        <option value="false">noindex, nofollow (Block search engines)</option>
                      </select>
                    </div>

                    {/* SEO Health Check Panel */}
                    <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <span className="text-xs font-bold text-slate-800 block">Content Health Checks</span>
                      <div className="flex items-center gap-2 text-xs">
                        {formData.title ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                        )}
                        <span>Title provided</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {formData.imageAlt ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        <span>Image alt text defined ({formData.imageAlt ? 'OK' : 'Warning'})</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {formData.content.includes('#') ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        <span>Subheadings structure (H2 / H3)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalSlug && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 shadow-xl">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Blog Post?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Are you sure you want to permanently delete{' '}
                  <strong className="text-slate-800 font-mono">/blog/{deleteModalSlug}</strong>? This action cannot be
                  undone.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalSlug(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
                >
                  Yes, Delete Post
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

