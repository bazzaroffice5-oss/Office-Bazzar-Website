'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  FileText,
  Plus,
  Image as ImageIcon,
  Sparkles,
  Settings,
  FolderTree,
  Tag as TagIcon,
  Trash2,
  Clock,
  Eye,
  Edit3,
  Copy,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Upload,
  Globe,
  Share2,
  Heading2,
  Heading3,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Table as TableIcon,
  Code,
  Save,
  Check,
  RefreshCw,
  Monitor,
  Smartphone,
  CheckCircle,
  XCircle,
  HelpCircle,
  RotateCcw,
  ArrowUpRight,
  Grid,
  ListFilter,
  Calendar,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { AdminBlogPost, MediaItem } from '@/lib/blog-admin/storage';

interface Props {
  initialPosts: AdminBlogPost[];
  username: string;
}

const DEFAULT_CATEGORIES = [
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
  const [currentView, setCurrentView] = useState<
    'dashboard' | 'posts' | 'editor' | 'media' | 'categories' | 'tags' | 'seo-manager' | 'settings'
  >('dashboard');

  // Sub-navigation & Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [postsSubmenuOpen, setPostsSubmenuOpen] = useState(true);

  // Filter & Search states
  const [postStatusTab, setPostStatusTab] = useState<'all' | 'published' | 'scheduled' | 'draft' | 'trash'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedPostSlugs, setSelectedPostSlugs] = useState<string[]>([]);

  // Categories & Tags local state
  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_CATEGORIES);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTagName, setNewTagName] = useState('');

  // Media Library state
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaViewMode, setMediaViewMode] = useState<'grid' | 'list'>('grid');
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'featured' | 'content'>('featured');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [selectedMediaItem, setSelectedMediaItem] = useState<MediaItem | null>(null);

  // Editor form state
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [formData, setFormData] = useState<AdminBlogPost>({
    slug: '',
    title: '',
    status: 'published',
    publishedDate: new Date().toISOString().split('T')[0],
    scheduledDate: '',
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

  const [tagInput, setTagInput] = useState('');
  const [editorActiveTab, setEditorActiveTab] = useState<'edit' | 'preview'>('edit');
  const [editorDevicePreview, setEditorDevicePreview] = useState<'desktop' | 'mobile'>('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [deleteModalSlug, setDeleteModalSlug] = useState<string | null>(null);
  const [previewModalPost, setPreviewModalPost] = useState<AdminBlogPost | null>(null);

  // Quick Draft state on Dashboard
  const [quickDraftTitle, setQuickDraftTitle] = useState('');
  const [quickDraftContent, setQuickDraftContent] = useState('');
  const [quickDraftSaving, setQuickDraftSaving] = useState(false);

  // Load Media Library
  const loadMedia = async () => {
    setMediaLoading(true);
    try {
      const res = await fetch('/api/blog-admin/media');
      if (res.ok) {
        const data = await res.json();
        setMediaItems(data.media || []);
      }
    } catch (e) {
      console.error('Failed to load media:', e);
    } finally {
      setMediaLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  // Post counts by status
  const counts = useMemo(() => {
    const published = posts.filter((p) => p.status === 'published').length;
    const scheduled = posts.filter((p) => p.status === 'scheduled').length;
    const drafts = posts.filter((p) => p.status === 'draft').length;
    const trash = posts.filter((p) => p.status === 'trash').length;
    return {
      all: posts.filter((p) => p.status !== 'trash').length,
      published,
      scheduled,
      drafts,
      trash,
      total: posts.length,
    };
  }, [posts]);

  // Filtered posts for Table View
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      // Status filter
      if (postStatusTab === 'all' && post.status === 'trash') return false;
      if (postStatusTab === 'published' && post.status !== 'published') return false;
      if (postStatusTab === 'scheduled' && post.status !== 'scheduled') return false;
      if (postStatusTab === 'draft' && post.status !== 'draft') return false;
      if (postStatusTab === 'trash' && post.status !== 'trash') return false;

      // Category filter
      if (categoryFilter !== 'ALL' && post.category !== categoryFilter) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = post.title.toLowerCase().includes(q);
        const matchSlug = post.slug.toLowerCase().includes(q);
        const matchExcerpt = post.excerpt.toLowerCase().includes(q);
        if (!matchTitle && !matchSlug && !matchExcerpt) return false;
      }

      return true;
    });
  }, [posts, postStatusTab, categoryFilter, searchQuery]);

  // SEO Health metrics across all non-trash posts
  const seoHealth = useMemo(() => {
    const active = posts.filter((p) => p.status !== 'trash');
    let missingAlt = 0;
    let missingMeta = 0;
    let titleLengthIssues = 0;

    active.forEach((p) => {
      if (!p.imageAlt || !p.imageAlt.trim()) missingAlt++;
      const desc = p.seoDescription || p.excerpt;
      if (!desc || desc.length < 50) missingMeta++;
      const title = p.seoTitle || p.title;
      if (title.length < 35 || title.length > 65) titleLengthIssues++;
    });

    const optimalCount = active.filter((p) => {
      const hasAlt = Boolean(p.imageAlt && p.imageAlt.trim());
      const desc = p.seoDescription || p.excerpt;
      const goodDesc = Boolean(desc && desc.length >= 80 && desc.length <= 165);
      const title = p.seoTitle || p.title;
      const goodTitle = Boolean(title && title.length >= 35 && title.length <= 65);
      return hasAlt && goodDesc && goodTitle;
    }).length;

    const percent = active.length > 0 ? Math.round((optimalCount / active.length) * 100) : 100;

    return {
      missingAlt,
      missingMeta,
      titleLengthIssues,
      optimalCount,
      percent,
      totalActive: active.length,
    };
  }, [posts]);

  // Open New Post Editor
  const handleNewPost = () => {
    setEditingSlug(null);
    setFormData({
      slug: '',
      title: '',
      status: 'draft',
      publishedDate: new Date().toISOString().split('T')[0],
      scheduledDate: '',
      author: 'Office Bazzar Team',
      category: categoriesList[0] || 'Housekeeping & Hygiene',
      tags: ['Procurement', 'Office Supplies'],
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
    setTagInput('Procurement, Office Supplies');
    setSaveMessage(null);
    setEditorActiveTab('edit');
    setCurrentView('editor');
    setMobileMenuOpen(false);
  };

  // Open Edit Post Editor
  const handleEditPost = (post: AdminBlogPost) => {
    setEditingSlug(post.slug);
    setFormData({ ...post });
    setTagInput((post.tags || []).join(', '));
    setSaveMessage(null);
    setEditorActiveTab('edit');
    setCurrentView('editor');
    setMobileMenuOpen(false);
  };

  // Duplicate Post action
  const handleDuplicatePost = async (post: AdminBlogPost) => {
    try {
      const res = await fetch(`/api/blog-admin/posts/${post.slug}/duplicate`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) => [data.post, ...prev]);
        setSaveMessage({ type: 'success', text: `Post duplicated: ${data.post.title}` });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Move to Trash action
  const handleMoveToTrash = async (post: AdminBlogPost) => {
    const updated = { ...post, status: 'trash' as const };
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

  // Restore from Trash action
  const handleRestoreFromTrash = async (post: AdminBlogPost) => {
    const updated = { ...post, status: 'draft' as const };
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

  // Delete Confirm
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

  // Duplicate slug check
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
    const selected = text.substring(start, end) || 'Sample text';
    const replacement = prefix + selected + suffix;
    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setFormData((prev) => ({ ...prev, content: newContent }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 50);
  };

  // Save / Publish / Schedule / Trash
  const handleSave = async (overrideStatus?: 'published' | 'draft' | 'scheduled' | 'trash') => {
    if (!formData.title.trim()) {
      setSaveMessage({ type: 'error', text: 'Article title is required.' });
      return;
    }
    if (!formData.slug.trim()) {
      setSaveMessage({ type: 'error', text: 'URL slug is required.' });
      return;
    }
    if (isDuplicateSlug) {
      setSaveMessage({ type: 'error', text: 'URL slug is already taken. Please enter a unique slug.' });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    const targetStatus = overrideStatus || formData.status;
    const postPayload: AdminBlogPost = {
      ...formData,
      status: targetStatus,
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
        text: targetStatus === 'published'
          ? 'Post published live successfully!'
          : targetStatus === 'scheduled'
          ? 'Post scheduled for publication!'
          : 'Post saved as draft.',
      });

      // Update state
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

  // Quick Draft from Dashboard
  const handleQuickDraftSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickDraftTitle.trim()) return;

    setQuickDraftSaving(true);
    const slug = quickDraftTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const newPost: AdminBlogPost = {
      slug: slug || `draft-${Date.now()}`,
      title: quickDraftTitle,
      status: 'draft',
      publishedDate: new Date().toISOString().split('T')[0],
      author: 'Office Bazzar Team',
      category: categoriesList[0] || 'Housekeeping & Hygiene',
      tags: ['Draft'],
      featuredImage: '/images/categories/office-supplies-stationery.jpg',
      imageAlt: quickDraftTitle,
      excerpt: quickDraftContent.slice(0, 140),
      canonicalUrl: `https://www.officebazzar.com/blog/${slug}`,
      content: quickDraftContent,
    };

    try {
      const res = await fetch('/api/blog-admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost),
      });
      if (res.ok) {
        setPosts((prev) => [newPost, ...prev]);
        setQuickDraftTitle('');
        setQuickDraftContent('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setQuickDraftSaving(false);
    }
  };

  // Upload Media handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    const body = new FormData();
    body.append('file', file);

    try {
      const res = await fetch('/api/blog-admin/media', {
        method: 'POST',
        body,
      });
      if (res.ok) {
        const data = await res.json();
        await loadMedia();
        if (mediaPickerOpen) {
          if (mediaPickerTarget === 'featured') {
            setFormData((prev) => ({ ...prev, featuredImage: data.url }));
          } else {
            insertMarkdown(`![${file.name}](`, `${data.url})`);
          }
          setMediaPickerOpen(false);
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploadingMedia(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await fetch('/api/blog-admin/logout', { method: 'POST' });
    window.location.reload();
  };

  // SEO Calculation values
  const displaySeoTitle = formData.seoTitle || `${formData.title} | OfficeBazzar`;
  const displaySeoDesc = formData.seoDescription || formData.excerpt;
  const titleLen = displaySeoTitle.length;
  const descLen = displaySeoDesc.length;

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-slate-800 flex flex-col font-sans">
      {/* ===================== WORDPRESS-STYLE TOP ADMIN BAR ===================== */}
      <header className="sticky top-0 z-40 bg-[#004b87] text-white h-12 flex items-center justify-between px-3 sm:px-4 shadow-sm select-none border-b border-[#0a355c]">
        {/* Left: Brand & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden p-1.5 text-blue-100 hover:text-white rounded-lg hover:bg-white/10"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center font-bold text-white text-xs border border-white/20">
              OB
            </span>
            <span className="text-sm font-bold tracking-tight text-white hidden sm:inline">
              OfficeBazzar CMS
            </span>
          </div>

          <span className="text-blue-300/40 hidden sm:inline">|</span>

          {/* Quick + New Post button */}
          <button
            onClick={handleNewPost}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Post</span>
          </button>

          {/* Live site link */}
          <Link
            href="/blog"
            target="_blank"
            className="flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-white/10 text-xs font-medium text-blue-100 hover:text-white transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Visit Blog</span>
            <ExternalLink className="w-3 h-3 text-blue-200" />
          </Link>
        </div>

        {/* Right: Search, Admin profile & Logout */}
        <div className="flex items-center gap-3 text-xs">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#16a34a]/20 text-emerald-200 border border-[#16a34a]/40 text-[11px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Production
          </div>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold text-white">
              {username.charAt(0).toUpperCase()}
            </div>
            <span className="text-blue-100 font-medium hidden sm:inline max-w-[150px] truncate">
              {username}
            </span>
          </div>

          <button
            onClick={handleLogout}
            title="Log out"
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-600/80 hover:bg-rose-600 text-white font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* ===================== BODY WRAPPER (SIDEBAR + MAIN CANVAS) ===================== */}
      <div className="flex-1 flex min-h-[calc(100vh-3rem)]">
        {/* ===================== WORDPRESS-STYLE LEFT SIDEBAR ===================== */}
        <aside
          className={`fixed inset-y-12 left-0 z-30 bg-[#0a355c] text-slate-200 flex flex-col transition-all duration-200 ease-in-out md:static ${
            sidebarCollapsed ? 'w-16' : 'w-60'
          } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        >
          {/* Main Navigation Menu */}
          <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto text-xs font-medium">
            {/* 1. Dashboard */}
            <button
              onClick={() => {
                setCurrentView('dashboard');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-[#004b87] text-white font-semibold border-l-4 border-[#16a34a]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>Dashboard</span>}
            </button>

            {/* 2. Posts (With WordPress-style collapsible submenu) */}
            <div>
              <button
                onClick={() => {
                  setPostsSubmenuOpen((prev) => !prev);
                  if (currentView !== 'posts' && currentView !== 'editor') {
                    setCurrentView('posts');
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                  currentView === 'posts' || currentView === 'editor'
                    ? 'bg-[#004b87] text-white font-semibold border-l-4 border-[#16a34a]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 shrink-0" />
                  {!sidebarCollapsed && <span>Posts</span>}
                </div>
                {!sidebarCollapsed && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      postsSubmenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>

              {/* Posts Submenu */}
              {postsSubmenuOpen && !sidebarCollapsed && (
                <div className="pl-9 pr-2 py-1 space-y-1">
                  <button
                    onClick={() => {
                      setPostStatusTab('all');
                      setCurrentView('posts');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left py-1.5 px-2 rounded-md text-xs cursor-pointer ${
                      currentView === 'posts' && postStatusTab === 'all'
                        ? 'text-white font-semibold bg-white/10'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All Posts ({counts.all})
                  </button>

                  <button
                    onClick={handleNewPost}
                    className={`w-full text-left py-1.5 px-2 rounded-md text-xs cursor-pointer ${
                      currentView === 'editor' && !editingSlug
                        ? 'text-white font-semibold bg-white/10'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Add New Post
                  </button>

                  <button
                    onClick={() => {
                      setCurrentView('categories');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left py-1.5 px-2 rounded-md text-xs cursor-pointer ${
                      currentView === 'categories'
                        ? 'text-white font-semibold bg-white/10'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Categories ({categoriesList.length})
                  </button>

                  <button
                    onClick={() => {
                      setCurrentView('tags');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left py-1.5 px-2 rounded-md text-xs cursor-pointer ${
                      currentView === 'tags'
                        ? 'text-white font-semibold bg-white/10'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Tags
                  </button>
                </div>
              )}
            </div>

            {/* 3. Media Library */}
            <button
              onClick={() => {
                setCurrentView('media');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                currentView === 'media'
                  ? 'bg-[#004b87] text-white font-semibold border-l-4 border-[#16a34a]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <ImageIcon className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>Media Library</span>}
              </div>
              {!sidebarCollapsed && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-slate-300">
                  {mediaItems.length}
                </span>
              )}
            </button>

            {/* 4. SEO Manager */}
            <button
              onClick={() => {
                setCurrentView('seo-manager');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                currentView === 'seo-manager'
                  ? 'bg-[#004b87] text-white font-semibold border-l-4 border-[#16a34a]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 shrink-0 text-[#16a34a]" />
                {!sidebarCollapsed && <span>SEO Manager</span>}
              </div>
              {!sidebarCollapsed && seoHealth.missingAlt > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>

            {/* 5. Published Quick Filter */}
            <button
              onClick={() => {
                setPostStatusTab('published');
                setCurrentView('posts');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                currentView === 'posts' && postStatusTab === 'published'
                  ? 'bg-[#004b87] text-white font-semibold border-l-4 border-[#16a34a]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                {!sidebarCollapsed && <span>Published</span>}
              </div>
              {!sidebarCollapsed && (
                <span className="text-[11px] font-semibold text-emerald-400">{counts.published}</span>
              )}
            </button>

            {/* 6. Scheduled Posts */}
            <button
              onClick={() => {
                setPostStatusTab('scheduled');
                setCurrentView('posts');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                currentView === 'posts' && postStatusTab === 'scheduled'
                  ? 'bg-[#004b87] text-white font-semibold border-l-4 border-[#16a34a]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 shrink-0 text-blue-300" />
                {!sidebarCollapsed && <span>Scheduled</span>}
              </div>
              {!sidebarCollapsed && (
                <span className="text-[11px] font-semibold text-blue-300">{counts.scheduled}</span>
              )}
            </button>

            {/* 7. Drafts */}
            <button
              onClick={() => {
                setPostStatusTab('draft');
                setCurrentView('posts');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                currentView === 'posts' && postStatusTab === 'draft'
                  ? 'bg-[#004b87] text-white font-semibold border-l-4 border-[#16a34a]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 shrink-0 text-amber-300" />
                {!sidebarCollapsed && <span>Drafts</span>}
              </div>
              {!sidebarCollapsed && (
                <span className="text-[11px] font-semibold text-amber-300">{counts.drafts}</span>
              )}
            </button>

            {/* 8. Trash */}
            <button
              onClick={() => {
                setPostStatusTab('trash');
                setCurrentView('posts');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                currentView === 'posts' && postStatusTab === 'trash'
                  ? 'bg-[#004b87] text-white font-semibold border-l-4 border-[#16a34a]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-4 h-4 shrink-0 text-rose-300" />
                {!sidebarCollapsed && <span>Trash</span>}
              </div>
              {!sidebarCollapsed && (
                <span className="text-[11px] font-semibold text-rose-300">{counts.trash}</span>
              )}
            </button>

            {/* 9. Settings */}
            <button
              onClick={() => {
                setCurrentView('settings');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer ${
                currentView === 'settings'
                  ? 'bg-[#004b87] text-white font-semibold border-l-4 border-[#16a34a]'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>Settings</span>}
            </button>
          </nav>

          {/* Sidebar Collapse Toggle */}
          <div className="p-2 border-t border-white/10 hidden md:block">
            <button
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="w-full flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-xs"
              title={sidebarCollapsed ? 'Expand menu' : 'Collapse menu'}
            >
              <ChevronRight
                className={`w-4 h-4 transition-transform ${
                  sidebarCollapsed ? '' : 'rotate-180'
                }`}
              />
              {!sidebarCollapsed && <span className="ml-2">Collapse Menu</span>}
            </button>
          </div>
        </aside>

        {/* Mobile backdrop */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-20 bg-black/50 backdrop-blur-xs md:hidden"
          />
        )}

        {/* ===================== MAIN APPLICATION WORKSPACE ===================== */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          {/* ===================== VIEW 1: WORDPRESS-STYLE DASHBOARD ===================== */}
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              {/* Dashboard Welcome Header */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <span>Welcome to OfficeBazzar CMS</span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage corporate supplies blog articles, SEO performance, media files, and scheduled publications.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleNewPost}
                    className="px-4 py-2 rounded-xl bg-[#004b87] hover:bg-[#0a355c] text-white text-xs font-bold tracking-wide flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Write New Post</span>
                  </button>
                </div>
              </div>

              {/* At a Glance Metric Widgets */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">All Posts</span>
                    <FileText className="w-4 h-4 text-[#004b87]" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{counts.all}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Stored in Git repository</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Published</span>
                    <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
                  </div>
                  <p className="text-2xl font-bold text-[#16a34a] mt-2">{counts.published}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Live on /blog & indexed</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Drafts & Scheduled</span>
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <p className="text-2xl font-bold text-amber-600 mt-2">{counts.drafts + counts.scheduled}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Excluded from public index</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">SEO Score</span>
                    <Sparkles className="w-4 h-4 text-[#004b87]" />
                  </div>
                  <p className="text-2xl font-bold text-[#004b87] mt-2">{seoHealth.percent}%</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {seoHealth.optimalCount} of {seoHealth.totalActive} posts optimal
                  </p>
                </div>
              </div>

              {/* 2-Column Dashboard Grid: Quick Draft + Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Quick Draft Form */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h2 className="text-sm font-bold text-slate-900">Quick Draft</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Jot down a quick blog idea</p>
                  </div>

                  <form onSubmit={handleQuickDraftSave} className="space-y-3">
                    <div>
                      <input
                        type="text"
                        value={quickDraftTitle}
                        onChange={(e) => setQuickDraftTitle(e.target.value)}
                        placeholder="Title"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#004b87]"
                      />
                    </div>
                    <div>
                      <textarea
                        rows={4}
                        value={quickDraftContent}
                        onChange={(e) => setQuickDraftContent(e.target.value)}
                        placeholder="What's on your mind? Write quick notes or excerpt..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#004b87] resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={quickDraftSaving || !quickDraftTitle.trim()}
                      className="px-4 py-2 bg-[#004b87] hover:bg-[#0a355c] text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {quickDraftSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      <span>Save Draft</span>
                    </button>
                  </form>
                </div>

                {/* Right: Recent Activity Table */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Recent Activity</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Recently modified and published articles</p>
                    </div>
                    <button
                      onClick={() => {
                        setPostStatusTab('all');
                        setCurrentView('posts');
                      }}
                      className="text-xs font-semibold text-[#004b87] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>All Posts ({counts.all})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {posts.slice(0, 5).map((post) => (
                      <div
                        key={post.slug}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                post.status === 'published'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : post.status === 'scheduled'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {post.status}
                            </span>
                            <span className="text-xs text-slate-500">{post.category}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs text-slate-400">{post.publishedDate}</span>
                          </div>
                          <h3 className="text-sm font-semibold text-slate-900 truncate max-w-lg">
                            {post.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          <button
                            onClick={() => setPreviewModalPost(post)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditPost(post)}
                            className="px-3 py-1.5 rounded-lg bg-[#004b87] hover:bg-[#0a355c] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
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
            </div>
          )}

          {/* ===================== VIEW 2: WORDPRESS-STYLE ALL POSTS DIRECTORY ===================== */}
          {currentView === 'posts' && (
            <div className="space-y-4">
              {/* Header and Add button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-slate-900">Posts</h1>
                  <button
                    onClick={handleNewPost}
                    className="px-3 py-1 rounded-md bg-[#004b87] hover:bg-[#0a355c] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New</span>
                  </button>
                </div>

                {saveMessage && (
                  <span
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium animate-in fade-in ${
                      saveMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {saveMessage.text}
                  </span>
                )}
              </div>

              {/* WordPress-style Status Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs text-slate-500 overflow-x-auto">
                <button
                  onClick={() => setPostStatusTab('all')}
                  className={`font-semibold cursor-pointer ${
                    postStatusTab === 'all' ? 'text-[#004b87]' : 'hover:text-slate-800'
                  }`}
                >
                  All <span className="text-slate-400">({counts.all})</span>
                </button>
                <span className="text-slate-300">|</span>

                <button
                  onClick={() => setPostStatusTab('published')}
                  className={`font-semibold cursor-pointer ${
                    postStatusTab === 'published' ? 'text-[#004b87]' : 'hover:text-slate-800'
                  }`}
                >
                  Published <span className="text-slate-400">({counts.published})</span>
                </button>
                <span className="text-slate-300">|</span>

                <button
                  onClick={() => setPostStatusTab('scheduled')}
                  className={`font-semibold cursor-pointer ${
                    postStatusTab === 'scheduled' ? 'text-[#004b87]' : 'hover:text-slate-800'
                  }`}
                >
                  Scheduled <span className="text-slate-400">({counts.scheduled})</span>
                </button>
                <span className="text-slate-300">|</span>

                <button
                  onClick={() => setPostStatusTab('draft')}
                  className={`font-semibold cursor-pointer ${
                    postStatusTab === 'draft' ? 'text-[#004b87]' : 'hover:text-slate-800'
                  }`}
                >
                  Drafts <span className="text-slate-400">({counts.drafts})</span>
                </button>
                <span className="text-slate-300">|</span>

                <button
                  onClick={() => setPostStatusTab('trash')}
                  className={`font-semibold cursor-pointer ${
                    postStatusTab === 'trash' ? 'text-rose-600' : 'hover:text-slate-800'
                  }`}
                >
                  Trash <span className="text-slate-400">({counts.trash})</span>
                </button>
              </div>

              {/* Filters toolbar */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-[#004b87]"
                  >
                    <option value="ALL">All Categories</option>
                    {categoriesList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search posts..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#004b87]"
                  />
                </div>
              </div>

              {/* Posts Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-4">Title</th>
                        <th className="py-3 px-4">Author</th>
                        <th className="py-3 px-4">Categories</th>
                        <th className="py-3 px-4">Tags</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">SEO Health</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPosts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                            No posts found.
                          </td>
                        </tr>
                      ) : (
                        filteredPosts.map((post) => (
                          <tr key={post.slug} className="hover:bg-slate-50/70 transition-colors group">
                            {/* Title & Hover Row Actions */}
                            <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                              <p className="font-bold text-slate-900 truncate">{post.title}</p>
                              <p className="text-[11px] text-slate-400 font-mono truncate">
                                /blog/{post.slug}
                              </p>

                              {/* WordPress-style Row Actions */}
                              <div className="flex items-center gap-2 mt-1 text-[11px] font-medium text-slate-400 opacity-90 group-hover:opacity-100">
                                {post.status !== 'trash' ? (
                                  <>
                                    <button
                                      onClick={() => handleEditPost(post)}
                                      className="text-[#004b87] hover:underline cursor-pointer"
                                    >
                                      Edit
                                    </button>
                                    <span>|</span>
                                    <button
                                      onClick={() => handleDuplicatePost(post)}
                                      className="text-blue-600 hover:underline cursor-pointer"
                                    >
                                      Duplicate
                                    </button>
                                    <span>|</span>
                                    <button
                                      onClick={() => setPreviewModalPost(post)}
                                      className="text-slate-600 hover:underline cursor-pointer"
                                    >
                                      Preview
                                    </button>
                                    <span>|</span>
                                    <button
                                      onClick={() => handleMoveToTrash(post)}
                                      className="text-rose-600 hover:underline cursor-pointer"
                                    >
                                      Trash
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleRestoreFromTrash(post)}
                                      className="text-emerald-600 hover:underline cursor-pointer"
                                    >
                                      Restore
                                    </button>
                                    <span>|</span>
                                    <button
                                      onClick={() => setDeleteModalSlug(post.slug)}
                                      className="text-rose-600 hover:underline cursor-pointer font-bold"
                                    >
                                      Delete Permanently
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                              {post.author}
                            </td>

                            <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                              {post.category}
                            </td>

                            <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap max-w-[120px] truncate">
                              {(post.tags || []).slice(0, 2).join(', ')}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="space-y-0.5">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    post.status === 'published'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : post.status === 'scheduled'
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : post.status === 'trash'
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}
                                >
                                  {post.status}
                                </span>
                                <p className="text-[11px] text-slate-400">{post.publishedDate}</p>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              {!post.imageAlt ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                  <AlertTriangle className="w-3 h-3" /> Missing Alt
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                  <CheckCircle className="w-3 h-3" /> Optimal
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                              <button
                                onClick={() => handleEditPost(post)}
                                className="px-3 py-1.5 rounded-lg bg-[#004b87] hover:bg-[#0a355c] text-white text-xs font-semibold cursor-pointer"
                              >
                                Edit
                              </button>
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

          {/* ===================== VIEW 3: WORDPRESS-STYLE 2-COLUMN BLOG EDITOR ===================== */}
          {currentView === 'editor' && (
            <div className="space-y-4">
              {/* Top Editor Bar */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentView('posts')}
                    className="p-1 rounded-md hover:bg-slate-200 text-slate-500 cursor-pointer"
                  >
                    ← Back to Posts
                  </button>
                  <span className="text-xs text-slate-400">|</span>
                  <span className="text-xs font-bold text-slate-700">
                    {editingSlug ? 'Edit Post' : 'Add New Post'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {saveMessage && (
                    <span
                      className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                        saveMessage.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {saveMessage.text}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSave('draft')}
                    disabled={isSaving}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewModalPost(formData)}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave()}
                    disabled={isSaving}
                    className="px-4 py-1.5 rounded-lg bg-[#004b87] hover:bg-[#0a355c] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{formData.status === 'published' ? 'Update Post' : formData.status === 'scheduled' ? 'Schedule Post' : 'Publish Post'}</span>
                  </button>
                </div>
              </div>

              {/* 2-Column WordPress Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* ================= LEFT MAIN CANVAS ================= */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Title and Permalink */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <input
                      type="text"
                      value={formData.title}
                      onChange={handleTitleChange}
                      placeholder="Add title"
                      className="w-full text-xl sm:text-2xl font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none border-b border-transparent focus:border-slate-200 pb-2"
                    />

                    {/* Permalink Display */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono flex-wrap bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="font-semibold text-slate-600">Permalink:</span>
                      <span className="text-slate-400">https://www.officebazzar.com/blog/</span>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                            canonicalUrl: `https://www.officebazzar.com/blog/${e.target.value}`,
                          }))
                        }
                        className="font-bold text-[#004b87] bg-white border border-slate-200 px-2 py-0.5 rounded-md focus:outline-none"
                      />
                      {isDuplicateSlug && (
                        <span className="text-rose-600 text-[11px] font-semibold">⚠️ Duplicate Slug</span>
                      )}
                    </div>
                  </div>

                  {/* Formatting Toolbar & Content Editor */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                    {/* Gutenberg/Classic Toolbar */}
                    <div className="bg-slate-50 border-b border-slate-200 p-2.5 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => insertMarkdown('## ', '\n')}
                          className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 cursor-pointer"
                          title="Heading 2"
                        >
                          <Heading2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdown('### ', '\n')}
                          className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 cursor-pointer"
                          title="Heading 3"
                        >
                          <Heading3 className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-slate-300 mx-1" />
                        <button
                          type="button"
                          onClick={() => insertMarkdown('**', '**')}
                          className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 cursor-pointer"
                          title="Bold"
                        >
                          <Bold className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdown('*', '*')}
                          className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 cursor-pointer"
                          title="Italic"
                        >
                          <Italic className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-slate-300 mx-1" />
                        <button
                          type="button"
                          onClick={() => insertMarkdown('- ', '\n')}
                          className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 cursor-pointer"
                          title="Bulleted List"
                        >
                          <List className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdown('1. ', '\n')}
                          className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 cursor-pointer"
                          title="Numbered List"
                        >
                          <ListOrdered className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertMarkdown('> ', '\n')}
                          className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 cursor-pointer"
                          title="Quote"
                        >
                          <Quote className="w-4 h-4" />
                        </button>
                        <div className="w-px h-4 bg-slate-300 mx-1" />
                        <button
                          type="button"
                          onClick={() => insertMarkdown('[', '](https://www.officebazzar.com/)')}
                          className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 cursor-pointer"
                          title="Insert Link"
                        >
                          <LinkIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMediaPickerTarget('content');
                            setMediaPickerOpen(true);
                          }}
                          className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 cursor-pointer flex items-center gap-1 text-xs font-semibold"
                          title="Insert Media"
                        >
                          <ImageIcon className="w-4 h-4" />
                          <span>Add Media</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            insertMarkdown(
                              '| Item | Description | Specification |\n| :--- | :--- | :--- |\n| Product A | Heavy Duty | High Grade |\n'
                            )
                          }
                          className="p-1.5 rounded-md hover:bg-slate-200 text-slate-700 cursor-pointer"
                          title="Insert Table"
                        >
                          <TableIcon className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex bg-slate-200/70 rounded-lg p-0.5 text-xs">
                        <button
                          type="button"
                          onClick={() => setEditorActiveTab('edit')}
                          className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${
                            editorActiveTab === 'edit' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                          }`}
                        >
                          Code / Text
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditorActiveTab('preview')}
                          className={`px-3 py-1 rounded-md font-semibold cursor-pointer ${
                            editorActiveTab === 'preview' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                          }`}
                        >
                          Visual Preview
                        </button>
                      </div>
                    </div>

                    {/* Textarea or Visual Preview */}
                    {editorActiveTab === 'edit' ? (
                      <textarea
                        id="blog-content-textarea"
                        rows={18}
                        value={formData.content}
                        onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                        placeholder="Start writing or use Markdown formatting..."
                        className="w-full p-5 font-mono text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none resize-y leading-relaxed"
                      />
                    ) : (
                      <div className="p-6 min-h-[400px] prose prose-slate max-w-none text-xs sm:text-sm">
                        <div className="whitespace-pre-wrap font-sans leading-relaxed text-slate-800">
                          {formData.content || '(No content written yet)'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Excerpt Meta Box */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
                    <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                      <span>Excerpt</span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        Shown on catalog search and social shares ({formData.excerpt.length} chars)
                      </span>
                    </label>
                    <textarea
                      rows={2}
                      value={formData.excerpt}
                      onChange={(e) => setFormData((prev) => ({ ...prev, excerpt: e.target.value }))}
                      placeholder="Write an excerpt (optional)..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#004b87]"
                    />
                  </div>

                  {/* ================= WORDPRESS-STYLE YOAST / RANKMATH SEO META BOX ================= */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#004b87]" />
                        <h2 className="text-sm font-bold text-slate-900">SEO Manager & Google SERP Preview</h2>
                      </div>
                      <div className="flex bg-slate-200 rounded-lg p-0.5 text-xs">
                        <button
                          type="button"
                          onClick={() => setEditorDevicePreview('desktop')}
                          className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                            editorDevicePreview === 'desktop' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                          }`}
                        >
                          Desktop SERP
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditorDevicePreview('mobile')}
                          className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                            editorDevicePreview === 'mobile' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                          }`}
                        >
                          Mobile SERP
                        </button>
                      </div>
                    </div>

                    <div className="p-5 space-y-5">
                      {/* Google Snippet Card */}
                      <div
                        className={`p-4 rounded-xl border border-slate-200 bg-white ${
                          editorDevicePreview === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-4 h-4 rounded-full bg-[#004b87] flex items-center justify-center text-[9px] font-bold text-white">
                            OB
                          </div>
                          <div className="text-[11px] text-slate-600 truncate">
                            <span>www.officebazzar.com</span>
                            <span className="mx-1">›</span>
                            <span>blog</span>
                            <span className="mx-1">›</span>
                            <span>{formData.slug || 'article-slug'}</span>
                          </div>
                        </div>
                        <h3 className="text-[#1a0dab] hover:underline text-sm sm:text-base font-normal leading-snug cursor-pointer line-clamp-1">
                          {displaySeoTitle}
                        </h3>
                        <p className="text-slate-600 text-xs leading-relaxed mt-1 line-clamp-2">
                          {displaySeoDesc || 'Search engines will display this snippet in Google search results.'}
                        </p>
                      </div>

                      {/* SEO Fields */}
                      <div className="space-y-4 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                            <span>SEO Title</span>
                            <span
                              className={`text-[11px] font-mono ${
                                titleLen >= 40 && titleLen <= 60 ? 'text-[#16a34a] font-bold' : 'text-amber-600'
                              }`}
                            >
                              {titleLen} / 60 chars (Recommended: 40-60)
                            </span>
                          </label>
                          <input
                            type="text"
                            value={formData.seoTitle || ''}
                            onChange={(e) => setFormData((prev) => ({ ...prev, seoTitle: e.target.value }))}
                            placeholder={formData.title ? `${formData.title} | OfficeBazzar` : 'SEO Title'}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#004b87]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                            <span>Meta Description</span>
                            <span
                              className={`text-[11px] font-mono ${
                                descLen >= 120 && descLen <= 160 ? 'text-[#16a34a] font-bold' : 'text-amber-600'
                              }`}
                            >
                              {descLen} / 155 chars (Recommended: 120-155)
                            </span>
                          </label>
                          <textarea
                            rows={3}
                            value={formData.seoDescription || ''}
                            onChange={(e) => setFormData((prev) => ({ ...prev, seoDescription: e.target.value }))}
                            placeholder={formData.excerpt || 'Enter meta description...'}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#004b87]"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                              Focus Keyword
                            </label>
                            <input
                              type="text"
                              value={formData.focusKeyword || ''}
                              onChange={(e) => setFormData((prev) => ({ ...prev, focusKeyword: e.target.value }))}
                              placeholder="e.g. housekeeping products chennai"
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#004b87]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                              Secondary Keywords
                            </label>
                            <input
                              type="text"
                              value={formData.secondaryKeywords || ''}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, secondaryKeywords: e.target.value }))
                              }
                              placeholder="comma-separated"
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#004b87]"
                            />
                          </div>
                        </div>

                        {/* Real-time SEO Analysis Checklist */}
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            SEO Checklist & Quality Audit
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1.5">
                              {titleLen >= 35 && titleLen <= 65 ? (
                                <CheckCircle className="w-4 h-4 text-[#16a34a]" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                              )}
                              <span>SEO Title length optimal</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {descLen >= 80 && descLen <= 165 ? (
                                <CheckCircle className="w-4 h-4 text-[#16a34a]" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                              )}
                              <span>Meta Description length optimal</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {formData.imageAlt?.trim() ? (
                                <CheckCircle className="w-4 h-4 text-[#16a34a]" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                              )}
                              <span>Featured image has descriptive alt text</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {formData.focusKeyword &&
                              formData.title.toLowerCase().includes(formData.focusKeyword.toLowerCase()) ? (
                                <CheckCircle className="w-4 h-4 text-[#16a34a]" />
                              ) : (
                                <HelpCircle className="w-4 h-4 text-slate-400" />
                              )}
                              <span>Focus keyword in title</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ================= RIGHT SIDEBAR (WORDPRESS DOCUMENT SETTINGS) ================= */}
                <div className="space-y-5">
                  {/* Summary / Publish Box */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                      Publish Settings
                    </h3>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Status:</label>
                        <select
                          value={formData.status}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              status: e.target.value as 'published' | 'draft' | 'scheduled' | 'trash',
                            }))
                          }
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                        >
                          <option value="published">Published (Live)</option>
                          <option value="draft">Draft (Private)</option>
                          <option value="scheduled">Scheduled (Future)</option>
                          <option value="trash">Trash</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">
                          Publish Date:
                        </label>
                        <input
                          type="date"
                          value={formData.publishedDate}
                          onChange={(e) => setFormData((prev) => ({ ...prev, publishedDate: e.target.value }))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 font-semibold mb-1">Author:</label>
                        <input
                          type="text"
                          value={formData.author}
                          onChange={(e) => setFormData((prev) => ({ ...prev, author: e.target.value }))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleSave('trash')}
                        className="text-xs text-rose-600 hover:underline cursor-pointer"
                      >
                        Move to Trash
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSave()}
                        disabled={isSaving}
                        className="px-4 py-2 rounded-xl bg-[#004b87] hover:bg-[#0a355c] text-white text-xs font-bold cursor-pointer transition-colors"
                      >
                        {formData.status === 'published' ? 'Update' : formData.status === 'scheduled' ? 'Schedule' : 'Save'}
                      </button>
                    </div>
                  </div>

                  {/* Categories Box */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                      Category
                    </h3>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
                      {categoriesList.map((c) => (
                        <label
                          key={c}
                          className="flex items-center gap-2 p-1 rounded hover:bg-slate-50 cursor-pointer text-slate-700"
                        >
                          <input
                            type="radio"
                            name="category-choice"
                            checked={formData.category === c}
                            onChange={() => setFormData((prev) => ({ ...prev, category: c }))}
                            className="accent-[#004b87]"
                          />
                          <span>{c}</span>
                        </label>
                      ))}
                    </div>

                    {/* Inline Add Category */}
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="New category..."
                        className="flex-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newCategoryName.trim()) {
                            setCategoriesList((prev) => [...prev, newCategoryName.trim()]);
                            setFormData((prev) => ({ ...prev, category: newCategoryName.trim() }));
                            setNewCategoryName('');
                          }
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  {/* Tags Box */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                      Tags
                    </h3>
                    <div>
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Separate with commas"
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* Featured Image Box */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                      Featured Image
                    </h3>

                    {formData.featuredImage ? (
                      <div className="space-y-2">
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                          <Image
                            src={formData.featuredImage}
                            alt={formData.imageAlt || 'Featured image'}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setMediaPickerTarget('featured');
                            setMediaPickerOpen(true);
                          }}
                          className="w-full py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
                        >
                          Replace Image
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setMediaPickerTarget('featured');
                          setMediaPickerOpen(true);
                        }}
                        className="w-full py-8 border-2 border-dashed border-slate-200 hover:border-[#004b87] rounded-xl text-center text-xs font-semibold text-slate-600 cursor-pointer"
                      >
                        Set featured image
                      </button>
                    )}

                    {/* Image Alt Text */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Image Alt Text (SEO Required)
                      </label>
                      <input
                        type="text"
                        value={formData.imageAlt}
                        onChange={(e) => setFormData((prev) => ({ ...prev, imageAlt: e.target.value }))}
                        placeholder="Descriptive alt text for Google..."
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                      {!formData.imageAlt && (
                        <p className="text-[11px] text-amber-600 mt-1 font-medium">
                          ⚠️ Missing Alt Text is an SEO risk.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================== VIEW 4: WORDPRESS-STYLE MEDIA LIBRARY ===================== */}
          {currentView === 'media' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-slate-900">Media Library</h1>
                  <label className="px-3 py-1 rounded-md bg-[#004b87] hover:bg-[#0a355c] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Add New Media</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={mediaSearch}
                      onChange={(e) => setMediaSearch(e.target.value)}
                      placeholder="Search media..."
                      className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                    />
                  </div>
                  <div className="flex bg-white border border-slate-200 rounded-lg p-0.5">
                    <button
                      onClick={() => setMediaViewMode('grid')}
                      className={`p-1.5 rounded-md ${mediaViewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setMediaViewMode('list')}
                      className={`p-1.5 rounded-md ${mediaViewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}
                    >
                      <ListFilter className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {uploadingMedia && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#004b87]" />
                  <span>Uploading image and committing to repository...</span>
                </div>
              )}

              {/* Grid / List View */}
              {mediaViewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {mediaItems
                    .filter((m) => m.name.toLowerCase().includes(mediaSearch.toLowerCase()))
                    .map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setSelectedMediaItem(item)}
                        className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:border-[#004b87] transition-all cursor-pointer group"
                      >
                        <div className="aspect-square relative bg-slate-50">
                          <Image src={item.url} alt={item.name} fill className="object-cover" />
                        </div>
                        <div className="p-2 text-[11px] truncate">
                          <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                          <p className="text-slate-400 text-[10px]">{item.size}</p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-3 px-4">File</th>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Folder</th>
                        <th className="py-3 px-4">Size</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mediaItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70">
                          <td className="py-2 px-4 w-16">
                            <div className="w-12 h-12 relative rounded-lg overflow-hidden border border-slate-200">
                              <Image src={item.url} alt={item.name} fill className="object-cover" />
                            </div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{item.name}</td>
                          <td className="py-3 px-4 text-slate-500">{item.folder}</td>
                          <td className="py-3 px-4 text-slate-500">{item.size}</td>
                          <td className="py-3 px-4 text-slate-500">{item.date}</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(item.url);
                                alert('URL copied: ' + item.url);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold cursor-pointer"
                            >
                              Copy URL
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ===================== VIEW 5: CATEGORIES MANAGER ===================== */}
          {currentView === 'categories' && (
            <div className="space-y-5">
              <h1 className="text-xl font-bold text-slate-900">Categories</h1>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Add New Category form */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <h2 className="text-sm font-bold text-slate-900">Add New Category</h2>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g. Corporate Facility Management"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (newCategoryName.trim()) {
                        setCategoriesList((prev) => [...prev, newCategoryName.trim()]);
                        setNewCategoryName('');
                      }
                    }}
                    className="w-full py-2 bg-[#004b87] hover:bg-[#0a355c] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Add Category
                  </button>
                </div>

                {/* Categories Table */}
                <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px] font-bold">
                      <tr>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Slug</th>
                        <th className="py-3 px-4 text-right">Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {categoriesList.map((cat) => {
                        const count = posts.filter((p) => p.category === cat).length;
                        return (
                          <tr key={cat} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-semibold text-slate-900">{cat}</td>
                            <td className="py-3 px-4 text-slate-500 font-mono">
                              {cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-[#004b87]">
                              {count}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===================== VIEW 6: TAGS MANAGER ===================== */}
          {currentView === 'tags' && (
            <div className="space-y-5">
              <h1 className="text-xl font-bold text-slate-900">Post Tags</h1>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Add new tag..."
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs w-64"
                  />
                  <button
                    onClick={() => {
                      if (newTagName.trim()) {
                        alert(`Tag "${newTagName}" ready for posts.`);
                        setNewTagName('');
                      }
                    }}
                    className="px-4 py-2 bg-[#004b87] hover:bg-[#0a355c] text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Add Tag
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                  {Array.from(new Set(posts.flatMap((p) => p.tags || []))).map((tag) => {
                    const count = posts.filter((p) => (p.tags || []).includes(tag)).length;
                    return (
                      <span
                        key={tag}
                        className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                      >
                        <TagIcon className="w-3 h-3 text-[#004b87]" />
                        <span>{tag}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({count})</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ===================== VIEW 7: SEO HEALTH MANAGER ===================== */}
          {currentView === 'seo-manager' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                <h1 className="text-xl font-bold text-slate-900">SEO Health Manager</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Comprehensive audit of meta tags, search snippets, and image attributes across all published articles.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs font-semibold text-slate-500">Missing Image Alt Tags</span>
                    <p className="text-2xl font-bold text-amber-600 mt-1">{seoHealth.missingAlt}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Required for image search</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs font-semibold text-slate-500">Short Meta Descriptions</span>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{seoHealth.missingMeta}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Below 50 characters</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs font-semibold text-slate-500">Title Length Issues</span>
                    <p className="text-2xl font-bold text-purple-600 mt-1">{seoHealth.titleLengthIssues}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Outside 35–65 characters</p>
                  </div>
                </div>
              </div>

              {/* Items requiring attention */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-100">
                  <h2 className="text-sm font-bold text-slate-900">Articles Requiring Optimization</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {posts
                    .filter((p) => p.status !== 'trash')
                    .filter(
                      (p) =>
                        !p.imageAlt ||
                        (p.seoDescription || p.excerpt).length < 50 ||
                        (p.seoTitle || p.title).length > 65
                    )
                    .map((post) => (
                      <div
                        key={post.slug}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70"
                      >
                        <div className="space-y-1">
                          <h3 className="text-xs font-bold text-slate-900">{post.title}</h3>
                          <div className="flex items-center gap-3 text-[11px]">
                            {!post.imageAlt && (
                              <span className="text-amber-600 font-semibold">⚠️ Missing Image Alt</span>
                            )}
                            {(post.seoDescription || post.excerpt).length < 50 && (
                              <span className="text-blue-600 font-semibold">⚠️ Short Meta Description</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleEditPost(post)}
                          className="px-3 py-1.5 rounded-lg bg-[#004b87] hover:bg-[#0a355c] text-white text-xs font-semibold cursor-pointer self-start sm:self-auto"
                        >
                          Optimize in Editor
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ===================== VIEW 8: CMS SETTINGS ===================== */}
          {currentView === 'settings' && (
            <div className="space-y-5">
              <h1 className="text-xl font-bold text-slate-900">Settings</h1>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 max-w-2xl">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Canonical Domain
                  </label>
                  <input
                    type="text"
                    disabled
                    value="https://www.officebazzar.com"
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Default Author Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Office Bazzar Team"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Storage Provider
                  </label>
                  <input
                    type="text"
                    disabled
                    value="GitHub Repository (Office-Bazzar-Website / main)"
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-600"
                  />
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => alert('Settings saved successfully.')}
                    className="px-4 py-2 bg-[#004b87] hover:bg-[#0a355c] text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ===================== MODAL: MEDIA LIBRARY PICKER ===================== */}
      {mediaPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white text-slate-900 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Choose Image from Media Library
              </span>
              <button
                onClick={() => setMediaPickerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 gap-3">
              {mediaItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (mediaPickerTarget === 'featured') {
                      setFormData((prev) => ({ ...prev, featuredImage: item.url }));
                    } else {
                      insertMarkdown(`![${item.name}](`, `${item.url})`);
                    }
                    setMediaPickerOpen(false);
                  }}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-[#004b87] transition-all cursor-pointer group"
                >
                  <div className="aspect-square relative bg-slate-50">
                    <Image src={item.url} alt={item.name} fill className="object-cover" />
                  </div>
                  <p className="p-1.5 text-[10px] font-semibold text-slate-700 truncate">{item.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ARTICLE PREVIEW ===================== */}
      {previewModalPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white text-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Article Preview
              </span>
              <button
                onClick={() => setPreviewModalPost(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <span className="text-xs font-bold text-[#004b87] uppercase tracking-wider">
                {previewModalPost.category}
              </span>
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                {previewModalPost.title}
              </h1>
              <p className="text-xs text-slate-400">
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

      {/* ===================== MODAL: DELETE CONFIRMATION ===================== */}
      {deleteModalSlug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white text-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Delete Post Permanently</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete post{' '}
              <strong className="text-rose-600 font-mono">/{deleteModalSlug}</strong>? This action will remove the article from repository content.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteModalSlug(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
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
