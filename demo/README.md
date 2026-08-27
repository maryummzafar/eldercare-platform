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

### Admin

| Method | Path                                            | Effect                          |
|--------|-------------------------------------------------|---------------------------------|
| POST   | `/api/admin/helpers/{userId}/verification?verified=true` | Vets a helper. |

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

## Known gaps before launch

- `ddl-auto: update` must become `validate` with Flyway migrations. An entity rename
  under `update` silently drops a column.
- No payment integration yet — `finalTotal` is computed but nothing charges a card.
- No ratings endpoint; `averageRating` exists on the profile but nothing writes it.
- No refresh tokens: a 24-hour token expires and the user logs in again.
- No rate limiting on `/api/auth/**`.
