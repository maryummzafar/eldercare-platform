/**
 * Business details shown on the public pages (privacy policy, terms, account
 * deletion) and in the app. Google Play checks that these match the store listing,
 * so change them here once and every page follows.
 *
 * TODO before launch: replace every placeholder below with the real values.
 */
export const SITE = {
  appName: 'Eldercare',
  /** The person or registered business responsible for the app and its data. */
  operator: 'Eldercare (operator name to be confirmed)',
  supportEmail: 'support@yourdomain.com',
  /** Courts and law that govern the terms. */
  jurisdiction: 'India',
  /** Shown as the "last updated" date on the legal pages. */
  policyDate: '3 October 2026',
} as const;
