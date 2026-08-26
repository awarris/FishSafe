/**
 * Temporary demonstration thresholds.
 *
 * These values are NOT official maritime safety thresholds.
 * They only keep the proof of concept operational until the
 * risk model is replaced with values documented and validated
 * by the project team.
 */
export const DEMO_THRESHOLDS = {
  windKmh: {
    moderate: 20,
    high: 30,
    critical: 40,
  },
  gustsKmh: {
    moderate: 30,
    high: 45,
    critical: 60,
  },
  waveM: {
    moderate: 1,
    high: 1.5,
    critical: 2.5,
  },
  swellM: {
    moderate: 1,
    high: 1.5,
    critical: 2.5,
  },
} as const;
