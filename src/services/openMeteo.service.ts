/**
 * Open-Meteo integration layer.
 *
 * Responsibilities:
 * - build Weather and Marine API requests;
 * - fetch both datasets in parallel;
 * - normalize and merge hourly values by timestamp;
 * - expose one application-specific ForecastBundle.
 *
 * No UI concerns or risk scoring belong in this service.
 */

import { APP_CONFIG } from '../config/app.config';
import type {
  Coordinates,
  ForecastBundle,
  ForecastPoint,
  OpenMeteoHourlyResponse,
} from '../types/forecast';
import { logger } from '../utils/logger';

const WEATHER_BASE_URL =
  'https://api.open-meteo.com/v1/forecast';

const MARINE_BASE_URL =
  'https://marine-api.open-meteo.com/v1/marine';

/** Resolve how many hourly forecast points are needed for the trip window. */
function getForecastHours(
  durationHours: number
): number {
  const requestedHours = Math.max(
    APP_CONFIG.forecast.minimumHours,
    durationHours +
      APP_CONFIG.forecast.extraHoursAfterTrip
  );

  return Math.min(
    requestedHours,
    APP_CONFIG.forecast.maximumHours
  );
}

function readNumericValue(
  values: Array<number | null> | undefined,
  index: number
): number | null {
  const value = values?.[index];

  return typeof value === 'number' &&
    Number.isFinite(value)
    ? value
    : null;
}

/** Fetch and parse JSON while emitting consistent request diagnostics. */
async function fetchJson<T>(
  url: string,
  module: string
): Promise<T> {
  const startedAt = Date.now();

  logger.info(
    module,
    'HTTP_REQUEST_STARTED',
    'Starting Open-Meteo HTTP request.',
    { url }
  );

  try {
    const response = await fetch(url);

    logger.info(
      module,
      'HTTP_RESPONSE_RECEIVED',
      'Open-Meteo HTTP response received.',
      {
        status: response.status,
        ok: response.ok,
        durationMs: Date.now() - startedAt,
      }
    );

    if (!response.ok) {
      const body = await response
        .text()
        .catch(() => '');

      throw new Error(
        `Open-Meteo request failed with HTTP ${
          response.status
        }: ${body.slice(0, 300)}`
      );
    }

    const data =
      (await response.json()) as T;

    logger.info(
      module,
      'HTTP_RESPONSE_PARSED',
      'Open-Meteo response body parsed successfully.',
      {
        durationMs: Date.now() - startedAt,
      }
    );

    return data;
  } catch (error) {
    logger.error(
      module,
      'HTTP_REQUEST_FAILED',
      'Open-Meteo request failed.',
      error,
      {
        durationMs: Date.now() - startedAt,
      }
    );

    throw error;
  }
}

function buildWeatherUrl(
  coordinates: Coordinates,
  forecastHours: number
): string {
  const params = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
    hourly:
      'wind_speed_10m,wind_gusts_10m,wind_direction_10m',
    wind_speed_unit: 'kmh',
    forecast_hours: String(forecastHours),
    timezone: 'auto',
    cell_selection: 'sea',
  });

  return `${WEATHER_BASE_URL}?${params.toString()}`;
}

function buildMarineUrl(
  coordinates: Coordinates,
  forecastHours: number
): string {
  const params = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
    hourly:
      'wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction',
    forecast_hours: String(forecastHours),
    timezone: 'auto',
    cell_selection: 'sea',
  });

  return `${MARINE_BASE_URL}?${params.toString()}`;
}

