/**
 * FishSafe custom alert modal.
 *
 * Native Alert dialogs are intentionally avoided for important product
 * messages so the visual language stays consistent across Android devices.
 *
 * The modal supports informational, warning, high-risk, and danger states.
 * Business logic stays outside this component.
 */

import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAppTheme } from '../hooks/use-app-theme';
import type { AppTheme } from '../theme';

export type AppAlertVariant =
  | 'info'
  | 'warning'
  | 'high'
  | 'danger';

type AppAlertModalProps = {
  visible: boolean;
  variant?: AppAlertVariant;
  eyebrow?: string;
  title: string;
  message: string;
  primaryLabel: string;
  onPrimary: () => void;
  onRequestClose?: () => void;
};

function resolvePalette(
  theme: AppTheme,
  variant: AppAlertVariant
) {
  switch (variant) {
    case 'danger':
      return {
        foreground:
          theme.colors.riskDanger,
        surface:
          theme.colors.riskDangerSurface,
        symbol: '!',
      };
    case 'high':
      return {
        foreground:
          theme.colors.riskHigh,
        surface:
          theme.colors.riskHighSurface,
        symbol: '!',
      };
    case 'warning':
      return {
        foreground:
          theme.colors.riskModerate,
        surface:
          theme.colors.riskModerateSurface,
        symbol: '!',
      };
    default:
      return {
        foreground:
          theme.colors.primary,
        surface:
          theme.colors.primarySoft,
        symbol: 'i',
      };
  }
}

export function AppAlertModal({
  visible,
  variant = 'info',
  eyebrow,
  title,
  message,
  primaryLabel,
  onPrimary,
  onRequestClose,
}: AppAlertModalProps) {
  const { theme } = useAppTheme();

  const palette =
    resolvePalette(theme, variant);

  const styles = createStyles(
    theme,
    palette.foreground,
    palette.surface
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={
        onRequestClose ?? onPrimary
      }
    >
      <View style={styles.backdrop}>
        <View
          style={styles.card}
          accessibilityViewIsModal
        >
          <View style={styles.topRow}>
            <View style={styles.symbolCircle}>
              <Text style={styles.symbol}>
                {palette.symbol}
              </Text>
            </View>

            <View style={styles.headerText}>
              {eyebrow ? (
                <Text style={styles.eyebrow}>
                  {eyebrow}
                </Text>
              ) : null}

              <Text
                selectable
                style={styles.title}
              >
                {title}
              </Text>
            </View>
          </View>

          <Text
            selectable
            style={styles.message}
          >
            {message}
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={onPrimary}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed &&
                styles.primaryButtonPressed,
            ]}
          >
            <Text
              style={styles.primaryButtonText}
            >
              {primaryLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(
  theme: AppTheme,
  foreground: string,
  stateSurface: string
) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor:
        'rgba(6, 16, 13, 0.52)',
      paddingHorizontal: 16,
      paddingBottom: 18,
    },
    card: {
      width: '100%',
      borderRadius: 26,
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      backgroundColor:
        theme.colors.surface,
      padding: 20,
      gap: 18,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
    },
    symbolCircle: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor:
        stateSurface,
      borderWidth: 1,
      borderColor: foreground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    symbol: {
      color: foreground,
      fontSize: 22,
      fontWeight: '900',
    },
    headerText: {
      flex: 1,
      gap: 3,
    },
    eyebrow: {
      color: foreground,
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 0.9,
      textTransform: 'uppercase',
    },
    title: {
      color: theme.colors.text,
      fontSize: 22,
      lineHeight: 27,
      fontWeight: '900',
    },
    message: {
      color:
        theme.colors.textMuted,
      fontSize: 15,
      lineHeight: 22,
    },
    primaryButton: {
      minHeight: 54,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        foreground,
      paddingHorizontal: 18,
    },
    primaryButtonPressed: {
      opacity: 0.86,
    },
    primaryButtonText: {
      color:
        theme.mode === 'dark'
          ? '#0F1513'
          : theme.colors.white,
      fontSize: 15,
      fontWeight: '900',
    },
  });
}
