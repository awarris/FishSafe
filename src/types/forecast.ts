/**
 * Forecast domain types.
 *
 * These types normalize data coming from Open-Meteo so the rest of the
 * application does not depend directly on the external API response shape.
 */

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type ForecastPoint = {
  time: string;
  windSpeedKmh: number | null;
  windGustsKmh: number | null;
  windDirectionDeg: number | null;
  waveHeightM: number | null;
  wavePeriodS: number | null;
  waveDirectionDeg: number | null;
  swellHeightM: number | null;
  swellPeriodS: number | null;
  swellDirectionDeg: number | null;
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
  hourly?: {
    time?: string[];
    wind_speed_10m?: Array<number | null>;
    wind_gusts_10m?: Array<number | null>;
    wind_direction_10m?: Array<number | null>;
    wave_height?: Array<number | null>;
    wave_period?: Array<number | null>;
    wave_direction?: Array<number | null>;
    swell_wave_height?: Array<number | null>;
    swell_wave_period?: Array<number | null>;
    swell_wave_direction?: Array<number | null>;
  };
};
