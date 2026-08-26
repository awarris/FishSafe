import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAppTheme } from '../hooks/use-app-theme';
import type { AppTheme } from '../theme';

type FeatureCardProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function FeatureCard({
  eyebrow,
  title,
  description,
}: FeatureCardProps) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>
        {eyebrow}
      </Text>

      <Text style={styles.title}>
        {title}
      </Text>

      <Text style={styles.description}>
        {description}
      </Text>
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    card: {
      borderRadius: theme.radius.md,
      backgroundColor:
        theme.colors.surface,
      borderWidth: 1,
      borderColor:
        theme.colors.border,
      padding: 18,
    },
    eyebrow: {
      color: theme.colors.primary,
      fontSize: 12,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.7,
      marginBottom: 10,
    },
    title: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: '800',
      marginBottom: 8,
    },
    description: {
      color: theme.colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
    },
  });
}
