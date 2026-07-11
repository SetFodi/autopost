# AutoPost

AutoPost for Cars is a production-minded Wizard-of-Oz validation MVP for Georgian vehicle sellers. A seller uploads 5–15 real car photos and minimal vehicle details; the AutoPost team manually prepares a watermarked Preview and delivers it over WhatsApp within 24 hours. A customer who likes it can buy the clean content package for **14.90₾** by manual bank transfer.

The product is intentionally optimized around one demand signal: a completed submission containing real vehicle photos. The strongest signal is a recorded payment.

## Campaign gate — read before launch

<!-- CAMPAIGN GATE: Before advertisements are launched, the team must create one genuinely impressive manual vehicle transformation. Do not launch unless it is clearly better than typical Georgian dealer posts. -->

> **Do not launch advertisements before one genuinely impressive manual vehicle transformation exists.** The result must be clearly better than typical Georgian dealer posts. It becomes the landing-page hero, the first ad creative, and the first reusable production template. Placeholder media is development-only.

## MVP scope

Included:

- Georgian mobile-first landing page and exact, consistent Preview CTA
- replaceable before/after hero media with polished local fallbacks
- short vehicle form with Georgian phone normalization
- 5–15 image selection, preview, removal, progress, retry, and duplicate-click protection
- short-lived direct upload tokens for the private Supabase bucket
- server verification of every expected object, declared MIME, file signature, structure, and safe dimensions before completion
- two-scope database-backed, per-IP rate limiting with a keyed IP hash
- authenticated daily cleanup of abandoned uploads and expired rate-limit rows
- invisible honeypot and server-side count, size, MIME, and metadata validation
- internal product analytics and conditional Meta Pixel events
- Supabase email/password admin authentication
- admin KPIs, search, filters, responsive submission review, private photo links, status/notes/revenue updates
- editable WhatsApp delivery message and fulfillment workflow
- Georgian privacy and terms pages
- focused automated tests plus a manual QA checklist

Explicitly excluded from this validation release:

- automated video rendering or Remotion
- generative content or automatic copy generation
- online payments or subscriptions
- Meta, TikTok, or other social auto-publishing
- customer accounts
- a hosted customer Preview portal

## Technical architecture

AutoPost uses Next.js App Router, strict TypeScript, Tailwind CSS, React Hook Form, Zod, Supabase Database/Auth/private Storage, and `pnpm`.

The upload flow is designed for Vercel rather than a long-lived server:

1. `/api/submissions/init` validates metadata and file descriptors.
2. The server hashes the request IP with `RATE_LIMIT_IP_HASH_SECRET`.
3. A Postgres RPC consumes a broad init-request limit before idempotency lookup, so replays cannot generate unlimited signed upload URLs.
4. An idempotency key prevents duplicate submissions; genuinely new rows also consume the stricter new-submission limit.
5. Supabase creates one short-lived signed upload token per generated object path; the server also returns an HMAC completion capability bound to the submission.
6. The browser uploads files directly to the private `vehicle-uploads` bucket.
7. `/api/submissions/complete` rejects invalid capabilities before privileged reads, then verifies every expected object’s path, size, declared MIME, bounded byte signature/structure, and safe dimensions before marking it complete.
8. Only after completion does the browser enter the success state and fire Meta `Lead` once.

There is no in-memory rate-limit counter. Vercel instances are ephemeral; both throttle scopes are deliberately persisted in Postgres. A daily authenticated cron removes globally expired rate rows and stale incomplete submissions after first claiming them atomically. It deletes private objects through the Storage API before deleting the matching database row.

## Local setup

Requirements:

- Node.js 22 or newer
- pnpm 10 or newer
- a Supabase project, or the Supabase CLI for a local stack

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The public presentation can render without optional integrations. Submission and admin operations show a readable configuration error until Supabase is configured.

## Environment variables

Copy `.env.example` to `.env.local`.

