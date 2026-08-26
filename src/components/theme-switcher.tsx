/**
 * Compact appearance toggle.
 *
 * The explicit light/dark choice is persisted by ThemeProvider.
 */

import {
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '../hooks/use-app-theme';
import type { AppTheme } from '../theme';

export function ThemeSwitcher() {
  const { t } = useTranslation();

  const {
    theme,
    resolvedMode,
    setPreference,
  } = useAppTheme();

  const styles =
    createStyles(theme);

  const isDark =
    resolvedMode === 'dark';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        isDark
          ? t('theme.switchToLight')
          : t('theme.switchToDark')
      }
      onPress={() => {
        void setPreference(
          isDark ? 'light' : 'dark'
        );
      }}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.icon}>
        {isDark ? '☀' : '☾'}
      </Text>
    </Pressable>
  );
}

function createStyles(
  theme: AppTheme
) {
  return StyleSheet.create({
    button: {
      width: 42,
      height: 42,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        theme.colors.surface,
      borderWidth: 1,
      borderColor:
        theme.colors.border,
    },
    pressed: {
      opacity: 0.75,
    },
    icon: {
      color: theme.colors.text,
      fontSize: 20,
      fontWeight: '700',
    },
  });
}
