/**
 * Foreground GPS access hook.
 *
 * The hook first requests a fresh position from the device. If a fresh fix
 * cannot be obtained, it falls back to a recent last-known position.
 *
 * Important safety rule:
 * stale locations are rejected. FishSafe must not silently use an old
 * position that may no longer represent the user's current fishing area.
 */

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
  | 'services-disabled'
  | 'location-unavailable';

const LAST_KNOWN_MAX_AGE_MS = 2 * 60 * 1000;
const LAST_KNOWN_REQUIRED_ACCURACY_M = 1000;

function normalizeLocation(
  location: Location.LocationObject
): UserLocation {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy: location.coords.accuracy,
  };
}

export function useCurrentLocation() {
  const [location, setLocation] =
    useState<UserLocation | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [errorCode, setErrorCode] =
    useState<LocationErrorCode | null>(null);

  async function readRecentLastKnownLocation():
    Promise<UserLocation | null> {
    logger.info(
      'GPS',
      'LAST_KNOWN_LOCATION_LOOKUP_STARTED',
      'Attempting to read a recent last-known device location.'
    );

    try {
      const lastKnown =
        await Location.getLastKnownPositionAsync({
          maxAge: LAST_KNOWN_MAX_AGE_MS,
          requiredAccuracy:
            LAST_KNOWN_REQUIRED_ACCURACY_M,
        });

      if (!lastKnown) {
        logger.warn(
          'GPS',
          'LAST_KNOWN_LOCATION_NOT_AVAILABLE',
          'No sufficiently recent last-known location is available.',
          {
            maxAgeMs:
              LAST_KNOWN_MAX_AGE_MS,
            requiredAccuracyM:
              LAST_KNOWN_REQUIRED_ACCURACY_M,
          }
        );

        return null;
      }

      const value =
        normalizeLocation(lastKnown);

      logger.info(
        'GPS',
        'LAST_KNOWN_LOCATION_USED',
        'Using a recent last-known location as GPS fallback.',
        {
          ...value,
          timestamp:
            lastKnown.timestamp,
          ageMs:
            Date.now() -
            lastKnown.timestamp,
        }
      );

      return value;
    } catch (error) {
      logger.error(
        'GPS',
        'LAST_KNOWN_LOCATION_LOOKUP_FAILED',
        'Failed to read the last-known device location.',
        error
      );

      return null;
    }
  }

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

      const servicesEnabled =
        await Location.hasServicesEnabledAsync();

      logger.info(
        'GPS',
        'LOCATION_SERVICES_STATUS_RESOLVED',
        'Device location-services status resolved.',
        {
          enabled:
            servicesEnabled,
        }
      );

      if (!servicesEnabled) {
        setErrorCode(
          'services-disabled'
        );

        logger.warn(
          'GPS',
          'LOCATION_SERVICES_DISABLED',
          'Device location services are disabled.'
        );

        return null;
      }

      const permission =
        await Location.requestForegroundPermissionsAsync();

      logger.info(
        'GPS',
        'LOCATION_PERMISSION_RESOLVED',
        'Foreground location permission resolved.',
        {
          status:
            permission.status,
          canAskAgain:
            permission.canAskAgain,
        }
      );

      if (
        permission.status !==
        'granted'
      ) {
        setErrorCode(
          'permission-denied'
        );

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

      try {
        const current =
          await Location.getCurrentPositionAsync({
            accuracy:
              Location.Accuracy.Balanced,
          });

        const value =
          normalizeLocation(current);

        logger.info(
          'GPS',
          'LOCATION_LOOKUP_SUCCEEDED',
          'Current device location acquired.',
          {
            ...value,
            timestamp:
              current.timestamp,
          }
        );

        setLocation(value);
        return value;
      } catch (
        currentLocationError
      ) {
        logger.warn(
          'GPS',
          'CURRENT_LOCATION_UNAVAILABLE',
          'Fresh device location could not be acquired. Trying recent last-known location.',
          {
            error:
              currentLocationError instanceof
              Error
                ? currentLocationError.message
                : String(
                    currentLocationError
                  ),
          }
        );

        const fallbackLocation =
          await readRecentLastKnownLocation();

        if (fallbackLocation) {
          setLocation(
            fallbackLocation
          );

          return fallbackLocation;
        }

        throw currentLocationError;
      }
    } catch (error) {
      setErrorCode(
        'location-unavailable'
      );

      logger.error(
        'GPS',
        'LOCATION_LOOKUP_FAILED',
        'Unable to retrieve a usable device location.',
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
