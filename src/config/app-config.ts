/**
 * Central application configuration.
 *
 * Keep environment-independent product settings here so they are easy to
 * review and change without touching UI or domain logic.
 *
 * The demo location is intentionally isolated from real GPS behavior.
 */

export const APP_CONFIG = {
  demoLocation: {
    label: 'Zone test au large de Cotonou',
    latitude: 6.25,
    longitude: 2.43,
  },
  forecast: {
    minimumHours: 12,
    extraHoursAfterTrip: 6,
    maximumHours: 48,
  },
  risk: {
    demoMode: true,
  },
} as const;
