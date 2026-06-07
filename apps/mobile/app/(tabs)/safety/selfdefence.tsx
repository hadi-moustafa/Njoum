// ============================================================
// Self-Defence Videos Screen — grouped list with inline player
// ============================================================
import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card } from '../../../components/ui/Card';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { api } from '../../../services/api';
import { Colors, Spacing, FontSize, FontWeight, TAB_BAR_HEIGHT } from '../../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORY_LABELS: Record<string, string> = {
  grabbed:       '✊ التعامل مع الإمساك',
  followed:      '👣 عند الملاحقة',
  attacked:      '🛡️ التصدي للهجوم',
  online_safety: '💻 السلامة الإلكترونية',
  general:       '📚 مهارات عامة',
};

interface Video {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  scenario_category: string;
  duration_seconds?: number;
  is_offline_capable: boolean;
}

function formatDuration(secs?: number) {
  if (!secs) return '';
  const m = Math.floor(secs / 60), s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function SelfDefenceScreen() {
  const { colors } = useColorScheme();
  const [playing, setPlaying] = useState<Video | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['selfdefence-videos'],
    queryFn:  () => api.get<Video[]>('/content/videos'),
    staleTime: 1000 * 60 * 30,
  });

  const videos  = data?.data ?? [];
  const grouped = videos.reduce<Record<string, Video[]>>((acc, v) => {
    if (!acc[v.scenario_category]) acc[v.scenario_category] = [];
    acc[v.scenario_category]!.push(v);
    return acc;
  }, {});

  return (
    <>
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <ScreenHeader title="الدفاع عن النفس" showBack />
        <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + 80 }}>

          {/* Safety disclaimer */}
          <Card style={{ backgroundColor: Colors.emergency + '12', borderColor: Colors.emergency, borderWidth: 1, marginBottom: Spacing.md }}>
            <Text style={[styles.disclaimer, { color: Colors.emergency }]}>
              ⚠️ هذه المقاطع للتوعية فقط. في حال الخطر الفعلي، اتصلي بالطوارئ فوراً.
            </Text>
          </Card>

          {isLoading && (
            <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: Spacing.xl }}>
              جارٍ تحميل المقاطع…
            </Text>
          )}

          {Object.entries(grouped).map(([cat, items]) => (
            <View key={cat} style={{ marginBottom: Spacing.lg }}>
              <Text style={[styles.category, { color: colors.text }]}>
                {CATEGORY_LABELS[cat] ?? cat}
              </Text>
              {items.map(v => (
                <Pressable key={v.id} onPress={() => setPlaying(v)} accessibilityRole="button">
                  <Card style={styles.videoCard}>
                    <View style={styles.thumbnail}>
                      <Text style={{ fontSize: 30 }}>▶️</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.title, { color: colors.text }]}>{v.title}</Text>
                      {v.description && (
                        <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={2}>
                          {v.description}
                        </Text>
                      )}
                      <View style={styles.meta}>
                        {v.duration_seconds && (
                          <Text style={[styles.dur, { color: colors.textMuted }]}>
                            ⏱ {formatDuration(v.duration_seconds)}
                          </Text>
                        )}
                        {v.is_offline_capable && (
                          <Text style={[styles.offline]}>⬇ بدون إنترنت</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.playBadge}>
                      <Text style={styles.playText}>شاهدي</Text>
                    </View>
                  </Card>
                </Pressable>
              ))}
            </View>
          ))}

          {videos.length === 0 && !isLoading && (
            <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: Spacing.xl }}>
              لا توجد مقاطع متاحة حالياً.
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Video Player Modal */}
      <Modal
        visible={!!playing}
        animationType="slide"
        onRequestClose={() => setPlaying(null)}
        statusBarTranslucent
      >
        <SafeAreaView style={[styles.modalSafe, { backgroundColor: '#000' }]}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={() => setPlaying(null)}>
            <Text style={styles.closeTxt}>✕ إغلاق</Text>
          </TouchableOpacity>

          {/* Placeholder video area (real player requires expo-av installation) */}
          <View style={styles.playerPlaceholder}>
            <Text style={{ fontSize: 64 }}>▶️</Text>
            <Text style={styles.playerTitle}>{playing?.title}</Text>
            {playing?.video_url && (
              <Text style={styles.playerUrl} numberOfLines={1}>{playing.video_url}</Text>
            )}
            <Text style={styles.playerNote}>
              لتشغيل الفيديو، ثبّتي expo-av أو افتحي الرابط في المتصفح.
            </Text>
          </View>

          {/* Description */}
          {playing?.description && (
            <ScrollView style={{ flex: 1, padding: Spacing.md }}>
              <Text style={[styles.modalDesc, { color: '#ccc' }]}>{playing.description}</Text>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safe:              { flex: 1 },
  disclaimer:        { fontSize: FontSize.xs, textAlign: 'right', lineHeight: 18 },
  category:          { fontSize: FontSize.lg, fontWeight: FontWeight.bold, marginBottom: Spacing.sm, textAlign: 'right' },
  videoCard:         { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  thumbnail:         { width: 64, height: 64, backgroundColor: '#f0e0e5', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title:             { fontSize: FontSize.md, fontWeight: FontWeight.semibold, textAlign: 'right' },
  desc:              { fontSize: FontSize.sm, marginTop: 2, textAlign: 'right' },
  meta:              { flexDirection: 'row', gap: Spacing.sm, marginTop: 4, justifyContent: 'flex-end' },
  dur:               { fontSize: FontSize.xs },
  offline:           { fontSize: FontSize.xs, color: Colors.success, fontWeight: FontWeight.medium },
  playBadge:         { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  playText:          { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  // Modal
  modalSafe:         { flex: 1 },
  closeBtn:          { padding: Spacing.md },
  closeTxt:          { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  playerPlaceholder: { height: SCREEN_WIDTH * 0.5625, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  playerTitle:       { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold, textAlign: 'center', paddingHorizontal: Spacing.lg },
  playerUrl:         { color: '#aaa', fontSize: FontSize.xs, paddingHorizontal: Spacing.lg },
  playerNote:        { color: '#888', fontSize: FontSize.sm, textAlign: 'center', paddingHorizontal: Spacing.xl },
  modalDesc:         { fontSize: FontSize.md, lineHeight: 26, textAlign: 'right' },
});
