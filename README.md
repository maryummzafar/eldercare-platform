# Eldercare Platform

A marketplace where elderly people book vetted student helpers by the hour, for hospital
visits, grocery runs, help around the house, and companionship.

The repo has two parts: a **Spring Boot REST API** and a **React Native (Expo) app** that
runs on Android and the web from a single codebase.

## Tech stack

| Layer    | Technologies |
|----------|--------------|
| Backend  | Java 21, Spring Boot 3.5, Spring Security, JWT, Spring Data JPA, PostgreSQL, Flyway |
| Mobile   | React Native, Expo SDK 57, React 19, TypeScript, expo-router |
| Testing  | JUnit, Spring Boot integration tests on in-memory H2 |
| Deploy   | Docker, Render (`render.yaml`), EAS Build for Android |

## Features

- **Three roles.** Elders book help. Helpers offer services. Admins vet helpers.
- **Trust and safety.** Users verify their email with a code, and an admin reviews each
  person's identity on a video call. A helper only appears in search after passing the
  identity check *and* being approved by an admin.
- **Booking lifecycle.** A booking moves through requested → accepted → in progress →
  completed. The API rejects double-booked time slots, both when the elder books and
  again when the helper accepts.
- **Billing.** The helper's rate is fixed on the booking when it's made. The final price
  is based on the actual time worked, rounded up to the next 15 minutes, with a one-hour
  minimum. All money is stored as `BigDecimal`.
- **Chat and notifications.** Each booking has its own chat thread. The app shows in-app
  notifications with an unread badge.
- **Account security.** BCrypt password hashing and rate-limited login. A password reset
  signs out every other device. Login errors don't reveal whether an email is registered.
- **Privacy.** The app records each user's consent and the version of the terms they
  agreed to. Users can delete their account, which erases their personal details while
  keeping the other person's booking history intact.
- **Accessibility-first UI.** Built for elderly users: body text of at least 18sp, tap
  targets of at least 48dp, text contrast of at least 4.5:1, and no gesture-only
  navigation.

## Repository layout

```
demo/      Spring Boot API: setup, full endpoint reference, design notes
mobile/    Expo app (Android and web): setup, screens, design constraints
render.yaml  Render configuration for the API, database and website
```

## Running locally

**Backend** (needs PostgreSQL):

```sh
cd demo
cp .env.example .env        # fill in DB_PASSWORD and JWT_SECRET
./mvnw spring-boot:run      # http://localhost:8081
./mvnw test                 # needs no database
```

**Mobile app:**

```sh
cd mobile
npm install
npm start                   # scan the QR code with Expo Go
```

For details, see [demo/README.md](demo/README.md) and [mobile/README.md](mobile/README.md).

## Not built yet

- Payment processing. The API calculates the total, but nothing charges the elder.
- Push notifications. The app checks the server for new notifications at regular
  intervals instead.
- Ratings and reviews.
