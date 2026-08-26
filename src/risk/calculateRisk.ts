/**
 * Pure risk-scoring engine.
 *
 * The engine consumes normalized forecast values plus trip context and returns
 * a language-neutral result. It does not fetch data, store state, or render UI.
 */

import { APP_CONFIG } from '../config/app.config';
import type { ForecastPoint } from '../types/forecast';
import type {
  BoatType,
  RiskLevel,
  RiskReasonKey,
  RiskResult,
} from '../types/trip';
import { logger } from '../utils/logger';
import { DEMO_THRESHOLDS } from './risk.config';

type ThresholdSet = {
  moderate: number;
  high: number;
  critical: number;
};

/** Convert a raw environmental value into its weighted score contribution. */
function scoreValue(
  value: number | null,
  thresholds: ThresholdSet,
  maxPoints: number
): number {
  if (value === null) {
    return 0;
  }

  if (value >= thresholds.critical) {
    return maxPoints;
  }

  if (value >= thresholds.high) {
    return Math.round(maxPoints * 0.75);
  }

  if (value >= thresholds.moderate) {
    return Math.round(maxPoints * 0.45);
  }

  return 0;
}

/** Map the numeric score to a stable domain-level risk category. */
function resolveRiskLevel(
  score: number
): RiskLevel {
  if (score >= 76) {
    return 'critical';
  }

  if (score >= 51) {
    return 'high';
  }

  if (score >= 26) {
    return 'moderate';
  }

  return 'low';
}

/** Calculate the complete demo risk assessment for one forecast point. */
export function calculateRisk(
  point: ForecastPoint,
  boatType: BoatType,
  durationHours: number
): RiskResult {
  const wind = scoreValue(
    point.windSpeedKmh,
    DEMO_THRESHOLDS.windKmh,
    22
  );

  const gusts = scoreValue(
    point.windGustsKmh,
    DEMO_THRESHOLDS.gustsKmh,
    18
  );

  const waves = scoreValue(
    point.waveHeightM,
    DEMO_THRESHOLDS.waveM,
    28
  );

  const swell = scoreValue(
    point.swellHeightM,
    DEMO_THRESHOLDS.swellM,
    17
  );

  const duration =
    durationHours >= 8
      ? 8
      : durationHours >= 6
      ? 5
      : durationHours >= 4
      ? 2
      : 0;

  const boat =
    boatType === 'canoe'
      ? 7
      : boatType === 'small-boat'
      ? 4
      : 0;

  const score = Math.min(
    100,
    wind +
      gusts +
      waves +
      swell +
      duration +
      boat
  );

  const level =
    resolveRiskLevel(score);

  const reasonKeys:
    RiskReasonKey[] = [];

  if (wind > 0) {
    reasonKeys.push('risk.wind');
  }

  if (gusts > 0) {
    reasonKeys.push('risk.gusts');
  }

  if (waves > 0) {
    reasonKeys.push('risk.waves');
  }

  if (swell > 0) {
    reasonKeys.push('risk.swell');
  }

  if (duration > 0) {
    reasonKeys.push('risk.duration');
  }

  if (boat > 0) {
    reasonKeys.push('risk.boat');
  }

  logger.debug(
    'RISK',
    'RISK_CALCULATION_COMPLETED',
    'Risk score calculated.',
    {
      time: point.time,
      boatType,
      durationHours,
      inputs: {
        windSpeedKmh:
          point.windSpeedKmh,
        windGustsKmh:
          point.windGustsKmh,
        waveHeightM:
          point.waveHeightM,
        swellHeightM:
          point.swellHeightM,
      },
      components: {
        wind,
        gusts,
        waves,
        swell,
        duration,
        boat,
      },
      score,
      level,
      demoMode:
        APP_CONFIG.risk.demoMode,
    }
  );

  return {
    score,
    level,
    isDemo:
      APP_CONFIG.risk.demoMode,
    reasonKeys,
    components: {
      wind,
      gusts,
      waves,
      swell,
      duration,
      boat,
    },
  };
}
