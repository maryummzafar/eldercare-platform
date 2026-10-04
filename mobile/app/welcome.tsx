import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ALL_SERVICES, SERVICE_LABELS } from '../src/api/types';
import { BrandMark } from '../src/components/BrandMark';
import { PublicFooter } from '../src/components/PublicFooter';
import { Avatar, Badge, Button, Icon } from '../src/components/ui';
import type { IconName } from '../src/components/ui';
import { SERVICE_ICONS } from '../src/presentation';
import { SITE } from '../src/site';
import { colors, fonts, radius, shadow, spacing, type } from '../src/theme';

const PAGE_MAX = 1120;

const STEPS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'search-outline',
    title: 'Find a helper',
    body: 'Search by city and the kind of help you need. Every helper is ID-checked by our team.',
  },
  {
    icon: 'calendar-outline',
    title: 'Book a time',
    body: 'Pick a day and time. You see the hourly rate and an estimated total before you confirm.',
  },
  {
    icon: 'happy-outline',
    title: 'Get help',
    body: 'Message your helper in the app, and pay only for the time they actually spend with you.',
  },
];

const PROMISES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'shield-checkmark-outline', title: 'ID-checked helpers', body: 'Nobody can be booked until we have verified who they are.' },
  { icon: 'cash-outline', title: 'Clear pricing', body: 'One hourly rate, shown up front. No booking fees, no surprises.' },
  { icon: 'chatbubbles-outline', title: 'Stay in touch', body: 'Chat with your helper before and during every visit.' },
  { icon: 'lock-closed-outline', title: 'Private by design', body: 'Your address is shared only with the helper you book.' },
];