| Variable                                 | Required          | Purpose                                                                       |
| ---------------------------------------- | ----------------- | ----------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`               | yes               | Supabase project URL                                                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`          | yes               | Browser-safe publishable/legacy anon key; never use the service key here      |
| `SUPABASE_SERVICE_ROLE_KEY`              | yes               | Server-only intake, verification, analytics, and admin access                 |
| `ADMIN_EMAIL`                            | yes for admin     | Exact email allowed into `/admin`; every server page/action re-checks it      |
| `RATE_LIMIT_IP_HASH_SECRET`              | yes in production | Secret used to HMAC IPs before the database-backed rate-limit event is stored |
| `CRON_SECRET`                            | yes in production | Separate 32+ character bearer secret Vercel sends to the cleanup route        |
| `SUBMISSION_RATE_LIMIT_MAX`              | no                | Maximum new intake attempts per window; defaults to a conservative value      |
| `SUBMISSION_INIT_REQUEST_RATE_LIMIT_MAX` | no                | Broader cap for every valid init request, including idempotent replays        |
| `SUBMISSION_RATE_LIMIT_WINDOW_MINUTES`   | no                | Rate-limit window length                                                      |
| `NEXT_PUBLIC_WHATSAPP_NUMBER`            | no                | Support WhatsApp number, ideally `9955XXXXXXXX`                               |
| `NEXT_PUBLIC_OPERATOR_NAME`              | no                | Real operator/company name in the footer and legal pages                      |
| `NEXT_PUBLIC_FACEBOOK_URL`               | no                | Real Facebook page URL                                                        |
| `NEXT_PUBLIC_SITE_URL`                   | recommended       | Canonical origin, for example `https://autopost.ge`                           |
| `NEXT_PUBLIC_META_PIXEL_ID`              | no                | Enables Meta Pixel; no script or error is produced when absent                |

Generate the IP hashing secret locally:

```bash
openssl rand -hex 32
```

Generate `CRON_SECRET` separately with the same command. Do not expose `SUPABASE_SERVICE_ROLE_KEY`, `RATE_LIMIT_IP_HASH_SECRET`, or `CRON_SECRET` through a `NEXT_PUBLIC_` name.

## Supabase project and database setup

1. Create a Supabase project.
2. Install or invoke the current Supabase CLI and authenticate.
3. Link this repository to the project.
4. Apply the committed migrations.

```bash
pnpm dlx supabase@latest login
pnpm dlx supabase@latest link --project-ref YOUR_PROJECT_REF
pnpm dlx supabase@latest db push
```

For a disposable local Supabase stack, use:

```bash
pnpm dlx supabase@latest start
pnpm dlx supabase@latest db reset
pnpm test:db
```

`db reset` applies the migration and development-only seed. `test:db` runs the pgTAP checks for RLS, denied public privileges, the private bucket, and the persisted per-IP rate-limit behavior. A Docker-compatible runtime must be running.

The migrations create the submission, file, analytics, and rate-limit tables; constraints and indexes; updated-at handling; the atomic rate-limit function; private bucket configuration; explicit Data API grants for `service_role`; and RLS on every exposed public table. Public roles receive no list/read access to submission data.

After applying migrations, use the Supabase database advisors and resolve any environment-specific warnings before launch.

### Retention cleanup cron

`vercel.json` invokes `GET /api/cron/cleanup` daily at `03:23 UTC`. Vercel sends `Authorization: Bearer $CRON_SECRET`; the route rejects requests when the secret is missing or mismatched. Configure `CRON_SECRET` in the Vercel Production environment before deployment.

Each run claims at most 50 pending/failed submissions older than 24 hours using row locks and a short claim lease, removes their tracked objects through the private Storage API, then deletes only rows whose claim token still matches. Duplicate or overlapping invocations are safe, and a crashed claim becomes retryable. Rate-limit rows older than seven days are deleted globally through an indexed cutoff, covering attackers that rotate IPs and never revisit the same key.

### Private storage bucket

