# AutoPost

AutoPost for Cars is an automated validation product for Georgian vehicle sellers. A seller uploads 5–15 real car photos and minimal vehicle details; durable workflows create a watermarked Reel, 3 Stories, a 6-slide carousel, a square card, and trilingual copy. The private result page appears immediately, updates while processing, and unlocks the clean package after a verified **14.90₾** TBC Checkout payment.

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
- local orientation-preserving photo re-encoding that strips EXIF/GPS before upload
- short-lived direct upload tokens for the private Supabase bucket
- server verification of every expected object, declared MIME, file signature, structure, and safe dimensions before completion
- two-scope database-backed, per-IP rate limiting with a keyed IP hash
- an atomic global Storage-capacity reservation guard sized for the Free tier
- authenticated daily cleanup of abandoned uploads and expired rate-limit rows
- invisible honeypot and server-side count, size, MIME, and metadata validation
- internal product analytics and conditional Meta Pixel events
- Supabase email/password admin authentication
- admin KPIs, search, filters, responsive submission review, private photo links, status/notes/revenue updates
- automatic watermarked and clean static asset templates with trilingual copy
- durable Vercel Workflow orchestration and Remotion rendering in Vercel Sandbox
- signed private customer result pages with expiring asset downloads
- server-verified TBC Checkout payments and automatic ZIP delivery
- editable WhatsApp support/delivery tools for exceptional cases
- Georgian privacy and terms pages
- focused automated tests plus a manual QA checklist

Explicitly excluded from this validation release:

- subscriptions or recurring billing
- Meta, TikTok, or other social auto-publishing
- customer accounts
- AI-generated vehicle imagery or ungrounded vehicle claims

## Technical architecture

AutoPost uses Next.js App Router, strict TypeScript, Tailwind CSS, React Hook Form, Zod, Supabase Database/Auth/private Storage, and `pnpm`.

The upload flow is designed for Vercel rather than a long-lived server:

1. `/api/submissions/init` validates metadata and file descriptors.
2. The server hashes the request IP with `RATE_LIMIT_IP_HASH_SECRET`.
3. A Postgres RPC consumes a broad init-request limit before idempotency lookup, so replays cannot generate unlimited signed upload URLs.
4. An idempotency key prevents duplicate submissions; genuinely new rows also consume the stricter new-submission limit.
5. Before any file row is created, Postgres serializes a global capacity check. Incomplete files reserve the bucket's 12 MiB object maximum; completed files reserve their server-verified declared sizes.
6. Before init, the browser validates each source header, decodes with source orientation, bounds it to 3000 px, and canvas-re-encodes it. The selected upload file is always a new pixel-only JPEG, PNG, or WEBP; raw JPG/PNG/WEBP bytes never pass through just because they are small.
7. Photos are prepared sequentially so selecting the 15-photo maximum does not decode 15 full-resolution sources at once. HEIC/HEIF becomes a sanitized JPEG only when the browser can decode it; otherwise selection fails with an explicit conversion message and no raw HEIC/HEIF is uploaded.
8. Supabase creates one short-lived signed upload token per generated object path; the server also returns an HMAC completion capability bound to the submission.
9. The browser uploads only those prepared files directly to the private `vehicle-uploads` bucket.
10. `/api/submissions/complete` rejects invalid capabilities before privileged reads, then verifies every expected object’s path, size, declared MIME, bounded byte signature/structure, and safe dimensions before marking it complete.
11. Postgres atomically reserves one preview workflow start, preventing duplicate renders across retries or concurrent requests.
12. The browser enters the success state, fires Meta `Lead` once, and opens a signed private result page that polls while Vercel Workflow generates the preview assets.
13. TBC's callback is never trusted by itself: the server looks up the known payment, fetches its details from TBC, verifies the exact amount/currency/status in Postgres, and atomically reserves paid generation.
14. After verified payment, the clean assets and ZIP package are generated automatically and exposed only through short-lived signed URLs.

