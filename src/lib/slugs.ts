export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // Split accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

export function extractIdFromSlug(slug: string): string {
  // Format is: title-slug--firebaseId (double dash separates slug from ID)
  if (!slug) return '';
  const doubleDashIndex = slug.lastIndexOf('--');
  if (doubleDashIndex !== -1) {
    return slug.substring(doubleDashIndex + 2);
  }
  // Fallback: last part after single dash (legacy URLs)
  const parts = slug.split('-');
  return parts[parts.length - 1];
}

export function createProductLink(product: { id: string; title: string; category?: string }): string {
  const slug = slugify(product.title);
  const categorySlug = product.category ? slugify(product.category) : 'detalii';
  // Use full ID with double dash separator for proper extraction
  return `/anunturi/${categorySlug}/${slug}--${product.id}`;
}
