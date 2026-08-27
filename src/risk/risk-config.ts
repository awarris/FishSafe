/**
 * Risk thresholds used by FishSafe.
 *
 * Boundary rules are explicit to avoid overlaps:
 *
 * Wind:
 * - Level 1: < 20 km/h
 * - Level 2: >= 20 and < 39 km/h
 * - Level 3: >= 39 and <= 61 km/h
 * - Level 4: > 61 km/h
 *
 * Waves:
 * - Level 1: < 1.0 m
 * - Level 2: >= 1.0 and < 1.5 m
 * - Level 3: >= 1.5 and <= 2.5 m
 * - Level 4: > 2.5 m
 *
 * The final risk level is the highest level reached by either variable.
 */

export const RISK_THRESHOLDS = {
  windSpeedKmh: {
    moderate: 20,
    high: 39,
    danger: 61,
  },
  waveHeightM: {
    moderate: 1,
    high: 1.5,
    danger: 2.5,
  },
} as const;
