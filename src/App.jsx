import React from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import BrandHeader from "./components/BrandHeader.jsx";
import BottomNav from "./components/BottomNav.jsx";
import SchedulePage from "./pages/SchedulePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import MyBookingsPage from "./pages/MyBookingsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import AdminHome from "./pages/admin/AdminHome.jsx";
import AdminSession from "./pages/admin/AdminSession.jsx";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements.jsx";
import AdminMembers from "./pages/admin/AdminMembers.jsx";
import { RequireAuth, RequireAdmin } from "./components/RequireAuth.jsx";

export default function App() {
  return (
    <div className="min-h-full bg-brand-50">
      <BrandHeader />
      <main className="mx-auto max-w-md px-4 pb-24 pt-4">
        <Routes>
          <Route path="/" element={<SchedulePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route
            path="/my-bookings"
            element={
              <RequireAuth>
                <MyBookingsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />

          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminHome />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/sessions/:id"
            element={
              <RequireAdmin>
                <AdminSession />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/announcements"
            element={
              <RequireAdmin>
                <AdminAnnouncements />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/members"
            element={
              <RequireAdmin>
                <AdminMembers />
              </RequireAdmin>
            }
          />
        </Routes>
      </main>

      <BottomNav />
      <Toaster richColors position="top-center" />
    </div>
  );
}
