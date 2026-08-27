/**
 * Home route.
 *
 * Provides the product entry point and exposes the two global user preferences:
 * language and appearance.
 */

import { router } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { FeatureCard } from '../components/feature-card';
import { LanguageSwitcher } from '../components/language-switcher';
import { PrimaryButton } from '../components/primary-button';
import { ThemeSwitcher } from '../components/theme-switcher';
import { useAppTheme } from '../hooks/use-app-theme';
import type { AppTheme } from '../theme';

export default function HomeScreen() {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.brandGroup}>
            <View style={styles.brandLogoContainer}>
              <Image
                source={require('../../assets/images/fishsafe-logo.png')}
                style={styles.brandLogo}
                resizeMode="contain"
                accessibilityLabel="FishSafe logo"
              />
            </View>

            <View>
              <Text style={styles.brand}>FishSafe</Text>
              <Text style={styles.brandCaption}>
                {t('home.brandCaption')}
              </Text>
            </View>
          </View>

          <View style={styles.preferences}>
            <ThemeSwitcher />
            <LanguageSwitcher />
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>
              {t('home.assistantBadge')}
            </Text>
          </View>

          <Text style={styles.title}>
            {t('home.title')}
          </Text>

          <Text style={styles.subtitle}>
            {t('home.subtitle')}
          </Text>

          <PrimaryButton
            label={t('home.prepareTrip')}
            onPress={() =>
              router.push('/prepare-trip')
            }
          />
        </View>

        <Text style={styles.sectionTitle}>
          {t('home.sectionTitle')}
        </Text>

        <View style={styles.cards}>
          <FeatureCard
            eyebrow={t('home.beforeDepartureEyebrow')}
            title={t('home.beforeDepartureTitle')}
            description={t(
              'home.beforeDepartureDescription'
            )}
          />

          <FeatureCard
            eyebrow={t('home.atSeaEyebrow')}
            title={t('home.atSeaTitle')}
            description={t(
              'home.atSeaDescription'
            )}
          />

          <FeatureCard
            eyebrow={t('home.offlineEyebrow')}
            title={t('home.offlineTitle')}
            description={t(
              'home.offlineDescription'
            )}
          />
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>
            {t('common.important')}
          </Text>

          <Text style={styles.noticeText}>
            {t('home.notice')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 36,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 28,
  },
  preferences: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  brandLogoContainer: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  brandLogo: {
    width: 46,
    height: 46,
  },
  brand: {
    color: theme.colors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  brandCaption: {
    color: theme.colors.textMuted,
    marginTop: 1,
    fontSize: 12,
  },
  hero: {
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceSoft,
    padding: 22,
    marginBottom: 24,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primarySoft,
    marginBottom: 18,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  badgeText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    color: theme.colors.text,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '900',
    marginBottom: 14,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 22,
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 14,
  },
  cards: {
    gap: 12,
  },
  notice: {
    marginTop: 22,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 18,
  },
  noticeTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 5,
  },
  noticeText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  });
}
