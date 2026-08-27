/**
 * Trip preparation route.
 *
 * The screen deliberately keeps the interaction linear and touch-friendly:
 * 1. choose a location;
 * 2. choose a duration;
 * 3. choose a vessel.
 *
 * The screen does not expose technical forecast details. Once all three
 * choices are complete, it downloads and stores the forecast before opening
 * the risk screen.
 */

import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppAlertModal, type AppAlertVariant } from '../components/app-alert-modal';
import { NetworkStatusBanner } from '../components/network-status-banner';
import { APP_CONFIG } from '../config/app-config';
import { useAppTheme } from '../hooks/use-app-theme';
import { useCurrentLocation } from '../hooks/use-current-location';
import { useNetworkStatus } from '../hooks/use-network-status';
import { getForecastBundle } from '../services/open-meteo-service';
import { savePreparedTrip } from '../storage/forecast-storage';
import type { AppTheme } from '../theme';
import type {
  BoatType,
  LocationSource,
  TripDraft,
} from '../types/trip';
import { logger } from '../utils/logger';

const DURATIONS = [2, 4, 6, 8] as const;

const BOAT_OPTIONS: Array<{
  id: BoatType;
  translationKey: string;
  symbol: string;
}> = [
  {
    id: 'canoe',
    translationKey: 'prepareTrip.boatCanoe',
    symbol: '≋',
  },
  {
    id: 'motorized',
    translationKey: 'prepareTrip.boatMotorized',
    symbol: '≈',
  },
  {
    id: 'small-boat',
    translationKey: 'prepareTrip.boatSmallBoat',
    symbol: '⌁',
  },
];

type StepNumber = 1 | 2 | 3;

type StepHeaderProps = {
  step: StepNumber;
  title: string;
  description: string;
  isComplete: boolean;
  theme: AppTheme;
};

function StepHeader({
  step,
  title,
  description,
  isComplete,
  theme,
}: StepHeaderProps) {
  const styles = createStyles(theme);

  return (
    <View style={styles.stepHeader}>
      <View
        style={[
          styles.stepNumber,
          isComplete && styles.stepNumberComplete,
        ]}
      >
        <Text
          style={[
            styles.stepNumberText,
            isComplete && styles.stepNumberTextComplete,
          ]}
        >
          {isComplete ? '✓' : step}
        </Text>
      </View>

      <View style={styles.flex}>
        <Text style={styles.stepTitle}>
          {title}
        </Text>

        <Text style={styles.stepDescription}>
          {description}
        </Text>
      </View>
    </View>
  );
}

