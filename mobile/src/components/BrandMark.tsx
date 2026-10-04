import { Image, StyleSheet, Text, View } from 'react-native';

import { SITE } from '../site';
import { colors, fonts } from '../theme';

/** The app icon and name, as shown at the top of the sign-in screens and the website. */
export function BrandMark({ size = 56, inverse = false }: { size?: number; inverse?: boolean }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={SITE.appName}>
      <Image
        source={require('../../assets/icon.png')}
        style={{ width: size, height: size, borderRadius: size * 0.26 }}
      />
      <Text style={[styles.name, { fontSize: size * 0.45 }, inverse && styles.inverse]}>{SITE.appName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontFamily: fonts.bold, color: colors.text, letterSpacing: -0.4 },
  inverse: { color: colors.onPrimary },
});
