// Shared React Query client singleton.
//
// Exported so that non-React code paths (e.g. the Zustand store's signOut
// action, deep-link handlers, background tasks) can imperatively clear the
// cache without needing a React hook context.
//
// CRITICAL: Clearing this cache on sign-out is required to prevent cross-
// account data leaks (Account A's data showing up under Account B after
// sign-out → sign-in with a different account on the same device).

import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days (must match persister maxAge)
      retry: 1,
    },
  },
});

export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'macr-rq-cache',
});