export default function PrepareTripScreen() {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const { isOffline } = useNetworkStatus();
  const styles = createStyles(theme);

  const [duration, setDuration] =
    useState<number | null>(null);

  const [boatType, setBoatType] =
    useState<BoatType | null>(null);

  const [
    isDemoLocationEnabled,
    setIsDemoLocationEnabled,
  ] = useState(false);

  const [isAnalyzing, setIsAnalyzing] =
    useState(false);

  const [appAlert, setAppAlert] =
    useState<{
      variant: AppAlertVariant;
      eyebrow: string;
      title: string;
      message: string;
    } | null>(null);

  const {
    location,
    loading: isLocationLoading,
    errorCode: locationErrorCode,
    requestLocation,
  } = useCurrentLocation();

  const effectiveLocation =
    isDemoLocationEnabled
      ? APP_CONFIG.demoLocation
      : location;

  const locationSource: LocationSource =
    isDemoLocationEnabled
      ? 'demo'
      : 'gps';

  const isLocationComplete =
    effectiveLocation !== null;

  const isDurationComplete =
    duration !== null;

  const isVesselComplete =
    boatType !== null;

  const canAnalyze = useMemo(
    () =>
      isLocationComplete &&
      isDurationComplete &&
      isVesselComplete &&
      !isAnalyzing &&
      !isOffline,
    [
      isLocationComplete,
      isDurationComplete,
      isVesselComplete,
      isAnalyzing,
      isOffline,
    ]
  );

  const locationErrorMessage =
    locationErrorCode === 'permission-denied'
      ? t(
          'prepareTrip.locationPermissionError'
        )
      : locationErrorCode ===
        'location-unavailable'
      ? t(
          'prepareTrip.locationUnavailableError'
        )
      : null;

  const selectedBoatLabel =
    boatType
      ? t(
          BOAT_OPTIONS.find(
            (option) =>
              option.id === boatType
          )?.translationKey ??
            'prepareTrip.boatCanoe'
        )
      : null;

  const selectedLocationLabel =
    effectiveLocation
      ? isDemoLocationEnabled
        ? t('prepareTrip.demoLocation')
        : t('prepareTrip.gpsLocation')
      : null;

  const summaryText =
    selectedLocationLabel &&
    duration &&
    selectedBoatLabel
      ? [
          selectedLocationLabel,
          `${duration} h`,
          selectedBoatLabel,
        ].join(
          t(
            'prepareTrip.summarySeparator'
          )
        )
      : t(
          'prepareTrip.summaryWaiting'
        );

  async function handleGpsRequest():
    Promise<void> {
    logger.info(
      'TRIP_PREPARATION',
      'GPS_SELECTION_REQUESTED',
      'User requested GPS location.'
    );

    setIsDemoLocationEnabled(false);
    await requestLocation();
  }

  function handleDemoLocation():
    void {
    logger.info(
      'TRIP_PREPARATION',
      'DEMO_LOCATION_SELECTED',
      'Demo location selected.',
      APP_CONFIG.demoLocation
    );

    setIsDemoLocationEnabled(true);
  }

  function handleDurationSelection(
    hours: number
  ): void {
    logger.debug(
      'TRIP_PREPARATION',
      'TRIP_DURATION_SELECTED',
      'Trip duration selected.',
      { hours }
    );

    setDuration(hours);
  }

  function handleVesselSelection(
    nextBoatType: BoatType
  ): void {
    logger.debug(
      'TRIP_PREPARATION',
      'VESSEL_TYPE_SELECTED',
      'Vessel type selected.',
      {
        boatType: nextBoatType,
      }
    );

    setBoatType(nextBoatType);
  }

  async function handleAnalyze():
    Promise<void> {
    if (isOffline) {
      logger.warn(
        'TRIP_PREPARATION',
        'TRIP_ANALYSIS_BLOCKED_OFFLINE',
        'Trip analysis requires an Internet connection.'
      );

      setAppAlert({
        variant: 'warning',
        eyebrow: t(
          'alerts.attentionEyebrow'
        ),
        title: t(
          'network.analysisBlockedTitle'
        ),
        message: t(
          'network.analysisBlockedMessage'
        ),
      });

      return;
    }

    if (
      !canAnalyze ||
      !effectiveLocation ||
      !duration ||
      !boatType
    ) {
      setAppAlert({
        variant: 'info',
        eyebrow: t(
          'alerts.informationEyebrow'
        ),
        title: t(
          'prepareTrip.missingTitle'
        ),
        message: t(
          'prepareTrip.missingMessage'
        ),
      });

      return;
    }

    setIsAnalyzing(true);

    const trip: TripDraft = {
      id: `trip-${Date.now()}`,
      createdAt:
        new Date().toISOString(),
      coordinates: {
        latitude:
          effectiveLocation.latitude,
        longitude:
          effectiveLocation.longitude,
      },
      locationSource,
      durationHours: duration,
      boatType,
    };

    logger.info(
      'TRIP_PREPARATION',
      'TRIP_ANALYSIS_STARTED',
      'Starting trip preparation analysis.',
      trip
    );

    try {
      const forecast =
        await getForecastBundle(
          trip.coordinates,
          trip.durationHours
        );

      await savePreparedTrip({
        trip,
        forecast,
      });

      logger.info(
        'TRIP_PREPARATION',
        'TRIP_ANALYSIS_COMPLETED',
        'Trip forecast fetched and stored successfully.',
        {
          tripId: trip.id,
          forecastPoints:
            forecast.points.length,
        }
      );

      router.push('/conditions');
    } catch (error) {
      logger.error(
        'TRIP_PREPARATION',
        'TRIP_ANALYSIS_FAILED',
        'Trip preparation analysis failed.',
        error
      );

      setAppAlert({
        variant: 'warning',
        eyebrow: t(
          'alerts.attentionEyebrow'
        ),
        title: t(
          'prepareTrip.analysisErrorTitle'
        ),
        message: t(
          'prepareTrip.analysisErrorMessage'
        ),
      });
    } finally {
      setIsAnalyzing(false);
    }
  }

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
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t(
              'common.back'
            )}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text
              style={styles.backSymbol}
            >
              ‹
            </Text>
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.title}>
              {t(
                'prepareTrip.title'
              )}
            </Text>

            <Text
              style={styles.subtitle}
            >
              {t(
                'prepareTrip.subtitle'
              )}
            </Text>
          </View>

          <View
            style={styles.headerSpacer}
          />
        </View>

        <View
          style={styles.progressCard}
        >
          {[
            {
              number: 1 as StepNumber,
              label: t(
                'prepareTrip.stepPosition'
              ),
              complete:
                isLocationComplete,
            },
            {
              number: 2 as StepNumber,
              label: t(
                'prepareTrip.stepDuration'
              ),
              complete:
                isDurationComplete,
            },
            {
              number: 3 as StepNumber,
              label: t(
                'prepareTrip.stepVessel'
              ),
              complete:
                isVesselComplete,
            },
          ].map(
            (
              item,
              index,
              array
            ) => (
              <View
                key={item.number}
                style={
                  styles.progressItem
                }
              >
                <View
                  style={
                    styles.progressTopRow
                  }
                >
                  <View
                    style={[
                      styles.progressCircle,
                      item.complete &&
                        styles.progressCircleComplete,
                    ]}
                  >
                    <Text
                      style={[
                        styles.progressNumber,
                        item.complete &&
                          styles.progressNumberComplete,
                      ]}
                    >
                      {item.complete
                        ? '✓'
                        : item.number}
                    </Text>
                  </View>

                  {index <
                    array.length - 1 && (
                    <View
                      style={[
                        styles.progressLine,
                        item.complete &&
                          styles.progressLineComplete,
                      ]}
                    />
                  )}
                </View>

                <Text
                  style={[
                    styles.progressLabel,
                    item.complete &&
                      styles.progressLabelComplete,
                  ]}
                >
                  {item.label}
                </Text>
              </View>
            )
          )}
        </View>

        <NetworkStatusBanner />

        <View style={styles.sectionCard}>
          <StepHeader
            step={1}
            title={t(
              'prepareTrip.locationTitle'
            )}
            description={t(
              'prepareTrip.locationHelp'
            )}
            isComplete={
              isLocationComplete
            }
            theme={theme}
          />

          <View
            style={styles.locationGrid}
          >
            <Pressable
              disabled={
                isLocationLoading
              }
              onPress={() => {
                void handleGpsRequest();
              }}
              style={({ pressed }) => [
                styles.locationOption,
                !isDemoLocationEnabled &&
                  location &&
                  styles.optionSelected,
                pressed &&
                  styles.optionPressed,
                isLocationLoading &&
                  styles.optionDisabled,
              ]}
            >
              <View
                style={[
                  styles.optionSymbol,
                  !isDemoLocationEnabled &&
                    location &&
                    styles.optionSymbolSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionSymbolText,
                    !isDemoLocationEnabled &&
                      location &&
                      styles.optionSymbolTextSelected,
                  ]}
                >
                  ⌖
                </Text>
              </View>

              <View style={styles.flex}>
                <Text
                  style={
                    styles.optionTitle
                  }
                >
                  {isLocationLoading
                    ? t(
                        'prepareTrip.locating'
                      )
                    : t(
                        'prepareTrip.useGps'
                      )}
                </Text>

                <Text
                  style={
                    styles.optionDescription
                  }
                >
                  {t(
                    'prepareTrip.gpsLocationHelp'
                  )}
                </Text>
              </View>

              {!isDemoLocationEnabled &&
                location && (
                  <View
                    style={
                      styles.selectedBadge
                    }
                  >
                    <Text
                      style={
                        styles.selectedBadgeText
                      }
                    >
                      ✓
                    </Text>
                  </View>
                )}
            </Pressable>

            <Pressable
              onPress={
                handleDemoLocation
              }
              style={({ pressed }) => [
                styles.locationOption,
                isDemoLocationEnabled &&
                  styles.optionSelected,
                pressed &&
                  styles.optionPressed,
              ]}
            >
              <View
                style={[
                  styles.optionSymbol,
                  isDemoLocationEnabled &&
                    styles.optionSymbolSelected,
                ]}
              >
                <Text
                  style={[
                    styles.optionSymbolText,
                    isDemoLocationEnabled &&
                      styles.optionSymbolTextSelected,
                  ]}
                >
                  ≋
                </Text>
              </View>

              <View style={styles.flex}>
                <Text
                  style={
                    styles.optionTitle
                  }
                >
                  {t(
                    'prepareTrip.useDemo'
                  )}
                </Text>

                <Text
                  style={
                    styles.optionDescription
                  }
                >
                  {t(
                    'prepareTrip.demoLocationHelp'
                  )}
                </Text>
              </View>

              {isDemoLocationEnabled && (
                <View
                  style={
                    styles.selectedBadge
                  }
                >
                  <Text
                    style={
                      styles.selectedBadgeText
                    }
                  >
                    ✓
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          {effectiveLocation && (
            <View
              style={styles.locationResult}
            >
              <View
                style={
                  styles.locationResultDot
                }
              />

              <View style={styles.flex}>
                <Text
                  style={
                    styles.locationResultTitle
                  }
                >
                  {selectedLocationLabel}
                </Text>

                <Text
                  style={
                    styles.locationCoordinates
                  }
                >
                  {effectiveLocation.latitude.toFixed(
                    5
                  )}
                  ,{' '}
                  {effectiveLocation.longitude.toFixed(
                    5
                  )}
                </Text>
              </View>
            </View>
          )}

          {locationErrorMessage &&
            !isDemoLocationEnabled && (
              <Text
                style={styles.errorText}
              >
                {locationErrorMessage}
              </Text>
            )}

          <View style={styles.infoStrip}>
            <View style={styles.infoIcon}>
              <Text style={styles.infoIconText}>
                i
              </Text>
            </View>

            <Text style={styles.infoText}>
              {t(
                'prepareTrip.locationInfo'
              )}
            </Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <StepHeader
            step={2}
            title={t(
              'prepareTrip.durationTitle'
            )}
            description={t(
              'prepareTrip.durationHelp'
            )}
            isComplete={
              isDurationComplete
            }
            theme={theme}
          />

          <View
            style={styles.durationGrid}
          >
            {DURATIONS.map(
              (hours) => {
                const isSelected =
                  duration === hours;

                return (
                  <Pressable
                    key={hours}
                    onPress={() =>
                      handleDurationSelection(
                        hours
                      )
                    }
                    style={({ pressed }) => [
                      styles.durationOption,
                      isSelected &&
                        styles.durationSelected,
                      pressed &&
                        styles.optionPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.durationClock,
                        isSelected &&
                          styles.durationTextSelected,
                      ]}
                    >
                      ◷
                    </Text>

                    <Text
                      style={[
                        styles.durationText,
                        isSelected &&
                          styles.durationTextSelected,
                      ]}
                    >
                      {hours} h
                    </Text>

                    {isSelected && (
                      <View
                        style={
                          styles.durationCheck
                        }
                      >
                        <Text
                          style={
                            styles.durationCheckText
                          }
                        >
                          ✓
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              }
            )}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <StepHeader
            step={3}
            title={t(
              'prepareTrip.boatTitle'
            )}
            description={t(
              'prepareTrip.boatHelp'
            )}
            isComplete={
              isVesselComplete
            }
            theme={theme}
          />

          <View style={styles.boatGrid}>
            {BOAT_OPTIONS.map(
              ({
                id,
                translationKey,
                symbol,
              }) => {
                const isSelected =
                  boatType === id;

                return (
                  <Pressable
                    key={id}
                    onPress={() =>
                      handleVesselSelection(
                        id
                      )
                    }
                    style={({ pressed }) => [
                      styles.boatOption,
                      isSelected &&
                        styles.boatSelected,
                      pressed &&
                        styles.optionPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.boatSymbol,
                        isSelected &&
                          styles.boatSymbolSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.boatSymbolText,
                          isSelected &&
                            styles.boatSymbolTextSelected,
                        ]}
                      >
                        {symbol}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.boatText,
                        isSelected &&
                          styles.boatTextSelected,
                      ]}
                    >
                      {t(
                        translationKey
                      )}
                    </Text>

                    {isSelected && (
                      <View
                        style={
                          styles.selectedBadge
                        }
                      >
                        <Text
                          style={
                            styles.selectedBadgeText
                          }
                        >
                          ✓
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              }
            )}
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View
            style={styles.summaryHeader}
          >
            <View
              style={styles.summaryShield}
            >
              <Text
                style={
                  styles.summaryShieldText
                }
              >
                ✓
              </Text>
            </View>

            <View style={styles.flex}>
              <Text
                style={styles.summaryLabel}
              >
                {t(
                  'prepareTrip.summaryTitle'
                )}
              </Text>

              <Text
                style={
                  styles.summaryValue
                }
              >
                {summaryText}
              </Text>
            </View>
          </View>

          <Pressable
            disabled={
              !canAnalyze ||
              isAnalyzing
            }
            onPress={() => {
              void handleAnalyze();
            }}
            style={({ pressed }) => [
              styles.analyzeButton,
              !canAnalyze &&
                styles.analyzeButtonDisabled,
              pressed &&
                canAnalyze &&
                styles.analyzeButtonPressed,
            ]}
          >
            {isAnalyzing ? (
              <>
                <ActivityIndicator
                  color={
                    theme.mode === 'dark'
                      ? '#0F1513'
                      : theme.colors.white
                  }
                />

                <Text
                  style={
                    styles.analyzeButtonText
                  }
                >
                  {t(
                    'prepareTrip.analyzing'
                  )}
                </Text>
              </>
            ) : (
              <>
                <Text
                  style={
                    styles.analyzeButtonText
                  }
                >
                  {t(
                    'prepareTrip.analyze'
                  )}
                </Text>

                <Text
                  style={
                    styles.analyzeArrow
                  }
                >
                  →
                </Text>
              </>
            )}
          </Pressable>
        </View>

        <Text style={styles.privacyNote}>
          ⌾{' '}
          {t(
            'prepareTrip.privacyNote'
          )}
        </Text>
      </ScrollView>

        <AppAlertModal
          visible={appAlert !== null}
          variant={
            appAlert?.variant ??
            'info'
          }
          eyebrow={
            appAlert?.eyebrow
          }
          title={
            appAlert?.title ?? ''
          }
          message={
            appAlert?.message ?? ''
          }
          primaryLabel={t(
            'alerts.understood'
          )}
          onPrimary={() =>
            setAppAlert(null)
          }
        />
    </SafeAreaView>
  );
}

function createStyles(
  theme: AppTheme
) {
  const selectedTextColor =
    theme.mode === 'dark'
      ? '#0F1513'
      : theme.colors.white;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor:
        theme.colors.background,
    },
    content: {
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 40,
      gap: 14,
    },
    flex: {
      flex: 1,
    },
    headerRow: {
      minHeight: 72,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    backButton: {
      width: 46,
      height: 46,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      backgroundColor:
        theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backSymbol: {
      color: theme.colors.text,
      fontSize: 34,
      lineHeight: 35,
      fontWeight: '400',
      marginTop: -3,
    },
    headerText: {
      flex: 1,
      alignItems: 'center',
    },
    headerSpacer: {
      width: 46,
      height: 46,
    },
    title: {
      color: theme.colors.text,
      fontSize: 27,
      lineHeight: 32,
      fontWeight: '900',
      textAlign: 'center',
    },
    subtitle: {
      color:
        theme.colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
      textAlign: 'center',
      marginTop: 4,
    },
    progressCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor:
        theme.colors.surface,
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      borderRadius:
        theme.radius.md,
      paddingHorizontal: 14,
      paddingVertical: 15,
    },
    progressItem: {
      flex: 1,
    },
    progressTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    progressCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor:
        theme.colors.neutralSurface,
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressCircleComplete: {
      backgroundColor:
        theme.colors.primary,
      borderColor:
        theme.colors.primary,
    },
    progressNumber: {
      color:
        theme.colors.textMuted,
      fontSize: 13,
      fontWeight: '900',
    },
    progressNumberComplete: {
      color: selectedTextColor,
    },
    progressLine: {
      flex: 1,
      height: 2,
      marginHorizontal: 7,
      backgroundColor:
        theme.colors.border,
    },
    progressLineComplete: {
      backgroundColor:
        theme.colors.primary,
    },
    progressLabel: {
      color:
        theme.colors.textMuted,
      fontSize: 11,
      fontWeight: '700',
      marginTop: 7,
      paddingLeft: 1,
    },
    progressLabelComplete: {
      color:
        theme.colors.primary,
      fontWeight: '900',
    },
    sectionCard: {
      backgroundColor:
        theme.colors.surface,
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      borderRadius:
        theme.radius.md,
      padding: 16,
    },
    stepHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      marginBottom: 15,
    },
    stepNumber: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor:
        theme.colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepNumberComplete: {
      backgroundColor:
        theme.colors.primary,
    },
    stepNumberText: {
      color:
        theme.colors.primary,
      fontSize: 16,
      fontWeight: '900',
    },
    stepNumberTextComplete: {
      color: selectedTextColor,
    },
    stepTitle: {
      color: theme.colors.text,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '900',
    },
    stepDescription: {
      color:
        theme.colors.textMuted,
      fontSize: 12,
      lineHeight: 17,
      marginTop: 3,
    },
    locationGrid: {
      gap: 10,
    },
    locationOption: {
      minHeight: 76,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 13,
      paddingVertical: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      backgroundColor:
        theme.colors.background,
    },
    optionSelected: {
      borderColor:
        theme.colors.primary,
      backgroundColor:
        theme.colors.primarySoft,
    },
    optionPressed: {
      opacity: 0.82,
    },
    optionDisabled: {
      opacity: 0.55,
    },
    optionSymbol: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor:
        theme.colors.neutralSurface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionSymbolSelected: {
      backgroundColor:
        theme.colors.primary,
    },
    optionSymbolText: {
      color:
        theme.colors.primary,
      fontSize: 25,
      fontWeight: '900',
    },
    optionSymbolTextSelected: {
      color: selectedTextColor,
    },
    optionTitle: {
      color: theme.colors.text,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '900',
    },
    optionDescription: {
      color:
        theme.colors.textMuted,
      fontSize: 11,
      lineHeight: 16,
      marginTop: 3,
    },
    selectedBadge: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor:
        theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectedBadgeText: {
      color: selectedTextColor,
      fontSize: 13,
      fontWeight: '900',
    },
    locationResult: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 10,
      borderRadius: 13,
      backgroundColor:
        theme.colors.surfaceSoft,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    locationResultDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor:
        theme.colors.primary,
    },
    locationResultTitle: {
      color:
        theme.colors.primary,
      fontSize: 12,
      fontWeight: '900',
    },
    locationCoordinates: {
      color:
        theme.colors.textMuted,
      fontSize: 11,
      marginTop: 2,
    },
    errorText: {
      color:
        theme.colors.danger,
      fontSize: 12,
      lineHeight: 17,
      marginTop: 10,
    },
    infoStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      marginTop: 12,
      borderRadius: 13,
      backgroundColor:
        theme.colors.surfaceSoft,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    infoIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1,
      borderColor:
        theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoIconText: {
      color:
        theme.colors.primary,
      fontSize: 12,
      fontWeight: '900',
    },
    infoText: {
      flex: 1,
      color:
        theme.colors.textMuted,
      fontSize: 11,
      lineHeight: 16,
    },
    durationGrid: {
      flexDirection: 'row',
      gap: 8,
    },
    durationOption: {
      flex: 1,
      minHeight: 62,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      backgroundColor:
        theme.colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      gap: 2,
    },
    durationSelected: {
      borderColor:
        theme.colors.primary,
      backgroundColor:
        theme.colors.primarySoft,
    },
    durationClock: {
      color:
        theme.colors.textMuted,
      fontSize: 15,
    },
    durationText: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '900',
    },
    durationTextSelected: {
      color:
        theme.colors.primary,
    },
    durationCheck: {
      position: 'absolute',
      top: 5,
      right: 5,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor:
        theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    durationCheckText: {
      color: selectedTextColor,
      fontSize: 10,
      fontWeight: '900',
    },
    boatGrid: {
      gap: 9,
    },
    boatOption: {
      minHeight: 66,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderRadius: 15,
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      backgroundColor:
        theme.colors.background,
      paddingHorizontal: 13,
      paddingVertical: 10,
    },
    boatSelected: {
      borderColor:
        theme.colors.primary,
      backgroundColor:
        theme.colors.primarySoft,
    },
    boatSymbol: {
      width: 42,
      height: 42,
      borderRadius: 13,
      backgroundColor:
        theme.colors.neutralSurface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    boatSymbolSelected: {
      backgroundColor:
        theme.colors.primary,
    },
    boatSymbolText: {
      color:
        theme.colors.primary,
      fontSize: 24,
      fontWeight: '900',
    },
    boatSymbolTextSelected: {
      color: selectedTextColor,
    },
    boatText: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '800',
    },
    boatTextSelected: {
      color:
        theme.colors.primary,
      fontWeight: '900',
    },
    summaryCard: {
      borderRadius:
        theme.radius.lg,
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      backgroundColor:
        theme.colors.primarySoft,
      padding: 16,
      gap: 14,
    },
    summaryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    summaryShield: {
      width: 46,
      height: 46,
      borderRadius: 16,
      backgroundColor:
        theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryShieldText: {
      color: selectedTextColor,
      fontSize: 20,
      fontWeight: '900',
    },
    summaryLabel: {
      color:
        theme.colors.primary,
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    summaryValue: {
      color: theme.colors.text,
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '900',
      marginTop: 4,
    },
    analyzeButton: {
      minHeight: 56,
      borderRadius: 17,
      paddingHorizontal: 18,
      backgroundColor:
        theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    analyzeButtonDisabled: {
      opacity: 0.42,
    },
    analyzeButtonPressed: {
      opacity: 0.86,
    },
    analyzeButtonText: {
      color: selectedTextColor,
      fontSize: 15,
      fontWeight: '900',
    },
    analyzeArrow: {
      color: selectedTextColor,
      fontSize: 22,
      fontWeight: '700',
    },
    privacyNote: {
      color:
        theme.colors.textMuted,
      fontSize: 10,
      lineHeight: 15,
      textAlign: 'center',
      paddingHorizontal: 16,
    },
  });
}
