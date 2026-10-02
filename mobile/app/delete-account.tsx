import { LegalPage } from '../src/components/LegalPage';
import { SITE } from '../src/site';

/**
 * The public "delete your account" URL Google Play asks for in the Data safety form.
 * It must be reachable without signing in and name the app and its developer.
 */
export default function DeleteAccountInfo() {
  return (
    <LegalPage
      title={`Delete your ${SITE.appName} account`}
      intro={`You can delete your ${SITE.appName} account, published by ${SITE.operator}, at any time.`}
      sections={[
        {
          heading: 'In the app or on the website',
          paragraphs: [
            '1. Sign in.',
            '2. Tap My account on the home screen.',
            '3. Tap Delete my account, enter your password and confirm.',
            'Your account is deleted immediately.',
          ],
        },
        {
          heading: 'If you cannot sign in',
          paragraphs: [
            `Email ${SITE.supportEmail} from the address you signed up with, asking us to delete your account. We will confirm it is you and delete it within 7 days.`,
          ],
        },
        {
          heading: 'What is deleted',
          paragraphs: [
            'Straight away: your name, email address, phone number, home address, password, the text of every message you sent, your notifications and, for helpers, your profile. Any upcoming bookings are cancelled and the other person is told.',
          ],
        },
        {
          heading: 'What is kept',
          paragraphs: [
            'Records of past bookings — the date, type of help and amount — are kept without your name or contact details, so the other person keeps their history of visits and we can meet legal and tax obligations. Backups containing deleted data are overwritten within 30 days.',
          ],
        },
      ]}
    />
  );
}