The migration provisions `vehicle-uploads` as a private bucket with the accepted image MIME types and configured per-object limit. Confirm in **Storage → Buckets** that:

- the bucket name is exactly `vehicle-uploads`;
- **Public bucket** is off;
- source files use `submissions/{submission-id}/{generated-filename}`;
- there is no anonymous browse/read policy.

If project permissions prevent bucket creation through the migration, create the bucket manually with the same name and settings, then re-run the migration. Do not make the bucket public. Admin photo review uses short-lived signed download URLs.

### Optional development seed

If `supabase/seed.sql` is present, run it only against a local/development database. Seed rows are labeled development-only and never appear on the production landing page.

## Authentication and the first admin

There is no public sign-up route.

1. In Supabase, open **Authentication → Users → Add user**.
2. Create an email/password user and mark the email confirmed.
3. Set `ADMIN_EMAIL` to that exact email in `.env.local` and Vercel.
4. Visit `/admin/login` and sign in.

Authentication alone is not authorization: `/admin` server pages and mutations verify the current Supabase user and the exact allow-listed email. Proxy/session refresh is convenience only, not the sole security boundary. Disable public sign-ups in Supabase Auth unless another controlled workflow needs them later.

## Meta Pixel

1. Create a Pixel in Meta Events Manager.
2. Put the numeric ID in `NEXT_PUBLIC_META_PIXEL_ID`.
3. Restart/redeploy the app.
4. In Meta Pixel Helper or Events Manager Test Events, verify:
   - `PageView` on a landing-page load;
   - `FormStarted` once after the first meaningful form interaction;
   - `Lead` only after all files are uploaded, verified, and the intake is completed.
5. Refresh or revisit the success state and confirm the same submission does not emit a second `Lead`.

When no Pixel ID is set, the integration is inert. Internal analytics still works independently.

## Internal analytics

The server accepts only this allow-list:

- `landing_view`
- `primary_cta_click`
- `form_started`
- `photo_added`
- `submission_completed`
- `whatsapp_clicked`
- `preview_delivered`
- `converted`

Events contain an event name, optional submission ID, and small non-sensitive metadata. Phone numbers and customer names do not belong in analytics metadata.

## Admin fulfillment workflow

1. A submission arrives.
2. Admin reviews the uploaded photos.
3. Admin marks the submission `in_progress`.
4. Admin manually creates the Reel, Story, carousel, square card, and trilingual copy.
5. Admin uploads the files to a private Drive folder.
6. Admin adds the Drive URL.
7. Admin generates the WhatsApp message.
8. Admin sends the Preview within 24 hours.
9. Admin marks the submission `delivered`.
10. If the customer pays 14.90₾, admin marks it `converted` and records the amount.

AutoPost does not publish on the customer’s behalf in this release.

## Development commands

```bash
pnpm dev           # local Next.js server
pnpm typecheck     # strict TypeScript
pnpm lint          # ESLint, zero warnings
pnpm test          # focused Vitest suite
pnpm test:db       # pgTAP migration/security tests (local Supabase required)
pnpm test:coverage # coverage report
pnpm format:check  # Prettier verification
pnpm build         # production build
pnpm start         # run the production build
```

## Deploy to Vercel

1. Push the repository to GitHub or import it directly into Vercel.
2. Keep the detected framework as **Next.js** and package manager as **pnpm**.
3. Add all required server variables and desired optional public variables to Production and Preview environments.
4. Set `NEXT_PUBLIC_SITE_URL` to the canonical production URL.
5. Apply the Supabase migration before the first live submission.
6. Deploy, then run the mobile upload, admin login, private-photo, WhatsApp, and Pixel test flows.
7. Add the final domain in Vercel and update DNS.

External setup requiring account credentials remains intentionally manual: create the Supabase project, confirm/create the private bucket, create the first admin, obtain the Meta Pixel ID, deploy to Vercel, and buy/configure the domain. Check `autopost.ge` availability with a Georgian registrar early; availability is not assumed by this repository.

