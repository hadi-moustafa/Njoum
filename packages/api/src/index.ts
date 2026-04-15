// ============================================================
// Njoum API — Entry Point
// ============================================================
import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { rateLimiter } from './middleware/rateLimiter';

// Route imports (uncomment as each module is built)
// import authRoutes from './routes/auth';
// import userRoutes from './routes/users';
// import sosRoutes from './routes/sos';
// import hotlineRoutes from './routes/hotlines';
// import moodRoutes from './routes/mood';
// import journalRoutes from './routes/journal';
// import cycleRoutes from './routes/cycles';
// import communityRoutes from './routes/community';
// import badgeRoutes from './routes/badges';
// import scoutsRoutes from './routes/scouts';
// import contentRoutes from './routes/content';
// import legalRoutes from './routes/legal';
// import adminRoutes from './routes/admin';

const app = express();
const PORT = process.env.PORT ?? 3001;

// ── Security middleware ───────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.APP_URL ?? 'http://localhost:3000',
  credentials: true,
}));

// ── Request parsing ───────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ───────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ── Global rate limiter ───────────────────────────────────────
app.use('/api/', rateLimiter);

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// ── API routes ────────────────────────────────────────────────
// app.use('/api/v1/auth',      authRoutes);
// app.use('/api/v1/users',     userRoutes);
// app.use('/api/v1/sos',       sosRoutes);
// app.use('/api/v1/hotlines',  hotlineRoutes);
// app.use('/api/v1/mood-logs', moodRoutes);
// app.use('/api/v1/journal',   journalRoutes);
// app.use('/api/v1/cycles',    cycleRoutes);
// app.use('/api/v1/community', communityRoutes);
// app.use('/api/v1/badges',    badgeRoutes);
// app.use('/api/v1/scouts',    scoutsRoutes);
// app.use('/api/v1/content',   contentRoutes);
// app.use('/api/v1/legal',     legalRoutes);
// app.use('/api/v1/admin',     adminRoutes);

// ── Error handling (must be last) ────────────────────────────
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[Njoum API] Running on port ${PORT} (${process.env.NODE_ENV ?? 'development'})`);
});

export default app; // for supertest
