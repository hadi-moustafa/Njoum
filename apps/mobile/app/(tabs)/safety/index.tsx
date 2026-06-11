// ============================================================
// Safety Hub — gradient tile cards with star/sun theme
// ============================================================
import { useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { StarField } from '../../../components/home/StarField';
import { Illustration } from '../../../components/home/Illustration';
import { Spacing, FontSize, FontWeight, Radius, TAB_BAR_HEIGHT } from '../../../constants/theme';

const { width: W } = Dimensions.get('window');

interface SectionItem {
  emoji: string;
  key:   string;
  route: string;
  accent: string;
  dayGrad:   [string, string];
  nightGrad: [string, string];
}

const SECTIONS: SectionItem[] = [
  { emoji: '🆘', key: 'hotlines',    route: './hotlines',   accent: '#E53E3E', dayGrad: ['#FFF0F0','#FFD5D5'], nightGrad: ['#2A0A0A','#1A0505'] },
  { emoji: '👥', key: 'contacts',    route: './contacts',   accent: '#B5586A', dayGrad: ['#FFF0F6','#FFE2EE'], nightGrad: ['#2A0D18','#1A0810'] },
  { emoji: '🗺️', key: 'journey',     route: './journey',    accent: '#3182CE', dayGrad: ['#EEF6FF','#DCEEFF'], nightGrad: ['#08142A','#040D1C'] },
  { emoji: '🥋', key: 'selfdefence', route: './selfdefence',accent: '#C8956A', dayGrad: ['#FFF8EE','#FFEEDD'], nightGrad: ['#271A08','#1A1005'] },
  { emoji: '📚', key: 'learn',       route: './learn',      accent: '#38A169', dayGrad: ['#EEFFF4','#DAFAE8'], nightGrad: ['#0A2015','#060E0A'] },
  { emoji: '⚖️', key: 'legal',       route: './legal',      accent: '#7A4E7A', dayGrad: ['#F5EEFF','#EDE0FF'], nightGrad: ['#160A30','#0E0620'] },
  { emoji: '🌟', key: 'scouts',      route: './scouts',     accent: '#C8956A', dayGrad: ['#FFFBEE','#FFF5D6'], nightGrad: ['#27200A','#1A1505'] },
];

const LABELS: Record<string, { ar: string; en: string; sub_ar: string; sub_en: string }> = {
  hotlines:    { ar: 'خطوط الطوارئ',       en: 'Hotlines',           sub_ar: 'أرقام الأزمات بحسب بلدكِ',    sub_en: 'Crisis numbers by country'      },
  contacts:    { ar: 'جهات الاتصال الطارئة', en: 'Emergency Contacts', sub_ar: 'أضيفي من تثقينَ بهم',         sub_en: 'People you trust'                },
  journey:     { ar: 'تتبّع رحلتي',         en: 'Journey Tracker',    sub_ar: 'أرسلي مسارك بأمان',           sub_en: 'Share your route safely'         },
  selfdefence: { ar: 'الدفاع عن النفس',     en: 'Self-Defence',       sub_ar: 'فيديوهات وتدريبات',            sub_en: 'Videos & training'               },
  learn:       { ar: 'مركز السلامة',         en: 'Safety Hub',         sub_ar: 'مقالات ومعلومات',              sub_en: 'Articles & resources'            },
  legal:       { ar: 'حقوقي القانونية',     en: 'Legal Rights',       sub_ar: 'أدلة وموارد قانونية',          sub_en: 'Guides & legal resources'        },
  scouts:      { ar: 'برنامج الكشافة',       en: 'Scouts',             sub_ar: 'شارات وأنشطة',                 sub_en: 'Badges & activities'             },
};

function SafetyTile({ item, isDark, isRTL, lang }: { item: SectionItem; isDark: boolean; isRTL: boolean; lang: 'ar' | 'en' }) {
  const router = useRouter();
  const scale  = useRef(new Animated.Value(1)).current;
  const info   = LABELS[item.key]!;

  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, friction: 10, tension: 200, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, friction: 8, tension: 120, useNativeDriver: true }).start()}
      onPress={() => router.push(item.route as any)}
      accessibilityRole="button"
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={isDark ? item.nightGrad : item.dayGrad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.tile, {
            borderColor:   item.accent + (isDark ? '30' : '22'),
            shadowColor:   item.accent,
            shadowOpacity: isDark ? 0.18 : 0.08,
          }]}
        >
          <View style={[styles.tileRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.iconBubble, { backgroundColor: item.accent + (isDark ? '28' : '18') }]}>
              <Text style={styles.tileEmoji}>{item.emoji}</Text>
            </View>
            <View style={[styles.tileTextWrap, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.tileLabel, { color: isDark ? '#EDE4FF' : item.accent }]}>
                {lang === 'ar' ? info.ar : info.en}
              </Text>
              <Text style={[styles.tileSub, { color: isDark ? '#9B89C4' : '#8A6070' }]}>
                {lang === 'ar' ? info.sub_ar : info.sub_en}
              </Text>
            </View>
            <Text style={[styles.chevron, { color: isDark ? '#9B89C4' : item.accent + '88' }]}>›</Text>
          </View>
          <View style={[styles.accentLine, { backgroundColor: item.accent + (isDark ? '40' : '30') }]} />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

