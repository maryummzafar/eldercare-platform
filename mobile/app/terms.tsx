import { LegalPage } from '../src/components/LegalPage';
import { SITE } from '../src/site';

export default function TermsOfService() {
  return (
    <LegalPage
      title="Terms of service"
      intro={`These terms are an agreement between you and ${SITE.operator} ("we") for using the ${SITE.appName} app and website. By creating an account you accept them.`}
      sections={[
        {
          heading: 'What we do',
          paragraphs: [
            `${SITE.appName} is a platform that lets older adults find and book student helpers for everyday tasks: hospital visits, grocery shopping, help around the house, medication pickup, transport and companionship. Helpers are independent. They are not our employees, and we do not provide the help ourselves.`,
            `${SITE.appName} is not an emergency, medical or nursing service. Helpers do not give medical care. In an emergency, call 112.`,
          ],
        },
        {
          heading: 'Accounts',
          paragraphs: [
            'You must be 18 or older and give true details. Keep your password private; you are responsible for what is done with your account.',
            'Helpers appear in search only after we have checked their identity. That check lowers risk but cannot remove it, and we do not guarantee any helper’s conduct.',
          ],
        },
        {
          heading: 'Bookings and payment',
          paragraphs: [
            'Booking a helper is a request; it becomes a booking when they accept. The rate is fixed when you book, even if the helper changes it later.',
            'The amount due is the helper’s hourly rate multiplied by the time actually spent, rounded up to the next 15 minutes, with a minimum of one hour. For now you pay the helper directly when the visit ends.',
            'Either side may cancel a booking before the visit starts. Please cancel as early as you can.',
          ],
        },
        {
          heading: 'Behaviour',
          paragraphs: [
            'Treat each other with respect. Do not harass, threaten, discriminate, ask for or offer anything unlawful, or use the service to contact someone for anything other than a booking.',
            'Helpers must not accept money beyond the amount shown, borrow or handle money or valuables except as part of an agreed errand, or share anything they learn about the people they help.',
            'We may suspend or close accounts that break these terms or put anyone at risk.',
          ],
        },
        {
          heading: 'Our responsibility',
          paragraphs: [
            'We work to keep the service running and to vet helpers carefully, but we provide the platform “as is”. To the extent the law allows, we are not responsible for what helpers or users do, or for indirect loss. Nothing in these terms limits rights you have by law that cannot be limited.',
          ],
        },
        {
          heading: 'Ending your account',
          paragraphs: [
            'You can delete your account at any time from My account in the app. Upcoming bookings are cancelled when you do.',
          ],
        },
        {
          heading: 'Changes, law and contact',
          paragraphs: [
            'We may update these terms, and will tell you in the app before important changes take effect.',
            `These terms are governed by the laws of ${SITE.jurisdiction}. Questions or complaints: ${SITE.supportEmail}.`,
          ],
        },
      ]}
    />
  );
}
