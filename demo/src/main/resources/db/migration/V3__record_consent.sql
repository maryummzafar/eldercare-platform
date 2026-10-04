-- Records when each user agreed to the Privacy Policy and Terms, and to which
-- version, so consent can be shown if it is ever questioned. Null for accounts
-- created before signup asked for it.
ALTER TABLE users ADD COLUMN terms_accepted_at TIMESTAMP(6) WITH TIME ZONE;
ALTER TABLE users ADD COLUMN terms_version VARCHAR(32);
