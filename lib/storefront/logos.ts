// Per-store logo registry. To add a logo for a store:
//   1. Drop the file in /public/logos/<slug>.png (or .svg)
//   2. Add an entry below: 'my-store': '/logos/my-store.png'
// If a slug is missing here, the storefront falls back to a text-mark
// rendered from the store name. No DB / schema changes required.

const LOGO_REGISTRY: Record<string, string> = {
  // 'benami': '/logos/benami.png',
}

export function getStoreLogoUrl(storeSlug: string): string | null {
  return LOGO_REGISTRY[storeSlug] ?? null
}
