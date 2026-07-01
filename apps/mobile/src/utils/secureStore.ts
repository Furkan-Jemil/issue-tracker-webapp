/**
 * Secure token storage — backed by iOS Keychain / Android Keystore via expo-secure-store.
 * Falls back to AsyncStorage for Expo Go (which does not support native Keychain plugins
 * without a dev-client build). The fallback is safe for development; the native path
 * is used in any Expo dev-client / EAS production build.
 */
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';

/** True when SecureStore is available (requires native build, not Expo Go sandbox) */
async function isSecureStoreAvailable(): Promise<boolean> {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function saveToken(token: string): Promise<void> {
  if (await isSecureStoreAvailable()) {
    await SecureStore.setItemAsync(TOKEN_KEY, token, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } else {
    // Expo Go sandbox — AsyncStorage is acceptable for development
    await AsyncStorage.setItem('@auth_token', token);
  }
}

export async function loadToken(): Promise<string | null> {
  if (await isSecureStoreAvailable()) {
    return SecureStore.getItemAsync(TOKEN_KEY);
  }
  return AsyncStorage.getItem('@auth_token');
}

export async function deleteToken(): Promise<void> {
  if (await isSecureStoreAvailable()) {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } else {
    await AsyncStorage.removeItem('@auth_token');
  }
}
