'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import FooterWrapper from '@/components/FooterWrapper';
import ScrollToTop from '@/components/ScrollToTop';

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Pages that should be fullscreen without navbar/footer
  const isFullscreenPage = pathname?.startsWith('/messages');

  if (isFullscreenPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      {/* Espaciador para compensar el header fijo */}
      <div className="h-14 sm:h-16" />
      {children}
      <FooterWrapper />
      <ScrollToTop />
    </>
  );
}
