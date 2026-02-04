import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { listAnnouncements, createAnnouncement } from "../../lib/api.js";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";
import { Button } from "../../components/ui/button.jsx";
import { parseISO, format } from "date-fns";

export default function AdminAnnouncements() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const data = await listAnnouncements({ limit: 20 });
      setItems(data);
    } catch (err) {
      toast.error(err?.message || "Could not load announcements");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await createAnnouncement({ title, message });
      toast.success("Announcement posted");
      setTitle("");
      setMessage("");
      await refresh();
    } catch (err) {
      toast.error(err?.message || "Could not create announcement");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Announcements</CardTitle>
          <CardDescription>Post updates visible to all members in-app.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="space-y-3">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Class cancelled" />
            </div>
            <div className="space-y-1">
              <Label>Message</Label>
              <textarea
                className="min-h-24 w-full rounded-2xl border border-brand-200 bg-white p-3 text-sm text-brand-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                placeholder="Write your update…"
              />
            </div>
            <Button className="w-full" disabled={busy} type="submit">
              {busy ? "Posting…" : "Post announcement"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent</CardTitle>
          <CardDescription>Latest announcements.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {items.length ? (
            items.map((a) => (
              <div key={a.id} className="rounded-2xl border border-brand-100 bg-white p-3">
                <div className="text-sm font-semibold text-brand-900">{a.title}</div>
                <div className="text-xs text-brand-600">{format(parseISO(a.created_at), "d MMM • HH:mm")}</div>
                <div className="mt-2 text-sm text-brand-800 whitespace-pre-wrap">{a.message}</div>
              </div>
            ))
          ) : (
            <div className="text-sm text-brand-700">No announcements yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
