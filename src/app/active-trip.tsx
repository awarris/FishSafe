/** Active-trip monitoring with an isolated jury demonstration mode. */
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { AppAlertModal } from '../components/app-alert-modal';
import { NetworkStatusBanner } from '../components/network-status-banner';
import { RiskStatusCard } from '../components/risk-status-card';
import { useAppTheme } from '../hooks/use-app-theme';
import { calculateRisk } from '../risk/calculate-risk';
import { applyDemoScenario } from '../services/demo-scenario-service';
import { loadPreparedTrip } from '../storage/forecast-storage';
import type { AppTheme } from '../theme';
import type { DemoScenario, PreparedTrip, RiskLevel } from '../types/trip';
import { logger } from '../utils/logger';

function formatWind(value: number) { return `${value.toFixed(0)} km/h`; }
function formatWaves(value: number) { return `${value.toFixed(1)} m`; }

export default function ActiveTripScreen() {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const [preparedTrip, setPreparedTrip] = useState<PreparedTrip | null>(null);
  const [forecastIndex, setForecastIndex] = useState(0);
  const [scenario, setScenario] = useState<DemoScenario>('real');
  const [isLoading, setIsLoading] = useState(true);
  const [lastAlertedLevel, setLastAlertedLevel] = useState<RiskLevel | null>(null);
  const [alertedRiskLevel, setAlertedRiskLevel] =
    useState<RiskLevel | null>(null);

  useEffect(() => {
    void (async () => {
      logger.info('ACTIVE_TRIP_SCREEN','SCREEN_INITIALIZATION_STARTED','Loading active trip from local storage.');
      try {
        const storedTrip = await loadPreparedTrip();
        setPreparedTrip(storedTrip);
        logger.info('ACTIVE_TRIP_SCREEN','SCREEN_INITIALIZATION_COMPLETED','Active trip loaded from local storage.', { tripId: storedTrip?.trip.id, forecastPoints: storedTrip?.forecast.points.length });
      } catch (error) {
        logger.error('ACTIVE_TRIP_SCREEN','SCREEN_INITIALIZATION_FAILED','Failed to initialize active trip screen.',error);
      } finally { setIsLoading(false); }
    })();
  }, []);

  const activeForecast = useMemo(() => {
    if (!preparedTrip) return null;
    return applyDemoScenario(preparedTrip.forecast, scenario);
  }, [preparedTrip, scenario]);

  if (isLoading) return <SafeAreaView style={styles.loading}><ActivityIndicator color={theme.colors.primary}/><Text style={styles.muted}>{t('common.loading')}</Text></SafeAreaView>;
  if (!preparedTrip || !activeForecast) return null;

  const safeIndex = Math.min(forecastIndex, activeForecast.points.length - 1);
  const point = activeForecast.points[safeIndex];
  const risk = calculateRisk(point);
  const isJuryDemoAvailable = preparedTrip.trip.locationSource === 'demo';

  function showRiskAlert(level: RiskLevel) {
    if (
      (level !== 'high' &&
        level !== 'danger') ||
      lastAlertedLevel === level
    ) {
      return;
    }

    setLastAlertedLevel(level);
    setAlertedRiskLevel(level);

    logger.info(
      'ACTIVE_TRIP_SCREEN',
      'PREVENTIVE_RISK_ALERT_TRIGGERED',
      'Preventive risk alert displayed.',
      { level }
    );
  }

  function nextHour() {
    if (!activeForecast) {
      logger.warn(
        'ACTIVE_TRIP_SCREEN',
        'NEXT_HOUR_SKIPPED_NO_FORECAST',
        'Cannot advance to the next hour because no active forecast is available.'
      );

      return;
    }

    const next = Math.min(
      safeIndex + 1,
      activeForecast.points.length - 1
    );

    setForecastIndex(next);

    const nextRisk = calculateRisk(
      activeForecast.points[next]
    );
    logger.info('ACTIVE_TRIP_SCREEN','FORECAST_HOUR_ADVANCED','Forecast advanced by one hour.', { scenario, previousIndex: safeIndex, nextIndex: next, level: nextRisk.levelNumber });
    showRiskAlert(nextRisk.level);
  }

  function changeScenario(next: DemoScenario) {
    setScenario(next); setForecastIndex(0); setLastAlertedLevel(null); setAlertedRiskLevel(null);
    logger.info('ACTIVE_TRIP_SCREEN','DEMO_SCENARIO_SELECTED','Jury demonstration scenario selected.', { scenario: next });
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top','left','right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.kicker}>{t('activeTrip.kicker')}</Text>
        <Text style={styles.title}>{t('activeTrip.title')}</Text>

        <NetworkStatusBanner
          forecastFetchedAt={preparedTrip.forecast.fetchedAt}
        />

        {scenario !== 'real' && <View style={styles.demoBadge}><Text style={styles.demoBadgeText}>{t('activeTrip.demoBadge')}</Text></View>}

        <RiskStatusCard caption={t('activeTrip.forecastLevel',{time:point.time.slice(11,16)})} risk={risk}/>

        <View style={styles.metrics}>
          <View style={styles.metric}><Text style={styles.metricLabel}>{t('activeTrip.wind')}</Text><Text style={styles.metricValue}>{formatWind(point.windSpeedKmh)}</Text></View>
          <View style={styles.metric}><Text style={styles.metricLabel}>{t('activeTrip.waves')}</Text><Text style={styles.metricValue}>{formatWaves(point.waveHeightM)}</Text></View>
        </View>

        <Pressable onPress={nextHour} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{t('activeTrip.nextHour')}</Text></Pressable>

        {isJuryDemoAvailable && (
          <View style={styles.demoPanel}>
            <Text style={styles.demoTitle}>{t('activeTrip.demoTitle')}</Text>
            <Text style={styles.demoText}>{t('activeTrip.demoText')}</Text>
            <View style={styles.scenarios}>
              {(['real','degradation','danger'] as DemoScenario[]).map(item => (
                <Pressable key={item} onPress={() => changeScenario(item)} style={[styles.scenarioButton, scenario===item && styles.scenarioSelected]}>
                  <Text style={[styles.scenarioText, scenario===item && styles.scenarioTextSelected]}>{t(item==='real'?'activeTrip.scenarioReal':item==='degradation'?'activeTrip.scenarioDegradation':'activeTrip.scenarioDanger')}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <Pressable onPress={() => { logger.info('ACTIVE_TRIP_SCREEN','TRIP_ENDED','User ended the active trip.',{tripId:preparedTrip.trip.id}); router.replace('/'); }} style={styles.endButton}><Text style={styles.endText}>{t('activeTrip.endTrip')}</Text></Pressable>
      </ScrollView>

        <AppAlertModal
          visible={
            alertedRiskLevel !== null
          }
          variant={
            alertedRiskLevel === 'danger'
              ? 'danger'
              : 'high'
          }
          eyebrow={t(
            'alerts.riskEyebrow'
          )}
          title={
            alertedRiskLevel === 'danger'
              ? t(
                  'activeTrip.dangerRiskTitle'
                )
              : t(
                  'activeTrip.highRiskTitle'
                )
          }
          message={
            alertedRiskLevel
              ? t(
                  `risk.messages.${alertedRiskLevel}`
                )
              : ''
          }
          primaryLabel={t(
            'alerts.understood'
          )}
          onPrimary={() =>
            setAlertedRiskLevel(null)
          }
        />
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) { return StyleSheet.create({
  safeArea:{flex:1,backgroundColor:theme.colors.background}, loading:{flex:1,alignItems:'center',justifyContent:'center',gap:10,backgroundColor:theme.colors.background}, muted:{color:theme.colors.textMuted},
  content:{paddingHorizontal:20,paddingTop:18,paddingBottom:38,gap:16}, kicker:{color:theme.colors.primary,fontSize:11,fontWeight:'900',letterSpacing:1.2}, title:{color:theme.colors.text,fontSize:32,lineHeight:38,fontWeight:'900'},
  demoBadge:{alignSelf:'flex-start',paddingHorizontal:10,paddingVertical:6,borderRadius:999,backgroundColor:theme.colors.riskHighSurface}, demoBadgeText:{color:theme.colors.riskHigh,fontSize:10,fontWeight:'900',letterSpacing:.8},
  metrics:{flexDirection:'row',gap:10}, metric:{flex:1,minHeight:96,borderRadius:18,backgroundColor:theme.colors.surface,borderWidth:1,borderColor:theme.colors.border,padding:16}, metricLabel:{color:theme.colors.textMuted,fontSize:13}, metricValue:{color:theme.colors.text,fontSize:25,fontWeight:'900',marginTop:7},
  primaryButton:{minHeight:58,borderRadius:16,backgroundColor:theme.colors.primary,alignItems:'center',justifyContent:'center'}, primaryButtonText:{color:theme.mode==='dark'?'#0F1513':theme.colors.white,fontSize:16,fontWeight:'900'},
  demoPanel:{marginTop:8,borderTopWidth:1,borderTopColor:theme.colors.border,paddingTop:18}, demoTitle:{color:theme.colors.text,fontSize:14,fontWeight:'900'}, demoText:{color:theme.colors.textMuted,fontSize:12,lineHeight:18,marginTop:4,marginBottom:12}, scenarios:{flexDirection:'row',gap:8}, scenarioButton:{flex:1,minHeight:48,borderRadius:13,borderWidth:1,borderColor:theme.colors.border,alignItems:'center',justifyContent:'center',paddingHorizontal:6}, scenarioSelected:{backgroundColor:theme.colors.primarySoft,borderColor:theme.colors.primary}, scenarioText:{color:theme.colors.textMuted,fontSize:11,fontWeight:'800',textAlign:'center'}, scenarioTextSelected:{color:theme.colors.primary},
  endButton:{minHeight:52,alignItems:'center',justifyContent:'center'}, endText:{color:theme.colors.danger,fontSize:14,fontWeight:'800'},
}); }
