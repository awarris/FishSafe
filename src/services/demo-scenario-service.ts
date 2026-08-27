/**
 * Controlled jury-demo scenarios.
 *
 * These values never replace Open-Meteo data silently. They are available only
 * when the user explicitly selects the configured demo location, and the UI
 * clearly labels the active scenario as a demonstration.
 */
import type { ForecastBundle, ForecastPoint } from '../types/forecast';
import type { DemoScenario } from '../types/trip';
import { logger } from '../utils/logger';

const DEGRADATION_VALUES = [
  { windSpeedKmh: 18, waveHeightM: 0.8 }, // level 1
  { windSpeedKmh: 28, waveHeightM: 1.1 }, // level 2
  { windSpeedKmh: 42, waveHeightM: 1.2 }, // level 3 by wind
  { windSpeedKmh: 46, waveHeightM: 1.8 }, // level 3 by both
  { windSpeedKmh: 64, waveHeightM: 2.7 }, // level 4
] as const;

const DANGER_VALUES = [
  { windSpeedKmh: 65, waveHeightM: 2.7 },
  { windSpeedKmh: 68, waveHeightM: 2.9 },
  { windSpeedKmh: 70, waveHeightM: 3.1 },
] as const;

function addHours(isoLocalTime: string, hours: number): string {
  const [datePart, timePart] = isoLocalTime.split('T');
  const [hour, minute = '00'] = timePart.split(':').map(Number);
  const date = new Date(`${datePart}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
  date.setHours(date.getHours() + hours);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}`;
}

function buildPoints(base: ForecastPoint, values: readonly { windSpeedKmh: number; waveHeightM: number }[]): ForecastPoint[] {
  return values.map((value, index) => ({
    time: addHours(base.time, index),
    windSpeedKmh: value.windSpeedKmh,
    waveHeightM: value.waveHeightM,
  }));
}

export function applyDemoScenario(forecast: ForecastBundle, scenario: DemoScenario): ForecastBundle {
  if (scenario === 'real') return forecast;
  const base = forecast.points[0];
  const values = scenario === 'degradation' ? DEGRADATION_VALUES : DANGER_VALUES;
  const points = buildPoints(base, values);
  logger.info('DEMO_SCENARIO', 'CONTROLLED_SCENARIO_APPLIED', 'Controlled jury-demo scenario applied.', { scenario, pointCount: points.length });
  return { ...forecast, points };
}