There is no in-memory rate-limit counter. Vercel instances are ephemeral; both throttle scopes are deliberately persisted in Postgres. A daily authenticated cron removes globally expired rate rows and stale incomplete submissions after first claiming them atomically. It deletes private objects through the Storage API before deleting the matching database row.

### Source-photo privacy and compatibility

Canvas serialization starts from decoded pixels, so source EXIF, GPS, XMP, text
chunks, and camera metadata are not copied into the new upload body. JPEG and
WEBP use a high-quality 0.92 starting encode; PNG remains lossless when it fits
the existing 12 MiB limit and can fall back to alpha-preserving WEBP. Orientation
metadata is applied during decode before the sanitized pixels are written, so a
portrait photo does not become sideways when its EXIF block disappears.

This is fail-closed. Decode, canvas, or encoder failure returns a readable error
and creates no upload target. HEIC/HEIF support therefore depends on the current
browser/device decoder; AutoPost never silently uploads an undecodable original
while claiming its metadata was stripped. The existing 30 MiB raw, 12 MiB
prepared-file, and 120 MiB total limits remain unchanged.

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

| Variable                                              | Required                     | Purpose                                                                       |
| ----------------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                            | yes                          | Supabase project URL                                                          |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`                | yes                          | Modern browser-safe key; never put a secret key in a `NEXT_PUBLIC_` variable  |
| `SUPABASE_SECRET_KEY`                                 | yes                          | Modern server-only key for intake, verification, analytics, and admin access  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`                       | legacy fallback              | Accepted when the modern publishable-key variable is absent                   |
| `SUPABASE_SERVICE_ROLE_KEY`                           | legacy fallback              | Accepted when the modern secret-key variable is absent                        |
| `ADMIN_EMAIL`                                         | yes for admin                | Exact email allowed into `/admin`; every server page/action re-checks it      |
| `RESULT_TOKEN_SECRET`                                 | yes in production            | Dedicated 32+ byte HMAC secret for unguessable customer result links          |
| `RATE_LIMIT_IP_HASH_SECRET`                           | yes in production            | Secret used to HMAC IPs before the database-backed rate-limit event is stored |
| `CRON_SECRET`                                         | yes in production            | Separate 32+ character bearer secret Vercel sends to the cleanup route        |
| `SUBMISSION_RATE_LIMIT_MAX`                           | no                           | Maximum new intake attempts per window; defaults to 3                         |
| `SUBMISSION_INIT_REQUEST_RATE_LIMIT_MAX`              | no                           | Broader cap for every valid init request, including idempotent replays        |
| `SUBMISSION_RATE_LIMIT_WINDOW_MINUTES`                | no                           | Rate-limit window length                                                      |
| `NEXT_PUBLIC_WHATSAPP_NUMBER`                         | no                           | Support WhatsApp number, ideally `9955XXXXXXXX`                               |
| `NEXT_PUBLIC_OPERATOR_NAME`                           | no                           | Real operator/company name in the footer and legal pages                      |
| `NEXT_PUBLIC_OPERATOR_ADDRESS`                        | required to go live with TBC | Real legal/physical contact address shown in the terms                        |
| `NEXT_PUBLIC_FACEBOOK_URL`                            | no                           | Real Facebook page URL                                                        |
| `NEXT_PUBLIC_SITE_URL`                                | recommended                  | Canonical origin, for example `https://autopost.ge`                           |
| `NEXT_PUBLIC_META_PIXEL_ID`                           | no                           | Enables Meta Pixel; no script or error is produced when absent                |
| `TBC_API_KEY` / `TBC_CLIENT_ID` / `TBC_CLIENT_SECRET` | required for payments        | TBC E-Commerce merchant credentials                                           |
| `TBC_API_BASE_URL`                                    | no                           | Defaults to `https://api.tbcbank.ge/v1`                                       |

Generate the IP hashing secret locally:

```bash
openssl rand -hex 32
```

Generate `RESULT_TOKEN_SECRET` and `CRON_SECRET` separately with the same command. Do not expose server keys, payment credentials, or HMAC secrets through a `NEXT_PUBLIC_` name.

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

