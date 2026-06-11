// ============================================================
// Cycle Reminder Push Notification Job
//
// Runs daily at 08:00 UTC via node-cron.
// For each active cycle_reminder row, checks whether the
// predicted next period is exactly `days_before` days away.
// If so, sends a FCM push notification to the user's device.
//
// Relies on:
//   - cycle_reminders.is_active, days_before, reminder_type
//   - users.push_token  (synced by the mobile app on login)
//   - cyclePredictor.ts (application-layer prediction)
//   - fcm.ts            (Firebase Cloud Messaging)
// ============================================================
import cron from 'node-cron';
import { supabaseAdmin } from '../models/supabase';
import { sendPush }      from './fcm';
import { predictNextCycle } from './cyclePredictor';

// ── Reminder type → Arabic notification body ─────────────────
function buildNotificationBody(
  reminderType: string,
  customLabel: string | null,
  daysUntil: number,
): string {
  if (customLabel) return customLabel;

  const dayText = daysUntil === 0
    ? 'اليوم'
    : daysUntil === 1
    ? 'غداً'
    : `خلال ${daysUntil} أيام`;

  switch (reminderType) {
    case 'period_due':   return `🩸 دورتكِ الشهرية متوقعة ${dayText}.`;
    case 'pill':         return `💊 تذكير: حبة الحماية — ${dayText}.`;
    case 'hydration':    return `💧 شربي الماء الكافي — دورتكِ قادمة ${dayText}.`;
    default:             return `⏰ تذكير بدورتكِ الشهرية ${dayText}.`;
  }
}

// ── Core job function (exported so it can be called in tests) ─
export async function runCycleReminderJob(): Promise<void> {
  const today     = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Fetch all active reminders with the user's push_token
  const { data: reminders, error: remErr } = await supabaseAdmin
    .from('cycle_reminders')
    .select(`
      id,
      user_id,
      reminder_type,
      days_before,
      custom_label,
      user:users!cycle_reminders_user_id_fkey ( push_token )
    `)
    .eq('is_active', true);

  if (remErr) {
    console.error('[CycleReminderJob] Failed to fetch reminders:', remErr.message);
    return;
  }
  if (!reminders?.length) return;

  // Deduplicate by user_id so we only run prediction once per user
  const userIds = [...new Set(reminders.map(r => r.user_id as string))];

  // 2. Fetch last 12 cycles per user (one query per user — manageable at scale)
  const cycleMap: Record<string, Array<{ start_date: string; end_date?: string }>> = {};
  await Promise.all(
    userIds.map(async (userId) => {
      const { data: cycles } = await supabaseAdmin
        .from('menstrual_cycles')
        .select('start_date, end_date')
        .eq('user_id', userId)
        .order('start_date', { ascending: true })
        .limit(12);
      cycleMap[userId] = cycles ?? [];
    })
  );

  // 3. For each reminder, check if the predicted period is `days_before` away
  const results = await Promise.allSettled(
    reminders.map(async (reminder) => {
      const token = (reminder.user as any)?.push_token as string | null;
      if (!token) return;   // user hasn't registered for push

      const cycles     = cycleMap[reminder.user_id as string] ?? [];
      const prediction = predictNextCycle(cycles);

      const nextPeriod = new Date(prediction.next_period_date);
      nextPeriod.setHours(0, 0, 0, 0);

      const msPerDay   = 1000 * 60 * 60 * 24;
      const daysUntil  = Math.round((nextPeriod.getTime() - today.getTime()) / msPerDay);

      if (daysUntil !== (reminder.days_before as number)) return;  // not today's reminder

      const body = buildNotificationBody(
        reminder.reminder_type as string,
        reminder.custom_label as string | null,
        daysUntil,
      );

      await sendPush({
        token,
        title: 'نجوم ★',
        body,
        data: {
          type:        'period_reminder',
          reminder_id: reminder.id as string,
        },
      });

      // Log to push_notifications table for audit trail
      await supabaseAdmin.from('push_notifications').insert({
        user_id: reminder.user_id,
        type:    'period_reminder',
        title:   'نجوم ★',
        body,
        status:  'sent',
      });
    })
  );

  const failed = results.filter(r => r.status === 'rejected').length;
  if (failed > 0) {
    console.warn(`[CycleReminderJob] ${failed} reminders failed to send.`);
  }
}

// ── Schedule ──────────────────────────────────────────────────
// Runs every day at 08:00 UTC.
// In production, adjust to the primary user timezone (e.g. 'Asia/Beirut').
export function scheduleCycleReminderJob(): void {
  cron.schedule('0 8 * * *', async () => {
    console.log('[CycleReminderJob] Running at', new Date().toISOString());
    try {
      await runCycleReminderJob();
    } catch (err) {
      console.error('[CycleReminderJob] Unhandled error:', err);
    }
  }, {
    timezone: 'UTC',
  });
  console.log('[CycleReminderJob] Scheduled — daily at 08:00 UTC');
}
