import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <div className="p-6 text-sm text-brand-700">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return children;
}

export function RequireAdmin({ children }) {
  const { user, loading, isAdmin } = useAuth();
  const loc = useLocation();

  if (loading) return <div className="p-6 text-sm text-brand-700">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}
