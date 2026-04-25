// Global test env vars — prevents "secret not set" throws
process.env['SUPABASE_JWT_SECRET'] = 'test-jwt-secret-that-is-at-least-32-characters-long';
process.env['ENCRYPTION_KEY']      = 'a'.repeat(64); // 32-byte hex
process.env['SUPABASE_URL']        = 'https://test.supabase.co';
process.env['SUPABASE_ANON_KEY']   = 'test-anon-key';
process.env['SUPABASE_SERVICE_ROLE_KEY'] = 'test-service-role-key';
