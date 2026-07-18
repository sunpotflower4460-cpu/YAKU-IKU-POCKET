import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Camera-captured photos live in the OS cache directory (expo-camera default)
// until they're saved as an observation, at which point the OS is free to
// evict them at any time — a saved observation's photo could silently break.
// This copies the photo into the app's persistent document directory only at
// save time (never for demo/discarded scans, to avoid wasting storage).
//
// Web has no durable/cache distinction worth copying between (no
// FileSystem.documentDirectory), so this is a native-only concern and is a
// no-op there — the original URI is returned unchanged.
const OBSERVATIONS_DIR = FileSystem.documentDirectory
  ? `${FileSystem.documentDirectory}observations/`
  : null;

async function ensureObservationsDir(): Promise<void> {
  if (!OBSERVATIONS_DIR) return;
  const info = await FileSystem.getInfoAsync(OBSERVATIONS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(OBSERVATIONS_DIR, { intermediates: true });
  }
}

/**
 * Copy a captured photo into persistent storage and return the durable URI.
 * Returns the original URI unchanged on web or on any copy failure — a
 * missing durable copy should never block saving the observation itself.
 */
export async function persistObservationPhoto(cacheUri: string): Promise<string> {
  if (Platform.OS === 'web' || !OBSERVATIONS_DIR) return cacheUri;
  try {
    await ensureObservationsDir();
    const ext = cacheUri.split('.').pop()?.split('?')[0] || 'jpg';
    const destUri = `${OBSERVATIONS_DIR}${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    await FileSystem.copyAsync({ from: cacheUri, to: destUri });
    return destUri;
  } catch (err) {
    console.warn('[observationPhotoStorage] copy failed, keeping cache URI:', err);
    return cacheUri;
  }
}
