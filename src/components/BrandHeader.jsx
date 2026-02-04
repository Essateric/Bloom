import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "./ui/button.jsx";
import { useAuth } from "../state/auth.jsx";
import { supabase } from "../lib/supabase.js"; // if your supabase file is in a different path, update this import

export default function BrandHeader() {
  const navigate = useNavigate();
  const { user, profile, signOut: signOutFromContext } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      // Prefer your auth context if it provides signOut, otherwise fallback to direct supabase sign out
      if (typeof signOutFromContext === "function") {
        await signOutFromContext();
      } else {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }

      toast.success("Logged out");
      navigate("/"); // back to schedule
    } catch (err) {
      toast.error(err?.message || "Could not log out");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-brand-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/bloom-logo.png"
            alt="Bloom by Holli"
            className="h-8 w-auto"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-brand-900">Bloom</div>
            <div className="text-xs text-brand-700">by Holli</div>
          </div>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link to="/profile" className="text-xs text-brand-700 hover:underline">
                {profile?.full_name ? `Hi, ${profile.full_name}` : "Profile"}
              </Link>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? "Logging out…" : "Log out"}
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm">Log in</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}