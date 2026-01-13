'use client';

import { SWRConfig } from 'swr';
import { ReactNode } from 'react';

// Configuración global de SWR - simple sin localStorage
const swrConfig = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 30000,           // 30s entre peticiones duplicadas
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  shouldRetryOnError: true,
};

export function SWRProvider({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={swrConfig}>
      {children}
    </SWRConfig>
  );
}

export default swrConfig;
