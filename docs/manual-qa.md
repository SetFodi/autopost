# AutoPost manual QA record

**Run date:** 11 July 2026  
**Environment:** macOS, headless Google Chrome 150, production Next.js build served with `pnpm start`  
**Scope:** credential-free public experience, degraded states, static security boundary, and local database migration smoke checks

## Result

The credential-free release candidate passes its production build, automated suite, responsive browser matrix, landing-page interactions, local upload selection, legal routes, Pixel-off state, and anonymous admin boundary.

One defect was found during this pass: the long privacy-page heading expanded the document to 525 px at a 390 px viewport. The heading now permits safe intra-word wrapping and was re-verified at 320 px with `scrollWidth === 320`.

Live Supabase, Meta, WhatsApp, and Vercel acceptance remains intentionally pending until those external accounts and credentials exist. Placeholder campaign media also remains behind the documented campaign gate.

## Automated gates

| Check               | Result                                                   |
| ------------------- | -------------------------------------------------------- |
| `pnpm format:check` | Pass                                                     |
| `pnpm typecheck`    | Pass                                                     |
| `pnpm lint`         | Pass, zero warnings                                      |
| `pnpm test`         | Pass, 15 files / 91 tests                                |
| `pnpm build`        | Pass, production compile and static generation completed |
| `pnpm audit --prod` | Pass, no known production dependency vulnerabilities     |
| `git diff --check`  | Pass                                                     |
| `pnpm test:db`      | Not run: a Docker-compatible runtime was unavailable     |

The migration was also applied to a disposable PostgreSQL database. Smoke checks confirmed the broad request scope on replay, one stricter creation slot, the configured fourth new request being denied after three accepted attempts, retry timing, stale-claim cleanup, one lifecycle event per status transition, and no `anon` table privileges. The committed pgTAP suite remains the reproducible full local check once Docker/Supabase CLI is available.

Automated coverage also verifies that an invalid completion capability is
rejected before privileged reads and that stored bytes spoofing their declared
image MIME never reach the completion transaction. Client-photo tests verify
that small JPEG, PNG, and WEBP sources all take the decode/canvas/re-encode path,
orientation-aware dimensions are retained, output stays inside the existing
limit, HEIC becomes JPEG only after a successful decode, an unsupported HEIC is
rejected explicitly, and a batch is prepared sequentially.

## Responsive browser matrix

| Viewport    | Result | Evidence checked                                                                                  |
| ----------- | ------ | ------------------------------------------------------------------------------------------------- |
| 320 × 812   | Pass   | Landing and privacy page fit exactly; compact `AP` header treatment; no overlay or browser errors |
| 375 × 812   | Pass   | Full wordmark, hero, pricing, and form remain usable; no horizontal overflow                      |
| 390 × 844   | Pass   | Cards and previews do not overlap; CTA lands on the form; no horizontal overflow                  |
| 768 × 1024  | Pass   | Intentional tablet spacing and content width; no horizontal overflow                              |
| 1440 × 1000 | Pass   | Balanced editorial layout; full-page screenshot inspected                                         |

Across the matrix, the mixed glyph specimen for Georgian, Latin, Cyrillic, numbers, `₾`, `$`, and vehicle specs was present. Required images loaded with non-zero intrinsic dimensions; below-fold lazy images resolved when scrolled into view. No Next.js error overlay or page errors appeared.

## Interaction and degraded-state checks

