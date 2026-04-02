# RuggedYouth Website — Full Stack Setup Guide

A modern, full-featured ministry website built with React + TypeScript + Supabase.

---

## 🏗️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router v6
- **Backend/DB**: Supabase (PostgreSQL, Auth, Storage, RLS)
- **Email (SMTP)**: Resend — for transactional emails (new member notifications, auth emails)
- **Icons**: Lucide React
- **Fonts**: Playfair Display + DM Sans (Google Fonts)

---

## 📦 Features

| Feature | Description |
|---|---|
| New Member Form | Landing page sign-up → stored in Supabase → email notification |
| Newsletter | Members auto-subscribed; use their emails via Resend |
| Blog | Posts with image/video/audio/text, likes, comments, share |
| Admin Panel | Full CRUD: posts, events, blog, members |
| Admin Auth | Register, login, email verification, forgot password, change password |
| Media Gallery | Filterable, searchable social media posts |
| Programs & Events | Upcoming events with flier uploads |
| Radio Live | Streaming player with live status |
| Persistent Storage | All content archived, never deleted (media_assets table) |
| Responsive | Mobile-first, works on all screen sizes |

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://twhtlvijldpriwkenlut.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 🗄️ Supabase Database Setup

### Step 1 — Create your Supabase project
Go to [supabase.com/dashboard](https://supabase.com/dashboard) → New Project

### Step 2 — Run all migrations
In the Supabase SQL Editor, run each migration file in order:

1. `supabase/migrations/20251205133335_create_social_media_posts_table.sql`
2. `supabase/migrations/20251205133351_create_upcoming_events_table.sql`
3. `supabase/migrations/20251205133404_create_programs_table.sql`
4. `supabase/migrations/20251205133420_create_event_fliers_storage_bucket.sql`
5. `supabase/migrations/20260101000001_new_members.sql`
6. `supabase/migrations/20260101000002_blog_posts.sql`
7. `supabase/migrations/20260101000003_blog_comments.sql`
8. `supabase/migrations/20260101000004_media_assets.sql`

### Step 3 — Storage Bucket
The `event-fliers` bucket is created by migration 4. Confirm it exists under **Storage** in your Supabase dashboard. It is set to **public** read, auth-required write.

---

## 📧 Email Setup with Resend

### Why Resend?
Resend is the recommended SMTP provider for Supabase auth emails. It gives you full control over transactional emails (verification, password reset, new member notifications).

### Step 1 — Create a Resend account
Go to [resend.com](https://resend.com) → Sign up (free tier: 3,000 emails/month)

### Step 2 — Add your domain or use onboarding domain
- For testing: use the Resend sandbox (no domain needed)
- For production: add and verify your domain under **Domains**

### Step 3 — Get your API key
In Resend dashboard → **API Keys** → Create API Key → copy it

### Step 4 — Configure Supabase to use Resend SMTP

In your Supabase dashboard:
1. Go to **Project Settings → Auth → SMTP Settings**
2. Toggle **Enable Custom SMTP**
3. Fill in:

| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | *your Resend API key* |
| Sender email | `noreply@yourdomain.com` *(or use `onboarding@resend.dev` for testing)* |
| Sender name | `RuggedYouth` |

4. Click **Save**

### Step 5 — Customize email templates (optional)
In Supabase → **Auth → Email Templates**, you can customize:
- Confirm signup
- Magic Link
- Change Email Address
- Reset Password

---

## 📬 New Member Email Notification

When a new member signs up via the landing page form, their data is stored in Supabase `new_members` table.

### To receive email notifications to `theruggedy@gmail.com`:

**Option A — Supabase Database Webhooks + Resend (recommended)**

1. In Supabase → **Database → Webhooks** → Create new webhook
2. Set: Table = `new_members`, Event = `INSERT`
3. Webhook URL = your edge function or a free service like [webhook.site](https://webhook.site) for testing
4. Then forward to Resend API to email `theruggedy@gmail.com`

**Option B — Supabase Edge Function**

Create `supabase/functions/notify-new-member/index.ts`:

```typescript
import { serve } from "https://deno.land/x/sift@0.6.0/mod.ts";

serve(async (req) => {
  const payload = await req.json();
  const member = payload.record;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "RuggedYouth <noreply@yourdomain.com>",
      to: ["theruggedy@gmail.com"],
      subject: `New Member: ${member.full_name}`,
      html: `
        <h2>New Member Registration</h2>
        <p><strong>Name:</strong> ${member.full_name}</p>
        <p><strong>Phone:</strong> ${member.phone}</p>
        <p><strong>Email:</strong> ${member.email}</p>
        <p><strong>Location:</strong> ${member.location}</p>
        <p><strong>Registered:</strong> ${new Date(member.created_at).toLocaleString()}</p>
      `,
    }),
  });

  return new Response("OK", { status: 200 });
});
```

Deploy with: `supabase functions deploy notify-new-member`

Then set up a database webhook pointing to this function URL.

**Option C — Manual follow-up (simplest)**

Log into your Supabase dashboard → **Table Editor → new_members** to view all registered members and follow up manually. You can also export to CSV.

---

## 📰 Newsletter / Broadcast Emails

All members with `subscribed_newsletter = true` have consented to receive updates. To send newsletters:

1. Export emails from Supabase: `SELECT email FROM new_members WHERE subscribed_newsletter = true`
2. Import into Resend's **Audiences** feature for bulk email
3. Create campaigns in Resend dashboard

Or use the Resend API:
```javascript
await resend.emails.send({
  from: 'RuggedYouth <news@yourdomain.com>',
  to: memberEmails,  // array from DB
  subject: 'Upcoming Event This Saturday!',
  html: '<p>Hello family...</p>',
});
```

---

## 🔐 Admin Authentication Flow

| Action | How it works |
|---|---|
| Register | Email + password → Supabase sends verification email via Resend |
| Verify | Click link in email → redirects to `/auth/confirm` |
| Login | Email + password → JWT session stored |
| Forgot Password | Email → Resend sends reset link → user clicks → redirects to `/auth/confirm` |
| Change Password | In Admin Settings tab (requires being logged in) |
| Logout | Clears Supabase session |

---

## 📁 Content Storage Policy

All uploaded content (flyers, images, videos, audio messages, documents) is **permanently preserved**:

- Files uploaded to Supabase Storage are never deleted
- The `media_assets` table has **no DELETE policy** — records are archived (`is_archived = true`), not removed
- Event fliers, blog media, and program files remain accessible indefinitely
- Users can filter/search all historical content through the Media page

---

## 🚀 Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🌐 Deployment

Recommended: **Netlify** or **Vercel**

The `public/_redirects` file is already configured for SPA routing on Netlify:
```
/* /index.html 200
```

For Vercel, add a `vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Set environment variables in your deployment dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 📞 Contact

- **Office**: +234 814 510 8708
- **Youth Pastor**: +234 813 679 0977
- **Email**: theruggedy@gmail.com
- **YouTube**: https://youtube.com/@ruggedyouth404
- **Instagram**: https://www.instagram.com/ruggedyouth_404/
- **TikTok**: https://www.tiktok.com/@ruggedyouth_chref
- **Facebook**: https://www.facebook.com/share/15CaXfr0V7mhwxd4-wWJfR
- **WhatsApp Community**: https://chat.whatsapp.com/GwFu5wDDl7O8hAT6p3JMAC
