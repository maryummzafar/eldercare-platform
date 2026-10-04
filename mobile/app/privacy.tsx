import { LegalPage } from '../src/components/LegalPage';
import { SITE } from '../src/site';

/**
 * Must stay accurate to what the backend actually stores: Google Play compares it
 * with the Data safety form, and a mismatch is a common rejection reason. Update it
 * in the same change as any new field that holds personal data.
 */
export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy policy"
      intro={`${SITE.appName} connects older adults with verified student helpers. This policy explains what personal information ${SITE.operator} ("we") collects through the ${SITE.appName} app and website, why, who can see it, and how you can delete it.`}
      sections={[
        {
          heading: 'What we collect',
          paragraphs: [
            'Account details: your name, email address, password (stored only in scrambled, one-way hashed form), and whether you joined to get help or to give it. You can also give a phone number and a home address.',
            'Helper profiles: a helper’s description of themselves, city, hourly rate and the kinds of help they offer.',
            'Bookings: who booked whom, for what kind of help, the date and time, the address where help is needed, any notes you add, and the amount charged. Notes can include health-related details, such as a hospital appointment, if you choose to write them.',
            'Messages you send through the app, and the notifications we create for you.',
            'Technical data: our servers record your device’s internet (IP) address when you sign in, to block repeated password guessing, and keep short-lived error logs to fix problems.',
          ],
        },
        {
          heading: 'How we use it',
          paragraphs: [
            'Only to run the service: to sign you in, show helpers to people looking for help, arrange and bill bookings, deliver messages and notifications, verify helpers, keep the service secure, and answer you when you contact us.',
            'We do not sell your information, do not use it for advertising, and do not share it with advertisers.',
          ],
        },
        {
          heading: 'Who can see it',
          paragraphs: [
            'Anyone signed in can see a verified helper’s name, description, city, rate, services and number of completed visits. Helpers’ email addresses, phone numbers and home addresses are never shown publicly.',
            'When you make or accept a booking, the other person sees your name, the booking details and the service address, and can message you. They cannot see your other bookings.',
            'Our administrators can see helpers’ contact details in order to check their identity before approving them.',
            'We use hosting and database providers to run the service. They store the data on our behalf and may not use it for anything else. We may disclose information if the law requires it, or to protect someone’s safety.',
          ],
        },
        {
          heading: 'Payments',
          paragraphs: [
            'At present you pay your helper directly. We show the amount due but do not collect card or bank details. If we add in-app payments, a payment provider will handle those details and we will update this policy first.',
          ],
        },
        {
          heading: 'How long we keep it',
          paragraphs: [
            'We keep your information while your account is open. When you delete your account, we erase your name, email, phone number, address, password and the text of your messages straight away, and remove your notifications and helper profile.',
            'Records of bookings that took place are kept without your details, so that the other person keeps their history of visits and we can deal with disputes and meet legal and tax obligations. Copies held in our database backups are removed as those backups are routinely replaced, and are never used to restore a deleted account.',
          ],
        },
        {
          heading: 'Your consent',
          paragraphs: [
            'When you create an account, you agree to this policy by ticking a box, and we record when you did and which version you agreed to. We use your information only for the purposes described here.',
            'You can withdraw your consent at any time by deleting your account. That stops all further use of your information, as described above.',
          ],
        },
        {
          heading: 'Your choices and rights',
          paragraphs: [
            `Helpers can change their profile in the app at any time. To correct your name, phone number or address, email ${SITE.supportEmail} and we will update it.`,
            'You can delete your account at any time from My account → Delete my account. If you cannot sign in, email us and we will delete it for you.',
            `You can ask us for a summary of the information we hold about you and who it has been shared with, ask us to correct or erase it, or nominate someone to exercise these rights for you if you die or become unable to. Email ${SITE.supportEmail}.`,
          ],
        },
        {
          heading: 'Grievance Officer',
          paragraphs: [
            `If you have a complaint about how we handle your information, or about anything on ${SITE.appName}, contact our Grievance Officer: ${SITE.grievanceOfficer}, ${SITE.supportEmail}. We acknowledge complaints within 24 hours and aim to resolve them within 15 days.`,
            "If you are not satisfied with our answer, you may complain to the Data Protection Board of India.",
          ],
        },
        {
          heading: 'Security',
          paragraphs: [
            'Information travels between your device and our servers encrypted (HTTPS). Passwords are hashed, sign-in tokens are kept in your phone’s secure storage, and access to the database is restricted. No system is perfectly secure, but we will tell you without delay if a breach affects your information.',
          ],
        },
        {
          heading: 'Age',
          paragraphs: [
            `${SITE.appName} is for adults. You must be 18 or older to create an account, as an older adult or as a helper.`,
          ],
        },
        {
          heading: 'Changes and contact',
          paragraphs: [
            'If we change this policy, we will update the date above and, for important changes, tell you in the app first.',
            `Contact: ${SITE.operator}, ${SITE.supportEmail}.`,
          ],
        },
      ]}
    />
  );
}
