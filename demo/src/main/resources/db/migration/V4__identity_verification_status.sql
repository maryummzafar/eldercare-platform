ALTER TABLE users
    ADD COLUMN identity_verification_status VARCHAR(24) NOT NULL DEFAULT 'NOT_STARTED';