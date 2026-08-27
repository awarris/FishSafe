/**
 * Application network-status provider.
 *
 * NetInfo is the single source of truth for connectivity state. The provider
 * exposes a conservative `isOffline` flag and records the last transition so
 * screens can notify users without leaking technical networking details.
 */

import NetInfo, {
  type NetInfoState,
} from '@react-native-community/netinfo';
import {
  createContext,
  type PropsWithChildren,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { logger } from '../utils/logger';

export type NetworkStatus =
  | 'unknown'
  | 'online'
  | 'offline';

type NetworkContextValue = {
  status: NetworkStatus;
  isOnline: boolean;
  isOffline: boolean;
  restoredAt: number | null;
};

export const NetworkContext =
  createContext<NetworkContextValue | null>(null);

function resolveStatus(
  state: NetInfoState
): NetworkStatus {
  if (state.isConnected === false) {
    return 'offline';
  }

  if (
    state.isInternetReachable === false
  ) {
    return 'offline';
  }

  if (
    state.isConnected === true &&
    state.isInternetReachable === true
  ) {
    return 'online';
  }

  return 'unknown';
}

export function NetworkProvider({
  children,
}: PropsWithChildren) {
  const [status, setStatus] =
    useState<NetworkStatus>('unknown');

  const [restoredAt, setRestoredAt] =
    useState<number | null>(null);

  const previousStatus =
    useRef<NetworkStatus>('unknown');

  useEffect(() => {
    const unsubscribe =
      NetInfo.addEventListener(
        (state) => {
          const nextStatus =
            resolveStatus(state);

          if (
            nextStatus ===
            previousStatus.current
          ) {
            return;
          }

          logger.info(
            'NETWORK',
            'NETWORK_STATUS_CHANGED',
            'Network status changed.',
            {
              previousStatus:
                previousStatus.current,
              nextStatus,
              type: state.type,
              isConnected:
                state.isConnected,
              isInternetReachable:
                state.isInternetReachable,
            }
          );

          if (
            previousStatus.current ===
              'offline' &&
            nextStatus === 'online'
          ) {
            setRestoredAt(Date.now());
          }

          previousStatus.current =
            nextStatus;
          setStatus(nextStatus);
        }
      );

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      status,
      isOnline: status === 'online',
      isOffline: status === 'offline',
      restoredAt,
    }),
    [status, restoredAt]
  );

  return (
    <NetworkContext.Provider
      value={value}
    >
      {children}
    </NetworkContext.Provider>
  );
}
