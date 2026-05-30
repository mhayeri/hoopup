import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../providers/useAuth';
import type { ReactNode } from 'react';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center bg-[var(--color-night)] px-6 py-16">
        <p className="text-sm uppercase tracking-[0.4em] text-[var(--color-bone)]/60">Loading...</p>
      </main>
    );
  }

  if (!session) {
    const from = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?from=${from}`} replace />;
  }

  return <>{children}</>;
}
