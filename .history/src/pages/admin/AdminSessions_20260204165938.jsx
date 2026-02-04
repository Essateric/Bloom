import React, { useEffect, useMemo, useState } from "react";
import { addDays, format, isSameDay } from "date-fns";
import { toast } from "sonner";
import {
  adminListClassTypes,
  adminListSessionsRange,
  adminCreateSession,
  adminUpdateSession,
  adminToggleCancelSession,
} from "../../lib/api.js";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Badge } from "../../components/ui/badge.jsx";

function toPence(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(String(v ?? "").replace(/,/g, "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}
function fromPence(p) {
  if (p === null || p === undefined) return "";
  const n = Number(p);
  if (!Number.isFinite(n)) return "";
  return (n / 100).toFixed(2);
}

function toDatetimeLocalValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}
function datetimeLocalToISO(val) {
  if (!val) return null;
  const d = new Date(val);
  return d.toISOString();
}

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl border border-brand-100 bg-white p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold text-brand-900">{title}</div>
          <button
            onClick={onClose}
            className="rounded-full border border-brand-200 bg-white px-3 py-1 text-sm text-brand-900"
          >
            Close
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

function DayChips({ selected, onSelect }) {
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(new Date(), i)), []);
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {days.map((d) => {
        const active = isSameDay(d, selected);
        return (
          <button
            key={d.toISOString()}
            onClick={() => onSelect(d)}
            className={[
              "shrink-0 rounded-full border px-3 py-2 text-sm transition",
              active ? "border-brand-400 bg-white text-brand-900" : "border-brand-200 bg-brand-50 text-brand-800",
            ].join(" ")}
          >
            <div className="text-xs text-brand-600">{format(d, "EEE")}</div>
            <div className="font-medium">{format(d, "d MMM")}</div>
          </button>
        );
      })}
    </div>
  );
}

