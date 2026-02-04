import React, { useEffect, useState } from "react";
import { parseISO, format } from "date-fns";
import { toast } from "sonner";
import { listMyBookings, cancelBooking } from "../lib/api.js";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card.jsx";
import { Button } from "../components/ui/button.jsx";
import { Badge } from "../components/ui/badge.jsx";

export default function MyBookingsPage() {
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const data = await listMyBookings({ upcomingOnly: false });
      setItems(data);
    } catch (err) {
      toast.error(err?.message || "Could not load bookings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onCancel(id) {
    setBusyId(id);
    try {
      await cancelBooking(id);
      toast.success("Cancelled");
      await refresh();
    } catch (err) {
      toast.error(err?.message || "Could not cancel");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>My bookings</CardTitle>
          <CardDescription>Your upcoming and past class bookings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="text-sm text-brand-700">Loading…</div>
          ) : items.length ? (
            items.map((b) => {
              const s = b.bloom_class_sessions;
              const startsAt = s?.starts_at ? parseISO(s.starts_at) : null;
              return (
                <div key={b.id} className="rounded-2xl border border-brand-100 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-brand-900">{s?.title || "Session"}</div>
                      <div className="text-xs text-brand-700">
                        {startsAt ? `${format(startsAt, "EEE d MMM")} • ${format(startsAt, "HH:mm")}` : ""}
                        {s?.location ? ` • ${s.location}` : ""}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Badge>{s?.bloom_class_types?.name || "Class"}</Badge>
                        <Badge variant="outline">{b.status}</Badge>
                      </div>
                    </div>

                    {b.status === "booked" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyId === b.id}
                        onClick={() => onCancel(b.id)}
                      >
                        {busyId === b.id ? "Cancelling…" : "Cancel"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-brand-700">No bookings yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
