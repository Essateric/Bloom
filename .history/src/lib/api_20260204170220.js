import { supabase } from "./supabase.js";
import { startOfDay, endOfDay } from "date-fns";

/* ---------------------------
   Announcements
--------------------------- */

export async function listAnnouncements({ limit = 3 } = {}) {
  const { data, error } = await supabase
    .from("bloom_announcements")
    .select("id, title, message, created_at, created_by")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function createAnnouncement({ title, message }) {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("bloom_announcements")
    .insert({ title, message, created_by: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* ---------------------------
   Class Types (client + admin)
--------------------------- */

export async function listClassTypes() {
  // client uses this for filter chips (safe to include pricing too)
  const { data, error } = await supabase
    .from("bloom_class_types")
    .select("id, name, description, default_price_pence, currency")
    .order("name");
  if (error) throw error;
  return data || [];
}

// Admin
export async function adminListClassTypes() {
  const { data, error } = await supabase
    .from("bloom_class_types")
    .select("id, name, description, default_price_pence, currency, created_at")
    .order("name", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function adminCreateClassType(payload) {
  const { data, error } = await supabase
    .from("bloom_class_types")
    .insert([payload])
    .select("id, name, description, default_price_pence, currency, created_at")
    .single();
  if (error) throw error;
  return data;
}

export async function adminUpdateClassType(id, patch) {
  const { data, error } = await supabase
    .from("bloom_class_types")
    .update(patch)
    .eq("id", id)
    .select("id, name, description, default_price_pence, currency, created_at")
    .single();
  if (error) throw error;
  return data;
}

/* ---------------------------
   Sessions (client schedule)
--------------------------- */

export async function listSessionsForDay(date) {
  const from = startOfDay(date).toISOString();
  const to = endOfDay(date).toISOString();

  const { data, error } = await supabase
    .from("bloom_class_sessions")
    .select(
      `
      id,
      class_type_id,
      title,
      instructor_name,
      starts_at,
      duration_minutes,
      capacity,
      location,
      description,
      is_cancelled,
      price_override_pence,
      created_at,
      bloom_class_types (
        name,
        default_price_pence,
        currency
      )
    `
    )
    .gte("starts_at", from)
    .lte("starts_at", to)
    .eq("is_cancelled", false)
    .order("starts_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getSession(sessionId) {
  const { data, error } = await supabase
    .from("bloom_class_sessions")
    .select(
      `
      id,
      class_type_id,
      title,
      instructor_name,
      starts_at,
      duration_minutes,
      capacity,
      location,
      description,
      is_cancelled,
      price_override_pence,
      created_at,
      bloom_class_types (
        name,
        default_price_pence,
        currency
      )
    `
    )
    .eq("id", sessionId)
    .single();
  if (error) throw error;
  return data;
}

/* ---------------------------
   Bookings
--------------------------- */

export async function getBookedCountForSession(sessionId) {
  const { count, error } = await supabase
    .from("bloom_bookings")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId)
    .eq("status", "booked");

  if (error) throw error;
  return count || 0;
}

export async function getMyBookingForSession(sessionId) {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("bloom_bookings")
    .select("id, session_id, user_id, status, created_at, cancelled_at")
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function createBooking({ sessionId, desiredStatus = "booked" }) {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("bloom_bookings")
    .insert({ session_id: sessionId, user_id: userId, status: desiredStatus })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function cancelBooking(bookingId) {
  const { data, error } = await supabase
    .from("bloom_bookings")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", bookingId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listMyBookings({ upcomingOnly = true } = {}) {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) throw new Error("Not logged in");

  let q = supabase
    .from("bloom_bookings")
    .select(
      `
      id,
      session_id,
      user_id,
      status,
      created_at,
      cancelled_at,
      bloom_class_sessions (
        id,
        title,
        starts_at,
        duration_minutes,
        location,
        capacity,
        price_override_pence,
        bloom_class_types (
          name,
          default_price_pence,
          currency
        )
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (upcomingOnly) {
    q = q.eq("status", "booked");
  }

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

/* ---------------------------
   Admin: sessions + bookings + members
--------------------------- */

export async function adminListSessionsForDay(date) {
  // Admin should see cancelled too
  const from = startOfDay(date).toISOString();
  const to = endOfDay(date).toISOString();

  const { data, error } = await supabase
    .from("bloom_class_sessions")
    .select(
      `
      id,
      class_type_id,
      title,
      instructor_name,
      starts_at,
      duration_minutes,
      capacity,
      location,
      description,
      is_cancelled,
      price_override_pence,
      created_at,
      bloom_class_types (
        id,
        name,
        default_price_pence,
        currency
      )
    `
    )
    .gte("starts_at", from)
    .lte("starts_at", to)
    .order("starts_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function adminListSessionsRange({ fromISO, toISO }) {
  let q = supabase
    .from("bloom_class_sessions")
    .select(
      `
      id,
      class_type_id,
      title,
      instructor_name,
      starts_at,
      duration_minutes,
      capacity,
      location,
      description,
      is_cancelled,
      price_override_pence,
      created_at,
      bloom_class_types (
        id,
        name,
        default_price_pence,
        currency
      )
    `
    )
    .order("starts_at", { ascending: true });

  if (fromISO) q = q.gte("starts_at", fromISO);
  if (toISO) q = q.lte("starts_at", toISO);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function adminCreateSession(payload) {
  const { data, error } = await supabase
    .from("bloom_class_sessions")
    .insert([payload])
    .select(
      `
      id,
      class_type_id,
      title,
      instructor_name,
      starts_at,
      duration_minutes,
      capacity,
      location,
      description,
      is_cancelled,
      price_override_pence,
      created_at,
      bloom_class_types (
        id,
        name,
        default_price_pence,
        currency
      )
    `
    )
    .single();

  if (error) throw error;
  return data;
}

export async function adminUpdateSession(id, patch) {
  const { data, error } = await supabase
    .from("bloom_class_sessions")
    .update(patch)
    .eq("id", id)
    .select(
      `
      id,
      class_type_id,
      title,
      instructor_name,
      starts_at,
      duration_minutes,
      capacity,
      location,
      description,
      is_cancelled,
      price_override_pence,
      created_at,
      bloom_class_types (
        id,
        name,
        default_price_pence,
        currency
      )
    `
    )
    .single();

  if (error) throw error;
  return data;
}

export async function adminToggleCancelSession(id, is_cancelled) {
  return adminUpdateSession(id, { is_cancelled });
}

export async function adminListBookingsForSession(sessionId) {
  const { data, error } = await supabase
    .from("bloom_bookings")
    .select("id, session_id, user_id, status, created_at, cancelled_at, bloom_profiles(full_name, phone, email)")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  // If the join fails due to missing FK, do a fallback two-step fetch
  if (error) {
    const { data: bookings, error: err2 } = await supabase
      .from("bloom_bookings")
      .select("id, session_id, user_id, status, created_at, cancelled_at")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    if (err2) throw err2;

    const userIds = Array.from(new Set((bookings || []).map((b) => b.user_id)));
    let profilesById = {};
    if (userIds.length) {
      const { data: profiles, error: err3 } = await supabase
        .from("bloom_profiles")
        .select("user_id, full_name, phone, email")
        .in("user_id", userIds);
      if (err3) throw err3;
      profilesById = Object.fromEntries((profiles || []).map((p) => [p.user_id, p]));
    }
    return (bookings || []).map((b) => ({ ...b, bloom_profiles: profilesById[b.user_id] || null }));
  }

  return data || [];
}

export async function adminListMembers() {
  const { data, error } = await supabase
    .from("bloom_profiles")
    .select("user_id, full_name, phone, email, role, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}