## Manual QA checklist

The latest credential-free run and the clearly separated live-account checks are recorded in [`docs/manual-qa.md`](docs/manual-qa.md). Record device/browser and pass/fail notes again on the final production domain before campaign launch.

### Responsive and content

- [ ] 320px: no horizontal overflow, clipping, or tiny tap targets
- [ ] 375px: navigation, hero media, pricing, and form remain usable
- [ ] 390px: cards and file previews do not overlap
- [ ] tablet: spacing and content width remain intentional
- [ ] desktop/large desktop: media and editorial layout remain balanced
- [ ] Georgian, Latin, Cyrillic, numbers, `₾`, `$`, and car specs render without missing glyphs
- [ ] a long mixed model such as `Mercedes-Benz GLE 450 4MATIC — ახალი` wraps correctly
- [ ] all primary CTAs use `მიიღე უფასო Preview` and focus/scroll to the form

### Upload and validation

- [ ] native mobile multi-photo picker works
- [ ] exactly 5 photos completes successfully
- [ ] exactly 15 photos completes successfully
- [ ] fewer than 5 and more than 15 are rejected clearly
- [ ] JPG/JPEG/PNG/WEBP and supported HEIC files are accepted
- [ ] an invalid MIME type is rejected client- and server-side
- [ ] an oversized file and oversized total are rejected clearly
- [ ] slow upload shows understandable progress/status
- [ ] a partial failure preserves form data and offers a clear retry
- [ ] double-clicking submit cannot create a second submission
- [ ] formatted Georgian numbers normalize to `+9955XXXXXXXX`
- [ ] invalid Georgian phone errors are written in Georgian
- [ ] the success state appears only after every storage/database operation completes

### Admin and fulfillment

- [ ] anonymous `/admin` requests redirect to `/admin/login`
- [ ] a signed-in non-allow-listed account cannot read or mutate admin data
- [ ] dashboard search works for vehicle, phone, and public reference
- [ ] every status filter and mobile card view works
- [ ] private photos load with expiring URLs and cannot be browsed anonymously
- [ ] notes, delivery URL, amount, and status persist
- [ ] WhatsApp text preserves Georgian characters and line breaks
- [ ] delivered and converted transitions create internal analytics events

### Integrations and degraded states

- [ ] Pixel disabled state has no script errors
- [ ] Pixel `Lead` fires once, only after verified completion
- [ ] missing optional WhatsApp/operator/Facebook values hide or degrade cleanly
- [ ] missing required Supabase values show a readable development configuration state
- [ ] the database-backed rate limit blocks the configured excess attempt across separate server requests

## Validation rules after launch

- Initial Meta advertising budget is approximately **50–60₾**.
- Likes, views, and page visits are not validation.
- Real photo uploads are the primary demand signal.
- Three or more serious uploads justify manual fulfillment and a payment test.
- Do not build Remotion automation until at least one or two customers pay.
- A weak first test should lead to a new creative and one second small test.
- Only two weak creative rounds count as a meaningful negative result.
- If cars fail, test real estate next using the same platform architecture.

## Repository map

```text
src/app/                 routes, metadata, legal pages, APIs, admin
src/components/landing/ public marketing sections
src/components/forms/   upload experience
src/components/admin/   private operational UI
src/lib/validation/      shared Zod schemas and Georgian phone logic
src/lib/supabase/        browser, cookie-aware server, and service clients
src/lib/analytics/       typed Meta/internal analytics helpers
src/lib/security/        IP hashing and request guards
supabase/migrations/     schema, RLS, grants, bucket, rate-limit RPC
public/demo/             replaceable campaign media and local fallbacks
tests/                   focused validation, security, upload, and analytics tests
```

## Known intentional omission

`/preview/[secure-token]` is not part of the initial build. Validation-stage delivery is WhatsApp plus a private Google Drive or equivalent link, keeping the upload and admin fulfillment path reliable and simple.
