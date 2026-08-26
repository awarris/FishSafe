/**
 * Active trip route.
 *
 * Uses the forecast already stored on-device and reevaluates risk as the
 * selected forecast point changes. The current "next hour" control exists to
 * make the preventive behavior demonstrable during the hackathon.
 */

import { router } from 'expo-router';
import {
  useEffect,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { calculateRisk } from '../risk/calculateRisk';
import { loadPreparedTrip } from '../storage/forecast.storage';
import { useAppTheme } from '../hooks/use-app-theme';
import type { AppTheme } from '../theme';
import type {
  PreparedTrip,
  RiskLevel,
} from '../types/trip';
import { logger } from '../utils/logger';

function formatMeasurement(
  value: number | null,
  unit: string,
  fractionDigits = 0
): string {
  return value === null
    ? '—'
    : `${value.toFixed(
        fractionDigits
      )} ${unit}`;
}

export default function ActiveTripScreen() {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  const [preparedTrip, setPreparedTrip] =
    useState<PreparedTrip | null>(null);

  const [
    forecastIndex,
    setForecastIndex,
  ] = useState(0);

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    lastAlertedLevel,
    setLastAlertedLevel,
  ] = useState<RiskLevel | null>(null);

  useEffect(() => {
    async function initialize():
      Promise<void> {
      logger.info(
        'ACTIVE_TRIP_SCREEN',
        'SCREEN_INITIALIZATION_STARTED',
        'Loading active trip from local storage.'
      );

      try {
        const storedTrip =
          await loadPreparedTrip();

        setPreparedTrip(storedTrip);

        logger.info(
          'ACTIVE_TRIP_SCREEN',
          'SCREEN_INITIALIZATION_COMPLETED',
          'Active trip loaded from local storage.',
          {
            tripId:
              storedTrip?.trip.id,
            forecastPoints:
              storedTrip?.forecast
                .points.length,
          }
        );
      } catch (error) {
        logger.error(
          'ACTIVE_TRIP_SCREEN',
          'SCREEN_INITIALIZATION_FAILED',
          'Failed to initialize active trip screen.',
          error
        );
      } finally {
        setIsLoading(false);
      }
    }

    void initialize();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView
        style={styles.loadingContainer}
      >
        <ActivityIndicator
          color={theme.colors.primary}
        />

        <Text style={styles.loadingText}>
          {t('common.loading')}
        </Text>
      </SafeAreaView>
    );
  }

  if (!preparedTrip) {
    return null;
  }

  const safeForecastIndex =
    Math.min(
      forecastIndex,
      preparedTrip.forecast
        .points.length - 1
    );

  const currentPoint =
    preparedTrip.forecast.points[
      safeForecastIndex
    ];

  const currentRisk =
    calculateRisk(
      currentPoint,
      preparedTrip.trip.boatType,
      preparedTrip.trip.durationHours
    );

  function maybeShowRiskAlert(
    nextLevel: RiskLevel,
    nextScore: number,
    nextTime: string
  ): void {
    const shouldAlert =
      nextLevel === 'high' ||
      nextLevel === 'critical';

    if (
      !shouldAlert ||
      lastAlertedLevel === nextLevel
    ) {
      return;
    }

    setLastAlertedLevel(nextLevel);

    logger.warn(
      'ACTIVE_TRIP_SCREEN',
      'PREVENTIVE_RISK_ALERT_TRIGGERED',
      'Preventive risk alert triggered.',
      {
        forecastIndex:
          safeForecastIndex,
        level: nextLevel,
        score: nextScore,
        time: nextTime,
      }
    );

    Alert.alert(
      nextLevel === 'critical'
        ? t(
            'activeTrip.criticalRiskTitle'
          )
        : t(
            'activeTrip.highRiskTitle'
          ),
      t(
        'activeTrip.riskAlertMessage'
      )
    );
  }

  function simulateNextHour(): void {
    const nextIndex = Math.min(
      safeForecastIndex + 1,
      preparedTrip.forecast
        .points.length - 1
    );

    logger.info(
      'ACTIVE_TRIP_SCREEN',
      'FORECAST_SIMULATION_ADVANCED',
      'Demo forecast advanced to the next hourly point.',
      {
        previousIndex:
          safeForecastIndex,
        nextIndex,
      }
    );

    setForecastIndex(nextIndex);

    const nextPoint =
      preparedTrip.forecast.points[
        nextIndex
      ];

    const nextRisk =
      calculateRisk(
        nextPoint,
        preparedTrip.trip.boatType,
        preparedTrip.trip
          .durationHours
      );

    maybeShowRiskAlert(
      nextRisk.level,
      nextRisk.score,
      nextPoint.time
    );
  }

  function endTrip(): void {
    logger.info(
      'ACTIVE_TRIP_SCREEN',
      'TRIP_ENDED',
      'User ended the active trip.',
      {
        tripId:
          preparedTrip.trip.id,
      }
    );

    router.replace('/');
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.kicker}>
          {t('activeTrip.kicker')}
        </Text>

        <Text style={styles.title}>
          {t('activeTrip.title')}
        </Text>

        <View style={styles.statusCard}>
          <View style={styles.statusDot} />

          <View style={styles.flex}>
            <Text style={styles.statusTitle}>
              {t(
                'activeTrip.trackingActive'
              )}
            </Text>

            <Text style={styles.statusText}>
              {t(
                'activeTrip.offlineAvailable'
              )}
            </Text>
          </View>
        </View>

        <View style={styles.riskCard}>
          <Text style={styles.riskCaption}>
            {t(
              'activeTrip.forecastLevel',
              {
                time:
                  currentPoint.time.slice(
                    11,
                    16
                  ),
              }
            )}
          </Text>

          <Text style={styles.riskLabel}>
            {t(
              `risk.${currentRisk.level}`
            )}
          </Text>

          <Text style={styles.riskScore}>
            {t('activeTrip.score', {
              score: currentRisk.score,
            })}
          </Text>
        </View>

        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>
              {t('activeTrip.wind')}
            </Text>

            <Text style={styles.metricValue}>
              {formatMeasurement(
                currentPoint.windSpeedKmh,
                'km/h'
              )}
            </Text>
          </View>

          <View style={styles.metric}>
            <Text style={styles.metricLabel}>
              {t('activeTrip.waves')}
            </Text>

            <Text style={styles.metricValue}>
              {formatMeasurement(
                currentPoint.waveHeightM,
                'm',
                1
              )}
            </Text>
          </View>
        </View>

        {currentRisk.reasonKeys.length >
          0 && (
          <View style={styles.reasonBox}>
            <Text style={styles.reasonTitle}>
              {t(
                'activeTrip.watchedPoints'
              )}
            </Text>

            {currentRisk.reasonKeys.map(
              (reasonKey) => (
                <Text
                  key={reasonKey}
                  style={styles.reasonText}
                >
                  • {t(reasonKey)}
                </Text>
              )
            )}
          </View>
        )}

        <View style={styles.demoBox}>
          <Text style={styles.demoTitle}>
            {t('activeTrip.demoTitle')}
          </Text>

          <Text style={styles.demoText}>
            {t('activeTrip.demoText')}
          </Text>

          <Pressable
            onPress={simulateNextHour}
            style={styles.demoButton}
          >
            <Text
              style={styles.demoButtonText}
            >
              {t('activeTrip.nextHour')}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={endTrip}
          style={styles.endButton}
        >
          <Text style={styles.endButtonText}>
            {t('activeTrip.endTrip')}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:
      theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      theme.colors.background,
    gap: 10,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
  },
  flex: {
    flex: 1,
  },
  kicker: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    color: theme.colors.text,
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 18,
  },
  statusCard: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor:
      theme.colors.surface,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    paddingHorizontal: 15,
    marginBottom: 14,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor:
      theme.colors.primary,
    marginRight: 12,
  },
  statusTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  statusText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  riskCard: {
    borderRadius: theme.radius.lg,
    backgroundColor:
      theme.colors.primarySoft,
    padding: 22,
    marginBottom: 14,
  },
  riskCaption: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginBottom: 6,
  },
  riskLabel: {
    color: theme.colors.primary,
    fontSize: 32,
    fontWeight: '900',
  },
  riskScore: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 5,
  },
  metrics: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  metric: {
    flex: 1,
    minHeight: 88,
    borderRadius: 16,
    backgroundColor:
      theme.colors.surface,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    padding: 14,
  },
  metricLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: 6,
  },
  metricValue: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  reasonBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    backgroundColor:
      theme.colors.surface,
    padding: 15,
    marginBottom: 14,
  },
  reasonTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 7,
  },
  reasonText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  demoBox: {
    borderRadius: 18,
    backgroundColor: theme.colors.neutralSurface,
    padding: 16,
    marginBottom: 18,
  },
  demoTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 5,
  },
  demoText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  demoButton: {
    minHeight: 46,
    borderRadius: 14,
    backgroundColor:
      theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoButtonText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  endButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endButtonText: {
    color: theme.colors.danger,
    fontSize: 14,
    fontWeight: '800',
  },
  });
}
