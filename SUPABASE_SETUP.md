# Shared inventory setup

The application now supports secure cross-device inventory, customer, and invoice-metadata sync through one Supabase shop account. PDF files are still generated and downloaded only in the browser.

## 1. Create the database

1. Create a free Supabase project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, paste and run the complete contents of `supabase/schema.sql`.
3. In **Project Settings > API**, copy the Project URL and **Publishable** key. Do not use or expose a service-role/secret key.

## 2. Configure the application

For local testing, copy `.env.example` to `.env.local`, then fill in the two values.

For Vercel, add the same two variables under **Project Settings > Environment Variables** and redeploy:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

## 3. Create and use the shop account

1. Open the deployed app. Click **First device? Create the shop account** and create an email/password account for the shop.
2. If email confirmation is enabled in Supabase, confirm the email, then sign in.
3. Sign in with that exact same shop email and password on every device that should access the shared inventory.
4. On the original device, open **Settings > Shared cloud inventory** and choose **Upload local data to shared shop** once to migrate existing products, customers, and invoice metadata.

Every account is isolated at the database policy level. Devices signed into the same account share the same inventory and receive changes without needing a page refresh when Supabase Realtime is available. Older Supabase projects may call the publishable key an `anon` key; the app also accepts `VITE_SUPABASE_ANON_KEY` in that case.
