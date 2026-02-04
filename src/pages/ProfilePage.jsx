import React, { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../state/auth.jsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card.jsx";
import { Input } from "../components/ui/input.jsx";
import { Label } from "../components/ui/label.jsx";
import { Button } from "../components/ui/button.jsx";

export default function ProfilePage() {
  const { profile, user, updateProfile, isAdmin } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [busy, setBusy] = useState(false);

  async function onSave() {
    setBusy(true);
    try {
      await updateProfile({ full_name: fullName, phone });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err?.message || "Could not update profile");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Your profile</CardTitle>
          <CardDescription>Update your details for class bookings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Email</Label>
            <Input value={profile?.email || user?.email || ""} disabled />
          </div>
          <div className="space-y-1">
            <Label>Full name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="space-y-1">
            <Label>Phone number</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07…" />
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-brand-50 p-3 text-sm">
            <span className="text-brand-700">Role</span>
            <span className="font-medium text-brand-900">{isAdmin ? "Admin" : "Client"}</span>
          </div>

          <Button onClick={onSave} disabled={busy} className="w-full">
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
