import assert from 'node:assert/strict';
import test from 'node:test';

import { validateReleaseApiUrl } from './check-release-api-url.mjs';

test('accepts a public HTTPS API URL and removes trailing slashes', () => {
  assert.equal(
    validateReleaseApiUrl('https://api.eldercare.in/'),
    'https://api.eldercare.in',
  );
});

test('rejects missing, non-HTTPS, local, and placeholder URLs', () => {
  for (const value of [undefined, '', 'http://api.eldercare.in', 'https://localhost:8081',
    'https://api.yourdomain.com', 'https://api.example.com']) {
    assert.throws(() => validateReleaseApiUrl(value));
  }
});