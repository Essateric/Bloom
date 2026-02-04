import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase.js";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = session?.user ?? null;

  async function fetchProfile(userId, email) {
    if (!userId) return null;

    // Ensure profile exists (idempotent)
    const payload = {
      user_id: userId,
      email: email || null,
    };

    await supabase.from("bloom_profiles").upsert(payload, { onConflict: "user_id" });

    const { data, error } = await supabase
      .from("bloom_profiles")
      .select("user_id, full_name, phone, role, email, created_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      try {
        const p = data.session?.user?.id
          ? await fetchProfile(data.session.user.id, data.session.user.email)
          : null;
        setProfile(p);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      try {
        const p = nextSession?.user?.id
          ? await fetchProfile(nextSession.user.id, nextSession.user.email)
          : null;
        setProfile(p);
      } catch {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      isAdmin: String(profile?.role || "").toLowerCase() === "admin",
      async signUp({ email, password, fullName, phone }) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        // create/update profile (after signUp; if email confirmation is on, user might be null)
        const userId = data.user?.id;
        if (userId) {
          await supabase
            .from("bloom_profiles")
            .upsert(
              { user_id: userId, email, full_name: fullName || null, phone: phone || null },
              { onConflict: "user_id" }
            );
        }
        return data;
      },
      async signIn({ email, password }) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
      },
      async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
      async updateProfile(patch) {
        if (!user?.id) throw new Error("Not logged in");
        const allowed = {
          full_name: patch.full_name ?? null,
          phone: patch.phone ?? null,
        };
        const { error } = await supabase.from("bloom_profiles").update(allowed).eq("user_id", user.id);
        if (error) throw error;

        const { data } = await supabase
          .from("bloom_profiles")
          .select("user_id, full_name, phone, role, email, created_at")
          .eq("user_id", user.id)
          .maybeSingle();
        setProfile(data ?? null);
        return data;
      },
    }),
    [session, user, profile, loading]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
