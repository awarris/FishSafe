/**
 * Local persistence for prepared trips and downloaded forecasts.
 *
 * Forecast data is stored before departure so the active-trip experience can
 * continue when the device has limited or no Internet connectivity.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PreparedTrip } from '../types/trip';
import { logger } from '../utils/logger';

const PREPARED_TRIP_KEY =
  '@fishsafe/prepared-trip/latest';

/** Persist the latest prepared trip and forecast atomically as JSON. */
export async function savePreparedTrip(
  data: PreparedTrip
): Promise<void> {
  logger.info(
    'STORAGE',
    'PREPARED_TRIP_SAVE_STARTED',
    'Saving prepared trip and forecast locally.',
    {
      tripId: data.trip.id,
      forecastPoints:
        data.forecast.points.length,
    }
  );

  try {
    const serialized = JSON.stringify(data);

    await AsyncStorage.setItem(
      PREPARED_TRIP_KEY,
      serialized
    );

    logger.info(
      'STORAGE',
      'PREPARED_TRIP_SAVE_COMPLETED',
      'Prepared trip saved locally.',
      {
        tripId: data.trip.id,
        serializedLength:
          serialized.length,
      }
    );
  } catch (error) {
    logger.error(
      'STORAGE',
      'PREPARED_TRIP_SAVE_FAILED',
      'Failed to save prepared trip locally.',
      error
    );

    throw error;
  }
}

/** Load the latest prepared trip, or null when no local trip exists. */
export async function loadPreparedTrip():
  Promise<PreparedTrip | null> {
  logger.info(
    'STORAGE',
    'PREPARED_TRIP_LOAD_STARTED',
    'Loading the latest prepared trip from local storage.'
  );

  try {
    const serialized =
      await AsyncStorage.getItem(
        PREPARED_TRIP_KEY
      );

    if (!serialized) {
      logger.warn(
        'STORAGE',
        'PREPARED_TRIP_NOT_FOUND',
        'No prepared trip was found in local storage.'
      );

      return null;
    }

    const parsed =
      JSON.parse(serialized) as PreparedTrip;

    logger.info(
      'STORAGE',
      'PREPARED_TRIP_LOAD_COMPLETED',
      'Prepared trip loaded from local storage.',
      {
        tripId: parsed.trip.id,
        forecastPoints:
          parsed.forecast.points.length,
      }
    );

    return parsed;
  } catch (error) {
    logger.error(
      'STORAGE',
      'PREPARED_TRIP_LOAD_FAILED',
      'Failed to load prepared trip from local storage.',
      error
    );

    throw error;
  }
}

export async function clearPreparedTrip():
  Promise<void> {
  logger.info(
    'STORAGE',
    'PREPARED_TRIP_CLEAR_STARTED',
    'Clearing prepared trip cache.'
  );

  await AsyncStorage.removeItem(
    PREPARED_TRIP_KEY
  );

  logger.info(
    'STORAGE',
    'PREPARED_TRIP_CLEAR_COMPLETED',
    'Prepared trip cache cleared.'
  );
}
