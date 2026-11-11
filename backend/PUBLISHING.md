# Getting Eldercare published

Written 2026-07-31. Store policies change often — verify anything time-sensitive
against the current Play Console documentation before you rely on it.

## The honest starting point

You cannot publish anything yet. Google Play distributes **Android apps**; what exists
today is a backend API. The store listing needs an installable app, so the mobile client
is the blocking dependency, not the paperwork.

Realistic order:

```
mobile app  →  backend hosted on a real domain  →  Play Console  →  closed test  →  production
```

## 1. Backend hosting and domain

Needed before the app can talk to anything but `localhost`.

- **Domain** — register through any registrar (Namecheap, Cloudflare, Porkbun; ~$10–15/yr).
  You'll want `api.yourdomain.com` for the backend.
- **Hosting** — the app is a plain Spring Boot jar plus Postgres, so most platforms work:
  - Railway / Render — simplest, managed Postgres included, free tier to start.
  - Fly.io — cheap, good if you want more control.
  - AWS Elastic Beanstalk or a small EC2 + RDS — most work, most control.
- **HTTPS is mandatory.** Android blocks cleartext HTTP by default, and you will be
  handling health and address data. Every managed platform above issues certificates free.
- Set `DB_PASSWORD`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` as platform secrets —
  never in the repo.
- Switch `JPA_DDL_AUTO` to `validate` and move the schema to Flyway first. Deploying with
  `update` against production data will eventually drop a column during a rename.

## 2. The mobile app

You picked React Native or Flutter. Either consumes this API as-is. Concretely you need:

- Login / register screens (the API returns the token and role — route on `role`).
- Elder flow: search helpers → view profile → pick date + time → confirm → track status.
- Helper flow: profile setup → incoming requests → accept/reject → start/complete.
- Store the JWT in secure storage (Keychain / Keystore), not `AsyncStorage`.
- Handle **401 by sending the user to login** and 403 as a plain error — the API
  distinguishes these deliberately.

**Design for the actual users.** Elderly users are the paying side, and the usual mobile
defaults fail them: use large type (18sp minimum body), high contrast, generous tap
targets (48dp+), and avoid gesture-only navigation. This is worth more to adoption than
any store-listing detail below.

## 3. Google Play Console

- **Developer account** — $25 one-time. Register as an **organization** rather than an
  individual if you've registered a business; changing later is painful.
- Identity verification (ID, and for organizations a D-U-N-S number) takes days to weeks.
  Start it early — it's the step people underestimate.
- **Closed testing requirement:** new personal developer accounts must run a closed test
  with a minimum number of opted-in testers for a continuous period before applying for
  production access. Google has changed both numbers more than once — check the current
  rule in Play Console. Budget weeks, not days, and recruit testers before you need them.

### Listing assets you'll need

- App icon (512×512), feature graphic (1024×500)
- Phone screenshots (minimum 2; use the elder flow)
- Short description (80 chars) and full description (4000)
- **Privacy policy at a public URL** — mandatory, and it must be live before review.
- **Data safety form** — declare what you collect. Be accurate: you collect name, email,
  phone, **home address**, and health-adjacent info (hospital appointments). Understating
  this is a common rejection reason.

## 4. Things specific to a care marketplace

These matter more for your app than for a typical one, and reviewers do look:

- **Helper vetting.** The `verified` flag is already an admin gate — make sure a real
  background/ID check sits behind it before launch. You are sending strangers into
  elderly people's homes; this is the core trust question of the whole product.
- **Payments.** Google Play Billing applies to digital goods. Booking a person to
  physically accompany you to hospital is a **real-world service**, which is exempt — so
  you can and should use Stripe, Razorpay, or similar, and avoid Play's 15–30% cut. Verify
  against current Play payments policy, but this exemption is long-standing.
- **Insurance and liability.** Talk to a lawyer in your jurisdiction about liability if a
  helper is injured, or an elder is harmed, during a booking. This is not a code problem
  and it is not optional.
- **Worker classification.** Whether student helpers are contractors or employees varies
  by country and affects tax, minimum wage, and your pricing model.
- **Health data.** Appointment details may qualify as health data under GDPR / HIPAA /
  your local equivalent, which raises the bar on storage and consent.
- **Emergency escalation.** Decide what happens when a helper can't reach an elder who
  isn't answering the door. Users will hit this.

## 5. Before you flip to production

- [ ] Flyway migrations, `ddl-auto: validate`
- [ ] Rate limiting on `/api/auth/**` (credential stuffing hits login endpoints fast)
- [ ] Real payment integration + refund path for cancellations
- [ ] Refresh tokens, so people aren't logged out daily
- [ ] Error monitoring (Sentry) and database backups you have actually restored once
- [ ] CORS origins narrowed from `localhost` to your real domains
- [ ] A tested account-deletion path — Play requires it if you offer account creation
