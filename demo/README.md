# Eldercare Platform — Backend

REST API for a marketplace where elderly users book vetted student helpers by the hour
for hospital trips, groceries, house help and companionship.

Spring Boot 3.5 · Java 21 · PostgreSQL · JWT auth

## Running locally

1. **Create the database**

   ```sh
   createdb eldercare
   ```

2. **Set the environment.** Copy `.env.example` to `.env` and fill it in — it is loaded
   automatically at startup, so nothing needs exporting by hand:

   ```sh
   cp .env.example .env
   openssl rand -base64 48          # paste into JWT_SECRET
   ```

   `JWT_SECRET` and `DB_PASSWORD` have no defaults on purpose — the app refuses to start
   without them rather than running on a guessable key.

   Real environment variables take precedence over `.env`, so hosting platforms set these
   as secrets and never ship the file. `.env` is gitignored; keep it that way.

3. **Run**

   ```sh
   ./mvnw spring-boot:run
   ```

   Listens on `http://localhost:8081`. Health check at `/actuator/health`.

4. **Test** — uses an in-memory H2, needs no environment at all:

   ```sh
   ./mvnw test
   ```

## Database schema

Flyway owns the schema. Migrations live in `src/main/resources/db/migration` and run
automatically at startup; Hibernate is set to `validate`, so it checks the entities still
match what is there and refuses to start if they have drifted — it never alters anything
itself.

**To change the schema**, add a new numbered file (`V2__add_payments.sql`) alongside the
entity change in the same commit. Never edit a migration that has already run: Flyway
records a checksum for each and will refuse to start if one changes underneath it.

A database that predates Flyway is stamped as already being at V1 rather than having V1
run against it, so switching an existing environment over is safe. A brand-new database
gets the full V1.

Tests do not run the migrations — H2 builds the schema from the entities instead, since
the migrations are PostgreSQL-specific. Verify migration changes against a real
PostgreSQL before deploying.

## Roles

| Role     | Who                                                              |
|----------|------------------------------------------------------------------|
| `ELDER`  | Books and pays for help.                                          |
| `HELPER` | Student providing the service. Invisible until an admin verifies. |
| `ADMIN`  | Vets helpers. Cannot be created via signup — seeded via env vars. |

## API

All endpoints except `/api/auth/**` require `Authorization: Bearer <token>`.

### Auth

| Method | Path                 | Body                                        | Returns                      |
|--------|----------------------|---------------------------------------------|------------------------------|
| POST   | `/api/auth/register` | name, email, password, role, phone?, address? | 201 + token & profile      |
| POST   | `/api/auth/login`    | email, password                             | 200 + token & profile        |

`role` must be `ELDER` or `HELPER`. Passwords are 8–72 characters, BCrypt-hashed.

### Helpers

| Method | Path                       | Who    | Notes                                        |
|--------|----------------------------|--------|----------------------------------------------|
| GET    | `/api/helpers`             | any    | Search. Filters: `city`, `maxRate`, `service`, plus `page`/`size`. Verified + available only. |
| GET    | `/api/helpers/{userId}`    | any    | One verified helper's public profile.        |
| GET    | `/api/helpers/me`          | helper | The caller's own profile.                    |
| PUT    | `/api/helpers/me`          | helper | Create or update: bio, hourlyRate, city, offeredServices, acceptingBookings. |

