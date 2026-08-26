/**
 * Application theme provider.
 *
 * Theme behavior:
 * - first use follows the device appearance;
 * - an explicit user choice overrides the system preference;
 * - the explicit choice is persisted locally.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type PropsWithChildren,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';

import {
  darkTheme,
  lightTheme,
  type AppTheme,
} from '../theme';
import { logger } from '../utils/logger';

const THEME_STORAGE_KEY =
  '@fishsafe/preferences/theme';

export type ThemePreference =
  | 'system'
  | 'light'
  | 'dark';

type ThemeContextValue = {
  theme: AppTheme;
  preference: ThemePreference;
  resolvedMode: 'light' | 'dark';
  setPreference:
    (preference: ThemePreference) => Promise<void>;
};

export const ThemeContext =
  createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
}: PropsWithChildren) {
  const systemColorScheme =
    useColorScheme();

  const [preference, setPreferenceState] =
    useState<ThemePreference>('system');

  const [isReady, setIsReady] =
    useState(false);

  useEffect(() => {
    async function restoreThemePreference():
      Promise<void> {
      try {
        const storedPreference =
          await AsyncStorage.getItem(
            THEME_STORAGE_KEY
          );

        if (
          storedPreference === 'system' ||
          storedPreference === 'light' ||
          storedPreference === 'dark'
        ) {
          setPreferenceState(
            storedPreference
          );

          logger.info(
            'THEME',
            'THEME_PREFERENCE_RESTORED',
            'Stored theme preference restored.',
            {
              preference:
                storedPreference,
            }
          );
        }
      } catch (error) {
        logger.error(
          'THEME',
          'THEME_PREFERENCE_RESTORE_FAILED',
          'Failed to restore theme preference.',
          error
        );
      } finally {
        setIsReady(true);
      }
    }

    void restoreThemePreference();
  }, []);

  const resolvedMode:
    'light' | 'dark' =
      preference === 'system'
        ? systemColorScheme === 'dark'
          ? 'dark'
          : 'light'
        : preference;

  const theme =
    resolvedMode === 'dark'
      ? darkTheme
      : lightTheme;

  async function setPreference(
    nextPreference: ThemePreference
  ): Promise<void> {
    setPreferenceState(
      nextPreference
    );

    logger.info(
      'THEME',
      'THEME_PREFERENCE_CHANGED',
      'Theme preference changed.',
      {
        preference: nextPreference,
      }
    );

    try {
      await AsyncStorage.setItem(
        THEME_STORAGE_KEY,
        nextPreference
      );
    } catch (error) {
      logger.error(
        'THEME',
        'THEME_PREFERENCE_SAVE_FAILED',
        'Failed to persist theme preference.',
        error
      );
    }
  }

  const value = useMemo(
    () => ({
      theme,
      preference,
      resolvedMode,
      setPreference,
    }),
    [
      theme,
      preference,
      resolvedMode,
    ]
  );

  if (!isReady) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={value}
    >
      {children}
    </ThemeContext.Provider>
  );
}
