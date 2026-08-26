/**
 * Compact language selector.
 *
 * The selected language is persisted through the i18n module.
 */

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '../hooks/use-app-theme';
import {
  changeAppLanguage,
  type SupportedLanguage,
} from '../i18n';
import type { AppTheme } from '../theme';

const LANGUAGES: Array<{
  code: SupportedLanguage;
  shortLabel: string;
}> = [
  { code: 'fr', shortLabel: 'FR' },
  { code: 'en', shortLabel: 'EN' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { theme } = useAppTheme();

  const styles =
    createStyles(theme);

  const currentLanguage =
    i18n.language === 'en'
      ? 'en'
      : 'fr';

  async function handleLanguageChange(
    language: SupportedLanguage
  ): Promise<void> {
    if (
      language === currentLanguage
    ) {
      return;
    }

    await changeAppLanguage(language);
  }

  return (
    <View style={styles.container}>
      {LANGUAGES.map(
        ({ code, shortLabel }) => {
          const isSelected =
            currentLanguage === code;

          return (
            <Pressable
              key={code}
              accessibilityRole="button"
              accessibilityState={{
                selected: isSelected,
              }}
              onPress={() => {
                void handleLanguageChange(
                  code
                );
              }}
              style={[
                styles.option,
                isSelected &&
                  styles.selectedOption,
              ]}
            >
              <Text
                style={[
                  styles.label,
                  isSelected &&
                    styles.selectedLabel,
                ]}
              >
                {shortLabel}
              </Text>
            </Pressable>
          );
        }
      )}
    </View>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      gap: 4,
      padding: 4,
      borderRadius: 12,
      backgroundColor:
        theme.colors.surface,
      borderWidth: 1,
      borderColor:
        theme.colors.border,
    },
    option: {
      minWidth: 38,
      minHeight: 32,
      paddingHorizontal: 8,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectedOption: {
      backgroundColor:
        theme.colors.primary,
    },
    label: {
      color:
        theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '800',
    },
    selectedLabel: {
      color:
        theme.mode === 'dark'
          ? '#0F1513'
          : theme.colors.white,
    },
  });
}
