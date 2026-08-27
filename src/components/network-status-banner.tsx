/**
 * User-facing connectivity notice.
 *
 * The banner intentionally uses plain language. Technical network failures
 * remain available only through structured logs.
 */

import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '../hooks/use-app-theme';
import { useNetworkStatus } from '../hooks/use-network-status';
import type { AppTheme } from '../theme';

type NetworkStatusBannerProps = {
  forecastFetchedAt?: string | null;
};

function formatForecastTime(
  value: string | null | undefined
): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NetworkStatusBanner({
  forecastFetchedAt,
}: NetworkStatusBannerProps) {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const { isOffline } =
    useNetworkStatus();

  if (!isOffline) {
    return null;
  }

  const styles = createStyles(theme);
  const forecastTime =
    formatForecastTime(
      forecastFetchedAt
    );

  return (
    <View style={styles.container}>
      <View style={styles.dot} />

      <View style={styles.textContainer}>
        <Text style={styles.title}>
          {t('network.offlineTitle')}
        </Text>

        <Text style={styles.message}>
          {forecastTime
            ? t(
                'network.offlineWithForecast',
                { time: forecastTime }
              )
            : t(
                'network.offlineWithoutForecast'
              )}
        </Text>
      </View>
    </View>
  );
}

function createStyles(
  theme: AppTheme
) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        theme.colors.warningBorder,
      backgroundColor:
        theme.colors.warningSurface,
      paddingHorizontal: 13,
      paddingVertical: 11,
    },
    dot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      marginTop: 4,
      backgroundColor:
        theme.colors.warningText,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      color:
        theme.colors.warningText,
      fontSize: 12,
      fontWeight: '900',
      marginBottom: 2,
    },
    message: {
      color:
        theme.colors.warningText,
      fontSize: 11,
      lineHeight: 16,
    },
  });
}
