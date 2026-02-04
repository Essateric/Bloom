import React, { useEffect, useMemo, useState } from "react";
import { format, addDays, isSameDay, parseISO } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "../state/auth.jsx";
import {
  listAnnouncements,
  listClassTypes,
  listSessionsForDay,
  getBookedCountForSession,
  getMyBookingForSession,
  createBooking,
} from "../lib/api.js";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card.jsx";
import { Badge } from "../components/ui/badge.jsx";
import { Button } from "../components/ui/button.jsx";
import { Toggle } from "../components/ui/toggle.jsx";
import { cn } from "../lib/utils.js";
import { Link } from "react-router-dom";

function DayChips({ selected, onSelect }) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(new Date(), i)), []);
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {days.map((d) => {
        const active = isSameDay(d, selected);
        return (
          <button
            key={d.toISOString()}
            onClick={() => onSelect(d)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-2 text-sm transition",
              active ? "border-brand-400 bg-white text-brand-900" : "border-brand-200 bg-brand-50 text-brand-800"
            )}
          >
            <div className="text-xs text-brand-600">{format(d, "EEE")}</div>
            <div className="font-medium">{format(d, "d MMM")}</div>
          </button>
        );
      })}
    </div>
  );
}

function AnnouncementList({ items }) {
  if (!items?.length) return null;
  return (
    <div className="space-y-2">
      {items.map((a) => (
        <Card key={a.id} className="border-brand-100 bg-white">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm">{a.title}</CardTitle>
            <CardDescription className="text-xs">{format(parseISO(a.created_at), "d MMM, HH:mm")}</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-sm text-brand-800 whitespace-pre-wrap">{a.message}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SessionCard({ session, typeName, bookedCount, myBooking, onRefresh }) {
  const { user } = useAuth();

  const startsAt = parseISO(session.starts_at);
  const spotsLeft = Math.max(0, (session.capacity || 0) - (bookedCount || 0));
  const isFull = spotsLeft <= 0;

  const myStatus = myBooking?.status || null;
  const alreadyBooked = myStatus === "booked";
  const alreadyWaitlist = myStatus === "waitlist";

  async function handleBook() {
    if (!user) return;
    try {
      const desired = isFull ? "waitlist" : "booked";
      await createBooking({ sessionId: session.id, desiredStatus: desired });
      toast.success(desired === "booked" ? "Booked!" : "Added to waitlist");
      onRefresh?.();
    } catch (err) {
      // Unique constraint -> already booked
      toast.error(err?.message || "Could not book");
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-brand-600">{format(startsAt, "HH:mm")}</div>
            <div className="text-base font-semibold text-brand-900">{session.title}</div>
            <div className="mt-1 flex flex-wrap gap-2">
              <Badge>{typeName || "Class"}</Badge>
              <Badge variant="outline">{session.duration_minutes} min</Badge>
              {session.location ? <Badge variant="outline">{session.location}</Badge> : null}
            </div>
          </div>

          <div className="text-right">
            <div className={cn("text-sm font-semibold", isFull ? "text-amber-900" : "text-brand-900")}>
              {isFull ? "Full" : `${spotsLeft} left`}
            </div>
            <div className="text-xs text-brand-600">Capacity {session.capacity}</div>
          </div>
        </div>

        {session.description ? (
          <p className="text-sm text-brand-800 whitespace-pre-wrap">{session.description}</p>
        ) : null}

        <div className="flex gap-2">
          {!user ? (
            <Link className="w-full" to="/login">
              <Button className="w-full">Log in to book</Button>
            </Link>
          ) : alreadyBooked ? (
            <Button className="w-full" variant="secondary" disabled>
              You’re booked
            </Button>
          ) : alreadyWaitlist ? (
            <Button className="w-full" variant="secondary" disabled>
              On waitlist
            </Button>
          ) : (
            <Button className="w-full" onClick={handleBook}>
              {isFull ? "Join waitlist" : "Book"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SchedulePage() {
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [classTypes, setClassTypes] = useState([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [availableOnly, setAvailableOnly] = useState(false);

  const [announcements, setAnnouncements] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [counts, setCounts] = useState({});
  const [myBookings, setMyBookings] = useState({});
  const [loading, setLoading] = useState(true);

  const typeNameById = useMemo(() => {
    const map = {};
    classTypes.forEach((t) => (map[t.id] = t.name));
    return map;
  }, [classTypes]);

  async function refresh() {
    setLoading(true);
    try {
      const [a, types, s] = await Promise.all([
        listAnnouncements({ limit: 3 }),
        listClassTypes(),
        listSessionsForDay(selectedDay),
      ]);

      setAnnouncements(a);
      setClassTypes(types);

      // optional filter on class type
      let filtered = s;
      if (typeFilter !== "all") filtered = filtered.filter((x) => x.class_type_id === typeFilter);

      // counts + my status for each session
      const nextCounts = {};
      const nextMine = {};

      // Do sequentially to keep it simple (can optimise later)
      for (const sess of filtered) {
        const [c, mine] = await Promise.all([
          getBookedCountForSession(sess.id),
          getMyBookingForSession(sess.id),
        ]);
        nextCounts[sess.id] = c;
        nextMine[sess.id] = mine;
      }

      if (availableOnly) {
        filtered = filtered.filter((sess) => {
          const c = nextCounts[sess.id] || 0;
          return (sess.capacity || 0) - c > 0;
        });
      }

      setSessions(filtered);
      setCounts(nextCounts);
      setMyBookings(nextMine);
    } catch (err) {
      toast.error(err?.message || "Could not load schedule");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay, typeFilter, availableOnly]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <DayChips selected={selectedDay} onSelect={setSelectedDay} />

        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setTypeFilter("all")}
            className={cn(
              "shrink-0 rounded-full border px-3 py-2 text-sm",
              typeFilter === "all" ? "border-brand-400 bg-white text-brand-900" : "border-brand-200 bg-brand-50 text-brand-800"
            )}
          >
            All
          </button>
          {classTypes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTypeFilter(t.id)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-2 text-sm",
                typeFilter === t.id ? "border-brand-400 bg-white text-brand-900" : "border-brand-200 bg-brand-50 text-brand-800"
              )}
            >
              {t.name}
            </button>
          ))}
          <div className="ml-auto">
            <Toggle checked={availableOnly} onChange={setAvailableOnly} label="Available only" />
          </div>
        </div>
      </div>

      <AnnouncementList items={announcements} />

      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-sm text-brand-600">Schedule</div>
            <div className="text-lg font-semibold text-brand-900">{format(selectedDay, "EEEE, d MMM")}</div>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-brand-100 bg-white p-4 text-sm text-brand-700">
            Loading classes…
          </div>
        ) : sessions.length ? (
          <div className="space-y-3">
            {sessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                typeName={typeNameById[s.class_type_id] || s?.bloom_class_types?.name}
                bookedCount={counts[s.id] || 0}
                myBooking={myBookings[s.id] || null}
                onRefresh={refresh}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-brand-100 bg-white p-4 text-sm text-brand-700">
            No classes found for this day.
          </div>
        )}
      </div>
    </div>
  );
}
