import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  canTriggerDoctorNotification,
  isDemoModeAllowed,
  isOriginAllowed,
  isValidUuid,
  parseAllowedOrigins,
  resolveSelfRegistrationRole,
  resolveSupabaseConfig,
} from "./security";

const repoRoot = path.resolve(__dirname, "../..");

describe("MediQueue authentication & environment hardening", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("forces public self-registration to the patient role only", () => {
    expect(resolveSelfRegistrationRole()).toBe("patient");
  });

  it("fails closed for demo mode in production builds", () => {
    expect(isDemoModeAllowed({ DEV: false, PROD: true })).toBe(false);
    expect(isDemoModeAllowed({ DEV: true, PROD: true })).toBe(false);
    expect(isDemoModeAllowed({ DEV: true, PROD: false, VITE_ENABLE_DEMO_MODE: "false" })).toBe(false);
    expect(isDemoModeAllowed({ DEV: true, PROD: false })).toBe(true);
  });

  it("denies demo mode activation when runtime env is production", async () => {
    localStorage.setItem("mediqueue_demo_mode", "true");
    vi.stubEnv("DEV", false as unknown as string);
    vi.stubEnv("PROD", true as unknown as string);
    vi.resetModules();

    const demoData = await import("./demoData");
    expect(demoData.checkDemoMode()).toBe(false);
    demoData.enableDemoMode();
    expect(demoData.checkDemoMode()).toBe(false);

    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("validates Supabase configuration and rejects insecure or missing values", () => {
    expect(() => resolveSupabaseConfig({})).toThrow(/VITE_SUPABASE_URL/);
    expect(() =>
      resolveSupabaseConfig({
        VITE_SUPABASE_URL: "not-a-url",
        VITE_SUPABASE_PUBLISHABLE_KEY: "pk_test",
      }),
    ).toThrow(/Invalid VITE_SUPABASE_URL/);
    expect(() =>
      resolveSupabaseConfig({
        VITE_SUPABASE_URL: "http://remote.example.com",
        VITE_SUPABASE_PUBLISHABLE_KEY: "pk_test",
      }),
    ).toThrow(/must use HTTPS/);

    expect(
      resolveSupabaseConfig({
        VITE_SUPABASE_URL: "https://example.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: "pk_test",
      }),
    ).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "pk_test",
    });

    expect(
      resolveSupabaseConfig({
        VITE_SUPABASE_URL: "http://localhost:54321",
        VITE_SUPABASE_ANON_KEY: "local_key",
      }),
    ).toEqual({
      url: "http://localhost:54321",
      publishableKey: "local_key",
    });
  });

  it("enforces strict UUID, origin allowlist, and doctor ownership rules", () => {
    expect(isValidUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isValidUuid("not-a-uuid")).toBe(false);

    const origins = parseAllowedOrigins("https://mediqueue.example.com, *, http://localhost:8080 ");
    expect(origins).toEqual(["https://mediqueue.example.com", "http://localhost:8080"]);
    expect(isOriginAllowed("https://mediqueue.example.com", origins)).toBe(true);
    expect(isOriginAllowed("https://evil.example.com", origins)).toBe(false);
    expect(isOriginAllowed(null, origins)).toBe(true);

    expect(canTriggerDoctorNotification("admin", "u1", "u2")).toBe(true);
    expect(canTriggerDoctorNotification("doctor", "u1", "u1")).toBe(true);
    expect(canTriggerDoctorNotification("doctor", "u1", "u2")).toBe(false);
    expect(canTriggerDoctorNotification("patient", "u1", "u1")).toBe(false);
    expect(canTriggerDoctorNotification(null, "u1", "u1")).toBe(false);
  });

  it("keeps .env untracked, ignored, and documents placeholder keys in .env.example", () => {
    expect(existsSync(path.join(repoRoot, ".env"))).toBe(false);

    const gitignore = readFileSync(path.join(repoRoot, ".gitignore"), "utf8");
    expect(gitignore).toMatch(/^\.env$/m);
    expect(gitignore).toMatch(/!\.env\.example/m);

    const envExample = readFileSync(path.join(repoRoot, ".env.example"), "utf8");
    expect(envExample).toContain("VITE_SUPABASE_URL=");
    expect(envExample).toContain("VITE_SUPABASE_PUBLISHABLE_KEY=");
    expect(envExample).not.toMatch(/eyJhbGci/);
  });

  it("hardens Auth signup UI and database RLS/role migration policies", () => {
    const authSource = readFileSync(path.join(repoRoot, "src/pages/Auth.tsx"), "utf8");
    expect(authSource).not.toMatch(/<TabsTrigger\s+value="admin"/);
    expect(authSource).not.toMatch(/<TabsTrigger\s+value="doctor"/);

    const migration = readFileSync(
      path.join(repoRoot, "supabase/migrations/20261111000000_harden_roles_and_rls.sql"),
      "utf8",
    );
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.handle_new_user()");
    expect(migration).toContain("'patient'");
    expect(migration).toContain("CREATE TRIGGER protect_profile_role_on_update");
    expect(migration).toContain('DROP POLICY IF EXISTS "System can insert notifications"');
    expect(migration).toContain("ALTER VIEW IF EXISTS public.daily_analytics SET (security_invoker = true)");
  });

  it("authenticates and authorizes callers in notify-patients Edge Function", () => {
    const edgeFn = readFileSync(
      path.join(repoRoot, "supabase/functions/notify-patients/index.ts"),
      "utf8",
    );
    expect(edgeFn).toContain("if (origin && !allowedOrigins.includes(origin))");
    expect(edgeFn).toContain("authClient.auth.getUser()");
    expect(edgeFn).toContain("['doctor', 'admin'].includes(callerProfile.role)");
    expect(edgeFn).toContain("doctor.user_id !== authData.user.id");
    expect(edgeFn).not.toContain("'Access-Control-Allow-Origin': '*'");
  });
});
