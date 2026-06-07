// ============================================================
// Njoum API — Entry Point
// ============================================================
import 'dotenv/config';
import * as Sentry from '@sentry/node';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

// Sentry must be initialised before any other imports that might throw
Sentry.init({
  dsn:         process.env['SENTRY_DSN'],
  environment: process.env['NODE_ENV'] ?? 'development',
  tracesSampleRate: process.env['NODE_ENV'] === 'production' ? 0.2 : 0,
  enabled: !!process.env['SENTRY_DSN'],
});

import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { rateLimiter } from './middleware/rateLimiter';

import userRoutes      from './routes/users';
import sosRoutes       from './routes/sos';
import hotlineRoutes   from './routes/hotlines';
import moodRoutes      from './routes/mood';
import journalRoutes   from './routes/journal';
import cycleRoutes     from './routes/cycles';
import communityRoutes from './routes/community';
import scoutsRoutes    from './routes/scouts';
import contentRoutes   from './routes/content';
import legalRoutes     from './routes/legal';
import journeyRoutes   from './routes/journey';
import eventsRoutes    from './routes/events';
import mentorRoutes    from './routes/mentor';
import adminRoutes        from './routes/admin';
import certificateRoutes  from './routes/certificates';
import { openapiSpec }    from './openapi';

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

// ── OpenAPI / Swagger UI ──────────────────────────────────────
app.get('/api/docs/openapi.json', (_req, res) => {
  res.json(openapiSpec);
});
// Minimal Swagger UI redirect (full UI served via CDN)
app.get('/api/docs', (_req, res) => {
  res.send(`<!DOCTYPE html><html><head>
    <title>Njoum API Docs</title>
    <meta charset="utf-8"/>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css">
  </head><body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
    <script>
      SwaggerUIBundle({ url: '/api/docs/openapi.json', dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
        layout: 'BaseLayout' });
    </script>
  </body></html>`);
});

// ── API v1 routes ─────────────────────────────────────────────
app.use('/api/v1/users/me',     userRoutes);
app.use('/api/v1/sos',          sosRoutes);
app.use('/api/v1/hotlines',     hotlineRoutes);
app.use('/api/v1/mood-logs',    moodRoutes);
app.use('/api/v1/journal',      journalRoutes);
app.use('/api/v1/cycles',       cycleRoutes);
app.use('/api/v1/community',    communityRoutes);
app.use('/api/v1/scouts',       scoutsRoutes);
app.use('/api/v1/content',      contentRoutes);
app.use('/api/v1/legal',        legalRoutes);
app.use('/api/v1/journey',      journeyRoutes);
app.use('/api/v1/events',       eventsRoutes);
app.use('/api/v1/mentor',       mentorRoutes);
app.use('/api/v1/admin',        adminRoutes);
app.use('/api/v1/badges',       certificateRoutes);

// ── Error handling (must be last) ────────────────────────────
app.use(notFound);
Sentry.setupExpressErrorHandler(app); // captures unhandled errors before our handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[Njoum API] Running on port ${PORT} (${process.env.NODE_ENV ?? 'development'})`);
});

export default app; // for supertest
