import { useRef, useEffect, useState, useCallback } from 'react';
import { Animated, View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { QUOTES, strings, type Lang } from '../../constants/i18n';
import type { ThemeColors } from '../../constants/theme';

const { width: W } = Dimensions.get('window');
const ADVANCE_INTERVAL = 180_000; // 3 minutes

interface Props {
  lang: Lang;
  isDark: boolean;
  colors: ThemeColors;
}

export function QuoteCarousel({ lang, isDark, colors }: Props) {
  const [idx, setIdx]       = useState(0);
  const fadeAnim            = useRef(new Animated.Value(1)).current;
  const slideAnim           = useRef(new Animated.Value(0)).current;
  const s                   = strings[lang];

  const goTo = useCallback((nextIdx: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -20, duration: 280, useNativeDriver: true }),
    ]).start(() => {
      setIdx(nextIdx);
      slideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  // Auto-advance
  useEffect(() => {
    const id = setInterval(() => {
      goTo((idx + 1) % QUOTES.length);
    }, ADVANCE_INTERVAL);
    return () => clearInterval(id);
  }, [idx, goTo]);

  const quote   = QUOTES[idx]!;
  const isRTL   = lang === 'ar';
  const gradColors: [string, string] = isDark
    ? ['#281A42', '#0B0818']
    : [colors.gradientStart as string, colors.gradientEnd as string];

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={gradColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Top label row */}
        <View style={[styles.labelRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={styles.labelIcon}>{isDark ? '✦' : '✦'}</Text>
          <Text style={styles.label}>{s.quoteLabel}</Text>
        </View>

        {/* Decorative large quote mark */}
        <Text style={[styles.bigQuote, { left: isRTL ? undefined : 16, right: isRTL ? 16 : undefined }]}>
          ❝
        </Text>

        {/* Quote text */}
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          <Text style={[styles.quoteText, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? quote.ar : quote.en}
          </Text>
        </Animated.View>

        {/* Dots + tap hint */}
        <View style={[styles.footer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.dots, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {QUOTES.map((_, i) => (
              <Pressable key={i} onPress={() => goTo(i)} hitSlop={6}>
                <View
                  style={[
                    styles.dot,
                    i === idx && styles.dotActive,
                  ]}
                />
              </Pressable>
            ))}
          </View>
          <Pressable onPress={() => goTo((idx + 1) % QUOTES.length)}>
            <Text style={styles.tapHint}>
              {isRTL ? '←' : '→'}
            </Text>
          </Pressable>
        </View>

        {/* Corner star decoration */}
        {isDark && (
          <>
            <Text style={styles.cornerStar1}>✧</Text>
            <Text style={styles.cornerStar2}>✦</Text>
          </>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  card: {
    borderRadius: 24,
    paddingTop:    22,
    paddingBottom: 16,
    paddingHorizontal: 20,
    minHeight: 150,
    overflow: 'hidden',
  },
  labelRow: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  labelIcon: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  label: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  bigQuote: {
    position: 'absolute',
    top: 14,
    fontSize: 80,
    color: 'rgba(255,255,255,0.08)',
    lineHeight: 80,
  },
  quoteText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '600',
    lineHeight: 28,
    marginBottom: 14,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dots: {
    gap: 5,
    alignItems: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#FFFFFF',
  },
  tapHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 18,
    fontWeight: '300',
  },
  cornerStar1: {
    position: 'absolute',
    top: 10,
    right: 18,
    fontSize: 20,
    color: 'rgba(232,200,106,0.45)',
  },
  cornerStar2: {
    position: 'absolute',
    top: 30,
    right: 38,
    fontSize: 11,
    color: 'rgba(164,128,255,0.55)',
  },
});
