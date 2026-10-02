import { Body, Heading, Screen, Title } from './ui';
import { PublicFooter } from './PublicFooter';
import { SITE } from '../site';

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

/** Renders a policy as plain sections, at the same large type as the rest of the app. */
export function LegalPage({ title, intro, sections }: {
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <Screen>
      <Title>{title}</Title>
      <Body muted>Last updated {SITE.policyDate}</Body>
      <Body>{intro}</Body>
      {sections.map((section) => (
        <SectionBlock key={section.heading} section={section} />
      ))}
      <PublicFooter />
    </Screen>
  );
}

function SectionBlock({ section }: { section: LegalSection }) {
  return (
    <>
      <Heading>{section.heading}</Heading>
      {section.paragraphs.map((p) => (
        <Body key={p}>{p}</Body>
      ))}
    </>
  );
}
