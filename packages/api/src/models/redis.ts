// ============================================================
// Redis client — sessions, rate limiting, SOS pub/sub
// ============================================================
import { createClient } from 'redis';

export const redis = createClient({ url: process.env.REDIS_URL ?? 'redis://localhost:6379' });

redis.on('error', (err) => console.error('[Redis] Client error:', err));

export async function connectRedis(): Promise<void> {
  if (redis.isOpen) return;
  await redis.connect();
  console.log('[Redis] Connected');
}
