import React from 'react';
import CategoryPage, { generateMetadata as baseGenerateMetadata } from '@/app/category/[slug]/page';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ sub?: string; query?: string; brand?: string; view?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  return baseGenerateMetadata({
    params,
    searchParams: Promise.resolve({ ...resolvedSearchParams, view: 'all' }),
  });
}

export default async function CategoryProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ sub?: string; query?: string; brand?: string; view?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  return (
    <CategoryPage
      params={params}
      searchParams={Promise.resolve({ ...resolvedSearchParams, view: 'all' })}
    />
  );
}
