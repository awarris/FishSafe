/**
 * Trip and risk domain types.
 *
 * UI translations are deliberately excluded from these types. Domain values
 * remain language-neutral and are translated only at the presentation layer.
 */

import type { Coordinates, ForecastBundle } from './forecast';

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

export type RiskLevel =
  | 'low'
  | 'moderate'
  | 'high'
  | 'critical';

export type RiskReasonKey =
  | 'risk.wind'
  | 'risk.gusts'
  | 'risk.waves'
  | 'risk.swell'
  | 'risk.duration'
  | 'risk.boat';

export type RiskResult = {
  score: number;
  level: RiskLevel;
  isDemo: boolean;
  reasonKeys: RiskReasonKey[];
  components: {
    wind: number;
    gusts: number;
    waves: number;
    swell: number;
    duration: number;
    boat: number;
  };
};
