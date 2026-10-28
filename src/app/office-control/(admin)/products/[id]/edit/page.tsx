import React from 'react';
import { notFound } from 'next/navigation';
import { getProductById, getCategories, getBrands } from '@/lib/db/store';
import ProductFormClient from '@/components/admin/ProductFormClient';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories, brands] = await Promise.all([
    getProductById(id),
    getCategories(),
    getBrands(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <ProductFormClient
      initialProduct={product}
      categories={categories}
      brands={brands}
      mode="edit"
    />
  );
}
