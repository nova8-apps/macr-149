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

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: 1,
    },
  },
});