A helper is not searchable until **both** `verified` (admin-granted) and
`acceptingBookings` (helper's own toggle) are true.

### Bookings

| Method | Path                          | Who         | Effect                              |
|--------|-------------------------------|-------------|-------------------------------------|
| POST   | `/api/bookings`               | elder       | Creates a `REQUESTED` booking.      |
| GET    | `/api/bookings`               | participant | The caller's bookings, paged.       |
| GET    | `/api/bookings/{id}`          | participant | One booking.                        |
| POST   | `/api/bookings/{id}/accept`   | helper      | `REQUESTED` → `ACCEPTED`            |
| POST   | `/api/bookings/{id}/reject`   | helper      | `REQUESTED` → `REJECTED`            |
| POST   | `/api/bookings/{id}/start`    | helper      | `ACCEPTED` → `IN_PROGRESS`, starts the clock |
| POST   | `/api/bookings/{id}/complete` | helper      | `IN_PROGRESS` → `COMPLETED`, sets `finalTotal` |
| POST   | `/api/bookings/{id}/cancel`   | either      | Cancels while `REQUESTED` or `ACCEPTED` |

### Messages

Chat is scoped to a booking rather than to a pair of users: the booking *is* the
thread. That makes "may these two people talk?" the same question as "are they both
on this booking?", so there is no separate contacts or blocking model, and an elder
cannot message a helper they have never booked.

| Method | Path                                  | Who         | Notes                                   |
|--------|---------------------------------------|-------------|-----------------------------------------|
| GET    | `/api/bookings/{id}/messages`         | participant | Whole thread, oldest first.             |
| POST   | `/api/bookings/{id}/messages`         | participant | Sends one message (max 2000 chars).     |
| POST   | `/api/bookings/{id}/messages/read`    | participant | Marks the other side's messages read.   |

Threads on `REJECTED` or `CANCELLED` bookings are read-only — the history stays
visible, but nobody can keep messaging through a booking the other side declined.

### Notifications

In-app only; there is no device push yet. The client polls. Every notification in the
system is written through `NotificationService.notify`, which is the single place a
push sender would be added.

| Method | Path                              | Effect                                    |
|--------|-----------------------------------|-------------------------------------------|
| GET    | `/api/notifications`              | The caller's notifications, newest first. |
| GET    | `/api/notifications/unread-count` | Just the count — polled by the badge.     |
| POST   | `/api/notifications/{id}/read`    | Marks one read.                           |
| POST   | `/api/notifications/read-all`     | Marks all read.                           |

Written automatically on every booking transition (to whichever party did not cause
it) and on every incoming chat message.

### Account

| Method | Path                  | Body     | Effect                                         |
|--------|-----------------------|----------|------------------------------------------------|
| POST   | `/api/account/delete` | password | 204. Permanently deletes the caller's account. |

Required by Google Play. The user row is anonymised rather than removed, because
bookings involve two people: name, email, phone, address, password and message text
are erased, notifications and the helper profile are deleted, open bookings are
cancelled (the other side is notified), and past bookings stay without the departed
user's details. Refused with 409 while a visit is in progress, and for admins.

### Admin

| Method | Path                                            | Effect                          |
|--------|-------------------------------------------------|---------------------------------|
| GET    | `/api/admin/helpers?verified=false`             | The vetting queue, oldest first, with contact details. `verified=true` lists approved helpers. |
| POST   | `/api/admin/helpers/{userId}/verification?verified=true` | Vets a helper (`false` revokes). |

## Limits and errors

- `/api/auth/**` allows `AUTH_RATE_LIMIT_PER_MINUTE` (default 10) attempts per client
  address per minute, then answers 429 with `Retry-After`.
- Every error, including bad JSON and unexpected failures, comes back in the same JSON
  shape with its real status. 401 means only "not signed in / token expired", which the
  app relies on to decide when to log the user out.

## Deploying

`Dockerfile` builds a production image that listens on `$PORT`. `../render.yaml`
describes the API, its database and the website for Render; any container host works
with the same environment variables. In production also set `CORS_ALLOWED_ORIGINS` to
the website's address and `JPA_SHOW_SQL=false`.

## Billing rules

- The helper's `hourlyRate` is **copied onto the booking** when it's created. Later rate
  changes never alter an already-agreed booking.
- `estimatedTotal` = rate × scheduled hours, shown to the elder up front.
- `finalTotal` = rate × actual elapsed time, computed on completion.
- Elapsed time rounds **up to the next 15 minutes**, with a **one-hour minimum**.
- All money is `BigDecimal` with scale 2 — never `double`.

## Design notes

- **Stateless JWT.** No sessions; the token carries identity, `AuthenticatedUser` carries
  the entity so controllers don't re-query.
- **404 over 403 on other people's bookings.** Asking for a booking that isn't yours
  returns 404, so the API never confirms which booking IDs exist.
- **Login errors are vague.** "Invalid email or password" regardless of which was wrong,
  so the endpoint can't be used to enumerate registered emails.
- **Overlaps are rejected twice** — when the elder books, and again when the helper
  accepts, since a competing request may have been accepted in between.

## Known gaps

- No payment integration yet — `finalTotal` is computed and the elder pays the helper
  directly.
- No ratings endpoint; `averageRating` exists on the profile but nothing writes it.
- No refresh tokens: a 24-hour token expires and the user logs in again.
- The auth rate limit is held in memory, so it is per instance. Move it to a shared
  store before running more than one.
