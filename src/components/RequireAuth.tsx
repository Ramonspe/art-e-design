import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="container py-20 text-center text-muted-foreground">Carregando…</div>;
  if (!user) return <Navigate to={`/auth?redirect=${encodeURIComponent(loc.pathname)}`} replace />;
  return children;
};

export const RequireAdmin = ({ children }: { children: JSX.Element }) => {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return <div className="container py-20 text-center text-muted-foreground">Carregando…</div>;
  if (!user) return <Navigate to="/auth?redirect=/admin" replace />;
  if (!isAdmin) return <div className="container py-20 text-center"><h1 className="text-2xl font-bold">Acesso restrito</h1><p className="text-muted-foreground mt-2">Esta área é exclusiva para administradores.</p></div>;
  return children;
};