| Scenario                         | Result                                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Primary CTA copy and destination | Pass: `მიიღე უფასო Preview` scrolls to `#preview-form`                                               |
| Empty submit                     | Pass: focus moves to phone and Georgian field errors appear                                          |
| Formatted Georgian phone         | Pass: `+995 (555) 12-34-56` is accepted by the form flow                                             |
| Non-numeric price                | Pass: `$20k` is blocked client-side without an init request                                          |
| Invalid SVG upload               | Pass: clear Georgian file-type error                                                                 |
| Five PNG selection               | Pass: five thumbnails/removal controls and `5 / 15` count                                            |
| Fifteen PNG selection            | Pass: fifteen removal controls and `15 / 15` count                                                   |
| Sixteen PNG selection            | Pass: selection rejected; no previews retained; maximum-15 error shown                               |
| Oversized source photo           | Pass: a 30 MB+ PNG is rejected before preview/processing with a Georgian size error                  |
| Long mixed vehicle model         | Pass: remains usable and preserves its value after a failed request                                  |
| Long price                       | Pass: `99999999` remains usable at mobile width and reaches validated submission handling            |
| Duplicate submit gesture         | Pass: a real browser double-click produced exactly one `/api/submissions/init` request               |
| Missing Supabase configuration   | Pass: init returns 503; readable retry message; phone, model, consent, and five photos remain intact |
| Pixel ID absent                  | Pass: no `fbq`, no `fbevents` script, and no console error                                           |
| Privacy and terms routes         | Pass after privacy heading fix; metadata and headings present                                        |
| Anonymous `/admin`               | Pass: 307 to `/admin/login?reason=configuration` without required environment values                 |
| Unconfigured admin login         | Pass: configuration notice shown; email, password, and submit controls disabled                      |
| `robots.txt` and `sitemap.xml`   | Pass: generated routes respond and use the configured/runtime origin                                 |
| Security headers                 | Pass: nosniff, frame deny, referrer policy, permissions policy, and production HSTS present          |

## Account-dependent acceptance still required

Run these after completing the external setup in the README:

- Complete a real 5-photo and 15-photo submission against Supabase, including signed upload, object verification, completion, and one success/Lead transition.
- Exercise a real HEIC/HEIF file and the native multi-photo picker on representative iOS and Android devices.
- Upload a disposable orientation-tagged JPEG containing known EXIF/GPS values.
  Confirm its preview remains upright and download the resulting private object
  to verify those tags are absent. Repeat with PNG text/eXIf and WEBP EXIF/XMP
  fixtures.
- On a browser/device that cannot decode HEIC, confirm the form explains that
  conversion is required, adds no photo, and sends no `/api/submissions/init`
  request. On a compatible device, confirm the selected HEIC becomes a previewable
  sanitized JPEG.
- Select fifteen representative high-resolution phone photos and confirm
  preparation completes sequentially without a tab reload or memory crash.
- Throttle or interrupt a real Storage upload, confirm progress is understandable, then use retry without losing form state or duplicating the submission.
- Confirm the configured rate limit from separate Vercel requests/instances; the underlying shared Postgres ledger and concurrency lock are already covered by migration checks.
- Confirm the global capacity guard rejects a new intake once reservations cross the configured limit, while an idempotent replay still resolves normally.
- Sign in as the allow-listed admin, then as a non-allow-listed user; verify reads and mutations are denied for the latter.
- Review private images through expiring admin URLs and confirm anonymous listing/reading is impossible.
- Persist every admin status, note, delivery URL, and amount; verify delivered/converted analytics are recorded once.
- From a completed submission, open the Danger zone and verify the irreversible
  button remains disabled until the exact public reference is typed. Delete a
  disposable submission and confirm its private Storage objects disappear before
  its submission/file rows, the admin list no longer finds it, and the old detail
  URL returns not found.
- Force one Storage-removal failure and confirm the database row remains; then
  force a database failure after Storage succeeds and confirm the UI gives the
  explicit safe-to-retry warning before a retry completes deletion.
- Open the generated WhatsApp link on a real device and verify Georgian characters and line breaks.
- Configure Meta Pixel and use Test Events/Pixel Helper to verify `PageView`, one `FormStarted`, and one post-completion `Lead`.
- Deploy on Vercel, add the final domain/DNS, rerun this matrix on the production URL, and confirm canonical/sitemap origins.
- Replace all development placeholder media with the first genuinely impressive manual transformation before any paid campaign.
