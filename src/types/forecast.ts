/**
 * Forecast domain types.
 *
 * External Open-Meteo values can be nullable, but FishSafe only exposes
 * complete normalized forecast points to the risk engine.
 */

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type ForecastPoint = {
  time: string;
  windSpeedKmh: number;
  waveHeightM: number;
};

export type ForecastBundle = {
  coordinates: Coordinates;
  timezone: string;
  fetchedAt: string;
  points: ForecastPoint[];
  source: 'open-meteo';
};

export type OpenMeteoHourlyResponse = {
  timezone?: string;
  hourly_units?: {
    wind_speed_10m?: string;
    wave_height?: string;
  };
  hourly?: {
    time?: string[];
    wind_speed_10m?: Array<number | null>;
    wave_height?: Array<number | null>;
  };
};
