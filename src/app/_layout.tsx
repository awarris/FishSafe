/**
 * Root application layout.
 *
 * Initializes language preferences, provides theme state, configures the
 * navigation stack, and keeps the status bar consistent with the active theme.
 */

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import '../i18n';
import { useAppTheme } from '../hooks/use-app-theme';
import { restoreStoredLanguage } from '../i18n';
import { ThemeProvider } from '../providers/theme-provider';

function AppNavigation() {
  const { theme, resolvedMode } =
    useAppTheme();

  return (
    <>
      <StatusBar
        style={
          resolvedMode === 'dark'
            ? 'light'
            : 'dark'
        }
      />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor:
              theme.colors.background,
          },
          animation: 'slide_from_right',
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const [isLanguageReady, setIsLanguageReady] =
    useState(false);

  useEffect(() => {
    async function initializeLanguage():
      Promise<void> {
      try {
        await restoreStoredLanguage();
      } finally {
        setIsLanguageReady(true);
      }
    }

    void initializeLanguage();
  }, []);

  if (!isLanguageReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AppNavigation />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
