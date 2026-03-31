/**
 * src/app/sitemap.ts
 * 
 * Issue #6: Generate sitemap.xml for 8,000+ product pages
 * Next.js will serve this at /sitemap.xml automatically
 */

import { createClient } from '@supabase/supabase-js';
import type { MetadataRoute } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://plantpriset.se';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/froer`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/vaxter`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/lokar`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tillbehor`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/planera`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // Fetch all product slugs from Supabase
  // Paginate to handle 8000+ products
  const allProducts: Array<{ slug: string; updated_at: string }> = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('products')
      .select('slug, updated_at')
      .not('slug', 'is', null)
      .range(page * pageSize, (page + 1) * pageSize - 1)
      .order('id');

    if (error || !data?.length) break;
    allProducts.push(...data);
    if (data.length < pageSize) break;
    page++;
  }

  // Generate product page entries
  const productPages: MetadataRoute.Sitemap = allProducts.map(product => ({
    url: `${baseUrl}/produkt/${product.slug}`,
    lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));

  // Also add subcategory pages if they exist
  const { data: subcategories } = await supabase
    .from('products')
    .select('subcategory, category')
    .not('subcategory', 'is', null);

  const uniqueSubcats = new Set<string>();
  subcategories?.forEach(p => {
    if (p.subcategory) uniqueSubcats.add(p.subcategory);
  });

  const subcategoryPages: MetadataRoute.Sitemap = Array.from(uniqueSubcats).map(sub => ({
    url: `${baseUrl}/kategori/${encodeURIComponent(sub.toLowerCase().replace(/\s+/g, '-'))}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...subcategoryPages, ...productPages];
}
