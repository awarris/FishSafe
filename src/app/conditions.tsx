/**
 * Pre-departure conditions route.
 *
 * Displays the two inputs used by the current risk grid: wind speed and wave
 * height. The final level is the highest level produced by either variable.
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
import {
  SafeAreaView,
} from 'react-native-safe-area-context';
import {
  useTranslation,
} from 'react-i18next';

import { NetworkStatusBanner } from '../components/network-status-banner';
import {
  PrimaryButton,
} from '../components/primary-button';
import {
  getRiskPalette,
  RiskStatusCard,
} from '../components/risk-status-card';
import {
  useAppTheme,
} from '../hooks/use-app-theme';
import {
  calculateRisk,
} from '../risk/calculate-risk';
import {
  loadPreparedTrip,
} from '../storage/forecast-storage';
import type {
  AppTheme,
} from '../theme';
import type {
  PreparedTrip,
} from '../types/trip';
import {
  logger,
} from '../utils/logger';

function formatWind(
  value: number
): string {
  return `${value.toFixed(0)} km/h`;
}

function formatWaves(
  value: number
): string {
  return `${value.toFixed(1)} m`;
}

export default function ConditionsScreen() {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles =
    createStyles(theme);

  const [
    preparedTrip,
    setPreparedTrip,
  ] = useState<PreparedTrip | null>(
    null
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initialize():
      Promise<void> {
      logger.info(
        'CONDITIONS_SCREEN',
        'SCREEN_INITIALIZATION_STARTED',
        'Loading prepared trip for pre-departure analysis.'
      );

      try {
        const storedTrip =
          await loadPreparedTrip();

        if (!isMounted) {
          return;
        }

        if (!storedTrip) {
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
          'Prepared trip loaded for pre-departure analysis.',
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
          'Failed to initialize pre-departure conditions screen.',
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

  const currentPoint =
    preparedTrip?.forecast.points[0] ??
    null;

  const currentRisk =
    useMemo(() => {
      if (!currentPoint) {
        return null;
      }

      return calculateRisk(
        currentPoint
      );
    }, [currentPoint]);

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
    !currentPoint ||
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
      edges={[
        'top',
        'left',
        'right',
      ]}
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
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

        <NetworkStatusBanner
          forecastFetchedAt={preparedTrip.forecast.fetchedAt}
        />

        <RiskStatusCard
          caption={t(
            'conditions.currentLevel'
          )}
          risk={currentRisk}
        />

        <Text style={styles.sectionTitle}>
          {t('conditions.now')}
        </Text>

        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text
              style={styles.metricLabel}
            >
              {t('conditions.wind')}
            </Text>

            <Text
              style={styles.metricValue}
            >
              {formatWind(
                currentPoint.windSpeedKmh
              )}
            </Text>
          </View>

          <View style={styles.metric}>
            <Text
              style={styles.metricLabel}
            >
              {t('conditions.waves')}
            </Text>

            <Text
              style={styles.metricValue}
            >
              {formatWaves(
                currentPoint.waveHeightM
              )}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          {t('conditions.forecast')}
        </Text>

        <View style={styles.forecastList}>
          {visibleForecastPoints.map(
            (point) => {
              const risk =
                calculateRisk(point);

              const palette =
                getRiskPalette(
                  theme,
                  risk.level
                );

              return (
                <View
                  key={point.time}
                  style={styles.forecastRow}
                >
                  <View
                    style={[
                      styles.riskIndicator,
                      {
                        backgroundColor:
                          palette.foreground,
                      },
                    ]}
                  />

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
                      style={[
                        styles.forecastLevel,
                        {
                          color:
                            palette.foreground,
                        },
                      ]}
                    >
                      {t(
                        `risk.${risk.level}`
                      )}
                    </Text>
                  </View>

                  <View
                    style={
                      styles.forecastValues
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
                      {formatWind(
                        point.windSpeedKmh
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
                      {formatWaves(
                        point.waveHeightM
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

            router.push(
              '/active-trip'
            );
          }}
        />

        <Text style={styles.offlineText}>
          {t(
            'conditions.offlineSaved'
          )}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(
  theme: AppTheme
) {
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
      color:
        theme.colors.textMuted,
      fontSize: 14,
    },
    content: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 36,
      gap: 18,
    },
    backButton: {
      alignSelf: 'flex-start',
      paddingVertical: 6,
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
    },
    title: {
      color: theme.colors.text,
      fontSize: 30,
      lineHeight: 36,
      fontWeight: '900',
    },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: '900',
      marginTop: 6,
    },
    metrics: {
      flexDirection: 'row',
      gap: 10,
    },
    metric: {
      flex: 1,
      minHeight: 92,
      borderRadius: 16,
      backgroundColor:
        theme.colors.surface,
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      padding: 14,
    },
    metricLabel: {
      color:
        theme.colors.textMuted,
      fontSize: 12,
      marginBottom: 8,
    },
    metricValue: {
      color: theme.colors.text,
      fontSize: 21,
      fontWeight: '900',
    },
    forecastList: {
      gap: 9,
    },
    forecastRow: {
      minHeight: 68,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      backgroundColor:
        theme.colors.surface,
      paddingHorizontal: 13,
      paddingVertical: 11,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
    },
    riskIndicator: {
      width: 5,
      height: 38,
      borderRadius: 999,
    },
    forecastTimeBlock: {
      width: 70,
    },
    forecastTime: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: '900',
    },
    forecastLevel: {
      fontSize: 11,
      fontWeight: '800',
      marginTop: 3,
    },
    forecastValues: {
      flex: 1,
    },
    forecastText: {
      color:
        theme.colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
    },
    offlineText: {
      color:
        theme.colors.textMuted,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
    },
  });
}