The migrations create submission, file, analytics, rate-limit, fulfillment, generated-asset, payment, and deletion-tombstone tables; constraints and indexes; updated-at handling; atomic throttles and workflow reservations; a global intake-capacity guard; private bucket configuration; explicit Data API grants for `service_role`; and forced RLS on private application state. Public roles receive no list/read access to submission, payment, or asset data.

The global source-upload guard is reduced to **512 MiB**, reserving the other half of the Free plan's first 1 GB for generated previews and paid packages. It is deliberately conservative while uploads are incomplete: every pending source object reserves the bucket's full 12 MiB limit, so a forged small browser-reported size cannot over-admit uploads. Monitor both buckets; after upgrading Storage capacity, raise `private.intake_capacity_config.max_reserved_bytes` explicitly in a reviewed forward migration rather than removing the guard.

After applying migrations, use the Supabase database advisors and resolve any environment-specific warnings before launch.

### Retention cleanup cron

`vercel.json` invokes `GET /api/cron/cleanup` daily at `03:23 UTC`. Vercel sends `Authorization: Bearer $CRON_SECRET`; the route rejects requests when the secret is missing or mismatched. Configure `CRON_SECRET` in the Vercel Production environment before deployment.

Each run claims at most 100 pending/failed submissions older than 24 hours using row locks and a short claim lease. It processes up to 10 claims concurrently, while preserving Storage deletion before database deletion for each submission, then deletes only rows whose claim token still matches. Duplicate or overlapping invocations are safe, and a crashed claim becomes retryable. Rate-limit rows older than seven days are deleted globally through an indexed cutoff, covering attackers that rotate IPs and never revisit the same key.

This cron does **not** automatically delete completed customer submissions. No
completed-submission retention period has been adopted for this validation MVP,
so the repository does not invent one. Completed records are removed manually
when the operator approves a verified customer request or another documented
business/legal reason. Revisit and document a fixed retention period before the
MVP's processing purpose or operating scale changes.

### Manual deletion of a completed submission

The protected submission detail page includes a **Danger zone** for the exact
allow-listed admin. Deletion requires retyping the submission's public reference
and is irreversible. The server always removes every tracked source and
generated object from both private buckets first. Only after Storage confirms success does
one Postgres `DELETE` remove the submission and atomically cascade its
`submission_files` rows. Existing analytics events contain no form values and
are detached from the deleted submission by the foreign key's `ON DELETE SET
NULL` behavior.

Partial failures are deliberately recoverable:

- if Storage deletion fails, the database is untouched;
- if Storage succeeds but the database delete cannot be confirmed, the server
  checks whether the row is already gone and otherwise returns an explicit
  safe-to-retry warning;
- retrying is safe because removing an already-absent object is idempotent;
- a successful deletion returns the admin to the submission list.

Follow [`docs/data-deletion-sop.md`](docs/data-deletion-sop.md) for requester
verification, failure handling, final checks, and removal of any separately
managed delivery folder.

### Private storage buckets

The migrations provision two private buckets. Confirm in **Storage → Buckets** that:

- `vehicle-uploads` is private, image-only, and capped at 12 MiB per public intake object;
- `vehicle-generated` is private, accepts only PNG, text, MP4, and ZIP, and is capped at 128 MiB per generated object;
- source files use `submissions/{submission-id}/{generated-filename}`;
- generated files use `generated/{submission-id}/{preview|paid}/{asset}` in the generated bucket;
- there is no anonymous browse/read policy.

If project permissions prevent bucket creation through the migration, create the buckets manually with the same names and settings, then re-run the migration. Do not make either bucket public. Admin and customer views use short-lived signed download URLs.

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

## Automated fulfillment and payment setup

Static Preview and clean image/copy assets are generated inside the workflow with no per-order operator action. Reel rendering uses Remotion in a short-lived Vercel Sandbox. Vercel supplies OIDC authentication automatically, the app uploads the MP4 directly into private Supabase Storage, and the sandbox is deleted after every render. No AWS account or Vercel Blob store is required.

1. Enable Vercel Sandbox for the project if the dashboard prompts for it, and set a conservative Vercel spend limit before public traffic.
2. Obtain the TBC E-Commerce API key and merchant client credentials, register `https://YOUR_DOMAIN/api/payments/tbc/callback` in the merchant dashboard, and set the three TBC secrets in Vercel Production.
3. Provide the real operator name, address, and support contact required on the public legal pages before requesting TBC live activation.
4. Submit a new order: its private result page should progress from generating to Preview-ready without admin action.
5. Complete a TBC test payment and confirm the result page progresses to a downloadable clean ZIP package.

