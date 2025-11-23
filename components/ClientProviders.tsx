'use client';

import { FavoritesProvider } from '../contexts/FavoritesContext';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <FavoritesProvider>
      {children}
    </FavoritesProvider>
  );
}

