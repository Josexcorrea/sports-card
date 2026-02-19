import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isFirebaseConfigured } from '../../lib/firebase';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isFirebaseConfigured) {
    return <>{children}</>;
  }

  if (!currentUser || !currentUser.approved) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
