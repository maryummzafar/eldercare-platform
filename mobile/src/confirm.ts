import { Alert, Platform } from 'react-native';

/**
 * Asks before something that cannot be undone, such as cancelling a booking.
 * Alert does nothing in a browser, so the website uses the browser's own dialog.
 */
export function confirm(title: string, message: string, confirmLabel: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(globalThis.confirm?.(`${title}\n\n${message}`) ?? true);
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Go back', style: 'cancel', onPress: () => resolve(false) },
      { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
