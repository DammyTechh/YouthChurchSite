# 📧 Supabase Email Verification Setup Guide

## 🚀 Complete Setup Instructions for RuggedYouth Admin Authentication

### **Step 1: Configure Authentication Settings**

Go to your Supabase Dashboard → **Authentication** → **Settings**:

```
✅ Enable email confirmations: ON
✅ Enable email change confirmations: ON  
✅ Enable secure email change: ON
✅ Double confirm email changes: ON
```

### **Step 2: Set Site URL**

In **Authentication** → **Settings** → **Site URL**:

```
Site URL: https://your-deployed-domain.netlify.app
```

**Important:** Replace `your-deployed-domain.netlify.app` with your actual Netlify domain after deployment.

### **Step 3: Configure Redirect URLs**

In **Authentication** → **Settings** → **Redirect URLs**, add these URLs:

```
https://your-deployed-domain.netlify.app/admin
https://your-deployed-domain.netlify.app/**
http://localhost:5173/admin (for development)
```

### **Step 4: Email Templates Configuration**

#### **Confirm Signup Template**
Go to **Authentication** → **Email Templates** → **Confirm signup**:

**Subject:**
```
Welcome to RuggedYouth Admin Panel - Confirm Your Account
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Your RuggedYouth Admin Account</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://imgur.com/7Rm4DNu.png" alt="RuggedYouth Logo" style="width: 80px; height: 80px; border-radius: 12px; margin-bottom: 20px;">
        <h1 style="color: #7c3aed; margin: 0;">Welcome to RuggedYouth!</h1>
        <p style="color: #666; margin: 10px 0 0 0;">Admin Panel Access</p>
    </div>
    
    <div style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
        <h2 style="color: white; margin: 0 0 15px 0;">Confirm Your Admin Account</h2>
        <p style="color: rgba(255,255,255,0.9); margin: 0 0 25px 0;">
            Thank you for registering as an admin for RuggedYouth. Please click the button below to confirm your email address and activate your admin account.
        </p>
        <a href="{{ .ConfirmationURL }}" style="background-color: white; color: #7c3aed; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; transition: all 0.2s;">
            Confirm Email & Access Admin Panel
        </a>
    </div>
    
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #7c3aed; margin-bottom: 20px;">
        <h3 style="margin: 0 0 10px 0; color: #374151;">What's Next?</h3>
        <ul style="margin: 0; padding-left: 20px; color: #6b7280;">
            <li>Click the confirmation button above</li>
            <li>You'll be redirected to the admin login page</li>
            <li>Log in with your email and password</li>
            <li>Start managing RuggedYouth content!</li>
        </ul>
    </div>
    
    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
        <p style="color: #9ca3af; font-size: 14px; margin: 0 0 10px 0;">
            If the button doesn't work, copy and paste this link into your browser:
        </p>
        <p style="color: #7c3aed; font-size: 12px; word-break: break-all; margin: 0 0 20px 0;">
            {{ .ConfirmationURL }}
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            This link will expire in 24 hours for security reasons.
        </p>
    </div>
    
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px; margin: 0;">
            Best regards,<br>
            <strong>RuggedYouth Team</strong>
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
            Empowering Young Lives • Building Faith • Creating Community
        </p>
    </div>
</body>
</html>
```

#### **Magic Link Template** (Optional)
Go to **Authentication** → **Email Templates** → **Magic Link**:

**Subject:**
```
Your RuggedYouth Admin Login Link
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RuggedYouth Admin Login</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://imgur.com/7Rm4DNu.png" alt="RuggedYouth Logo" style="width: 80px; height: 80px; border-radius: 12px; margin-bottom: 20px;">
        <h1 style="color: #7c3aed; margin: 0;">RuggedYouth Admin Access</h1>
    </div>
    
    <div style="background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
        <h2 style="color: white; margin: 0 0 15px 0;">Admin Panel Login</h2>
        <p style="color: rgba(255,255,255,0.9); margin: 0 0 25px 0;">
            Click the button below to securely access your RuggedYouth admin panel.
        </p>
        <a href="{{ .ConfirmationURL }}" style="background-color: white; color: #7c3aed; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            Access Admin Panel
        </a>
    </div>
    
    <div style="text-align: center; color: #9ca3af; font-size: 12px;">
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this login, please ignore this email.</p>
    </div>
</body>
</html>
```

### **Step 5: SMTP Configuration (Recommended)**

For better email delivery, configure SMTP in **Authentication** → **Settings** → **SMTP Settings**:

#### **Option A: Gmail SMTP (Free)**
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-gmail@gmail.com
SMTP Pass: your-app-password (not regular password)
Sender Name: RuggedYouth
Sender Email: your-gmail@gmail.com
```

#### **Option B: SendGrid (Professional)**
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Pass: your-sendgrid-api-key
Sender Name: RuggedYouth
Sender Email: noreply@yourdomain.com
```

### **Step 6: Storage Configuration**

Create a storage bucket for event fliers:

1. Go to **Storage** in your Supabase dashboard
2. Click **Create Bucket**
3. Name: `event-fliers`
4. Set to **Public** bucket
5. Click **Create bucket**

### **Step 7: RLS Policies Setup**

Run this SQL in your Supabase SQL Editor:

```sql
-- Storage policies for event-fliers bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-fliers', 'event-fliers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload event fliers" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'event-fliers');

-- Allow public access to view files
CREATE POLICY "Public can view event fliers" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'event-fliers');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete event fliers" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'event-fliers');
```

### **Step 8: Test the Flow**

1. **Deploy your app** to Netlify
2. **Update Site URL** in Supabase with your actual domain
3. **Test registration:**
   - Go to `your-domain.netlify.app/admin`
   - Click "Need an account? Register"
   - Fill out the form
   - Check email for confirmation link
   - Click link → should redirect to `/admin`
   - Login with credentials

### **Step 9: Production Checklist**

- [ ] Supabase project created and configured
- [ ] Environment variables set in Netlify
- [ ] Site URL updated in Supabase
- [ ] Redirect URLs configured
- [ ] Email templates customized
- [ ] SMTP configured (optional but recommended)
- [ ] Storage bucket created
- [ ] RLS policies applied
- [ ] Test registration and login flow
- [ ] Test email confirmation
- [ ] Test admin panel functionality

## 🔄 **User Flow After Setup**

### **Admin Registration:**
1. Admin visits `your-domain.netlify.app/admin`
2. Clicks "Need an account? Register"
3. Fills registration form
4. Receives confirmation email with RuggedYouth branding
5. Clicks confirmation link
6. Automatically redirected to `/admin` login page
7. Logs in with verified credentials
8. Access to full admin panel

### **Admin Login:**
1. Admin visits `/admin`
2. Enters email and password
3. Successful login → access to dashboard
4. Can manage events and media content
5. All changes persist and appear on main website

## 🛡️ **Security Features**

- ✅ Email verification required
- ✅ Row Level Security (RLS) enabled
- ✅ Secure file uploads
- ✅ Admin-only access
- ✅ Session management
- ✅ CSRF protection
- ✅ Input validation

## 📱 **Admin Panel Features**

- ✅ Dashboard with analytics
- ✅ Media management with search/filter
- ✅ Event management with file uploads
- ✅ Real-time notifications
- ✅ Responsive design
- ✅ Data persistence
- ✅ Professional UI/UX

Your RuggedYouth admin panel is now production-ready! 🎉