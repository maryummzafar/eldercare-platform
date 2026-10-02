import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SITE } from '../site';
import { TOUCH_TARGET, colors, spacing, type } from '../theme';

const LINKS = [
  { label: 'Privacy policy', href: '/privacy' },
  { label: 'Terms of service', href: '/terms' },
  { label: 'Delete your account', href: '/delete-account' },
] as const;

/** Links to the legal pages, shown at the foot of every public page. */
export function PublicFooter() {
  return (
    <View style={styles.footer}>
      <View style={styles.links}>
        {LINKS.map((link) => (
          <Pressable
            key={link.href}
            accessibilityRole="link"
            onPress={() => router.push(link.href)}
            style={styles.link}>
            <Text style={styles.linkText}>{link.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.small}>
        © 2026 {SITE.operator} · {SITE.supportEmail}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  links: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.lg },
  link: { minHeight: TOUCH_TARGET, justifyContent: 'center' },
  linkText: { ...type.body, color: colors.primary, textDecorationLine: 'underline' },
  small: { ...type.caption, color: colors.textMuted },
});
