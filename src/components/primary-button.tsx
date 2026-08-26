/**
 * Primary call-to-action button.
 *
 * Theme-aware styling is centralized here to avoid duplicating the main button
 * treatment across screens.
 */

import {
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import { useAppTheme } from '../hooks/use-app-theme';
import type { AppTheme } from '../theme';

type PrimaryButtonProps = {
  label: string;
  onPress?: () => void;
};

export function PrimaryButton({
  label,
  onPress,
}: PrimaryButtonProps) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    button: {
      minHeight: 54,
      borderRadius: theme.radius.md,
      backgroundColor:
        theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    pressed: {
      opacity: 0.88,
    },
    label: {
      color:
        theme.mode === 'dark'
          ? '#0F1513'
          : theme.colors.white,
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
