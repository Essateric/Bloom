import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { adminListMembers } from "../../lib/api.js";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Input } from "../../components/ui/input.jsx";

function toCsv(rows) {
  const header = ["full_name", "email", "phone", "role", "created_at"];
  const lines = [header.join(",")];
  rows.forEach((r) => {
    const vals = header.map((k) => {
      const raw = r[k] ?? "";
      const s = String(raw).replace(/"/g, '""');
      return `"${s}"`;
    });
    lines.push(vals.join(","));
  });
  return lines.join("\n");
}

export default function AdminMembers() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const data = await adminListMembers();
      setItems(data);
    } catch (err) {
      toast.error(err?.message || "Could not load members");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((m) =>
      [m.full_name, m.email, m.phone, m.role].some((v) => String(v || "").toLowerCase().includes(s))
    );
  }, [items, q]);

  function downloadCsv() {
    const csv = toCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bloom-members.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>View member contact details and export CSV.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone…" />
          <Button onClick={downloadCsv} disabled={!filtered.length} className="w-full">
            Download CSV
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>List</CardTitle>
          <CardDescription>{filtered.length} result(s)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="text-sm text-brand-700">Loading…</div>
          ) : filtered.length ? (
            filtered.map((m) => (
              <div key={m.user_id} className="rounded-2xl border border-brand-100 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-brand-900">{m.full_name || "Member"}</div>
                    <div className="text-xs text-brand-700">{m.email || ""}</div>
                    <div className="text-xs text-brand-700">{m.phone || ""}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-brand-900">{m.role}</div>
                    <div className="text-xs text-brand-600">{m.created_at ? String(m.created_at).slice(0, 10) : ""}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-brand-700">No members found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