/** The website's front page, for visitors who are not signed in. */
export default function Welcome() {
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  return (
    <SafeAreaView style={styles.page} edges={['top', 'left', 'right']}>
      <ScrollView>
        {/* Top bar */}
        <Band>
          <View style={styles.nav}>
            <BrandMark size={40} />
            <View style={styles.navActions}>
              {wide && (
                <Pressable accessibilityRole="link" onPress={() => router.push('/register?role=HELPER')} style={styles.navLink}>
                  <Text style={styles.navLinkText}>Become a helper</Text>
                </Pressable>
              )}
              <Button label="Sign in" variant="outline" compact onPress={() => router.push('/login')} />
            </View>
          </View>
        </Band>

        {/* Hero */}
        <View style={styles.heroBg}>
          <Band>
            <View style={[styles.hero, wide && styles.heroWide]}>
              <View style={[styles.heroCopy, wide && styles.half]}>
                <Badge label="Verified student helpers" tone="warning" icon="shield-checkmark" />
                <Text accessibilityRole="header" style={[styles.heroTitle, wide && styles.heroTitleWide]}>
                  Trusted help for your parents, by the hour.
                </Text>
                <Text style={styles.heroBody}>
                  Book a verified student helper for hospital visits, groceries, help around the house or simply some
                  company — in a few taps.
                </Text>
                <View style={[styles.heroCtas, wide && styles.row]}>
                  <Button label="Find a helper" variant="onBrand" icon="arrow-forward" onPress={() => router.push('/register')} />
                  <Button label="Become a helper" variant="outlineOnBrand" onPress={() => router.push('/register?role=HELPER')} />
                </View>
                <View style={styles.heroTrust}>
                  <TrustItem icon="shield-checkmark" text="ID-verified helpers" />
                  <TrustItem icon="cash" text="Pay by the hour" />
                </View>
              </View>
              <View style={[styles.preview, wide && styles.half]}>
                <AppPreview />
              </View>
            </View>
          </Band>
        </View>

        {/* Services */}
        <Band>
          <Section eyebrow="What we help with" title="Everyday help, from people who care">
            <View style={styles.grid}>
              {ALL_SERVICES.map((s) => (
                <View key={s} style={[styles.serviceTile, { flexBasis: wide ? '31%' : '46%' }]}>
                  <View style={styles.tileIcon}>
                    <Icon name={SERVICE_ICONS[s]} size={26} color={colors.primary} />
                  </View>
                  <Text style={styles.tileTitle}>{SERVICE_LABELS[s]}</Text>
                </View>
              ))}
            </View>
          </Section>
        </Band>

        {/* How it works */}
        <View style={styles.altBg}>
          <Band>
            <Section eyebrow="How it works" title="Help in three simple steps">
              <View style={[styles.steps, wide && styles.row]}>
                {STEPS.map((step, i) => (
                  <View key={step.title} style={[styles.step, wide && styles.third]}>
                    <View style={styles.stepTop}>
                      <View style={styles.stepIcon}>
                        <Icon name={step.icon} size={26} color={colors.onPrimary} />
                      </View>
                      <Text style={styles.stepNumber}>0{i + 1}</Text>
                    </View>
                    <Text style={styles.cardTitle}>{step.title}</Text>
                    <Text style={styles.cardBody}>{step.body}</Text>
                  </View>
                ))}
              </View>
            </Section>
          </Band>
        </View>

        {/* Trust */}
        <Band>
          <Section eyebrow="Safety first" title="Built for peace of mind">
            <View style={styles.grid}>
              {PROMISES.map((p) => (
                <View key={p.title} style={[styles.promise, { flexBasis: wide ? '23%' : '100%' }]}>
                  <Icon name={p.icon} size={28} color={colors.primary} />
                  <Text style={styles.cardTitle}>{p.title}</Text>
                  <Text style={styles.cardBody}>{p.body}</Text>
                </View>
              ))}
            </View>
          </Section>
        </Band>

        {/* For helpers */}
        <Band>
          <View style={[styles.helperBand, wide && styles.helperBandWide]}>
            <View style={styles.fill}>
              <Text style={styles.helperTitle}>Are you a student who likes helping people?</Text>
              <Text style={styles.helperBody}>
                Set your own hourly rate, choose the work you offer, and fit visits around your classes.
              </Text>
            </View>
            <Button label="Become a helper" variant="outline" icon="arrow-forward" compact onPress={() => router.push('/register?role=HELPER')} />
          </View>
        </Band>

        <Band>
          <View style={styles.disclaimer}>
            <Icon name="information-circle-outline" size={20} color={colors.textMuted} />
            <Text style={styles.disclaimerText}>
              {SITE.appName} is not an emergency or medical service. In an emergency, call 112.
            </Text>
          </View>
          <PublicFooter />
        </Band>
      </ScrollView>
    </SafeAreaView>
  );
}

/** A full-width row whose content is held to the page width. */
function Band({ children }: { children: ReactNode }) {
  return <View style={styles.band}>{children}</View>;
}

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function TrustItem({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.trustItem}>
      <Icon name={icon} size={18} color={colors.accent} />
      <Text style={styles.trustText}>{text}</Text>
    </View>
  );
}

