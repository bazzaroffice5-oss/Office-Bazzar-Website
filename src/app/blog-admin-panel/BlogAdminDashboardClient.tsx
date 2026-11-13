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
  LayoutDashboard,
  ShieldAlert,
  BarChart2,
  Menu,
  X,
  Smartphone,
  Monitor,
  CheckCircle,
  XCircle,
  HelpCircle,
  ChevronRight,
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
  const [currentView, setCurrentView] = useState<'dashboard' | 'posts' | 'editor' | 'seo-audit'>('dashboard');
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content');
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  const [previewModalPost, setPreviewModalPost] = useState<AdminBlogPost | null>(null);
  const [editorPreviewMode, setEditorPreviewMode] = useState(false);
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

  // Aggregate stats
  const totalCount = posts.length;
  const publishedCount = useMemo(() => posts.filter((p) => p.status === 'published').length, [posts]);
  const draftCount = useMemo(() => posts.filter((p) => p.status === 'draft').length, [posts]);

  // SEO Health calculation across all posts
  const seoAuditStats = useMemo(() => {
    let missingAltCount = 0;
    let missingDescCount = 0;
    let titleLengthIssues = 0;

    posts.forEach((p) => {
      if (!p.imageAlt || !p.imageAlt.trim()) missingAltCount++;
      const desc = p.seoDescription || p.excerpt;
      if (!desc || desc.length < 50) missingDescCount++;
      const title = p.seoTitle || p.title;
      if (title.length < 30 || title.length > 70) titleLengthIssues++;
    });

    const perfectCount = posts.filter((p) => {
      const hasAlt = Boolean(p.imageAlt && p.imageAlt.trim());
      const desc = p.seoDescription || p.excerpt;
      const goodDesc = Boolean(desc && desc.length >= 80 && desc.length <= 165);
      const title = p.seoTitle || p.title;
      const goodTitle = Boolean(title && title.length >= 35 && title.length <= 65);
      return hasAlt && goodDesc && goodTitle;
    }).length;

    const healthPercent = totalCount > 0 ? Math.round((perfectCount / totalCount) * 100) : 100;

    return {
      missingAltCount,
      missingDescCount,
      titleLengthIssues,
      healthPercent,
      perfectCount,
    };
  }, [posts, totalCount]);

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
    setMobileMenuOpen(false);
  };

  // Open Edit Post Editor
  const handleEditPost = (post: AdminBlogPost) => {
    setEditingSlug(post.slug);
    setFormData({ ...post });
    setTagInput((post.tags || []).join(', '));
    setActiveTab('content');
    setSaveMessage(null);
    setCurrentView('editor');
    setMobileMenuOpen(false);
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

  // Check duplicate slug
  const isDuplicateSlug = useMemo(() => {
    if (!formData.slug.trim()) return false;
    return posts.some(
      (p) => p.slug.toLowerCase() === formData.slug.trim().toLowerCase() && p.slug !== editingSlug
    );
  }, [posts, formData.slug, editingSlug]);

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
    if (isDuplicateSlug) {
      setSaveMessage({
        type: 'error',
        text: 'This URL slug is already taken by another article. Please use a unique slug.',
      });
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
        text: data.message || 'Article successfully saved.',
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
          setCurrentView('posts');
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
    <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row text-slate-100">
      {/* ===================== SIDEBAR (Standalone CMS Navigation) ===================== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
              OB
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>OfficeBazzar</span>
              </div>
              <p className="text-[10px] text-blue-400 font-medium uppercase tracking-wider">
                Blog CMS Application
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Button */}
        <div className="p-4">
          <button
            onClick={handleNewPost}
            className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-[#004b87] hover:from-blue-500 hover:to-[#003866] text-white flex items-center justify-center gap-2 text-xs font-semibold shadow-md shadow-blue-950/50 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Write New Article</span>
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <button
            onClick={() => {
              setCurrentView('dashboard');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              currentView === 'dashboard'
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => {
              setCurrentView('posts');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              currentView === 'posts'
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4" />
              <span>All Articles</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => {
              setCurrentView('seo-audit');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              currentView === 'seo-audit'
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-4 h-4" />
              <span>SEO Health Audit</span>
            </div>
            {seoAuditStats.missingAltCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>

          <div className="pt-4 pb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            External Shortcuts
          </div>

          <Link
            href="/blog"
            target="_blank"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4" />
              <span>Live Public Blog</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </Link>

          <Link
            href="/"
            target="_blank"
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors"
          >
            <div className="flex items-center gap-3">
              <ExternalLink className="w-4 h-4" />
              <span>OfficeBazzar Home</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </Link>
        </nav>

        {/* User Profile Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate">{username}</p>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Authenticated
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* ===================== MAIN APPLICATION WORKSPACE ===================== */}
      <div className="flex-1 md:ml-64 flex flex-col min-w-0 bg-slate-900 min-h-screen">
        {/* Standalone CMS Top Navigation Bar */}
        <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="text-slate-400">OfficeBazzar CMS</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-white font-semibold capitalize">
                {currentView === 'dashboard' && 'Dashboard Overview'}
                {currentView === 'posts' && 'Article Directory'}
                {currentView === 'seo-audit' && 'SEO Health Audit'}
                {currentView === 'editor' && (editingSlug ? `Editing: ${formData.title || editingSlug}` : 'New Article')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-[11px] font-medium text-slate-300 border border-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Production CMS
            </span>
            <Link
              href="/blog"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              <span>Live Blog</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Content Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* ===================== VIEW 1: DASHBOARD OVERVIEW ===================== */}
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome banner */}
              <div className="bg-gradient-to-r from-blue-900/40 via-slate-900 to-indigo-900/30 p-6 rounded-3xl border border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Welcome to OfficeBazzar Blog Admin
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1">
                    Manage corporate knowledge, SEO guides, and procurement insights.
                  </p>
                </div>
                <button
                  onClick={handleNewPost}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold tracking-wide flex items-center gap-2 shadow-lg shadow-blue-900/40 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Post</span>
                </button>
              </div>

              {/* Metric stats cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Total Articles</span>
                    <FileText className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-white mt-2">{totalCount}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Stored in Git repository</p>
                </div>

                <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Published Live</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-400 mt-2">{publishedCount}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Visible on /blog & sitemap</p>
                </div>

                <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Drafts</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <p className="text-2xl font-bold text-amber-400 mt-2">{draftCount}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Excluded from public index</p>
                </div>

                <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">SEO Health</span>
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-purple-400 mt-2">
                    {seoAuditStats.healthPercent}%
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {seoAuditStats.perfectCount} of {totalCount} optimized
                  </p>
                </div>
              </div>

              {/* Recent posts list */}
              <div className="bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-white">Recent Articles</h2>
                    <p className="text-xs text-slate-400">Recently published and updated content</p>
                  </div>
                  <button
                    onClick={() => setCurrentView('posts')}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>View all ({totalCount})</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="divide-y divide-slate-800/80">
                  {posts.slice(0, 5).map((post) => (
                    <div
                      key={post.slug}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/60 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              post.status === 'published'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {post.status}
                          </span>
                          <span className="text-xs text-slate-400">{post.category}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-xs text-slate-500">{post.publishedDate}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-white truncate max-w-xl">
                          {post.title}
                        </h3>
                        <p className="text-xs text-slate-400 line-clamp-1">{post.excerpt}</p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => handleToggleStatus(post)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                        >
                          {post.status === 'published' ? 'Switch to Draft' : 'Publish'}
                        </button>
                        <button
                          onClick={() => setPreviewModalPost(post)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditPost(post)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===================== VIEW 2: ALL POSTS DIRECTORY ===================== */}
          {currentView === 'posts' && (
            <div className="space-y-5">
              {/* Header and filters */}
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-lg font-bold text-white">Articles Directory</h1>
                    <p className="text-xs text-slate-400">
                      Manage, edit, filter, and publish blog articles
                    </p>
                  </div>
                  <button
                    onClick={handleNewPost}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 self-start sm:self-auto cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Article</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by title, slug, or content..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="py-2 px-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="ALL">All Categories</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>

                  <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                    <button
                      onClick={() => setStatusFilter('ALL')}
                      className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                        statusFilter === 'ALL'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      All ({totalCount})
                    </button>
                    <button
                      onClick={() => setStatusFilter('published')}
                      className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                        statusFilter === 'published'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Live ({publishedCount})
                    </button>
                    <button
                      onClick={() => setStatusFilter('draft')}
                      className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                        statusFilter === 'draft'
                          ? 'bg-amber-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Drafts ({draftCount})
                    </button>
                  </div>
                </div>
              </div>

              {/* Posts Table */}
              <div className="bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Article</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">SEO Health</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {filteredPosts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500">
                            No articles match your search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredPosts.map((post) => (
                          <tr key={post.slug} className="hover:bg-slate-900/40 transition-colors">
                            <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                              <p className="font-semibold text-white truncate">{post.title}</p>
                              <p className="text-[11px] text-slate-400 font-mono truncate">
                                /{post.slug}
                              </p>
                            </td>
                            <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                              {post.category}
                            </td>
                            <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                              {post.publishedDate}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <button
                                onClick={() => handleToggleStatus(post)}
                                title="Click to toggle status"
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                                  post.status === 'published'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                                }`}
                              >
                                {post.status}
                              </button>
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {!post.imageAlt ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Missing Alt
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                                  <CheckCircle className="w-3.5 h-3.5" /> Optimal
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setPreviewModalPost(post)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                                  title="Preview post"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEditPost(post)}
                                  className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-950/40 transition-colors cursor-pointer"
                                  title="Edit post"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteModalSlug(post.slug)}
                                  className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors cursor-pointer"
                                  title="Delete post"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================== VIEW 3: SEO HEALTH AUDIT ===================== */}
          {currentView === 'seo-audit' && (
            <div className="space-y-6">
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
                <h1 className="text-lg font-bold text-white">SEO Health Audit</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Automatic audit of titles, meta descriptions, image alt attributes, and robots directives.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400">Missing Image Alt Tags</span>
                    <p className="text-2xl font-bold text-amber-400 mt-1">
                      {seoAuditStats.missingAltCount}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Accessibility & image search risk</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400">Meta Description Warnings</span>
                    <p className="text-2xl font-bold text-blue-400 mt-1">
                      {seoAuditStats.missingDescCount}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Short or missing meta snippet</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-xs text-slate-400">Non-optimal Title Length</span>
                    <p className="text-2xl font-bold text-purple-400 mt-1">
                      {seoAuditStats.titleLengthIssues}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Outside 35-65 characters</p>
                  </div>
                </div>
              </div>

              {/* Items requiring attention */}
              <div className="bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800">
                  <h2 className="text-sm font-bold text-white">Articles Requiring Optimization</h2>
                </div>
                <div className="divide-y divide-slate-800/80">
                  {posts
                    .filter(
                      (p) =>
                        !p.imageAlt ||
                        (p.seoDescription || p.excerpt).length < 50 ||
                        (p.seoTitle || p.title).length > 70
                    )
                    .map((post) => (
                      <div
                        key={post.slug}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/50"
                      >
                        <div className="space-y-1">
                          <h3 className="text-xs font-semibold text-white">{post.title}</h3>
                          <div className="flex items-center gap-3 text-[11px]">
                            {!post.imageAlt && (
                              <span className="text-amber-400 font-medium">⚠️ Missing Alt Text</span>
                            )}
                            {(post.seoDescription || post.excerpt).length < 50 && (
                              <span className="text-blue-400 font-medium">⚠️ Short Meta Description</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleEditPost(post)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold self-start sm:self-auto cursor-pointer"
                        >
                          Optimize Now
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ===================== VIEW 4: SEO BLOG EDITOR ===================== */}
          {currentView === 'editor' && (
            <div className="space-y-6">
              {/* Sticky Action Bar */}
              <div className="bg-slate-950/90 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-16 z-10 shadow-lg">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentView('posts')}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h1 className="text-sm font-bold text-white truncate max-w-sm sm:max-w-md">
                      {editingSlug ? `Edit: ${formData.title || editingSlug}` : 'Create New Article'}
                    </h1>
                    <p className="text-[11px] text-slate-400">
                      {formData.status === 'published' ? '🟢 Will be live immediately' : '🟡 Draft article'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                  {saveMessage && (
                    <span
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium animate-in fade-in duration-200 ${
                        saveMessage.type === 'success'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {saveMessage.text}
                    </span>
                  )}

                  <button
                    onClick={() => setEditorPreviewMode((prev) => !prev)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{editorPreviewMode ? 'Edit Mode' : 'Preview'}</span>
                  </button>

                  <button
                    onClick={() => handleSave('draft')}
                    disabled={isSaving}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <span>Save Draft</span>
                  </button>

                  <button
                    onClick={() => handleSave('published')}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-900/40 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>{formData.status === 'published' ? 'Update & Publish' : 'Publish Article'}</span>
                  </button>
                </div>
              </div>

              {/* Editor Tabs: Content vs SEO */}
              <div className="flex border-b border-slate-800">
                <button
                  onClick={() => setActiveTab('content')}
                  className={`py-2.5 px-5 text-xs font-bold tracking-wide border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'content'
                      ? 'border-blue-500 text-blue-400 bg-slate-950/40'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📝 Content & Article Body
                </button>
                <button
                  onClick={() => setActiveTab('seo')}
                  className={`py-2.5 px-5 text-xs font-bold tracking-wide border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'seo'
                      ? 'border-blue-500 text-blue-400 bg-slate-950/40'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>⚡ SEO & Social Suite</span>
                </button>
              </div>

              {/* TAB 1: CONTENT */}
              {activeTab === 'content' && (
                <div className="space-y-6">
                  {/* Article metadata card */}
                  <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                        Article Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={handleTitleChange}
                        placeholder="e.g. Complete Guide to Industrial Dustbin Selection for Warehouses"
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                          URL Slug *
                        </label>
                        <div className="relative">
                          <span className="text-slate-500 text-xs absolute left-3.5 top-1/2 -translate-y-1/2 font-mono">
                            /blog/
                          </span>
                          <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                slug: e.target.value
                                  .toLowerCase()
                                  .replace(/[^a-z0-9]+/g, '-')
                                  .replace(/^-+|-+$/g, ''),
                                canonicalUrl: `https://www.officebazzar.com/blog/${e.target.value}`,
                              }))
                            }
                            className="w-full pl-16 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        {isDuplicateSlug && (
                          <p className="text-[11px] text-rose-400 mt-1 font-medium">
                            ⚠️ This slug is already in use by another article.
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                          Category
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                          Author Name
                        </label>
                        <input
                          type="text"
                          value={formData.author}
                          onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                          Publication Date
                        </label>
                        <input
                          type="date"
                          value={formData.publishedDate}
                          onChange={(e) => setFormData((prev) => ({ ...prev, publishedDate: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    {/* Featured Image & Alt */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                          Featured Image URL
                        </label>
                        <input
                          type="text"
                          value={formData.featuredImage}
                          onChange={(e) => setFormData((prev) => ({ ...prev, featuredImage: e.target.value }))}
                          placeholder="/images/categories/..."
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                          <span>Image Alt Text (Crucial for SEO)</span>
                          {!formData.imageAlt && (
                            <span className="text-amber-400 text-[10px] lowercase font-normal">
                              required
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={formData.imageAlt}
                          onChange={(e) => setFormData((prev) => ({ ...prev, imageAlt: e.target.value }))}
                          placeholder="Descriptive image keywords for Google bot"
                          className={`w-full px-3 py-2 bg-slate-900 border rounded-xl text-xs text-white focus:outline-none ${
                            !formData.imageAlt
                              ? 'border-amber-500/60 focus:border-amber-400'
                              : 'border-slate-800 focus:border-blue-500'
                          }`}
                        />
                      </div>
                    </div>

                    {!formData.imageAlt && (
                      <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          Missing Alt Text: Google Image Search and web accessibility guidelines require descriptive alt text.
                        </span>
                      </div>
                    )}

                    {/* Excerpt */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>Short Excerpt (Catalog Summary)</span>
                        <span className="text-[11px] text-slate-500">{formData.excerpt.length} chars</span>
                      </label>
                      <textarea
                        rows={2}
                        value={formData.excerpt}
                        onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                        placeholder="Concise 1-2 sentence preview shown on blog cards..."
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Housekeeping, Office Supplies, Procurement"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Rich Text Editor / Markdown Body */}
                  <div className="bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center gap-1 flex-wrap">
                      <button
                        type="button"
                        onClick={() => insertMarkdown('## ', '\n')}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                        title="Heading 2"
                      >
                        <Heading2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('### ', '\n')}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                        title="Heading 3"
                      >
                        <Heading3 className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-slate-800 mx-1" />
                      <button
                        type="button"
                        onClick={() => insertMarkdown('**', '**')}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                        title="Bold"
                      >
                        <Bold className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('*', '*')}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                        title="Italic"
                      >
                        <Italic className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-slate-800 mx-1" />
                      <button
                        type="button"
                        onClick={() => insertMarkdown('- ', '\n')}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                        title="Bulleted List"
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('1. ', '\n')}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                        title="Numbered List"
                      >
                        <ListOrdered className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('> ', '\n')}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                        title="Quote"
                      >
                        <Quote className="w-4 h-4" />
                      </button>
                      <div className="w-px h-4 bg-slate-800 mx-1" />
                      <button
                        type="button"
                        onClick={() => insertMarkdown('[', '](https://www.officebazzar.com/)')}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                        title="Insert Link"
                      >
                        <LinkIcon className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('![Image description](', ')')}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                        title="Insert Image"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Textarea or Preview */}
                    {editorPreviewMode ? (
                      <div className="p-6 bg-slate-900/50 min-h-[400px] prose prose-invert prose-blue max-w-none text-xs sm:text-sm">
                        <div className="whitespace-pre-wrap font-sans leading-relaxed text-slate-200">
                          {formData.content || '(No content written yet)'}
                        </div>
                      </div>
                    ) : (
                      <textarea
                        id="blog-content-textarea"
                        rows={18}
                        value={formData.content}
                        onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                        placeholder="Write article content using Markdown formatting (headings, lists, links, images)..."
                        className="w-full p-4 bg-slate-950 font-mono text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none resize-y leading-relaxed"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: SEO SUITE */}
              {activeTab === 'seo' && (
                <div className="space-y-6">
                  {/* Google Search Snippet Preview */}
                  <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-400" />
                        <span>Google Search Snippet Preview</span>
                      </h2>
                      <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
                        <button
                          onClick={() => setDevicePreview('desktop')}
                          className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium transition-colors ${
                            devicePreview === 'desktop'
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Monitor className="w-3.5 h-3.5" />
                          <span>Desktop</span>
                        </button>
                        <button
                          onClick={() => setDevicePreview('mobile')}
                          className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium transition-colors ${
                            devicePreview === 'mobile'
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Mobile</span>
                        </button>
                      </div>
                    </div>

                    {/* Google SERP Card */}
                    <div
                      className={`bg-white rounded-xl p-4 text-slate-900 shadow-sm border border-slate-200 ${
                        devicePreview === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-4 h-4 rounded-full bg-[#004b87] flex items-center justify-center text-[9px] font-bold text-white">
                          OB
                        </div>
                        <div className="text-[11px] text-slate-700 truncate">
                          <span>Office Bazzar</span>
                          <span className="text-slate-400 mx-1">›</span>
                          <span className="text-slate-500">blog › {formData.slug || 'article-slug'}</span>
                        </div>
                      </div>
                      <h3 className="text-[#1a0dab] hover:underline text-sm sm:text-base font-normal leading-snug cursor-pointer line-clamp-1">
                        {displaySeoTitle}
                      </h3>
                      <p className="text-slate-600 text-xs sm:text-xs leading-relaxed mt-1 line-clamp-2">
                        {displaySeoDesc || 'Search engines will generate a snippet from your article body.'}
                      </p>
                    </div>
                  </div>

                  {/* SEO Metadata Form */}
                  <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>SEO Title</span>
                        <span
                          className={`text-[11px] font-mono ${
                            titleCharCount >= 40 && titleCharCount <= 60
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {titleCharCount} / 60 chars (Optimal: 40-60)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={formData.seoTitle || ''}
                        onChange={(e) => setFormData((prev) => ({ ...prev, seoTitle: e.target.value }))}
                        placeholder={formData.title ? `${formData.title} | OfficeBazzar` : 'SEO Title'}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>Meta Description</span>
                        <span
                          className={`text-[11px] font-mono ${
                            descCharCount >= 120 && descCharCount <= 160
                              ? 'text-emerald-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {descCharCount} / 155 chars (Optimal: 120-155)
                        </span>
                      </label>
                      <textarea
                        rows={3}
                        value={formData.seoDescription || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, seoDescription: e.target.value }))
                        }
                        placeholder={formData.excerpt || 'Enter meta description for search engines...'}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                          Focus Keyword
                        </label>
                        <input
                          type="text"
                          value={formData.focusKeyword || ''}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, focusKeyword: e.target.value }))
                          }
                          placeholder="e.g. industrial dustbin supplier"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                          Secondary Keywords
                        </label>
                        <input
                          type="text"
                          value={formData.secondaryKeywords || ''}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, secondaryKeywords: e.target.value }))
                          }
                          placeholder="comma-separated keywords"
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                        Canonical URL
                      </label>
                      <input
                        type="url"
                        value={
                          formData.canonicalUrl ||
                          (formData.slug ? `https://www.officebazzar.com/blog/${formData.slug}` : '')
                        }
                        onChange={(e) => setFormData((prev) => ({ ...prev, canonicalUrl: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Social Media Sharing (Open Graph) */}
                    <div className="pt-3 border-t border-slate-800 space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <Share2 className="w-4 h-4 text-blue-400" />
                        <span>Social Sharing (Open Graph)</span>
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            OG Title
                          </label>
                          <input
                            type="text"
                            value={formData.ogTitle || ''}
                            onChange={(e) => setFormData((prev) => ({ ...prev, ogTitle: e.target.value }))}
                            placeholder={formData.title || 'Social sharing title'}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-slate-400 mb-1">
                            OG Image URL
                          </label>
                          <input
                            type="text"
                            value={formData.ogImage || ''}
                            onChange={(e) => setFormData((prev) => ({ ...prev, ogImage: e.target.value }))}
                            placeholder={formData.featuredImage || '/images/categories/...'}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Robots Index / Noindex directive */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-white">Search Engine Indexing (Robots)</p>
                        <p className="text-[11px] text-slate-400">
                          {formData.indexRobots !== false
                            ? 'Index, follow (Recommended for public articles)'
                            : 'Noindex, nofollow (Hidden from Google search)'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            indexRobots: prev.indexRobots === false ? true : false,
                          }))
                        }
                        className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                          formData.indexRobots !== false ? 'bg-blue-600' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                            formData.indexRobots !== false ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ===================== PREVIEW MODAL ===================== */}
      {previewModalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-white text-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Article Preview
              </span>
              <button
                onClick={() => setPreviewModalPost(null)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <span className="text-xs font-semibold text-[#004b87] uppercase tracking-wider">
                {previewModalPost.category}
              </span>
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                {previewModalPost.title}
              </h1>
              <p className="text-xs text-slate-500">
                Published on {previewModalPost.publishedDate} by {previewModalPost.author}
              </p>
              <div className="p-4 bg-slate-50 border-l-4 border-[#004b87] rounded-r-xl text-xs text-slate-700 italic">
                {previewModalPost.excerpt}
              </div>
              <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm leading-relaxed text-slate-800 pt-2 border-t border-slate-100">
                {previewModalPost.content || '(No content body)'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== DELETE CONFIRMATION MODAL ===================== */}
      {deleteModalSlug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-md w-full p-6 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-950/60 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Delete Article Confirmation</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete the article with slug{' '}
              <strong className="text-rose-400 font-mono">/{deleteModalSlug}</strong>? This action will remove the article from the repository.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteModalSlug(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
