// Tab navigator with full dark/light theme support.
// Dark mode → golden star-glow pill active indicator.
// Light mode → rose-pink dot active indicator.
// Uses only React Native's built-in Animated (not Reanimated) for compatibility.
import { useEffect, useRef } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SOSButton }         from '../../components/SOSButton';
import { supabase }          from '../../services/supabase';
import { useColorScheme }    from '../../hooks/useColorScheme';
import { strings }           from '../../constants/i18n';
import { TAB_BAR_HEIGHT, FontSize } from '../../constants/theme';

// ── Custom animated tab icon ──────────────────────────────────
function TabIcon({
  emoji, focused, isDark,
}: {
  emoji: string;
  focused: boolean;
  isDark: boolean;
}) {
  const scale  = useRef(new Animated.Value(1)).current;
  const glowOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.18 : 1,
      friction: 8,
      tension: 120,
      useNativeDriver: true,
    }).start();
    Animated.timing(glowOp, {
      toValue: focused ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <View style={styles.tabIconWrap}>
      {/* Active bar indicator */}
      {isDark ? (
        <Animated.View style={[styles.starGlowPill, { opacity: glowOp }]} />
      ) : (
        <Animated.View style={[styles.roseDot, { opacity: glowOp }]} />
      )}
      <Animated.View style={{ transform: [{ scale }] }}>
        <Text style={{ fontSize: 22 }}>{emoji}</Text>
      </Animated.View>
    </View>
  );
}

// ── Layout ────────────────────────────────────────────────────
export default function TabLayout() {
  const insets                   = useSafeAreaInsets();
  const router                   = useRouter();
  const { isDark, colors, lang } = useColorScheme();
  const s                        = strings[lang];

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/(auth)/sign-in');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor:   isDark ? '#E8C86A' : '#B5586A',
          tabBarInactiveTintColor: isDark ? '#9B89C4' : '#8A6070',
          tabBarStyle: {
            height:            TAB_BAR_HEIGHT + insets.bottom,
            paddingBottom:     insets.bottom + 8,
            paddingTop:        8,
            backgroundColor:   isDark ? '#120B20' : '#FFFFFF',
            borderTopColor:    isDark ? '#2C1C48' : '#E8D5D0',
            borderTopWidth:    1,
            paddingHorizontal: 8,
          },
          tabBarLabelStyle: {
            fontSize:   FontSize.xs,
            fontWeight: '600',
            marginTop:  2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: s.home,
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji={isDark ? '🌙' : '🏠'} focused={focused} isDark={isDark} />
            ),
          }}
        />
        <Tabs.Screen
          name="community"
          options={{
            title: s.communityTab,
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="💬" focused={focused} isDark={isDark} />
            ),
          }}
        />
        {/* Safety — accessed from home tiles, not a primary tab */}
        <Tabs.Screen
          name="safety"
          options={{ href: null }}
        />
        {/* Centre slot reserved for the floating SOS button */}
        <Tabs.Screen
          name="sos-placeholder"
          options={{
            title: '',
            tabBarButton: () => <View style={styles.sosSlotContainer} />,
          }}
        />
        <Tabs.Screen
          name="wellness"
          options={{
            title: s.wellnessTab,
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="🌸" focused={focused} isDark={isDark} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: s.profileTab,
            tabBarIcon: ({ focused }) => (
              <TabIcon emoji="👤" focused={focused} isDark={isDark} />
            ),
          }}
        />
      </Tabs>

      {/* SOS button floats above every tab */}
      <SOSButton />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  sosSlotContainer: { flex: 1 },

  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 44,
    height: 36,
    gap: 2,
  },

  // Dark mode: golden pill at top of icon
  starGlowPill: {
    position: 'absolute',
    top: 0,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#E8C86A',
    shadowColor: '#E8C86A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 4,
  },

  // Light mode: rose dot at top
  roseDot: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#B5586A',
  },
});
