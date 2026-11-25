# Supabase sync setup

SparkL Lens works without Supabase. When sync is configured, written reports
and their page photos upload from the device to a Supabase project when a
connection is available. Offline records stay in the local queue.

## 1. Create a project

Create a Supabase project and note:

- Project URL — `https://YOUR-PROJECT.supabase.co`
- Anon public key — Project Settings → API

Do not use the service-role key in the browser.

## 2. Run the schema

Open the SQL editor in Supabase and run [`schema.sql`](./schema.sql). It creates:

- `public.written_assessments`
- the private `written-photos` storage bucket
- prototype RLS policies for the anon key

The included policies are intentionally permissive for a college prototype.
Before using real child records, replace them with authentication and
per-device or per-educator access rules.

## 3. Configure the app

Open **Settings → Sync**, enter the project URL and anon key, and use **Test
connection**. Start a written check and save it; the record will appear as
**Queued** until it uploads.

When online, the app also attempts pending uploads automatically. The
**Sync now** button retries immediately.

## What is uploaded

- anonymous learner code, subject, centre, educator
- rubric marks, band, scores and notes
- compressed page photos
- device ID and timestamps

No names, audio or speech recordings are uploaded.

## What is not implemented yet

- pulling records from Supabase onto a second device
- authentication or per-educator accounts
- conflict resolution beyond last-write-wins on `updated_at`
- deletion or retention policies

These are deliberate prototype boundaries. Add them before a real field deployment.