Checkout stays disabled unless both TBC and Remotion are configured and the watermarked Reel exists. This prevents accepting money for a package the environment cannot render.

The protected admin dashboard remains available for review, customer support, notes, deletion requests, and exceptional recovery. Its legacy Drive/WhatsApp controls are not part of the normal automated customer flow.

When a verified deletion request arrives, follow the deletion SOP and permanently delete the submission from its protected detail page. Source and generated objects are removed from the private bucket; a delayed tombstone cleanup closes the signed-upload retry window.

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
pnpm build         # bundle the Reel composition and build Next.js
pnpm start         # run the production build
pnpm remotion:studio # preview the Reel composition locally
pnpm remotion:bundle # rebuild the composition bundle used by Sandbox
```

## Deploy to Vercel

1. Push the repository to GitHub or import it directly into Vercel.
2. Keep the detected framework as **Next.js** and package manager as **pnpm**.
3. Add the production Supabase URL/keys, `ADMIN_EMAIL`, `RATE_LIMIT_IP_HASH_SECRET`, `RESULT_TOKEN_SECRET`, `CRON_SECRET`, operator contact fields, and desired public settings to the **Production** environment only.
4. Do not give arbitrary Preview deployments production Supabase credentials or the production Pixel ID. Either leave backend variables absent (presentation-only previews) or use a separate staging Supabase project, staging admin, distinct secrets, and a staging/test Pixel.
5. Set the Production `NEXT_PUBLIC_SITE_URL` to the canonical production URL; previews can omit it and use their Vercel deployment origin.
6. Apply the Supabase migrations before the first live submission.
7. Confirm Vercel Sandbox renders one real Preview, then configure TBC merchant credentials before enabling checkout.
8. Deploy, then run the mobile upload, automatic Preview, TBC test payment, clean ZIP delivery, admin login, private-photo, and Pixel test flows.
9. Add the final domain in Vercel and update DNS, then update the TBC callback/return allow-list if required.

One-time external setup still requires account owners: Supabase access, the first admin, the Meta Pixel ID, TBC merchant activation, the real operator/address, Vercel, and the domain. No per-order manual creation, payment verification, or delivery is required after those credentials are active.

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
- [ ] a fresh completed submission starts exactly one preview workflow
- [ ] the private result page shows 3 Stories, 6 carousel slides, square, copy, and Reel
- [ ] concurrent completion retries do not start duplicate preview renders
- [ ] a TBC callback is verified with TBC before any paid state is recorded
- [ ] wrong amount/currency or a non-success status never unlocks paid assets
- [ ] a verified test payment starts exactly one paid workflow and exposes the ZIP

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
- Three or more serious uploads justify iterating the automated templates and payment funnel.
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
src/lib/fulfillment/     static asset generation, result tokens, packages
src/lib/payments/        TBC Checkout client and server-side verification
src/lib/security/        IP hashing and request guards
src/remotion/            9:16 Reel composition
src/workflows/           durable preview and paid fulfillment workflows
supabase/migrations/     schema, RLS, grants, bucket, rate-limit RPC
public/demo/             replaceable campaign media and local fallbacks
tests/                   focused validation, security, upload, and analytics tests
```

## Intentional omission

AutoPost produces publish-ready files but does not post to Facebook, Instagram, TikTok, MyAuto, or another marketplace on the customer’s behalf.
