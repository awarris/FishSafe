/**
 * Pre-departure conditions route.
 *
 * Reads the prepared trip from local storage, displays the normalized forecast,
 * calculates the current demo risk level, and lets the user start the trip.
 */

import { router } from 'expo-router';
import {
  useEffect,
  useMemo,
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

import { PrimaryButton } from '../components/primary-button';
import { calculateRisk } from '../risk/calculateRisk';
import { loadPreparedTrip } from '../storage/forecast.storage';
import { useAppTheme } from '../hooks/use-app-theme';
import type { AppTheme } from '../theme';
import type {
  PreparedTrip,
  RiskResult,
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

export default function ConditionsScreen() {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  const [preparedTrip, setPreparedTrip] =
    useState<PreparedTrip | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initialize():
      Promise<void> {
      logger.info(
        'CONDITIONS_SCREEN',
        'SCREEN_INITIALIZATION_STARTED',
        'Loading prepared trip for conditions screen.'
      );

      try {
        const storedTrip =
          await loadPreparedTrip();

        if (!isMounted) {
          return;
        }

        if (!storedTrip) {
          logger.warn(
            'CONDITIONS_SCREEN',
            'PREPARED_TRIP_MISSING',
            'No prepared trip is available.'
          );

          Alert.alert(
            t('conditions.noTripTitle'),
            t('conditions.noTripMessage')
          );

          router.replace(
            '/prepare-trip'
          );

          return;
        }

        setPreparedTrip(storedTrip);

        logger.info(
          'CONDITIONS_SCREEN',
          'SCREEN_INITIALIZATION_COMPLETED',
          'Prepared trip loaded for conditions screen.',
          {
            tripId:
              storedTrip.trip.id,
            forecastPoints:
              storedTrip.forecast
                .points.length,
          }
        );
      } catch (error) {
        logger.error(
          'CONDITIONS_SCREEN',
          'SCREEN_INITIALIZATION_FAILED',
          'Failed to initialize conditions screen.',
          error
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      isMounted = false;
    };
  }, [t]);

  const currentForecastPoint =
    preparedTrip?.forecast.points[0] ??
    null;

  const currentRisk:
    RiskResult | null = useMemo(() => {
      if (
        !preparedTrip ||
        !currentForecastPoint
      ) {
        return null;
      }

      return calculateRisk(
        currentForecastPoint,
        preparedTrip.trip.boatType,
        preparedTrip.trip
          .durationHours
      );
    }, [
      preparedTrip,
      currentForecastPoint,
    ]);

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

  if (
    !preparedTrip ||
    !currentForecastPoint ||
    !currentRisk
  ) {
    return null;
  }

  const visibleForecastPoints =
    preparedTrip.forecast.points.slice(
      0,
      Math.min(
        preparedTrip.trip.durationHours +
          1,
        9
      )
    );

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>
            ‹ {t('common.modify')}
          </Text>
        </Pressable>

        <Text style={styles.kicker}>
          {t('conditions.kicker')}
        </Text>

        <Text style={styles.title}>
          {t('conditions.title')}
        </Text>

        {currentRisk.isDemo && (
          <View style={styles.demoNotice}>
            <Text
              style={styles.demoNoticeTitle}
            >
              {t(
                'conditions.demoScoreTitle'
              )}
            </Text>

            <Text
              style={styles.demoNoticeText}
            >
              {t(
                'conditions.demoScoreText'
              )}
            </Text>
          </View>
        )}

        <View style={styles.riskCard}>
          <Text style={styles.riskCaption}>
            {t('conditions.currentLevel')}
          </Text>

          <Text style={styles.riskLabel}>
            {t(
              `risk.${currentRisk.level}`
            )}
          </Text>

          <Text style={styles.riskScore}>
            {t('conditions.score', {
              score: currentRisk.score,
            })}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>
          {t('conditions.now')}
        </Text>

        <View style={styles.metricGrid}>
          <View style={styles.metric}>
            <Text style={styles.metricLabel}>
              {t('conditions.wind')}
            </Text>

            <Text style={styles.metricValue}>
              {formatMeasurement(
                currentForecastPoint
                  .windSpeedKmh,
                'km/h'
              )}
            </Text>
          </View>

          <View style={styles.metric}>
            <Text style={styles.metricLabel}>
              {t('conditions.gusts')}
            </Text>

            <Text style={styles.metricValue}>
              {formatMeasurement(
                currentForecastPoint
                  .windGustsKmh,
                'km/h'
              )}
            </Text>
          </View>

          <View style={styles.metric}>
            <Text style={styles.metricLabel}>
              {t('conditions.waves')}
            </Text>

            <Text style={styles.metricValue}>
              {formatMeasurement(
                currentForecastPoint
                  .waveHeightM,
                'm',
                1
              )}
            </Text>
          </View>

          <View style={styles.metric}>
            <Text style={styles.metricLabel}>
              {t('conditions.swell')}
            </Text>

            <Text style={styles.metricValue}>
              {formatMeasurement(
                currentForecastPoint
                  .swellHeightM,
                'm',
                1
              )}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          {t('conditions.forecast')}
        </Text>

        <View style={styles.forecastList}>
          {visibleForecastPoints.map(
            (point, index) => {
              const risk =
                calculateRisk(
                  point,
                  preparedTrip.trip
                    .boatType,
                  preparedTrip.trip
                    .durationHours
                );

              return (
                <View
                  key={`${point.time}-${index}`}
                  style={
                    styles.forecastRow
                  }
                >
                  <View
                    style={
                      styles.forecastTimeBlock
                    }
                  >
                    <Text
                      style={
                        styles.forecastTime
                      }
                    >
                      {point.time.slice(
                        11,
                        16
                      )}
                    </Text>

                    <Text
                      style={
                        styles.forecastRisk
                      }
                    >
                      {t(
                        `risk.${risk.level}`
                      )}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.forecastMetrics
                    }
                  >
                    <Text
                      style={
                        styles.forecastText
                      }
                    >
                      {t(
                        'conditions.wind'
                      )}{' '}
                      {formatMeasurement(
                        point.windSpeedKmh,
                        'km/h'
                      )}
                    </Text>

                    <Text
                      style={
                        styles.forecastText
                      }
                    >
                      {t(
                        'conditions.waves'
                      )}{' '}
                      {formatMeasurement(
                        point.waveHeightM,
                        'm',
                        1
                      )}
                    </Text>
                  </View>
                </View>
              );
            }
          )}
        </View>

        <PrimaryButton
          label={t(
            'conditions.startTrip'
          )}
          onPress={() => {
            logger.info(
              'CONDITIONS_SCREEN',
              'TRIP_START_REQUESTED',
              'User started the prepared trip.',
              {
                tripId:
                  preparedTrip.trip.id,
              }
            );

            router.push('/active-trip');
          }}
        />

        <Text style={styles.offlineText}>
          {t('conditions.offlineSaved')}
        </Text>
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
    paddingTop: 10,
    paddingBottom: 36,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginBottom: 8,
  },
  backText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '700',
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
    lineHeight: 36,
    fontWeight: '900',
    marginBottom: 18,
  },
  demoNotice: {
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.warningSurface,
    borderWidth: 1,
    borderColor: theme.colors.warningBorder,
    padding: 14,
    marginBottom: 14,
  },
  demoNoticeTitle: {
    color: theme.colors.warningText,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
  },
  demoNoticeText: {
    color: theme.colors.warningText,
    fontSize: 12,
    lineHeight: 18,
  },
  riskCard: {
    borderRadius: theme.radius.lg,
    backgroundColor:
      theme.colors.primarySoft,
    padding: 22,
    marginBottom: 24,
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
    marginTop: 6,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  metric: {
    width: '48%',
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
    marginBottom: 7,
  },
  metricValue: {
    color: theme.colors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  forecastList: {
    gap: 9,
    marginBottom: 20,
  },
  forecastRow: {
    minHeight: 66,
    borderRadius: 15,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    backgroundColor:
      theme.colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  forecastTimeBlock: {
    width: 76,
  },
  forecastTime: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  forecastRisk: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
  },
  forecastMetrics: {
    flex: 1,
  },
  forecastText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  offlineText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 10,
  },
  });
}
