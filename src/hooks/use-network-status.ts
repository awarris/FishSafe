/** Access the application-wide connectivity state. */

import { useContext } from 'react';

import {
  NetworkContext,
} from '../providers/network-provider';

export function useNetworkStatus() {
  const context =
    useContext(NetworkContext);

  if (!context) {
    throw new Error(
      'useNetworkStatus must be used within NetworkProvider.'
    );
  }

  return context;
}
