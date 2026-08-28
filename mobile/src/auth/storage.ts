import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Token storage, per platform.
 *
 * expo-secure-store is iOS/Android only — it has no web implementation, and
 * calling it in a browser throws. The web target exists purely so the app can be
 * previewed on a laptop during development, so it falls back to localStorage.
 *
 * That fallback is NOT equivalent security: localStorage is plain text and
 * readable by any script running on the origin, whereas the native path puts the
 * JWT in the Keychain / Keystore. The shipped builds are native and never take
 * this branch — do not treat the web preview as a deployable target.
 */

const isWeb = Platform.OS === 'web';

export async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      // Private browsing modes can throw on access rather than return null.
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // Preview-only path; failing to persist just means signing in again.
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // Nothing to recover from — the session is being discarded anyway.
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
