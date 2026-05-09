'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
});

function AuthInitializer() {
  const init = useAuthStore(s => s.init);
  useEffect(() => { init(); }, [init]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer />
      {children}
      <Toaster position="top-right" toastOptions={{
        style: { borderRadius: '10px', background: '#1f2937', color: '#f9fafb' },
        success: { iconTheme: { primary: '#10b981', secondary: '#f9fafb' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#f9fafb' } },
      }} />
    </QueryClientProvider>
  );
}
