'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function FooterWrapper() {
  const pathname = usePathname();
  
  // Check if current page is product detail page
  // Assuming route is /product/[id]
  const isProductPage = pathname?.startsWith('/product/');

  if (isProductPage) {
    return null;
  }

  return <Footer />;
}
