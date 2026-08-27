/**
 * Trip and risk domain types.
 *
 * The risk result is intentionally language-neutral. User-facing labels and
 * safety messages are translated at the presentation layer.
 */

import type {
  Coordinates,
  ForecastBundle,
} from './forecast';

export type BoatType =
  | 'canoe'
  | 'motorized'
  | 'small-boat';

export type LocationSource =
  | 'gps'
  | 'demo';

export type TripDraft = {
  id: string;
  createdAt: string;
  coordinates: Coordinates;
  locationSource: LocationSource;
  durationHours: number;
  boatType: BoatType;
};

export type PreparedTrip = {
  trip: TripDraft;
  forecast: ForecastBundle;
};

export type DemoScenario =
  | 'real'
  | 'degradation'
  | 'danger';

export type RiskLevel =
  | 'low'
  | 'moderate'
  | 'high'
  | 'danger';

export type RiskLevelNumber =
  | 1
  | 2
  | 3
  | 4;

export type RiskMessageKey =
  | 'risk.messages.low'
  | 'risk.messages.moderate'
  | 'risk.messages.high'
  | 'risk.messages.danger';

export type RiskResult = {
  level: RiskLevel;
  levelNumber: RiskLevelNumber;
  messageKey: RiskMessageKey;
  windLevel: RiskLevelNumber;
  waveLevel: RiskLevelNumber;
  windSpeedKmh: number;
  waveHeightM: number;
};
