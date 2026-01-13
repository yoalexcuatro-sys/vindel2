'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function FooterWrapper() {
  const pathname = usePathname();
  
  // Check if current page is product detail page
  // Updated route for /anunturi/[category]/[slug]-[id]
  const isProductPage = pathname?.startsWith('/anunturi/');
  const isAdminPage = pathname?.startsWith('/admin');

  if (isProductPage || isAdminPage) {
    return null;
  }

  return <Footer />;
}
