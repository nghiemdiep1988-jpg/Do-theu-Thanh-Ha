import type { Product } from '../types.ts';

const RAW_API_BASE = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return RAW_API_BASE ? `${RAW_API_BASE}${normalized}` : normalized;
}

export function resolveAssetUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Uploaded files live on the backend server
  if (trimmed.startsWith('/uploads/') && RAW_API_BASE) {
    return `${RAW_API_BASE}${trimmed}`;
  }

  // Relative static assets under public/ (e.g. /images/products/...)
  if (trimmed.startsWith('/images/')) {
    const base = import.meta.env.BASE_URL || '/';
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    return `${cleanBase}${trimmed.slice(1)}`;
  }

  return trimmed;
}

export async function fetchPublishedProducts(): Promise<{
  products: Product[];
  mode: 'live-api' | 'static-fallback';
}> {
  try {
    const res = await fetch(apiUrl('/api/products?status=published'));
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = (await res.json()) as { products?: Product[] };
        return { products: data.products ?? [], mode: 'live-api' };
      }
    }
  } catch {
    // Fall through to static GitHub Pages JSON fallback
  }

  // Fallback for pure static hosting (e.g. GitHub Pages without live backend URL yet)
  try {
    const base = import.meta.env.BASE_URL || '/';
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    const staticRes = await fetch(`${cleanBase}data/products.json`);
    if (staticRes.ok) {
      const parsed = (await staticRes.json()) as Product[];
      if (Array.isArray(parsed)) {
        return {
          products: parsed.filter((p) => p.status === 'published'),
          mode: 'static-fallback',
        };
      }
    }
  } catch {
    // Ignore fallback failure
  }

  return { products: [], mode: 'static-fallback' };
}
