import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ALL_SERVICES, SERVICE_LABELS } from '../src/api/types';
import { PublicFooter } from '../src/components/PublicFooter';
import { Body, Button, Card, Heading, Screen, Title } from '../src/components/ui';
import { SITE } from '../src/site';
import { colors, spacing, type } from '../src/theme';

const STEPS = [
  {
    title: 'Find a helper',
    body: 'Search by city and the kind of help you need. Every helper is a student we have checked and approved.',
  },
  {
    title: 'Book a time',
    body: 'Pick a date and time. You see the hourly rate and an estimated total before you confirm.',
  },
  {
    title: 'Get help',
    body: 'Message your helper through the app, and pay only for the time they actually spend with you.',
  },
];

/** The website's front page, for visitors who are not signed in. */
export default function Welcome() {
  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.brand}>{SITE.appName}</Text>
        <Title>Trusted help for older adults, by the hour</Title>
        <Body>
          Book a verified student helper for hospital visits, grocery shopping, help around the
          house, or simply some company.
        </Body>
        <Button label="Create an account" onPress={() => router.push('/(auth)/register')} />
        <Button
          label="Sign in"
          variant="secondary"
          onPress={() => router.push('/(auth)/login')}
        />
      </View>

      <Heading>How it works</Heading>
      {STEPS.map((step, i) => (
        <Card key={step.title}>
          <Text style={styles.stepTitle}>
            {i + 1}. {step.title}
          </Text>
          <Body>{step.body}</Body>
        </Card>
      ))}

      <Heading>What helpers can do</Heading>
      <View style={styles.services}>
        {ALL_SERVICES.map((s) => (
          <View key={s} style={styles.service}>
            <Text style={styles.serviceText}>{SERVICE_LABELS[s]}</Text>
          </View>
        ))}
      </View>

      <Heading>Want to help?</Heading>
      <Body>
        Students can sign up as helpers, set their own hourly rate and choose the work they
        offer. We check your ID before you can be booked.
      </Body>
      <Button
        label="Become a helper"
        variant="secondary"
        onPress={() => router.push('/(auth)/register')}
      />

      <Body muted>
        {SITE.appName} is not an emergency or medical service. In an emergency, call 112.
      </Body>

      <PublicFooter />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  brand: { ...type.bodyStrong, color: colors.primary, letterSpacing: 1 },
  stepTitle: { ...type.bodyStrong, color: colors.text },
  services: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  service: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
  },
  serviceText: { ...type.body, color: colors.text },
});
