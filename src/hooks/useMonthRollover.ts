import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { currentMonthRef, monthKey } from '../utils/month';

const CHECK_INTERVAL_MS = 30_000;

/**
 * Detects a month rollover while the session stays alive.
 *
 * Screens in a bottom-tab navigator stay mounted, so their `selectedMonth`
 * would otherwise keep pointing at the previous month forever. Whenever the
 * calendar month actually changes, `onRollover` fires so the caller can jump
 * back to the current month and reload its data.
 */
export function useMonthRollover(onRollover: () => void): void {
  const handlerRef = useRef<() => void>(onRollover);
  const monthKeyRef = useRef<string>(monthKey(currentMonthRef()));

  useEffect(() => {
    handlerRef.current = onRollover;
  });

  const check = useCallback(() => {
    const nextKey = monthKey(currentMonthRef());
    if (nextKey !== monthKeyRef.current) {
      monthKeyRef.current = nextKey;
      handlerRef.current();
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') check();
    });
    const timer = setInterval(check, CHECK_INTERVAL_MS);

    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, [check]);
}
