/**
 * Business details shown on the public pages (privacy policy, terms, account
 * deletion) and in the app. Google Play checks that these match the store listing,
 * so change them here once and every page follows.
 */
export const SITE = {
  appName: 'Eldercare',
  /** The person or registered business responsible for the app and its data. */
  operator: 'Maryum',
  supportEmail: 'support@example.com',
  /**
   * The named person who handles privacy complaints, as Indian rules for online
   * platforms expect. Can be the founder at first.
   */
  grievanceOfficer: 'Maryum',
  /** Courts and law that govern the terms. */
  jurisdiction: 'India',
  /**
   * Shown as the "last updated" date on the legal pages. When the policy or terms
   * change, update this AND app.legal.terms-version on the server together, so each
   * user's recorded consent names the version they actually saw.
   */
  policyDate: '5 October 2026',
} as const;
