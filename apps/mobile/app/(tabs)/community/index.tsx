// ============================================================
// Community — groups list with star/sun theme
// ============================================================
import { useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { StarField } from '../../../components/home/StarField';
import { Illustration } from '../../../components/home/Illustration';
import { api } from '../../../services/api';
import { Spacing, FontSize, FontWeight, Radius, TAB_BAR_HEIGHT } from '../../../constants/theme';

interface Group {
  id: string;
  name: string;
  description?: string;
  category: string;
  member_count: number;
  is_private: boolean;
}

const CATEGORY_LABELS: Record<string, { ar: string; en: string }> = {
  survivors:     { ar: 'الناجيات',      en: 'Survivors'     },
  students:      { ar: 'الطالبات',      en: 'Students'      },
  career:        { ar: 'المهنة',         en: 'Career'        },
  general:       { ar: 'عام',            en: 'General'       },
  mental_health: { ar: 'الصحة النفسية', en: 'Mental Health' },
  custom:        { ar: 'مخصص',           en: 'Custom'        },
};

const CATEGORY_EMOJI: Record<string, string> = {
  survivors: '💜', students: '📚', career: '💼',
  general: '🌸', mental_health: '🧠', custom: '✨',
};

const CATEGORY_COLOR: Record<string, string> = {
  survivors: '#7A4E7A', students: '#3182CE', career: '#C8956A',
  general: '#B5586A', mental_health: '#38A169', custom: '#A480FF',
};

function QuickNavBtn({ emoji, label, color, onPress, isDark }: { emoji: string; label: string; color: string; onPress: () => void; isDark: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      style={{ flex: 1 }}
      onPressIn={() => Animated.spring(scale, { toValue: 0.94, friction: 10, tension: 200, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, friction: 8, tension: 120, useNativeDriver: true }).start()}
      onPress={onPress}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={isDark ? [color + '18', color + '08'] : [color + '15', color + '08']}
          style={[styles.quickBtn, {
            borderColor: color + (isDark ? '30' : '20'),
          }]}
        >
          <Text style={{ fontSize: 22 }}>{emoji}</Text>
          <Text style={[styles.quickLabel, { color }]}>{label}</Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

function GroupCard({ group, isDark, isRTL, lang, onPress }: { group: Group; isDark: boolean; isRTL: boolean; lang: 'ar' | 'en'; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const color = CATEGORY_COLOR[group.category] ?? '#B5586A';
  const catLabel = CATEGORY_LABELS[group.category];

  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.98, friction: 10, tension: 200, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, friction: 8, tension: 120, useNativeDriver: true }).start()}
      onPress={onPress}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <View style={[styles.groupCard, {
          backgroundColor: isDark ? '#1A1130' : '#FFFFFF',
          borderColor:     isDark ? '#2C1C48' : '#F0E4E0',
          shadowColor:     isDark ? '#A480FF' : '#000',
        }]}>
          <View style={[styles.groupCardInner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.catIcon, { backgroundColor: color + (isDark ? '28' : '18') }]}>
              <Text style={{ fontSize: 24 }}>{CATEGORY_EMOJI[group.category] ?? '🌸'}</Text>
            </View>
            <View style={[styles.groupText, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.groupName, { color: isDark ? '#EDE4FF' : '#2A1520' }]}>{group.name}</Text>
              {group.description && (
                <Text style={[styles.groupDesc, { color: isDark ? '#9B89C4' : '#8A6070', textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
                  {group.description}
                </Text>
              )}
              <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.catChip, { backgroundColor: color + '18', borderColor: color + '30' }]}>
                  <Text style={[styles.catChipText, { color }]}>
                    {catLabel ? (lang === 'ar' ? catLabel.ar : catLabel.en) : group.category}
                  </Text>
                </View>
                <Text style={[styles.memberCount, { color: isDark ? '#9B89C4' : '#8A6070' }]}>
                  👥 {group.member_count}
                </Text>
                {group.is_private && (
                  <Text style={[styles.memberCount, { color }]}>🔒</Text>
                )}
              </View>
            </View>
          </View>
          <View style={[styles.cardAccentLine, { backgroundColor: color + (isDark ? '40' : '25') }]} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function CommunityScreen() {
  const { isDark, colors, lang } = useColorScheme();
  const isRTL = lang === 'ar';
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn:  () => api.get<Group[]>('/community/groups'),
  });

  const groups = data?.data ?? [];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {isDark && <StarField />}

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: TAB_BAR_HEIGHT + 80 }]} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={{ flex: 1, gap: 4, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <Text style={[styles.screenTitle, { color: isDark ? colors.starGold : colors.primary }]}>
              {isRTL ? 'مجتمعنا' : 'Community'}
            </Text>
            <Text style={[styles.screenSub, { color: colors.textMuted }]}>
              {isRTL
                ? 'انضمي إلى مجموعة آمنة تجمعكِ بنساء يشاركنكِ تجاربهن'
                : 'Join a safe group with women who share your journey'}
            </Text>
          </View>
          <Illustration name={isDark ? 'girl-phone' : 'girl-walking'} height={85} />
        </View>

        {/* Quick nav */}
        <View style={[styles.quickRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <QuickNavBtn
            emoji="📅"
            label={isRTL ? 'الفعاليات' : 'Events'}
            color="#3182CE"
            isDark={isDark}
            onPress={() => router.push('/(tabs)/community/events' as any)}
          />
          <QuickNavBtn
            emoji="🌟"
            label={isRTL ? 'مرشدتي' : 'My Mentor'}
            color="#7A4E7A"
            isDark={isDark}
            onPress={() => router.push('/(tabs)/community/mentor' as any)}
          />
        </View>

        {/* Section title */}
        <Text style={[styles.sectionTitle, { color: isDark ? colors.starGold : colors.primary, textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? 'المجموعات ✦' : '✦ Groups'}
        </Text>

        {isLoading && (
          <Text style={[styles.loading, { color: colors.textMuted }]}>
            {isRTL ? 'جارٍ التحميل…' : 'Loading...'}
          </Text>
        )}

        {groups.map(g => (
          <GroupCard
            key={g.id}
            group={g}
            isDark={isDark}
            isRTL={isRTL}
            lang={lang}
            onPress={() => router.push(`/community/feed?groupId=${g.id}&groupName=${encodeURIComponent(g.name)}` as any)}
          />
        ))}

        {groups.length === 0 && !isLoading && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🌸</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {isRTL ? 'لا توجد مجموعات متاحة حالياً.' : 'No groups available yet.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1 },
  scroll: { padding: Spacing.md, gap: Spacing.md },

  header:      { alignItems: 'flex-end', marginBottom: Spacing.xs },
  screenTitle: { fontSize: 26, fontWeight: FontWeight.extrabold, letterSpacing: -0.5 },
  screenSub:   { fontSize: FontSize.sm, lineHeight: 20 },

  quickRow: { gap: Spacing.sm },
  quickBtn: {
    alignItems:    'center',
    padding:       Spacing.md,
    borderRadius:  Radius.xl,
    gap:           Spacing.xs,
    borderWidth:   1,
  },
  quickLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold },

  loading: { textAlign: 'center', marginTop: Spacing.md, fontSize: FontSize.sm },

  groupCard: {
    borderRadius:  Radius.xl,
    borderWidth:   1,
    overflow:      'hidden',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius:  8,
    elevation:     2,
  },
  groupCardInner: { alignItems: 'flex-start', padding: Spacing.md, gap: Spacing.sm },
  catIcon: {
    width: 48, height: 48, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  groupText:  { flex: 1, gap: 4 },
  groupName:  { fontSize: FontSize.md, fontWeight: FontWeight.bold },
  groupDesc:  { fontSize: FontSize.xs, lineHeight: 18 },
  metaRow:    { alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  catChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical:   2,
    borderRadius:      Radius.full,
    borderWidth:       1,
  },
  catChipText:  { fontSize: 10, fontWeight: FontWeight.semibold },
  memberCount:  { fontSize: FontSize.xs },
  cardAccentLine: {
    height:           2,
    marginHorizontal: Spacing.md,
    marginBottom:     Spacing.xs,
    borderRadius:     1,
  },

  emptyWrap:  { alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xl },
  emptyEmoji: { fontSize: 40 },
  emptyText:  { fontSize: FontSize.md, textAlign: 'center' },
});