export default function AdminSessions() {
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [types, setTypes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  // form
  const [classTypeId, setClassTypeId] = useState("");
  const [title, setTitle] = useState("");
  const [startsAtLocal, setStartsAtLocal] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [capacity, setCapacity] = useState(10);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [priceOverrideGBP, setPriceOverrideGBP] = useState("");

  async function loadTypes() {
    try {
      const t = await adminListClassTypes();
      setTypes(t);
      if (!classTypeId && t?.[0]?.id) setClassTypeId(t[0].id);
    } catch (err) {
      toast.error(err?.message || "Could not load class types");
    }
  }

  async function refreshSessions(day = selectedDay) {
    setLoading(true);
    try {
      const from = new Date(day);
      from.setHours(0, 0, 0, 0);
      const to = new Date(day);
      to.setHours(23, 59, 59, 999);

      const data = await adminListSessionsRange({
        fromISO: from.toISOString(),
        toISO: to.toISOString(),
      });
      setSessions(data);
    } catch (err) {
      toast.error(err?.message || "Could not load sessions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refreshSessions(selectedDay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay]);

  function startCreate() {
    setEditing(null);

    const defaultTypeId = types?.[0]?.id || "";
    setClassTypeId(defaultTypeId);

    setTitle("");
    // default start time: selected day at 09:00
    const d = new Date(selectedDay);
    d.setHours(9, 0, 0, 0);
    setStartsAtLocal(toDatetimeLocalValue(d.toISOString()));
    setDurationMinutes(45);
    setCapacity(10);
    setLocation("");
    setDescription("");
    setPriceOverrideGBP("");
    setOpen(true);
  }

  function startEdit(s) {
    setEditing(s);
    setClassTypeId(s.class_type_id || "");
    setTitle(s.title || "");
    setStartsAtLocal(toDatetimeLocalValue(s.starts_at));
    setDurationMinutes(s.duration_minutes || 45);
    setCapacity(s.capacity || 10);
    setLocation(s.location || "");
    setDescription(s.description || "");
    setPriceOverrideGBP(fromPence(s.price_override_pence));
    setOpen(true);
  }

  function sessionPriceLabel(sess) {
    const ct = sess?.bloom_class_types;
    const currency = ct?.currency || "GBP";
    const pence =
      sess.price_override_pence !== null && sess.price_override_pence !== undefined
        ? sess.price_override_pence
        : ct?.default_price_pence ?? 0;

    const gbp = (Number(pence || 0) / 100).toFixed(2);
    return currency === "GBP" ? `£${gbp}` : `${gbp} ${currency}`;
  }

  async function onSave(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const startsISO = datetimeLocalToISO(startsAtLocal);
      if (!classTypeId) throw new Error("Class type is required");
      if (!startsISO) throw new Error("Start time is required");
      if (!title.trim()) throw new Error("Title is required");

      const payload = {
        class_type_id: classTypeId,
        title: title.trim(),
        starts_at: startsISO,
        duration_minutes: Number(durationMinutes) || 0,
        capacity: Number(capacity) || 0,
        location: location?.trim() || null,
        description: description?.trim() || null,
        price_override_pence: toPence(priceOverrideGBP), // null => use default
      };

      if (payload.duration_minutes <= 0) throw new Error("Duration must be > 0");
      if (payload.capacity <= 0) throw new Error("Capacity must be > 0");

      if (editing?.id) {
        await adminUpdateSession(editing.id, payload);
        toast.success("Session updated");
      } else {
        await adminCreateSession(payload);
        toast.success("Session created");
      }

      setOpen(false);
      await refreshSessions(selectedDay);
    } catch (err) {
      toast.error(err?.message || "Could not save session");
    } finally {
      setBusy(false);
    }
  }

  async function toggleCancel(sess) {
    try {
      await adminToggleCancelSession(sess.id, !sess.is_cancelled);
      toast.success(sess.is_cancelled ? "Session restored" : "Session cancelled");
      await refreshSessions(selectedDay);
    } catch (err) {
      toast.error(err?.message || "Could not update session");
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
          <CardDescription>Create and edit class times, capacity, and prices.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <DayChips selected={selectedDay} onSelect={setSelectedDay} />
          <Button className="w-full" onClick={startCreate}>
            Add session
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="rounded-2xl border border-brand-100 bg-white p-4 text-sm text-brand-700">Loading…</div>
      ) : sessions.length ? (
        <div className="space-y-3">
          {sessions.map((s) => (
            <Card key={s.id} className={s.is_cancelled ? "opacity-75" : ""}>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-brand-600">{format(new Date(s.starts_at), "EEE d MMM • HH:mm")}</div>
                    <div className="text-base font-semibold text-brand-900">{s.title}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge>{s?.bloom_class_types?.name || "Class"}</Badge>
                      <Badge variant="outline">{sessionPriceLabel(s)}</Badge>
                      <Badge variant="outline">{s.capacity || 0} cap</Badge>
                      {s.is_cancelled ? <Badge variant="warning">Cancelled</Badge> : <Badge variant="success">Active</Badge>}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(s)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={s.is_cancelled ? "outline" : "destructive"}
                      onClick={() => toggleCancel(s)}
                    >
                      {s.is_cancelled ? "Uncancel" : "Cancel"}
                    </Button>
                  </div>
                </div>

                {s.location ? <div className="text-xs text-brand-700">📍 {s.location}</div> : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-brand-100 bg-white p-4 text-sm text-brand-700">
          No sessions for this day.
        </div>
      )}

      <Modal
        open={open}
        title={editing?.id ? "Edit session" : "Add session"}
        onClose={() => (busy ? null : setOpen(false))}
      >
        <form onSubmit={onSave} className="space-y-3">
          <div className="space-y-1">
            <Label>Class type</Label>
            <select
              value={classTypeId}
              onChange={(e) => setClassTypeId(e.target.value)}
              className="w-full rounded-2xl border border-brand-200 bg-white p-3 text-sm text-brand-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              required
            >
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Sculpt" />
          </div>

          <div className="space-y-1">
            <Label>Start date & time</Label>
            <Input
              type="datetime-local"
              value={startsAtLocal}
              onChange={(e) => setStartsAtLocal(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Duration (mins)</Label>
              <Input
                type="number"
                min="1"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Capacity</Label>
              <Input type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional" />
          </div>

          <div className="space-y-1">
            <Label>Price override (£) — leave blank to use class default</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={priceOverrideGBP}
              onChange={(e) => setPriceOverrideGBP(e.target.value)}
              placeholder=""
            />
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <textarea
              className="min-h-24 w-full rounded-2xl border border-brand-200 bg-white p-3 text-sm text-brand-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <Button className="w-full" disabled={busy} type="submit">
            {busy ? "Saving…" : "Save session"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}