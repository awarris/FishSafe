/**
 * Open-Meteo integration layer.
 *
 * FishSafe currently requires only:
 * - wind speed at 10 metres from the Weather API;
 * - significant wave height from the Marine API.
 *
 * Wind is explicitly requested in km/h with `wind_speed_unit=kmh`.
 * Open-Meteo Marine returns `wave_height` in metres.
 */

import { APP_CONFIG } from '../config/app-config';
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
    hourly: 'wind_speed_10m',
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
    hourly: 'wave_height',
    forecast_hours: String(forecastHours),
    timezone: 'auto',
    cell_selection: 'sea',
  });

  return `${MARINE_BASE_URL}?${params.toString()}`;
}

function validateUnits(
  weather: OpenMeteoHourlyResponse,
  marine: OpenMeteoHourlyResponse
): void {
  const windUnit =
    weather.hourly_units?.wind_speed_10m;

  const waveUnit =
    marine.hourly_units?.wave_height;

  logger.info(
    'OPEN_METEO',
    'FORECAST_UNITS_RECEIVED',
    'Open-Meteo response units received.',
    {
      windSpeedUnit: windUnit,
      waveHeightUnit: waveUnit,
    }
  );

  if (
    windUnit &&
    windUnit !== 'km/h'
  ) {
    logger.warn(
      'OPEN_METEO',
      'UNEXPECTED_WIND_UNIT',
      'Unexpected wind-speed unit returned by Open-Meteo.',
      {
        expected: 'km/h',
        actual: windUnit,
      }
    );
  }

  if (
    waveUnit &&
    waveUnit !== 'm'
  ) {
    logger.warn(
      'OPEN_METEO',
      'UNEXPECTED_WAVE_UNIT',
      'Unexpected wave-height unit returned by Open-Meteo.',
      {
        expected: 'm',
        actual: waveUnit,
      }
    );
  }
}

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

  validateUnits(weather, marine);

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
    weatherTimes.flatMap(
      (time, weatherIndex) => {
        const marineIndex =
          marineIndexByTime.get(time);

        if (marineIndex === undefined) {
          return [];
        }

        const windSpeedKmh =
          readNumericValue(
            weather.hourly?.wind_speed_10m,
            weatherIndex
          );

        const waveHeightM =
          readNumericValue(
            marine.hourly?.wave_height,
            marineIndex
          );

        if (
          windSpeedKmh === null ||
          waveHeightM === null
        ) {
          logger.warn(
            'OPEN_METEO',
            'INCOMPLETE_FORECAST_POINT_SKIPPED',
            'Skipping hourly point because wind or wave data is missing.',
            {
              time,
              windSpeedKmh,
              waveHeightM,
            }
          );

          return [];
        }

        return [{
          time,
          windSpeedKmh,
          waveHeightM,
        }];
      }
    );

  if (points.length === 0) {
    throw new Error(
      'Open-Meteo returned no complete wind-and-wave forecast points.'
    );
  }

  const completePoints =
    points.length;

  logger.info(
    'OPEN_METEO',
    'FORECAST_MERGE_COMPLETED',
    'Weather and marine forecasts merged successfully.',
    {
      weatherPoints: weatherTimes.length,
      marinePoints: marineTimes.length,
      mergedPoints: points.length,
      completeRiskPoints: completePoints,
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

export async function getForecastBundle(
  coordinates: Coordinates,
  durationHours: number
): Promise<ForecastBundle> {
  const forecastHours =
    getForecastHours(durationHours);

  logger.info(
    'OPEN_METEO',
    'FORECAST_REQUEST_STARTED',
    'Preparing wind and wave forecast requests.',
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
    'Combined wind and wave forecast is ready.',
    {
      timezone: bundle.timezone,
      pointCount: bundle.points.length,
      firstPoint: bundle.points[0],
    }
  );

  return bundle;
}
