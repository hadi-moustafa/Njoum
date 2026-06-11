// ============================================================
// React Query AsyncStorage Persister — offline cache.
//
// Uses @react-native-async-storage/async-storage which works
// in Expo Go without a custom native build.
// (react-native-mmkv v4 requires NitroModules / New Architecture
//  which needs a custom dev build — avoided here.)
//
// Offline-first queries (hotlines, activities, videos) survive
// app restarts because the cache is written to AsyncStorage.
// ============================================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

export const queryPersister = createAsyncStoragePersister({
  storage:      AsyncStorage,
  throttleTime: 2000,   // debounce writes (ms) — avoids hammering storage on rapid updates
});