/** Merge Weather and Marine API data by their shared hourly timestamp. */
function mergeForecasts(
  coordinates: Coordinates,
  weather: OpenMeteoHourlyResponse,
  marine: OpenMeteoHourlyResponse
): ForecastBundle {
  logger.info(
    'OPEN_METEO',
    'FORECAST_MERGE_STARTED',
    'Merging weather and marine forecasts.'
  );

  const weatherTimes =
    weather.hourly?.time ?? [];

  const marineTimes =
    marine.hourly?.time ?? [];

  const marineIndexByTime =
    new Map<string, number>();

  marineTimes.forEach((time, index) => {
    marineIndexByTime.set(time, index);
  });

  const points: ForecastPoint[] =
    weatherTimes.map(
      (time, weatherIndex) => {
        const marineIndex =
          marineIndexByTime.get(time);

        return {
          time,
          windSpeedKmh: readNumericValue(
            weather.hourly?.wind_speed_10m,
            weatherIndex
          ),
          windGustsKmh: readNumericValue(
            weather.hourly?.wind_gusts_10m,
            weatherIndex
          ),
          windDirectionDeg: readNumericValue(
            weather.hourly?.wind_direction_10m,
            weatherIndex
          ),
          waveHeightM:
            marineIndex === undefined
              ? null
              : readNumericValue(
                  marine.hourly?.wave_height,
                  marineIndex
                ),
          wavePeriodS:
            marineIndex === undefined
              ? null
              : readNumericValue(
                  marine.hourly?.wave_period,
                  marineIndex
                ),
          waveDirectionDeg:
            marineIndex === undefined
              ? null
              : readNumericValue(
                  marine.hourly?.wave_direction,
                  marineIndex
                ),
          swellHeightM:
            marineIndex === undefined
              ? null
              : readNumericValue(
                  marine.hourly?.swell_wave_height,
                  marineIndex
                ),
          swellPeriodS:
            marineIndex === undefined
              ? null
              : readNumericValue(
                  marine.hourly?.swell_wave_period,
                  marineIndex
                ),
          swellDirectionDeg:
            marineIndex === undefined
              ? null
              : readNumericValue(
                  marine.hourly?.swell_wave_direction,
                  marineIndex
                ),
        };
      }
    );

  if (points.length === 0) {
    throw new Error(
      'Open-Meteo returned no hourly forecast points.'
    );
  }

  const pointsWithMarineData =
    points.filter(
      (point) =>
        point.waveHeightM !== null ||
        point.swellHeightM !== null
    ).length;

  logger.info(
    'OPEN_METEO',
    'FORECAST_MERGE_COMPLETED',
    'Weather and marine forecasts merged successfully.',
    {
      weatherPoints: weatherTimes.length,
      marinePoints: marineTimes.length,
      mergedPoints: points.length,
      pointsWithMarineData,
    }
  );

  return {
    coordinates,
    timezone:
      weather.timezone ??
      marine.timezone ??
      'auto',
    fetchedAt: new Date().toISOString(),
    points,
    source: 'open-meteo',
  };
}

/** Download, normalize, and combine all forecast data required by FishSafe. */
export async function getForecastBundle(
  coordinates: Coordinates,
  durationHours: number
): Promise<ForecastBundle> {
  const forecastHours =
    getForecastHours(durationHours);

  logger.info(
    'OPEN_METEO',
    'FORECAST_REQUEST_STARTED',
    'Preparing combined weather and marine forecast request.',
    {
      coordinates,
      durationHours,
      forecastHours,
    }
  );

  const weatherUrl =
    buildWeatherUrl(
      coordinates,
      forecastHours
    );

  const marineUrl =
    buildMarineUrl(
      coordinates,
      forecastHours
    );

  const [weather, marine] =
    await Promise.all([
      fetchJson<OpenMeteoHourlyResponse>(
        weatherUrl,
        'WEATHER_API'
      ),
      fetchJson<OpenMeteoHourlyResponse>(
        marineUrl,
        'MARINE_API'
      ),
    ]);

  const bundle =
    mergeForecasts(
      coordinates,
      weather,
      marine
    );

  logger.info(
    'OPEN_METEO',
    'FORECAST_REQUEST_COMPLETED',
    'Combined forecast is ready.',
    {
      timezone: bundle.timezone,
      pointCount: bundle.points.length,
      firstPoint: bundle.points[0],
    }
  );

  return bundle;
}
