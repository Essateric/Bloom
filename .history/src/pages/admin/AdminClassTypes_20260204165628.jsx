import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  adminListClassTypes,
  adminCreateClassType,
  adminUpdateClassType,
} from "../../lib/api.js";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card.jsx";
import { Input } from "../../components/ui/input.jsx";
import { Label } from "../../components/ui/label.jsx";
import { Button } from "../../components/ui/button.jsx";
import { Badge } from "../../components/ui/badge.jsx";

function toPence(v) {
  const n = Number(String(v ?? "").replace(/,/g, "."));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}
function fromPence(p) {
  const n = Number(p ?? 0);
  return (n / 100).toFixed(2);
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

export default function AdminClassTypes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [priceGBP, setPriceGBP] = useState("0.00");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const data = await adminListClassTypes();
      setItems(data);
    } catch (err) {
      toast.error(err?.message || "Could not load class types");
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
    return items.filter((t) =>
      [t.name, t.description].some((v) => String(v || "").toLowerCase().includes(s))
    );
  }, [items, q]);

  function startCreate() {
    setEditing(null);
    setName("");
    setDesc("");
    setPriceGBP("0.00");
    setOpen(true);
  }

  function startEdit(t) {
    setEditing(t);
    setName(t?.name || "");
    setDesc(t?.description || "");
    setPriceGBP(fromPence(t?.default_price_pence || 0));
    setOpen(true);
  }

  async function onSave(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        description: desc?.trim() || null,
        default_price_pence: toPence(priceGBP),
        currency: "GBP",
      };

      if (!payload.name) {
        toast.error("Name is required");
        return;
      }

      if (editing?.id) {
        await adminUpdateClassType(editing.id, payload);
        toast.success("Class type updated");
      } else {
        await adminCreateClassType(payload);
        toast.success("Class type created");
      }

      setOpen(false);
      await refresh();
    } catch (err) {
      toast.error(err?.message || "Could not save class type");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Class Types</CardTitle>
          <CardDescription>Edit class names and default prices.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search class types…" />
          <Button className="w-full" onClick={startCreate}>
            Add class type
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>List</CardTitle>
          <CardDescription>{filtered.length} item(s)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="text-sm text-brand-700">Loading…</div>
          ) : filtered.length ? (
            filtered.map((t) => (
              <div key={t.id} className="rounded-2xl border border-brand-100 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-brand-900">{t.name}</div>
                    {t.description ? <div className="mt-1 text-xs text-brand-700">{t.description}</div> : null}
                    <div className="mt-2">
                      <Badge variant="outline">£{fromPence(t.default_price_pence || 0)}</Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => startEdit(t)}>
                    Edit
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-brand-700">No class types yet.</div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={open}
        title={editing?.id ? "Edit class type" : "Add class type"}
        onClose={() => (busy ? null : setOpen(false))}
      >
        <form onSubmit={onSave} className="space-y-3">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Pilates" />
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <textarea
              className="min-h-24 w-full rounded-2xl border border-brand-200 bg-white p-3 text-sm text-brand-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-1">
            <Label>Default price (£)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={priceGBP}
              onChange={(e) => setPriceGBP(e.target.value)}
            />
          </div>

          <Button className="w-full" disabled={busy} type="submit">
            {busy ? "Saving…" : "Save"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}