import { useState } from 'react';
import * as Location from 'expo-location';

import { logger } from '../utils/logger';

export type UserLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
};

export type LocationErrorCode =
  | 'permission-denied'
  | 'location-unavailable';

export function useCurrentLocation() {
  const [location, setLocation] =
    useState<UserLocation | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [errorCode, setErrorCode] =
    useState<LocationErrorCode | null>(null);

  async function requestLocation():
    Promise<UserLocation | null> {
    logger.info(
      'GPS',
      'LOCATION_REQUEST_STARTED',
      'Starting device location request.'
    );

    try {
      setLoading(true);
      setErrorCode(null);

      const permission =
        await Location.requestForegroundPermissionsAsync();

      logger.info(
        'GPS',
        'LOCATION_PERMISSION_RESOLVED',
        'Foreground location permission resolved.',
        {
          status: permission.status,
          canAskAgain: permission.canAskAgain,
        }
      );

      if (permission.status !== 'granted') {
        setErrorCode('permission-denied');

        logger.warn(
          'GPS',
          'LOCATION_PERMISSION_DENIED',
          'Foreground location permission was denied.'
        );

        return null;
      }

      logger.info(
        'GPS',
        'LOCATION_LOOKUP_STARTED',
        'Reading current device location.'
      );

      const current =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

      const value: UserLocation = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
        accuracy: current.coords.accuracy,
      };

      logger.info(
        'GPS',
        'LOCATION_LOOKUP_SUCCEEDED',
        'Current device location acquired.',
        value
      );

      setLocation(value);
      return value;
    } catch (error) {
      setErrorCode('location-unavailable');

      logger.error(
        'GPS',
        'LOCATION_LOOKUP_FAILED',
        'Unable to retrieve the current device location.',
        error
      );

      return null;
    } finally {
      setLoading(false);

      logger.info(
        'GPS',
        'LOCATION_REQUEST_FINISHED',
        'Device location request finished.'
      );
    }
  }

  return {
    location,
    loading,
    errorCode,
    requestLocation,
  };
}
