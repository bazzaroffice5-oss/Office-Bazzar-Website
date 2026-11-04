'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Folder, ExternalLink, X, ChevronLeft, ChevronRight, CheckCircle2, SlidersHorizontal } from 'lucide-react';

export interface SupplierAssetItem {
  originalFilename: string;
  originalFolder: string;
  processedFilename: string;
  webPath: string;
  fileSize: number;
  processingStatus: string;
  productMapping?: string;
}

interface SupplierGalleryClientProps {
  initialAssets: SupplierAssetItem[];
  categories: string[];
}

const ITEMS_PER_PAGE = 48;

export default function SupplierGalleryClient({ initialAssets, categories }: SupplierGalleryClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeModalAsset, setActiveModalAsset] = useState<SupplierAssetItem | null>(null);

  // Filtered assets
  const filteredAssets = useMemo(() => {
    return initialAssets.filter(item => {
      // Category filter
      if (selectedCategory !== 'All' && item.originalFolder !== selectedCategory) {
        return false;
      }
      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = item.originalFilename.toLowerCase().includes(query);
        const matchesFolder = item.originalFolder.toLowerCase().includes(query);
        const matchesMapping = (item.productMapping || '').toLowerCase().includes(query);
        if (!matchesName && !matchesFolder && !matchesMapping) return false;
      }
      return true;
    });
  }, [initialAssets, selectedCategory, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE) || 1;
  const paginatedAssets = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAssets.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAssets, currentPage]);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-blue-800 uppercase tracking-widest mb-1.5">
                <Folder className="w-4 h-4" />
                <span>OfficeBazzar Master Image Library</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Supplier Photography Archive
              </h1>
              <p className="text-sm text-slate-500 mt-1 max-w-2xl">
                Explore all 2,369 authentic supplier original photographs and high-resolution WebP assets across all 29 departments.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-2.5 text-center">
                <span className="block text-2xl font-black text-blue-900 leading-tight">2,369</span>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Total Assets</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-2.5 text-center">
                <span className="block text-2xl font-black text-emerald-900 leading-tight">29</span>
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Folders</span>
              </div>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by filename, product name, or SKU..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Pill Scroll */}
            <div className="w-full md:w-auto flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-medium shrink-0 flex items-center mr-1">
                <SlidersHorizontal className="w-3.5 h-3.5 mr-1" /> Department:
              </span>
              <button
                onClick={() => handleCategoryChange('All')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                  selectedCategory === 'All'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({initialAssets.length})
              </button>
              {categories.map((cat) => {
                const count = initialAssets.filter(a => a.originalFolder === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results Bar */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-2">
          <span>
            Showing <strong className="text-slate-800">{filteredAssets.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> to{' '}
            <strong className="text-slate-800">{Math.min(currentPage * ITEMS_PER_PAGE, filteredAssets.length)}</strong> of{' '}
            <strong className="text-slate-800">{filteredAssets.length}</strong> assets
          </span>
          <span>Page {currentPage} of {totalPages}</span>
        </div>

        {/* Image Grid */}
        {paginatedAssets.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {paginatedAssets.map((asset, index) => {
              const isImage = asset.webPath && asset.webPath.endsWith('.webp');
              return (
                <div
                  key={`${asset.originalFolder}-${asset.processedFilename}-${index}`}
                  onClick={() => setActiveModalAsset(asset)}
                  className="group bg-white border border-slate-200 rounded-2xl p-2.5 flex flex-col justify-between hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer relative"
                >
                  <div className="relative aspect-square w-full rounded-xl bg-slate-50 overflow-hidden flex items-center justify-center border border-slate-100">
                    {isImage ? (
                      <Image
                        src={asset.webPath}
                        alt={asset.originalFilename}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                        className="object-contain p-1 group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    ) : (
                      <div className="text-center p-3">
                        <Folder className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                        <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[100px]">
                          {asset.processedFilename}
                        </span>
                      </div>
                    )}

                    {/* Department Tag Overlay */}
                    <span className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                      {asset.originalFolder}
                    </span>
                  </div>

                  {/* Caption & Mapping Info */}
                  <div className="mt-2 text-left">
                    <p className="text-[11px] font-medium text-slate-800 line-clamp-1 group-hover:text-blue-900 transition-colors" title={asset.originalFilename}>
                      {asset.originalFilename}
                    </p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                      <span>{Math.round(asset.fileSize / 1024)} KB</span>
                      {asset.productMapping && asset.productMapping !== 'Available in Supplier Library' && asset.productMapping !== 'Unmatched' && (
                        <span className="flex items-center text-emerald-600 font-bold" title={asset.productMapping}>
                          <CheckCircle2 className="w-3 h-3 mr-0.5" /> Mapped
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No supplier assets match your search</h3>
            <p className="text-xs text-slate-500 mt-1">Try clearing filters or searching by a different term.</p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory('All'); setCurrentPage(1); }}
              className="mt-4 px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 pt-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </button>
            <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>

      {/* Lightbox Asset Detail Modal */}
      {activeModalAsset && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveModalAsset(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 relative flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                  {activeModalAsset.originalFolder}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1 line-clamp-1">
                  {activeModalAsset.originalFilename}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalAsset(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Image View */}
            <div className="relative aspect-square w-full max-h-[50vh] bg-slate-100/60 flex items-center justify-center p-4">
              {activeModalAsset.webPath && activeModalAsset.webPath.endsWith('.webp') ? (
                <Image
                  src={activeModalAsset.webPath}
                  alt={activeModalAsset.originalFilename}
                  fill
                  className="object-contain p-2"
                />
              ) : (
                <div className="text-center p-6 text-slate-400 text-xs">
                  <Folder className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  {activeModalAsset.processingStatus}
                </div>
              )}
            </div>

            {/* Modal Metadata Footer */}
            <div className="p-4 sm:p-6 bg-slate-50/70 border-t border-slate-100 text-xs space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Original Source</span>
                  <span className="text-slate-800 font-medium break-all">{activeModalAsset.originalFolder} / {activeModalAsset.originalFilename}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">Optimized Asset</span>
                  <span className="text-slate-800 font-mono text-[11px] break-all">{activeModalAsset.webPath}</span>
                </div>
              </div>

              {activeModalAsset.productMapping && activeModalAsset.productMapping !== 'Available in Supplier Library' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Connected Product</span>
                    <span className="text-emerald-950 font-bold text-xs">{activeModalAsset.productMapping}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400 text-[11px]">Size: {Math.round(activeModalAsset.fileSize / 1024)} KB · {activeModalAsset.processingStatus}</span>
                <a
                  href={activeModalAsset.webPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-blue-700 hover:text-blue-900 font-bold text-xs"
                >
                  <span>Open Full Size</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

