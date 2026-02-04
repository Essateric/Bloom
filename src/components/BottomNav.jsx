import React from "react";
import { NavLink } from "react-router-dom";
import { CalendarDays, User, ClipboardList, Shield } from "lucide-react";
import { cn } from "../lib/utils.js";
import { useAuth } from "../state/auth.jsx";

function Item({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs",
          isActive ? "text-brand-800" : "text-brand-600"
        )
      }
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </NavLink>
  );
}

export default function BottomNav() {
  const { isAdmin } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-brand-100 bg-white">
      <div className="mx-auto flex max-w-md">
        <Item to="/" icon={CalendarDays} label="Schedule" />
        <Item to="/my-bookings" icon={ClipboardList} label="My Bookings" />
        <Item to="/profile" icon={User} label="Profile" />
        {isAdmin ? <Item to="/admin" icon={Shield} label="Admin" /> : null}
      </div>
    </nav>
  );
}
