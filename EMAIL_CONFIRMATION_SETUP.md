# Email Confirmation Setup for Supabase

This guide will help you configure email confirmation for your RuggedYouth admin panel signup process.

## Overview

The email confirmation feature requires users to verify their email address before they can access the admin panel. Once they sign up, they'll receive a confirmation email with a verification link.

## Redirect URL for Supabase

**Use this exact redirect URL in your Supabase configuration:**

```
https://www.ruggedyouth.com/auth/confirm
```

This URL points to the confirmation page that handles the email verification callback from Supabase.

---

## Step-by-Step Setup in Supabase

### 1. Enable Email Confirmations

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Providers** → **Email**
4. Enable "Email confirmations" by toggling it ON
5. Click **Save**

### 2. Configure Email Redirect URL

1. In the same **Authentication** section, go to **URL Configuration**
2. Under **Redirect URLs**, add:
   ```
   https://www.ruggedyouth.com/auth/confirm
   ```
3. Click **Add URL**
4. Click **Save**

### 3. Configure Email Templates (Optional but Recommended)

To customize the confirmation email that users receive:

1. Go to **Authentication** → **Email Templates**
2. Click on **Confirm signup** template
3. Customize the email content to match your brand
4. The `{{ .ConfirmationURL }}` variable will automatically insert the correct verification link
5. Click **Save**

**Example template:**
```
<h1>Welcome to RuggedYouth Admin!</h1>

<p>Thank you for creating an account. Please verify your email address to activate your account.</p>

<p><a href="{{ .ConfirmationURL }}">Verify Email Address</a></p>

<p>If you didn't create this account, you can safely ignore this email.</p>

<p>Link expires in 24 hours.</p>
```

### 4. Email Provider Setup (SMTP)

By default, Supabase sends emails from its own system. For production, consider setting up a custom SMTP provider:

1. Go to **Authentication** → **Email** → **SMTP Settings**
2. Toggle **Enable Custom SMTP**
3. Enter your email provider details (Gmail, SendGrid, AWS SES, etc.)

**For Gmail (not recommended for production):**
- Host: `smtp.gmail.com`
- Port: `465`
- Username: Your Gmail email
- Password: Your Gmail app password (not your regular password)

**For SendGrid (recommended):**
- Host: `smtp.sendgrid.net`
- Port: `587`
- Username: `apikey`
- Password: Your SendGrid API key

---

## How It Works

### User Flow

1. **User registers** on your admin page with email and password
2. **Confirmation email sent** to their inbox
3. **User clicks link** in the email
4. **Redirected to** `https://www.ruggedyouth.com/auth/confirm`
5. **Email verified** automatically
6. **User logged in** and can access admin dashboard
7. **Or redirected back** to login if verification fails

### What Happens Behind the Scenes

1. User signs up → `AdminPanel.tsx` calls `supabase.auth.signUp()`
2. Email confirmation required → `EmailConfirmation.tsx` component displays
3. User receives email → Link includes redirect URL: `/auth/confirm`
4. User clicks link → `ConfirmEmail.tsx` page handles verification
5. Token verified → User is authenticated
6. Automatic redirect → User goes to `/admin` dashboard

---

## File References

The email confirmation system uses these files:

- **`src/components/EmailConfirmation.tsx`** - Beautiful confirmation screen with resend option
- **`src/pages/ConfirmEmail.tsx`** - Email verification callback handler
- **`src/components/AdminPanel.tsx`** - Signup logic integration
- **`src/App.tsx`** - Routes configuration

---

## Testing Email Confirmation Locally

For local development testing:

1. Enable email confirmations in Supabase (as above)
2. Update redirect URL to include localhost:
   ```
   http://localhost:5173/auth/confirm
   ```
3. Check Supabase logs for email content or use test email addresses

---

## Troubleshooting

### Email not received
- Check spam/junk folder
- Verify email address is correct
- Check Supabase SMTP logs
- Ensure Custom SMTP is properly configured

### Confirmation link expired
- User can click "Resend Confirmation Email" button
- Links expire after 24 hours by default
- Consider increasing token expiry in Supabase settings if needed

### Redirect not working
- Verify redirect URL matches exactly: `https://www.ruggedyouth.com/auth/confirm`
- Check that route is added in `src/App.tsx`
- Ensure no typos in URL configuration

### Users can't sign in after confirmation
- Ensure "Auto-confirm users" is OFF in Email provider settings
- Check that RLS policies allow user access to admin data
- Verify user session is properly created

---

## Security Notes

- Email confirmation adds a layer of security by verifying user email ownership
- Tokens expire after 24 hours
- Links are one-time use only
- Always use HTTPS in production
- Never share your SMTP credentials

---

## Next Steps

1. Complete the configuration steps above
2. Test signup and email confirmation
3. Customize email template to match your brand
4. Set up custom SMTP for production
5. Monitor email delivery metrics in Supabase

For more details, visit the [Supabase Auth Documentation](https://supabase.com/docs/guides/auth).
