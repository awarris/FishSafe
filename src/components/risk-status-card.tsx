/**
 * Risk summary presentation.
 *
 * This component contains no classification logic. It only renders the
 * language-neutral RiskResult returned by the risk engine.
 */

import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '../hooks/use-app-theme';
import type {
  AppTheme,
} from '../theme';
import type {
  RiskLevel,
  RiskResult,
} from '../types/trip';

type RiskStatusCardProps = {
  caption: string;
  risk: RiskResult;
};

export function getRiskPalette(
  theme: AppTheme,
  level: RiskLevel
) {
  switch (level) {
    case 'danger':
      return {
        foreground:
          theme.colors.riskDanger,
        background:
          theme.colors.riskDangerSurface,
      };
    case 'high':
      return {
        foreground:
          theme.colors.riskHigh,
        background:
          theme.colors.riskHighSurface,
      };
    case 'moderate':
      return {
        foreground:
          theme.colors.riskModerate,
        background:
          theme.colors.riskModerateSurface,
      };
    default:
      return {
        foreground:
          theme.colors.riskLow,
        background:
          theme.colors.riskLowSurface,
      };
  }
}

export function RiskStatusCard({
  caption,
  risk,
}: RiskStatusCardProps) {
  const { t } = useTranslation();
  const { theme } = useAppTheme();

  const palette =
    getRiskPalette(
      theme,
      risk.level
    );

  const styles =
    createStyles(
      theme,
      palette.foreground,
      palette.background
    );

  return (
    <View style={styles.card}>
      <Text style={styles.caption}>
        {caption}
      </Text>

      <Text style={styles.levelNumber}>
        {t('conditions.level', {
          level: risk.levelNumber,
        })}
      </Text>

      <Text style={styles.levelLabel}>
        {t(`risk.${risk.level}`)}
      </Text>

      <Text style={styles.message}>
        {t(risk.messageKey)}
      </Text>

    </View>
  );
}

function createStyles(
  theme: AppTheme,
  foreground: string,
  background: string
) {
  return StyleSheet.create({
    card: {
      borderRadius: theme.radius.lg,
      backgroundColor: background,
      borderWidth: 1,
      borderColor: foreground,
      padding: 20,
    },
    caption: {
      color: theme.colors.textMuted,
      fontSize: 13,
      marginBottom: 8,
    },
    levelNumber: {
      color: foreground,
      fontSize: 13,
      fontWeight: '800',
      marginBottom: 3,
    },
    levelLabel: {
      color: foreground,
      fontSize: 30,
      fontWeight: '900',
    },
    message: {
      color: theme.colors.text,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '700',
      marginTop: 8,
    },
    divider: {
      height: 1,
      backgroundColor: foreground,
      opacity: 0.22,
      marginVertical: 14,
    },
    detail: {
      color: theme.colors.text,
      fontSize: 12,
      lineHeight: 19,
    },
    rule: {
      color: theme.colors.textMuted,
      fontSize: 11,
      lineHeight: 17,
      marginTop: 7,
    },
  });
}
