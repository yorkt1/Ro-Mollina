import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[hsl(var(--navy-deep))] text-white">
        <div className="mb-8 flex flex-col items-center">
          <p className="text-xs uppercase tracking-[0.3em] text-accent/80 mb-4">Sincronizando</p>
          <div className="h-0.5 w-48 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-24 animate-[loading_1.5s_infinite_ease-in-out] bg-accent" />
          </div>
        </div>
        <Loader2 className="h-8 w-8 animate-spin text-accent/40" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
