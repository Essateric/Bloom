# Bloom by Holli (MVP Booking App)

Mobile-first React (JSX) app using Supabase Auth + Postgres tables prefixed with `bloom_`.

## 1) Setup

### Install
```bash
npm install
```

### Environment variables
Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### Run
```bash
npm run dev
```

## 2) Create database tables (Supabase)

Run the SQL file:
- `supabase/migrations/001_bloom.sql`

You can paste it into Supabase SQL Editor and run it.

## 3) Make yourself admin

After you sign up in the app, run this in Supabase SQL editor:

```sql
update public.bloom_profiles
set role = 'admin'
where email = 'YOUR_EMAIL_HERE';
```

Refresh the app — you’ll see the Admin tab.

## 4) Notes

- Schedule page shows the next 7 days as date chips (ClassFit-style browsing).
- Booking rules:
  - If a session has free spots → status = `booked`
  - If full → status = `waitlist`
  - Cancel sets status to `cancelled` (does not delete)

## 5) Next upgrades (Version 2)

- Stripe subscriptions (members-only content)
- Attendance tracking
- Real notifications:
  - Email broadcast (Resend/Postmark)
  - SMS broadcast (Twilio)
