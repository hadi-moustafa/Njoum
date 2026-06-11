import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { strings, type Lang } from '../../constants/i18n';
import type { ThemeColors } from '../../constants/theme';

interface CalEvent {
  date: Date;
  title: { ar: string; en: string };
  time: string;
  color: string;
  icon: string;
}

function buildEvents(): CalEvent[] {
  const t = new Date();
  const add = (n: number) => { const d = new Date(t); d.setDate(d.getDate() + n); return d; };
  return [
    { date: add(0), title: { ar: 'اجتماع الفوج',         en: 'Troop Meeting'         }, time: '17:00', color: '#B5586A', icon: '🏕️' },
    { date: add(1), title: { ar: 'تمرين الإسعافات',      en: 'First Aid Drill'       }, time: '10:00', color: '#3182CE', icon: '🩺' },
    { date: add(3), title: { ar: 'رحلة الطبيعة',         en: 'Nature Hike'           }, time: '09:00', color: '#38A169', icon: '🌿' },
    { date: add(5), title: { ar: 'ورشة مهارات الحياة',   en: 'Life Skills Workshop'  }, time: '14:00', color: '#7A4E7A', icon: '💡' },
    { date: add(6), title: { ar: 'حفل توزيع الشارات',    en: 'Badge Ceremony'        }, time: '16:00', color: '#C8956A', icon: '⭐' },
  ];
}

function getWeekDays(): Date[] {
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

function sameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();
}

interface Props {
  lang: Lang;
  isDark: boolean;
  colors: ThemeColors;
}

export function MiniCalendar({ lang, isDark, colors }: Props) {
  const s         = strings[lang];
  const isRTL     = lang === 'ar';
  const events    = useMemo(buildEvents, []);
  const weekDays  = useMemo(getWeekDays, []);
  const today     = new Date();

  const eventsOnDay = (d: Date) => events.filter(e => sameDay(e.date, d));

  const formatEventDate = (d: Date) => {
    if (sameDay(d, today)) return s.today;
    const opts: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', opts);
  };

  const cardBg = isDark ? colors.card : colors.surface;
  const borderC = isDark ? '#2C1C48' : '#F0E4E0';

  return (
    <View style={[styles.card, {
      backgroundColor: cardBg,
      borderColor: borderC,
      borderWidth: 1,
      ...(isDark
        ? { shadowColor: '#A480FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5 }
        : { shadowColor: '#B5586A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 }
      ),
    }]}>
      {/* Header */}
      <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={styles.headerIcon}>{isDark ? '✦' : '☀️'}</Text>
        <Text style={[styles.title, { color: colors.text }]}>{s.calTitle}</Text>
      </View>

      {/* Week strip */}
      <View style={[styles.weekRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {weekDays.map((d, i) => {
          const isToday   = sameDay(d, today);
          const dayEvents = eventsOnDay(d);
          return (
            <View key={i} style={styles.dayCell}>
              <Text style={[styles.dayName, { color: colors.textMuted }]}>
                {s.dayNames[d.getDay()]}
              </Text>
              {isToday ? (
                <LinearGradient
                  colors={isDark ? ['#281A42', '#A480FF'] : ['#B5586A', '#7A4E7A']}
                  style={styles.todayCircle}
                >
                  <Text style={styles.todayNum}>{d.getDate()}</Text>
                </LinearGradient>
              ) : (
                <Text style={[styles.dayNum, { color: colors.text }]}>
                  {d.getDate()}
                </Text>
              )}
              {/* Event dots */}
              <View style={styles.dotsRow}>
                {dayEvents.slice(0, 3).map((e, j) => (
                  <View key={j} style={[styles.eventDot, { backgroundColor: e.color }]} />
                ))}
              </View>
            </View>
          );
        })}
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: borderC }]} />

      {/* Upcoming events list */}
      <Text style={[styles.upcomingLabel, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
        {s.upcoming}
      </Text>
      <View style={styles.eventList}>
        {events.slice(0, 4).map((e, i) => (
          <View
            key={i}
            style={[styles.eventRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          >
            {/* Color pill */}
            <View style={[styles.eventColorBar, { backgroundColor: e.color }]} />
            <View style={[styles.eventIcon, { backgroundColor: e.color + '22' }]}>
              <Text style={{ fontSize: 14 }}>{e.icon}</Text>
            </View>
            <View style={[styles.eventInfo, { flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[styles.eventTitle, { color: colors.text }]}>
                {lang === 'ar' ? e.title.ar : e.title.en}
              </Text>
              <Text style={[styles.eventMeta, { color: colors.textMuted }]}>
                {formatEventDate(e.date)} · {e.time}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
  },
  headerRow: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  headerIcon: {
    fontSize: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  weekRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayCell: {
    alignItems: 'center',
    flex: 1,
    gap: 3,
  },
  dayName: {
    fontSize: 10,
    fontWeight: '600',
  },
  dayNum: {
    fontSize: 14,
    fontWeight: '500',
    width: 30,
    height: 30,
    textAlign: 'center',
    lineHeight: 30,
  },
  todayCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayNum: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 2,
    height: 6,
    alignItems: 'center',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  divider: {
    height: 1,
    marginVertical: 10,
    opacity: 0.5,
  },
  upcomingLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  eventList: {
    gap: 8,
  },
  eventRow: {
    alignItems: 'center',
    gap: 10,
  },
  eventColorBar: {
    width: 3,
    height: 38,
    borderRadius: 2,
  },
  eventIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventInfo: {
    gap: 2,
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  eventMeta: {
    fontSize: 11,
  },
});
