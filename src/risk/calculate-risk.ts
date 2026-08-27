/**
 * Conservative risk-classification engine.
 *
 * There is no weighted score. Wind speed and wave height are classified
 * independently, then FishSafe keeps the highest of the two levels.
 */

import type { ForecastPoint } from '../types/forecast';
import type {
  RiskLevel,
  RiskLevelNumber,
  RiskMessageKey,
  RiskResult,
} from '../types/trip';
import { logger } from '../utils/logger';
import { RISK_THRESHOLDS } from './risk-config';

function classifyWind(
  windSpeedKmh: number
): RiskLevelNumber {
  if (
    windSpeedKmh >
    RISK_THRESHOLDS.windSpeedKmh.danger
  ) {
    return 4;
  }

  if (
    windSpeedKmh >=
    RISK_THRESHOLDS.windSpeedKmh.high
  ) {
    return 3;
  }

  if (
    windSpeedKmh >=
    RISK_THRESHOLDS.windSpeedKmh.moderate
  ) {
    return 2;
  }

  return 1;
}

function classifyWaves(
  waveHeightM: number
): RiskLevelNumber {
  if (
    waveHeightM >
    RISK_THRESHOLDS.waveHeightM.danger
  ) {
    return 4;
  }

  if (
    waveHeightM >=
    RISK_THRESHOLDS.waveHeightM.high
  ) {
    return 3;
  }

  if (
    waveHeightM >=
    RISK_THRESHOLDS.waveHeightM.moderate
  ) {
    return 2;
  }

  return 1;
}

function mapLevel(
  levelNumber: RiskLevelNumber
): {
  level: RiskLevel;
  messageKey: RiskMessageKey;
} {
  switch (levelNumber) {
    case 4:
      return {
        level: 'danger',
        messageKey: 'risk.messages.danger',
      };
    case 3:
      return {
        level: 'high',
        messageKey: 'risk.messages.high',
      };
    case 2:
      return {
        level: 'moderate',
        messageKey: 'risk.messages.moderate',
      };
    default:
      return {
        level: 'low',
        messageKey: 'risk.messages.low',
      };
  }
}

/**
 * Classify one hourly forecast point.
 *
 * Upstream normalization guarantees that both required environmental
 * values are present before this function is called.
 */
export function calculateRisk(
  point: ForecastPoint
): RiskResult {
  const windLevel =
    classifyWind(point.windSpeedKmh);

  const waveLevel =
    classifyWaves(point.waveHeightM);

  const levelNumber =
    Math.max(
      windLevel,
      waveLevel
    ) as RiskLevelNumber;

  const {
    level,
    messageKey,
  } = mapLevel(levelNumber);

  logger.info(
    'RISK',
    'RISK_CLASSIFICATION_COMPLETED',
    'Risk level classified using the highest wind or wave level.',
    {
      time: point.time,
      windSpeedKmh: point.windSpeedKmh,
      windLevel,
      waveHeightM: point.waveHeightM,
      waveLevel,
      finalLevelNumber: levelNumber,
      finalLevel: level,
    }
  );

  return {
    level,
    levelNumber,
    messageKey,
    windLevel,
    waveLevel,
    windSpeedKmh: point.windSpeedKmh,
    waveHeightM: point.waveHeightM,
  };
}
