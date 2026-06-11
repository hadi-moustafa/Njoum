// Home screen — redesigned with star/sun themes, Sapiens illustrations,
// quotes carousel, mood planets, scouts calendar, and modern quick-access grid.
import { useCallback, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '../../hooks/useColorScheme';
import { useAppStore }    from '../../store/appStore';
import { strings }        from '../../constants/i18n';
import { Spacing, TAB_BAR_HEIGHT } from '../../constants/theme';

import { StarField }       from '../../components/home/StarField';
import { QuoteCarousel }   from '../../components/home/QuoteCarousel';
import { MoodMeter }       from '../../components/home/MoodMeter';
import { MiniCalendar }    from '../../components/home/MiniCalendar';
import { QuickAccessGrid } from '../../components/home/QuickAccessGrid';
import { Illustration }    from '../../components/home/Illustration';

// ── Header ────────────────────────────────────────────────────
function HomeHeader({
  isDark, colors, lang,
  onToggleTheme, onToggleLang,
}: {
  isDark: boolean;
  colors: any;
  lang: 'ar' | 'en';
  onToggleTheme: () => void;
  onToggleLang:  () => void;
}) {
  const isRTL = lang === 'ar';
  const s     = strings[lang];

  const hour = new Date().getHours();
  const timeGreeting =
    lang === 'ar'
      ? (hour < 12 ? 'صباح الخير ✨' : hour < 18 ? 'مساء الخير ✨' : 'مساء النور ✨')
      : (hour < 12 ? 'Good morning ✨' : hour < 18 ? 'Good afternoon ✨' : 'Good evening ✨');

  return (
    <View style={styles.headerSection}>
      {/* Top row: app name + toggles */}
      <View style={[styles.topRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={[styles.appName, { color: colors.primary }]}>{s.appName}</Text>
        <View style={[styles.toggleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable
            onPress={onToggleLang}
            style={[styles.langPill, {
              backgroundColor: isDark ? colors.card : colors.surface,
              borderColor:     isDark ? '#2C1C48' : '#E8D5D0',
            }]}
            accessibilityRole="button"
          >
            <Text style={[styles.langText, { color: isDark ? colors.starGold : colors.primary }]}>
              {lang === 'ar' ? 'EN' : 'ع'}
            </Text>
          </Pressable>
          <Pressable
            onPress={onToggleTheme}
            style={[styles.themeBtn, {
              backgroundColor: isDark ? 'rgba(164,128,255,0.18)' : 'rgba(181,88,106,0.10)',
            }]}
            accessibilityRole="button"
          >
            <Text style={styles.themeBtnIcon}>{isDark ? '☀️' : '🌙'}</Text>
          </Pressable>
        </View>
      </View>

      {/* Hero row: greeting + Sapiens character */}
      <View style={[styles.heroRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {/* Left: time greeting */}
        <View style={[styles.heroText, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={[styles.greeting, { color: colors.textMuted }]}>{timeGreeting}</Text>
          <Text style={[styles.heroTagline, { color: colors.text }]}>
            {lang === 'ar' ? 'كيف حالكِ اليوم؟' : "How's your day?"}
          </Text>
          {isDark ? (
            <View style={styles.starsRow}>
              {['✦', '✧', '✦', '✧', '✦'].map((s, i) => (
                <Text key={i} style={[styles.starDeco, { opacity: 0.4 + i * 0.12 }]}>{s}</Text>
              ))}
            </View>
          ) : (
            <View style={styles.starsRow}>
              {['·', '✦', '·', '✦', '·'].map((s, i) => (
                <Text key={i} style={[styles.starDeco, { color: colors.primary, opacity: 0.3 + i * 0.12 }]}>{s}</Text>
              ))}
            </View>
          )}
        </View>

        {/* Right: Sapiens illustration */}
        <Illustration
          name={isDark ? 'girl-standing' : 'girl-walking'}
          height={130}
        />
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────
export default function HomeScreen() {
  const { isDark, colors, lang } = useColorScheme();
  const { setTheme, setLanguage } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);
  const refreshKey = useRef(0);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    refreshKey.current += 1;
    await new Promise(r => setTimeout(r, 600));
    setRefreshing(false);
  }, []);

  const onToggleTheme = useCallback(() => {
    setTheme(isDark ? 'light' : 'dark');
  }, [isDark, setTheme]);

  const onToggleLang = useCallback(() => {
    setLanguage(lang === 'ar' ? 'en' : 'ar');
  }, [lang, setLanguage]);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      {/* Fixed star field behind content — dark mode only */}
      {isDark && <StarField />}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#A480FF' : '#B5586A'}
            colors={['#B5586A']}
          />
        }
      >
        <HomeHeader
          isDark={isDark}
          colors={colors}
          lang={lang}
          onToggleTheme={onToggleTheme}
          onToggleLang={onToggleLang}
        />

        <QuoteCarousel
          key={`quotes-${lang}`}
          lang={lang}
          isDark={isDark}
          colors={colors}
        />

        <MoodMeter
          key={`mood-${refreshKey.current}`}
          lang={lang}
          isDark={isDark}
          colors={colors}
        />

        <MiniCalendar
          lang={lang}
          isDark={isDark}
          colors={colors}
        />

        <QuickAccessGrid
          lang={lang}
          isDark={isDark}
          colors={colors}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    padding: Spacing.md,
    paddingBottom: TAB_BAR_HEIGHT + 100,
  },

  // Header sections
  headerSection: {
    marginBottom: Spacing.md,
    gap: 8,
  },
  topRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  toggleRow: {
    alignItems: 'center',
    gap: 8,
  },
  langPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langText: {
    fontSize: 13,
    fontWeight: '700',
  },
  themeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeBtnIcon: {
    fontSize: 18,
  },

  // Hero row
  heroRow: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  heroText: {
    flex: 1,
    gap: 4,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
  },
  heroTagline: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  starDeco: {
    fontSize: 14,
    color: '#E8C86A',
  },
});
