import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";
import { Button } from "./ui/button.jsx";

export default function BrandHeader() {
  const { user, profile, signOut } = useAuth();

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
              <span className="text-xs text-brand-700">
                {profile?.full_name ? `Hi, ${profile.full_name}` : "Logged in"}
              </span>
              <Button variant="outline" size="sm" onClick={signOut}>
                Log out
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
