import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format, addDays, isSameDay, parseISO } from "date-fns";
import { toast } from "sonner";
import { adminListSessionsForDay, getBookedCountForSession } from "../../lib/api.js";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Badge } from "../../components/ui/badge.jsx";

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

export default function AdminHome() {
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [sessions, setSessions] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const s = await adminListSessionsForDay(selectedDay);
      const nextCounts = {};
      for (const sess of s) {
        nextCounts[sess.id] = await getBookedCountForSession(sess.id);
      }
      setCounts(nextCounts);
      setSessions(s);
    } catch (err) {
      toast.error(err?.message || "Could not load admin dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay]);

  const totals = useMemo(() => {
    let booked = 0;
    let cap = 0;
    sessions.forEach((s) => {
      booked += counts[s.id] || 0;
      cap += s.capacity || 0;
    });
    return { booked, cap, sessions: sessions.length };
  }, [sessions, counts]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Admin</CardTitle>
          <CardDescription>Manage sessions, prices, members, and announcements.</CardDescription>
        </CardHeader>

        <CardContent className="grid grid-cols-2 gap-2">
          <Link to="/admin/sessions">
            <Button className="w-full" variant="outline">
              Manage Sessions
            </Button>
          </Link>

          <Link to="/admin/class-types">
            <Button className="w-full" variant="outline">
              Class Types & Prices
            </Button>
          </Link>

          <Link to="/admin/announcements">
            <Button className="w-full" variant="outline">
              Announcements
            </Button>
          </Link>

          <Link to="/admin/members">
            <Button className="w-full" variant="outline">
              Members
            </Button>
          </Link>
        </CardContent>
      </Card>

      <DayChips selected={selectedDay} onSelect={setSelectedDay} />

      <div className="rounded-2xl border border-brand-100 bg-white p-4">
        <div className="text-sm text-brand-600">Summary</div>
        <div className="mt-1 flex flex-wrap gap-2">
          <Badge>{totals.sessions} sessions</Badge>
          <Badge variant="outline">{totals.booked} booked</Badge>
          <Badge variant="outline">{totals.cap} capacity</Badge>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-brand-100 bg-white p-4 text-sm text-brand-700">Loading…</div>
      ) : sessions.length ? (
        <div className="space-y-3">
          {sessions.map((s) => {
            const startsAt = parseISO(s.starts_at);
            const booked = counts[s.id] || 0;
            const left = Math.max(0, (s.capacity || 0) - booked);
            return (
              <Link key={s.id} to={`/admin/sessions/${s.id}`}>
                <Card className="hover:shadow-md transition">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm text-brand-600">{format(startsAt, "EEE d MMM • HH:mm")}</div>
                        <div className="text-base font-semibold text-brand-900">{s.title}</div>
                        <div className="mt-2 flex gap-2">
                          <Badge>{s?.bloom_class_types?.name || "Class"}</Badge>
                          <Badge variant="outline">{booked} booked</Badge>
                          <Badge variant={left === 0 ? "warning" : "success"}>{left} left</Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-brand-100 bg-white p-4 text-sm text-brand-700">
          No sessions for this day.
        </div>
      )}
    </div>
  );
}