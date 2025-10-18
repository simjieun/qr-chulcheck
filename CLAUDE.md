# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QR-based attendance system for company sports events. Uploads Excel employee roster, generates individual QR codes, stores them in Supabase Storage, and emails them to employees. Employees scan QR codes to check in, with real-time dashboard showing attendance statistics.

## Commands

### Development
```bash
yarn dev              # Start development server (localhost:3000)
yarn build            # Production build
yarn start            # Start production server
yarn lint             # Run ESLint
yarn type-check       # TypeScript type checking without emit
```

### Build Variants
```bash
yarn build:analyze     # Build with bundle analysis (ANALYZE=true)
yarn build:production  # Production build with NODE_ENV=production
yarn start:production  # Start with NODE_ENV=production
```

### Utilities
```bash
yarn clean            # Remove .next and out directories
yarn build:clean      # Clean then build
```

**Note**: This project uses **Yarn Berry (v4.9.4)** as the package manager. Always use `yarn` commands, not `npm`.

## Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router, React 19)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage (QR code images)
- **Email**: Nodemailer (SMTP) + Resend (deprecated but still configured)
- **Styling**: Tailwind CSS + Radix UI components

### Key Data Flow

1. **Excel Upload** (`/register` → `/api/upload-excel`)
   - Parse Excel with `xlsx` library (columns: 직원명, 팀명, 이메일, 사번)
   - Generate UUID token per employee
   - Create QR code PNG with `qrcode` library pointing to `/check-in?token={uuid}`
   - Upload to Supabase Storage at `{sanitized_team}/{employee_number}.png`
   - Upsert to `attendees` table (conflict on `employee_number`)
   - Send email via Nodemailer with embedded QR image

2. **Check-in** (`/check-in?token={uuid}` → `/api/checkin`)
   - Client-side page auto-triggers POST to `/api/checkin` with token
   - API validates token, updates `check_in_at` timestamp
   - Returns attendee info to display confirmation

3. **Dashboard** (`/` → `/api/dashboard`)
   - Home page polls every 30s for stats
   - Shows total/checked-in/not-checked-in/percentage cards
   - Links to `/attendees` page with filters

### Directory Structure

```
app/
  api/
    upload-excel/   # Excel processing, QR generation, email sending
    checkin/        # Check-in API (updates check_in_at)
    dashboard/      # Attendance stats aggregation
    attendees/      # List all attendees with filters
  attendees/        # Attendee management page with search/filter
  check-in/         # QR scan landing page (Suspense wrapper)
  register/         # Excel upload form
  page.tsx          # Dashboard homepage

lib/
  env.ts            # Environment variable management with validation
  supabase.ts       # Admin client singleton (service role key)
  supabase-client.ts # Client-side Supabase client (anon key)
  nodemail.ts       # Email sending via SMTP
  email.ts          # Email templates

types/
  database.ts       # Supabase table types (auto-generated)
  attendance.ts     # Business logic types (EmployeeRow, NormalizedEmployee)

components/
  upload-form.tsx   # Excel upload UI with progress
  email-template.tsx # React Email template
```

### Database Schema

**Table**: `attendees`
- `id` (uuid, PK)
- `employee_number` (text, unique) - Used as upsert key
- `name`, `team`, `email` (text)
- `qr_token` (uuid) - Check-in identifier
- `qr_code_url` (text) - Public Storage URL
- `qr_code_storage_path` (text) - Storage file path
- `email_sent_at` (timestamptz)
- `check_in_at` (timestamptz) - NULL = not checked in
- `created_at`, `updated_at` (timestamptz with trigger)

**Indexes**: `email`, `team`

### Environment Variables

Required (see `.env.example` for full list):
- `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_QR_BUCKET` (default: `qr-codes`)
- `APP_URL` (auto-detected on Vercel via `VERCEL_PROJECT_PRODUCTION_URL`)
- `SMTP_SERVER`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`

SMTP email is the primary method. Resend config exists but is deprecated.

### Important Patterns

1. **Korean Text in Storage Paths**: Team names with Korean characters are Base64-encoded to avoid storage path issues. See `sanitizeForStorage()` in `/api/upload-excel/route.ts:19`.

2. **Environment Validation**: `lib/env.ts` provides `assertServerEnv()` to fail fast on missing vars. Use it for server-only secrets.

3. **Supabase Client Types**:
   - Server routes/actions → `getSupabaseAdminClient()` (service role, full access)
   - Client components → `getSupabaseClient()` (anon key, RLS)

4. **Upsert Logic**: Employee uploads replace existing records by `employee_number`, preserving `check_in_at` if already checked in (database default behavior).

5. **Email Failures Are Non-Blocking**: Excel upload continues even if email fails. Check logs for individual email errors.

## Common Tasks

### Adding a New API Route
1. Create `/app/api/{route}/route.ts`
2. Use `getSupabaseAdminClient()` for database access
3. Validate inputs, return `NextResponse.json()`
4. Add error handling with descriptive messages

### Modifying Database Schema
1. Edit SQL in `supabase/migrations/` (or create new migration)
2. Run migration via Supabase CLI or dashboard
3. Regenerate types: `npx supabase gen types typescript --project-id {id} > types/database.ts`
4. Update `types/database.ts` helper aliases if needed

### Debugging Email Issues
- Check `lib/nodemail.ts` SMTP configuration
- Verify SMTP credentials and port (587 for TLS)
- Look for console logs in `/api/upload-excel` route (detailed per-employee logging)
- Test with `TEST_EMAIL` env var in development

### Excel Format Requirements
- First sheet must have headers: `직원명`, `팀명`, `이메일`, `사번`
- All four fields are required per row (missing values → failure list)
- Duplicate `사번` → last row wins (upsert)
- Numeric `사번` values are auto-converted to strings
