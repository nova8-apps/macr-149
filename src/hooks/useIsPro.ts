import { useCallback } from 'react';
import { router } from 'expo-router';
import { useMe } from '@/lib/api-hooks';

/**
 * useIsPro — single canonical gate hook for Pro entitlement.
 *
 * Returns:
 *   isPro     — whether the current user has an active Pro entitlement
 *   isLoading — whether the entitlement data is still loading
 *   requirePro(onPro) — call with the action to run if Pro. If not Pro,
 *                        routes to /paywall instead.
 */
export function useIsPro() {
  const { data: meData, isLoading } = useMe();
  const isPro = !!meData?.entitlement?.isPro;

  const requirePro = useCallback(
    (onPro: () => void) => {
      if (isPro) {
        onPro();
      } else {
        router.push('/paywall');
      }
    },
    [isPro],
  );

  return { isPro, isLoading, requirePro };
}
