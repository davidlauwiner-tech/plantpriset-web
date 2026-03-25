import { createClient } from '@supabase/supabase-js';
import type { MetadataRoute } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://plantpriset.se';

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/froer`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/vaxter`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/lokar`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/tillbehor`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/planera`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ];

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

  const productPages: MetadataRoute.Sitemap = allProducts.map(p => ({
    url: `${baseUrl}/produkt/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...productPages];
}
