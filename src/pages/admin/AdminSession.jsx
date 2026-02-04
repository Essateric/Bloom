import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { parseISO, format } from "date-fns";
import { toast } from "sonner";
import { getSession, adminListBookingsForSession, getBookedCountForSession } from "../../lib/api.js";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Badge } from "../../components/ui/badge.jsx";

export default function AdminSession() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [bookedCount, setBookedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const [s, b, c] = await Promise.all([
        getSession(id),
        adminListBookingsForSession(id),
        getBookedCountForSession(id),
      ]);
      setSession(s);
      setBookings(b);
      setBookedCount(c);
    } catch (err) {
      toast.error(err?.message || "Could not load session");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const startsAt = session?.starts_at ? parseISO(session.starts_at) : null;
  const spotsLeft = useMemo(() => {
    const cap = session?.capacity || 0;
    return Math.max(0, cap - (bookedCount || 0));
  }, [session, bookedCount]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/admin">
          <Button variant="outline" size="sm">Back</Button>
        </Link>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          Refresh
        </Button>
      </div>

      {session ? (
        <Card>
          <CardHeader>
            <CardTitle>{session.title}</CardTitle>
            <CardDescription>
              {startsAt ? `${format(startsAt, "EEE d MMM • HH:mm")}` : ""} {session.location ? `• ${session.location}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge>{session?.bloom_class_types?.name || "Class"}</Badge>
            <Badge variant="outline">{bookedCount} booked</Badge>
            <Badge variant={spotsLeft === 0 ? "warning" : "success"}>{spotsLeft} left</Badge>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Bookings</CardTitle>
          <CardDescription>Attendees and contact info.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="text-sm text-brand-700">Loading…</div>
          ) : bookings.length ? (
            bookings.map((b) => {
              const p = b.bloom_profiles;
              return (
                <div key={b.id} className="rounded-2xl border border-brand-100 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-brand-900">{p?.full_name || "Member"}</div>
                      <div className="text-xs text-brand-700">{p?.email || ""}</div>
                      <div className="text-xs text-brand-700">{p?.phone || ""}</div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">{b.status}</Badge>
                      <div className="mt-1 text-xs text-brand-600">
                        {b.created_at ? format(parseISO(b.created_at), "d MMM • HH:mm") : ""}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-brand-700">No bookings yet.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notify everyone (stub)</CardTitle>
          <CardDescription>
            For MVP, use Announcements. Email/SMS provider can be added later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/admin/announcements">
            <Button className="w-full">Create announcement</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
