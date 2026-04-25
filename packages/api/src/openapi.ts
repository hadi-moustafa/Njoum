// ============================================================
// OpenAPI 3.0 spec — served at GET /api/docs/openapi.json
// Swagger UI at GET /api/docs
// ============================================================

export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title:       'Njoum API',
    version:     '1.0.0',
    description: 'نجوم — Safety-first app for girls and young women. Admin-only endpoints require an admin role in the JWT.',
    contact: { name: 'Njoum Team', email: 'hadimoustafa2024@gmail.com' },
  },
  servers: [
    { url: 'http://localhost:3001/api/v1', description: 'Local dev' },
    { url: 'https://api.njoum.app/api/v1',  description: 'Production' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data:    { nullable: true },
          error:   { nullable: true, type: 'object', properties: { code: { type: 'string' }, message: { type: 'string' } } },
          meta:    { nullable: true },
        },
      },
      User: {
        type: 'object',
        properties: {
          id:            { type: 'string', format: 'uuid' },
          email:         { type: 'string', format: 'email' },
          display_name:  { type: 'string', nullable: true },
          role:          { type: 'string', enum: ['girl','parent','mentor','content_admin','community_moderator','super_admin'] },
          age_range:     { type: 'string', nullable: true },
          created_at:    { type: 'string', format: 'date-time' },
        },
      },
      Hotline: {
        type: 'object',
        properties: {
          id:           { type: 'string', format: 'uuid' },
          name:         { type: 'string' },
          number:       { type: 'string' },
          category:     { type: 'string' },
          country_code: { type: 'string', minLength: 2, maxLength: 2 },
          is_active:    { type: 'boolean' },
          is_24h:       { type: 'boolean' },
        },
      },
      SosEvent: {
        type: 'object',
        properties: {
          id:             { type: 'string', format: 'uuid' },
          trigger_method: { type: 'string', enum: ['button','shake','volume','safe_word'] },
          cancelled:      { type: 'boolean' },
          resolved_at:    { type: 'string', format: 'date-time', nullable: true },
          created_at:     { type: 'string', format: 'date-time' },
        },
      },
      MoodLog: {
        type: 'object',
        properties: {
          id:        { type: 'string', format: 'uuid' },
          score:     { type: 'integer', minimum: 1, maximum: 5 },
          emoji:     { type: 'string' },
          note:      { type: 'string', nullable: true },
          logged_at: { type: 'string', format: 'date-time' },
        },
      },
      JournalEntry: {
        type: 'object',
        properties: {
          id:         { type: 'string', format: 'uuid' },
          title:      { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      Article: {
        type: 'object',
        properties: {
          id:           { type: 'string', format: 'uuid' },
          title:        { type: 'string' },
          module:       { type: 'string', enum: ['safety','mental_health','legal','wellness','self_defence'] },
          language:     { type: 'string' },
          is_published: { type: 'boolean' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          data:    { nullable: true, example: null },
          error:   { type: 'object', properties: { code: { type: 'string' }, message: { type: 'string' } } },
          meta:    { nullable: true, example: null },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: '401 — Missing or invalid token',
        content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } },
      },
      Forbidden: {
        description: '403 — Insufficient role',
        content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } },
      },
      NotFound: {
        description: '404 — Resource not found',
        content: { 'application/json': { schema: { '$ref': '#/components/schemas/ErrorResponse' } } },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'], summary: 'Register (Supabase handles this — stub)',
        description: 'Registration is handled by Supabase Auth + Google Sign-In. This endpoint is informational only.',
        responses: { '200': { description: 'OK' } },
      },
    },
    '/hotlines': {
      get: {
        tags: ['Hotlines'], summary: 'List hotlines',
        security: [],
        parameters: [
          { name: 'country', in: 'query', schema: { type: 'string', minLength: 2, maxLength: 2 } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Hotline list', content: { 'application/json': { schema: { '$ref': '#/components/schemas/ApiResponse' } } } },
          '400': { '$ref': '#/components/responses/Unauthorized' },
        },
      },
    },
    '/sos': {
      post: {
        tags: ['SOS'], summary: 'Trigger SOS',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: {
            trigger_method: { type: 'string', enum: ['button','shake','volume','safe_word'] },
            latitude:  { type: 'number' },
            longitude: { type: 'number' },
          } } } },
        },
        responses: {
          '201': { description: 'SOS created; contacts notified' },
          '401': { '$ref': '#/components/responses/Unauthorized' },
        },
      },
    },
    '/sos/{id}/cancel': {
      patch: {
        tags: ['SOS'], summary: 'Cancel SOS (within 10s grace period)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Cancelled' }, '400': { description: 'Grace period expired' } },
      },
    },
    '/mood-logs': {
      get:  { tags: ['Wellness'], summary: 'List mood logs', responses: { '200': { description: 'Mood history' } } },
      post: {
        tags: ['Wellness'], summary: 'Log daily mood',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object',
          required: ['score'],
          properties: { score: { type: 'integer', minimum: 1, maximum: 5 }, emoji: { type: 'string' }, note: { type: 'string' } },
        } } } },
        responses: { '200': { description: 'Mood upserted' }, '401': { '$ref': '#/components/responses/Unauthorized' } },
      },
    },
    '/journal': {
      get:  { tags: ['Wellness'], summary: 'List journal entries (metadata only — no content)', responses: { '200': { description: 'Entry list' } } },
      post: {
        tags: ['Wellness'], summary: 'Create journal entry',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object',
          required: ['content'],
          properties: { title: { type: 'string' }, content: { type: 'string' } },
        } } } },
        responses: { '201': { description: 'Created (content encrypted server-side)' } },
      },
    },
    '/community/groups': {
      get: { tags: ['Community'], summary: 'List support groups', responses: { '200': { description: 'Groups' } } },
    },
    '/community/groups/{id}/posts': {
      get: { tags: ['Community'], summary: 'List posts in a group',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Posts (author_id hidden when is_anonymous)' } },
      },
      post: {
        tags: ['Community'], summary: 'Create a post',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object',
          required: ['content'],
          properties: { content: { type: 'string' }, is_anonymous: { type: 'boolean', default: false } },
        } } } },
        responses: { '201': { description: 'Post created (goes through moderation pipeline)' } },
      },
    },
    '/admin/users': {
      get: {
        tags: ['Admin'], summary: 'List all users',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'role', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Paginated user list' }, '403': { '$ref': '#/components/responses/Forbidden' } },
      },
    },
    '/admin/reports': {
      get: {
        tags: ['Admin'], summary: 'Moderation queue',
        parameters: [{ name: 'status', in: 'query', schema: { type: 'string', enum: ['open','under_review','resolved','dismissed'] } }],
        responses: { '200': { description: 'Reports' } },
      },
    },
  },
};
