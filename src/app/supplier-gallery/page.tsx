import React from 'react';
import fs from 'fs';
import path from 'path';
import { Metadata } from 'next';
import SupplierGalleryClient, { SupplierAssetItem } from '@/components/gallery/SupplierGalleryClient';

export const metadata: Metadata = {
  title: 'Supplier Image Library | OfficeBazzar B2B Corporate Procurement',
  description: 'Complete digital photography archive of all 2,369 authentic supplier assets across all 29 departments.',
};

export default async function SupplierGalleryPage() {
  const manifestPath = path.join(process.cwd(), 'scripts', 'supplier_images_master_manifest.json');
  let assets: SupplierAssetItem[] = [];

  if (fs.existsSync(manifestPath)) {
    try {
      assets = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (e) {
      console.error('Error loading supplier manifest:', e);
    }
  }

  // Extract unique departments / folders
  const categories = Array.from(new Set(assets.map(a => a.originalFolder).filter(Boolean))).sort();

  return (
    <SupplierGalleryClient
      initialAssets={assets}
      categories={categories}
    />
  );
}

