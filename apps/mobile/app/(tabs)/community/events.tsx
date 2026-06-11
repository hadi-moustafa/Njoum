// ============================================================
// Events Board Screen — upcoming workshops, webinars, meetups
// ============================================================
import { View, Text, ScrollView, StyleSheet, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Card } from '../../../components/ui/Card';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { StarField } from '../../../components/home/StarField';
import { api } from '../../../services/api';
import { Colors, Spacing, FontSize, FontWeight, TAB_BAR_HEIGHT } from '../../../constants/theme';

interface Event {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  starts_at: string;
  ends_at?: string;
  location?: string;
  is_online: boolean;
  url?: string;
}

const TYPE_EMOJIS: Record<string, string> = {
  workshop:          '🔧',
  webinar:           '💻',
  meetup:            '🤝',
  troop_meeting:     '⭐',
  community_service: '❤️',
};

const TYPE_LABELS: Record<string, string> = {
  workshop:          'ورشة عمل',
  webinar:           'ندوة إلكترونية',
  meetup:            'لقاء',
  troop_meeting:     'اجتماع كشافة',
  community_service: 'خدمة مجتمعية',
};

function formatEventDate(startsAt: string, endsAt?: string): string {
  const start = new Date(startsAt);
  const opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  const startStr = start.toLocaleString('ar-LB', opts);
  if (!endsAt) return startStr;
  const end = new Date(endsAt);
  return `${startStr} — ${end.toLocaleTimeString('ar-LB', { hour: '2-digit', minute: '2-digit' })}`;
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const today  = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

export default function EventsScreen() {
  const { isDark, colors } = useColorScheme();

  const { data, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn:  () => api.get<Event[]>('/events'),
    staleTime: 1000 * 60 * 15,
  });

  const events = (data?.data ?? []) as Event[];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {isDark && <StarField />}
      <ScreenHeader title="الفعاليات" showBack />
      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: TAB_BAR_HEIGHT + 80 }}>

        {isLoading && (
          <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: Spacing.xl }}>
            جارٍ تحميل الفعاليات…
          </Text>
        )}

        {events.length === 0 && !isLoading && (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>📅</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>لا توجد فعاليات قادمة حالياً.</Text>
          </View>
        )}

        {events.map(event => {
          const daysUntil = getDaysUntil(event.starts_at);
          const isToday   = daysUntil === 0;
          const isSoon    = daysUntil <= 3;

          return (
            <Card key={event.id} style={{ marginBottom: Spacing.md }}>
              <View style={styles.typeRow}>
                <Text style={{ fontSize: 22 }}>{TYPE_EMOJIS[event.event_type] ?? '📌'}</Text>
                <View style={[styles.typeBadge, { backgroundColor: Colors.primary + '20' }]}>
                  <Text style={[styles.typeBadgeText, { color: Colors.primary }]}>
                    {TYPE_LABELS[event.event_type] ?? event.event_type}
                  </Text>
                </View>
                {isSoon && (
                  <View style={[styles.soonBadge, { backgroundColor: isToday ? Colors.emergency : Colors.accent }]}>
                    <Text style={styles.soonText}>{isToday ? 'اليوم!' : `بعد ${daysUntil} أيام`}</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.title, { color: colors.text }]}>{event.title}</Text>

              {event.description && (
                <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={2}>
                  {event.description}
                </Text>
              )}

              <View style={styles.infoRow}>
                <Text style={[styles.infoText, { color: colors.textMuted }]}>
                  🕐 {formatEventDate(event.starts_at, event.ends_at)}
                </Text>
              </View>

              {event.location && !event.is_online && (
                <Text style={[styles.infoText, { color: colors.textMuted }]}>
                  📍 {event.location}
                </Text>
              )}

              {event.is_online && (
                <Text style={[styles.virtualBadge, { color: Colors.success }]}>🌐 فعالية إلكترونية</Text>
              )}

              {event.url && (
                <Pressable
                  style={[styles.joinBtn, { backgroundColor: Colors.primary }]}
                  onPress={() => Linking.openURL(event.url!)}
                  accessibilityRole="button"
                >
                  <Text style={styles.joinBtnText}>انضمي للفعالية</Text>
                </Pressable>
              )}
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:          { flex: 1 },
  typeRow:       { flexDirection: 'row-reverse', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  typeBadge:     { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: 20 },
  typeBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  soonBadge:     { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: 20 },
  soonText:      { fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.bold },
  title:         { fontSize: FontSize.lg, fontWeight: FontWeight.bold, textAlign: 'right', marginBottom: Spacing.xs },
  desc:          { fontSize: FontSize.sm, textAlign: 'right', marginBottom: Spacing.sm },
  infoRow:       { marginBottom: 4 },
  infoText:      { fontSize: FontSize.sm, textAlign: 'right' },
  virtualBadge:  { fontSize: FontSize.sm, textAlign: 'right', marginTop: 4 },
  joinBtn:       { marginTop: Spacing.sm, paddingVertical: Spacing.sm, borderRadius: 10, alignItems: 'center' },
  joinBtnText:   { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.sm },
  empty:         { alignItems: 'center', paddingTop: Spacing.xl * 2, gap: Spacing.md },
  emptyText:     { fontSize: FontSize.md, textAlign: 'center' },
});
