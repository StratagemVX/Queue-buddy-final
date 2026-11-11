export interface RuntimeEnv {
  DEV?: boolean;
  PROD?: boolean;
  MODE?: string;
  VITE_ENABLE_DEMO_MODE?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

export interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function resolveSelfRegistrationRole(): 'patient' {
  return 'patient';
}

export function isDemoModeAllowed(env: RuntimeEnv): boolean {
  return Boolean(env.DEV) && !env.PROD && env.VITE_ENABLE_DEMO_MODE !== 'false';
}

export function isValidUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value.trim());
}

export function parseAllowedOrigins(rawOrigins: string | undefined): string[] {
  if (!rawOrigins) return [];
  return rawOrigins
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0 && value !== '*');
}

export function isOriginAllowed(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return true;
  return allowedOrigins.includes(origin);
}

export function canTriggerDoctorNotification(
  callerRole: string | null | undefined,
  callerUserId: string | null | undefined,
  doctorUserId: string | null | undefined,
): boolean {
  if (!callerUserId || !callerRole) return false;
  if (callerRole === 'admin') return true;
  if (callerRole === 'doctor') {
    return Boolean(doctorUserId) && callerUserId === doctorUserId;
  }
  return false;
}

export function resolveSupabaseConfig(env: RuntimeEnv): SupabaseConfig {
  const url = typeof env.VITE_SUPABASE_URL === 'string' ? env.VITE_SUPABASE_URL.trim() : '';
  const publishableKey = (
    typeof env.VITE_SUPABASE_PUBLISHABLE_KEY === 'string' && env.VITE_SUPABASE_PUBLISHABLE_KEY.trim()
      ? env.VITE_SUPABASE_PUBLISHABLE_KEY
      : typeof env.VITE_SUPABASE_ANON_KEY === 'string'
        ? env.VITE_SUPABASE_ANON_KEY
        : ''
  ).trim();

  if (!url || !publishableKey) {
    throw new Error(
      'Missing Supabase configuration: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set.',
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Invalid VITE_SUPABASE_URL configuration.');
  }

  const isLocalHost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && isLocalHost)) {
    throw new Error('VITE_SUPABASE_URL must use HTTPS (or HTTP only for localhost development).');
  }

  return { url, publishableKey };
}
