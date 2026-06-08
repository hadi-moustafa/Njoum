// ============================================================
// Tab Navigator Layout
// Bottom tabs: Home, Community, Safety, Wellness, Profile
// SOS button floats above the tab bar on every tab.
// ============================================================
import { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { View, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SOSButton } from '../../components/SOSButton';
import { supabase } from '../../services/supabase';
import { Colors, TAB_BAR_HEIGHT, FontSize } from '../../constants/theme';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 26 : 22, opacity: focused ? 1 : 0.5 }}>
      {emoji}
    </Text>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Redirect to sign-in when the Supabase session is revoked
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
          tabBarActiveTintColor:   Colors.primary,
          tabBarInactiveTintColor: Colors.textMuted,
          tabBarStyle: {
            height:            TAB_BAR_HEIGHT + insets.bottom,
            paddingBottom:     insets.bottom + 8,
            paddingTop:        8,
            backgroundColor:   Colors.surface,
            borderTopColor:    Colors.border,
            borderTopWidth:    1,
            // Reserve centre slot for the SOS button — make it wider
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
            title: 'الرئيسية',
            tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="community"
          options={{
            title: 'المجتمع',
            tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} />,
          }}
        />
        {/* Safety section — accessible from home tiles, not a primary tab */}
        <Tabs.Screen
          name="safety"
          options={{ href: null }}
        />
        {/* Centre empty slot — SOS button floats here */}
        <Tabs.Screen
          name="sos-placeholder"
          options={{
            title: '',
            tabBarIcon: () => <View style={styles.sosSlot} />,
            tabBarButton: () => <View style={styles.sosSlotContainer} />,
          }}
        />
        <Tabs.Screen
          name="wellness"
          options={{
            title: 'الصحة',
            tabBarIcon: ({ focused }) => <TabIcon emoji="🌸" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'حسابي',
            tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
          }}
        />
      </Tabs>

      {/* SOS button — renders above every tab */}
      <SOSButton />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  sosSlot: {
    width:  64,
    height: 64,
  },
  sosSlotContainer: {
    flex: 1,
  },
});
