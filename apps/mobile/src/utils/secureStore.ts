/**
 * Secure token storage — backed by iOS Keychain / Android Keystore via expo-secure-store.
 * Falls back to AsyncStorage for Expo Go (which does not support native Keychain plugins
 * without a dev-client build). The fallback is safe for development; the native path
 * is used in any Expo dev-client / EAS production build.
 */
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';

/**
 * True when SecureStore is available (requires native build, not Expo Go sandbox).
 * Memoized so save/load/delete always agree within a session — otherwise a slow
 * cold-start check could make load() disagree with save() and drop a valid token.
 */
let _availability: Promise<boolean> | null = null;
function isSecureStoreAvailable(): Promise<boolean> {
  if (!_availability) {
    _availability = SecureStore.isAvailableAsync().catch(() => false);
  }
  return _availability;
}

export async function saveToken(token: string): Promise<void> {
  try {
    if (await isSecureStoreAvailable()) {
      await SecureStore.setItemAsync(TOKEN_KEY, token, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
      return;
    }
  } catch {
    // Fall back to AsyncStorage if SecureStore fails (e.g. in Expo Go on Android)
  }
  await AsyncStorage.setItem('@auth_token', token);
}

export async function loadToken(): Promise<string | null> {
  try {
    if (await isSecureStoreAvailable()) {
      const secure = await SecureStore.getItemAsync(TOKEN_KEY);
      // Return the SecureStore value if present. If it's missing (e.g. the token
      // was written via the AsyncStorage fallback on a prior launch), fall through
      // to AsyncStorage rather than reporting the user as logged out.
      if (secure) return secure;
    }
  } catch {
    // Fall back
  }
  return AsyncStorage.getItem('@auth_token');
}

export async function deleteToken(): Promise<void> {
  try {
    if (await isSecureStoreAvailable()) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  } catch {
    // Fall back
  }
  await AsyncStorage.removeItem('@auth_token');
}
