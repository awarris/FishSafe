/**
 * Trip preparation route.
 *
 * Collects the minimum information required to prepare a trip:
 * location, expected duration, and vessel type.
 *
 * Once complete, it downloads forecast data and persists the prepared trip
 * before navigating to the pre-departure conditions screen.
 */

import { router } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { APP_CONFIG } from '../config/app.config';
import { useCurrentLocation } from '../hooks/use-current-location';
import { getForecastBundle } from '../services/openMeteo.service';
import { savePreparedTrip } from '../storage/forecast.storage';
import { useAppTheme } from '../hooks/use-app-theme';
import type { AppTheme } from '../theme';
import type {
  BoatType,
  LocationSource,
  TripDraft,
} from '../types/trip';
import { logger } from '../utils/logger';

const DURATIONS = [2, 4, 6, 8];

const BOAT_OPTIONS: Array<{
  id: BoatType;
  translationKey: string;
}> = [
  {
    id: 'canoe',
    translationKey: 'prepareTrip.boatCanoe',
  },
  {
    id: 'motorized',
    translationKey: 'prepareTrip.boatMotorized',
  },
  {
    id: 'small-boat',
    translationKey: 'prepareTrip.boatSmallBoat',
  },
];

export default function PrepareTripScreen() {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
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

  const locationSource:
    LocationSource =
      isDemoLocationEnabled
        ? 'demo'
        : 'gps';

  const canAnalyze = useMemo(
    () =>
      effectiveLocation !== null &&
      duration !== null &&
      boatType !== null &&
      !isAnalyzing,
    [
      effectiveLocation,
      duration,
      boatType,
      isAnalyzing,
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
    logger.warn(
      'TRIP_PREPARATION',
      'DEMO_LOCATION_SELECTED',
      'Demo location selected.',
      APP_CONFIG.demoLocation
    );

    setIsDemoLocationEnabled(true);
  }

  async function handleAnalyze():
    Promise<void> {
    if (
      !canAnalyze ||
      !effectiveLocation ||
      !duration ||
      !boatType
    ) {
      Alert.alert(
        t('prepareTrip.missingTitle'),
        t('prepareTrip.missingMessage')
      );

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

      Alert.alert(
        t('prepareTrip.analysisErrorTitle'),
        t(
          'prepareTrip.analysisErrorMessage'
        )
      );
    } finally {
      setIsAnalyzing(false);
    }
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
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>
            ‹ {t('common.back')}
          </Text>
        </Pressable>

        <Text style={styles.kicker}>
          {t('prepareTrip.kicker')}
        </Text>

        <Text style={styles.title}>
          {t('prepareTrip.title')}
        </Text>

        <Text style={styles.subtitle}>
          {t('prepareTrip.subtitle')}
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>
            {t('prepareTrip.locationTitle')}
          </Text>

          <Text style={styles.help}>
            {t('prepareTrip.locationHelp')}
          </Text>

          {effectiveLocation ? (
            <View style={styles.locationSuccess}>
              <View style={styles.successDot} />

              <View style={styles.flex}>
                <Text style={styles.locationTitle}>
                  {isDemoLocationEnabled
                    ? t(
                        'prepareTrip.demoLocation'
                      )
                    : t(
                        'prepareTrip.gpsLocation'
                      )}
                </Text>

                <Text style={styles.locationCoords}>
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
          ) : (
            <View style={styles.locationEmpty}>
              <Text
                style={styles.locationEmptyText}
              >
                {t('prepareTrip.noLocation')}
              </Text>
            </View>
          )}

          {locationErrorMessage &&
            !isDemoLocationEnabled && (
              <Text style={styles.errorText}>
                {locationErrorMessage}
              </Text>
            )}

          <Pressable
            disabled={isLocationLoading}
            onPress={() => {
              void handleGpsRequest();
            }}
            style={[
              styles.outlineButton,
              isLocationLoading &&
                styles.disabledButton,
            ]}
          >
            <Text
              style={styles.outlineButtonText}
            >
              {isLocationLoading
                ? t('prepareTrip.locating')
                : t('prepareTrip.useGps')}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleDemoLocation}
            style={styles.demoButton}
          >
            <Text style={styles.demoButtonText}>
              {t('prepareTrip.useDemo')}
            </Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>
            {t('prepareTrip.durationTitle')}
          </Text>

          <Text style={styles.help}>
            {t('prepareTrip.durationHelp')}
          </Text>

          <View style={styles.optionsRow}>
            {DURATIONS.map((hours) => {
              const isSelected =
                duration === hours;

              return (
                <Pressable
                  key={hours}
                  onPress={() => {
                    logger.debug(
                      'TRIP_PREPARATION',
                      'TRIP_DURATION_SELECTED',
                      'Trip duration selected.',
                      { hours }
                    );

                    setDuration(hours);
                  }}
                  style={[
                    styles.durationOption,
                    isSelected &&
                      styles.optionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.durationText,
                      isSelected &&
                        styles.optionSelectedText,
                    ]}
                  >
                    {hours} h
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>
            {t('prepareTrip.boatTitle')}
          </Text>

          <Text style={styles.help}>
            {t('prepareTrip.boatHelp')}
          </Text>

          <View style={styles.boatList}>
            {BOAT_OPTIONS.map(
              ({
                id,
                translationKey,
              }) => {
                const isSelected =
                  boatType === id;

                return (
                  <Pressable
                    key={id}
                    onPress={() => {
                      logger.debug(
                        'TRIP_PREPARATION',
                        'VESSEL_TYPE_SELECTED',
                        'Vessel type selected.',
                        { boatType: id }
                      );

                      setBoatType(id);
                    }}
                    style={[
                      styles.boatOption,
                      isSelected &&
                        styles.boatSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.radio,
                        isSelected &&
                          styles.radioSelected,
                      ]}
                    >
                      {isSelected && (
                        <View
                          style={styles.radioDot}
                        />
                      )}
                    </View>

                    <Text
                      style={[
                        styles.boatText,
                        isSelected &&
                          styles.boatTextSelected,
                      ]}
                    >
                      {t(translationKey)}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </View>
        </View>

        {isAnalyzing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator
              color={theme.colors.primary}
            />

            <Text style={styles.loadingText}>
              {t('prepareTrip.analyzing')}
            </Text>
          </View>
        ) : (
          <PrimaryButton
            label={t('prepareTrip.analyze')}
            onPress={() => {
              void handleAnalyze();
            }}
          />
        )}
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 36,
  },
  flex: {
    flex: 1,
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
    marginBottom: 10,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  card: {
    backgroundColor:
      theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    padding: 18,
    marginBottom: 14,
  },
  label: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 5,
  },
  help: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  locationEmpty: {
    minHeight: 60,
    borderRadius: 14,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  locationEmptyText: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  locationSuccess: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor:
      theme.colors.primarySoft,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  successDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor:
      theme.colors.primary,
    marginRight: 12,
  },
  locationTitle: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  locationCoords: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  outlineButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor:
      theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  outlineButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  demoButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  demoButtonText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  durationOption: {
    minWidth: 68,
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSelected: {
    backgroundColor:
      theme.colors.primary,
    borderColor:
      theme.colors.primary,
  },
  durationText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  optionSelectedText: {
    color: theme.colors.white,
  },
  boatList: {
    gap: 10,
  },
  boatOption: {
    minHeight: 54,
    borderWidth: 1,
    borderColor:
      theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  boatSelected: {
    borderColor:
      theme.colors.primary,
    backgroundColor:
      theme.colors.primarySoft,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#A8B3AF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioSelected: {
    borderColor:
      theme.colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor:
      theme.colors.primary,
  },
  boatText: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  boatTextSelected: {
    color: theme.colors.primary,
    fontWeight: '800',
  },
  loadingBox: {
    minHeight: 54,
    borderRadius: theme.radius.md,
    backgroundColor:
      theme.colors.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  });
}