export default function SafetyScreen() {
  const { isDark, colors, lang } = useColorScheme();
  const isRTL = lang === 'ar';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {isDark && <StarField />}

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: TAB_BAR_HEIGHT + 80 }]} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={{ flex: 1, gap: 4, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={[styles.screenTitle, { color: isDark ? colors.starGold : colors.primary }]}>
              {isRTL ? 'السلامة' : 'Safety'}
            </Text>
            <Text style={[styles.screenSub, { color: colors.textMuted }]}>
              {isRTL ? 'أدوات الحماية — دائماً في متناول يدكِ' : 'Protection tools — always within reach'}
            </Text>
            {isDark && (
              <View style={styles.decoRow}>
                {['✦', '·', '✧', '·', '✦'].map((s, i) => (
                  <Text key={i} style={[styles.deco, { opacity: 0.25 + i * 0.1 }]}>{s}</Text>
                ))}
              </View>
            )}
          </View>
          <Illustration name={isDark ? 'girl-standing' : 'girl-desk'} height={90} />
        </View>

        {/* Tiles */}
        <View style={styles.tilesWrap}>
          {SECTIONS.map(item => (
            <SafetyTile key={item.key} item={item} isDark={isDark} isRTL={isRTL} lang={lang} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1 },
  scroll: { padding: Spacing.md, gap: Spacing.sm },

  header: { alignItems: 'flex-end', marginBottom: Spacing.md },
  screenTitle: { fontSize: 26, fontWeight: FontWeight.extrabold, letterSpacing: -0.5 },
  screenSub:   { fontSize: FontSize.sm, lineHeight: 20 },
  decoRow:     { flexDirection: 'row', gap: 4, marginTop: 2 },
  deco:        { fontSize: 13, color: '#E8C86A' },

  tilesWrap: { gap: Spacing.sm },

  tile: {
    borderRadius:  Radius.xl,
    borderWidth:   1,
    overflow:      'hidden',
    shadowOffset:  { width: 0, height: 3 },
    shadowRadius:  10,
    elevation:     3,
  },
  tileRow: {
    alignItems: 'center',
    padding:    Spacing.md,
    gap:        Spacing.sm,
  },
  iconBubble: {
    width:          52,
    height:         52,
    borderRadius:   Radius.lg,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  tileEmoji:   { fontSize: 26 },
  tileTextWrap: { flex: 1, gap: 2 },
  tileLabel: {
    fontSize:   FontSize.md,
    fontWeight: FontWeight.bold,
  },
  tileSub: {
    fontSize:   FontSize.sm,
    lineHeight: 18,
  },
  chevron: {
    fontSize:   24,
    fontWeight: '300',
  },
  accentLine: {
    height: 2,
    marginHorizontal: Spacing.md,
    marginBottom:     Spacing.xs,
    borderRadius:     1,
  },
});
