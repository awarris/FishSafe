/**
 * Internationalization bootstrap.
 *
 * French is the default language. The user's explicit language choice is
 * persisted locally and restored at startup.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import fr from './locales/fr.json';

export const LANGUAGE_STORAGE_KEY = '@fishsafe/preferences/language';
export const DEFAULT_LANGUAGE = 'fr';

export type SupportedLanguage = 'fr' | 'en';

void i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      fr: { translation: fr },
      en: { translation: en },
    },
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
  });

export async function restoreStoredLanguage(): Promise<void> {
  const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

  if (storedLanguage === 'fr' || storedLanguage === 'en') {
    await i18n.changeLanguage(storedLanguage);
  }
}

export async function changeAppLanguage(
  language: SupportedLanguage
): Promise<void> {
  await i18n.changeLanguage(language);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

export default i18n;