/** A still of the product itself: what a family sees when they search and book. */
function AppPreview() {
  return (
    <View style={styles.previewStack} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.previewCard}>
        <View style={styles.previewRow}>
          <Avatar name="Priya Sharma" size={52} />
          <View style={styles.fill}>
            <Text style={styles.previewName}>Priya Sharma</Text>
            <Badge label="Verified" tone="success" icon="shield-checkmark" />
          </View>
          <View style={styles.previewPrice}>
            <Text style={styles.previewPriceValue}>₹250</Text>
            <Text style={styles.previewPriceUnit}>per hour</Text>
          </View>
        </View>
        <Text style={styles.cardBody}>Nursing student. Patient, punctual and used to hospital visits.</Text>
        <View style={styles.previewChips}>
          {(['HOSPITAL_VISIT', 'COMPANIONSHIP'] as const).map((s) => (
            <View key={s} style={styles.previewChip}>
              <Icon name={SERVICE_ICONS[s]} size={14} color={colors.primary} />
              <Text style={styles.previewChipText}>{SERVICE_LABELS[s]}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={[styles.previewCard, styles.previewToast]}>
        <View style={styles.toastIcon}>
          <Icon name="checkmark" size={22} color={colors.onPrimary} />
        </View>
        <View style={styles.fill}>
          <Text style={styles.previewName}>Booking confirmed</Text>
          <Text style={styles.cardBody}>Hospital visit · Tomorrow, 10 am</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.card },
  fill: { flex: 1, gap: 4 },
  row: { flexDirection: 'row' },
  half: { flex: 1 },
  third: { flex: 1 },
  band: { width: '100%', maxWidth: PAGE_MAX, alignSelf: 'center', paddingHorizontal: spacing.md + 4 },

  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.md },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  navLink: { minHeight: 48, justifyContent: 'center' },
  navLinkText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },

  heroBg: { backgroundColor: colors.primary },
  hero: { paddingVertical: spacing.xl + spacing.md, gap: spacing.xl },
  heroWide: { flexDirection: 'row', alignItems: 'center', paddingVertical: 72 },
  heroCopy: { gap: spacing.md + 4 },
  heroTitle: { fontFamily: fonts.bold, fontSize: 36, lineHeight: 44, letterSpacing: -1, color: colors.onPrimary },
  heroTitleWide: { fontSize: 52, lineHeight: 60 },
  heroBody: { fontFamily: fonts.regular, fontSize: 19, lineHeight: 29, color: '#DCEAF7' },
  heroCtas: { gap: spacing.sm + 4 },
  heroTrust: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trustText: { fontFamily: fonts.medium, fontSize: 16, color: colors.onPrimary },

  preview: { alignItems: 'center' },
  previewStack: { width: '100%', maxWidth: 420, gap: spacing.md },
  previewCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm + 4,
    boxShadow: '0 20px 40px rgba(4, 30, 60, 0.25)',
  },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  previewName: { ...type.bodyStrong, color: colors.text },
  previewPrice: { alignItems: 'flex-end' },
  previewPriceValue: { fontFamily: fonts.bold, fontSize: 22, color: colors.text },
  previewPriceUnit: { ...type.small, color: colors.textMuted },
  previewChips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  previewChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
  },
  previewChipText: { ...type.small, color: colors.primary },
  previewToast: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginLeft: spacing.xl, paddingVertical: spacing.md },
  toastIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },

  section: { paddingVertical: spacing.xl + spacing.md, gap: spacing.md },
  eyebrow: { fontFamily: fonts.semibold, fontSize: 15, letterSpacing: 1, textTransform: 'uppercase', color: colors.primary },
  sectionTitle: { ...type.title, fontSize: 30, lineHeight: 38, color: colors.text, marginBottom: spacing.sm },
  altBg: { backgroundColor: colors.background },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  serviceTile: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTitle: { ...type.bodyStrong, color: colors.text, flexShrink: 1 },

  steps: { gap: spacing.md },
  step: { backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, ...shadow.card },
  stepTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  stepIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: { fontFamily: fonts.bold, fontSize: 28, color: colors.border },
  cardTitle: { ...type.heading, color: colors.text },
  cardBody: { ...type.caption, color: colors.textMuted },

  promise: { flexGrow: 1, gap: spacing.sm, paddingVertical: spacing.sm },

  helperBand: {
    backgroundColor: colors.text,
    borderRadius: radius.lg,
    padding: spacing.lg + 4,
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  helperBandWide: { flexDirection: 'row', alignItems: 'center', padding: spacing.xl + 8 },
  helperTitle: { ...type.title, color: colors.onPrimary },
  helperBody: { ...type.body, color: '#C9D1DB' },

  disclaimer: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', paddingTop: spacing.lg },
  disclaimerText: { ...type.caption, color: colors.textMuted, flex: 1 },
});
