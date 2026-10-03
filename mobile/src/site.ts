/**
 * Business details shown on the public pages (privacy policy, terms, account
 * deletion) and in the app. Google Play checks that these match the store listing,
 * so change them here once and every page follows.
 */
export const SITE = {
  appName: 'Eldercare',
  /** The person or registered business responsible for the app and its data. */
  operator: 'Maryum',
  supportEmail: 'zafarmaryum43@gmail.com',
  /** Courts and law that govern the terms. */
  jurisdiction: 'India',
  /** Shown as the "last updated" date on the legal pages. */
  policyDate: '3 October 2026',
} as const;
