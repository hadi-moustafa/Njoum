// Quick-access tile grid with spring press animation.
// Uses only React Native's built-in Animated (no Reanimated) for compatibility.
import { useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { strings, type Lang } from '../../constants/i18n';
import type { ThemeColors } from '../../constants/theme';

const { width: W } = Dimensions.get('window');
const GAP          = 10;
const PADDING      = 16;
const TILE_W       = (W - PADDING * 2 - GAP) / 2;

interface TileConfig {
  key: string;
  icon: string;
  route: string;
  dayGrad: [string, string];
  nightGrad: [string, string];
  accent: string;
}

const TILES: TileConfig[] = [
  { key: 'hotlines',    icon: '🆘', route: '/safety/hotlines',    dayGrad: ['#FFF0F0','#FFE0E0'], nightGrad: ['#2A0A0A','#1A0505'], accent: '#E53E3E' },
  { key: 'journal',     icon: '📔', route: '/wellness/journal',    dayGrad: ['#F5EEFF','#EDE0FF'], nightGrad: ['#160A30','#0E0620'], accent: '#7A4E7A' },
  { key: 'cycle',       icon: '🌸', route: '/wellness/cycle',      dayGrad: ['#FFF0F6','#FFE2EE'], nightGrad: ['#2A0D18','#1A0810'], accent: '#B5586A' },
  { key: 'community',   icon: '💬', route: '/community',           dayGrad: ['#EEF6FF','#DCEEFF'], nightGrad: ['#08142A','#040D1C'], accent: '#3182CE' },
  { key: 'scouts',      icon: '⭐', route: '/safety/scouts',       dayGrad: ['#FFFBEE','#FFF5D6'], nightGrad: ['#27200A','#1A1505'], accent: '#C8956A' },
  { key: 'legal',       icon: '⚖️', route: '/safety/legal',        dayGrad: ['#EEFFF4','#DAFAE8'], nightGrad: ['#0A2015','#060E0A'], accent: '#38A169' },
  { key: 'selfdefence', icon: '🥋', route: '/safety/selfdefence',  dayGrad: ['#FFF8EE','#FFEEDD'], nightGrad: ['#271A08','#1A1005'], accent: '#C8956A' },
  { key: 'mood',        icon: '✨', route: '/wellness/mood',        dayGrad: ['#F0F0FF','#E4E0FF'], nightGrad: ['#100A2A','#08051A'], accent: '#A480FF' },
];

function Tile({ config, lang, isDark, colors }: {
  config: TileConfig;
  lang: Lang;
  isDark: boolean;
  colors: ThemeColors;
}) {
  const router = useRouter();
  const scale  = useRef(new Animated.Value(1)).current;
  const s      = strings[lang];
  const isRTL  = lang === 'ar';
  const grad   = isDark ? config.nightGrad : config.dayGrad;

  return (
    <Pressable
      onPressIn={() =>
        Animated.spring(scale, { toValue: 0.94, friction: 10, tension: 200, useNativeDriver: true }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, { toValue: 1, friction: 8, tension: 120, useNativeDriver: true }).start()
      }
      onPress={() => router.push(config.route as any)}
      accessibilityRole="button"
      accessibilityLabel={s.tiles[config.key]}
      style={{ width: TILE_W }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={grad}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.tile, {
            borderColor: config.accent + (isDark ? '30' : '22'),
            borderWidth: 1,
            shadowColor:   isDark ? config.accent : config.accent,
            shadowOffset:  { width: 0, height: isDark ? 4 : 2 },
            shadowOpacity: isDark ? 0.2 : 0.1,
            shadowRadius:  isDark ? 10 : 6,
            elevation:     isDark ? 4 : 2,
          }]}
        >
          {/* Icon bubble */}
          <View style={[styles.iconBubble, { backgroundColor: config.accent + (isDark ? '28' : '18') }]}>
            <Text style={styles.tileIcon}>{config.icon}</Text>
          </View>
          {/* Label */}
          <Text
            style={[styles.tileLabel, {
              color:     isDark ? colors.text : config.accent,
              textAlign: isRTL ? 'right' : 'left',
            }]}
            numberOfLines={2}
          >
            {s.tiles[config.key]}
          </Text>
          {/* Bottom accent stripe */}
          <View style={[styles.accentLine, { backgroundColor: config.accent + '55' }]} />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

interface Props {
  lang: Lang;
  isDark: boolean;
  colors: ThemeColors;
}

export function QuickAccessGrid({ lang, isDark, colors }: Props) {
  const s     = strings[lang];
  const isRTL = lang === 'ar';

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.sectionTitle, { color: colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
        {s.quickTitle}
      </Text>
      <View style={[styles.grid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {TILES.map(tile => (
          <Tile key={tile.key} config={tile} lang={lang} isDark={isDark} colors={colors} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  grid: {
    flexWrap: 'wrap',
    gap: GAP,
  },
  tile: {
    borderRadius: 20,
    padding: 16,
    minHeight: 120,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tileIcon: {
    fontSize: 24,
  },
  tileLabel: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  accentLine: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 3,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
});
