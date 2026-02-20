import { beforeEach, describe, expect, it } from "vitest";
import {
  getTenantPolicy,
  getTenantPolicyBySlug,
  isIpAllowedByPolicy,
  resetTenantPolicyStoreForTests,
  updateTenantPolicy,
  validatePasswordAgainstPolicy,
} from "@/lib/tenant-policy-store";

describe("tenant policy store", () => {
  beforeEach(async () => {
    await resetTenantPolicyStoreForTests();
  });

  it("returns default policy for unknown tenant", async () => {
    const policy = await getTenantPolicy("tenant-a");

    expect(policy.tenantSlug).toBe("f-core");
    expect(policy.session.maxSessionMinutes).toBe(480);
    expect(policy.password.minLength).toBe(8);
    expect(policy.ipAllowlist.enabled).toBe(false);
  });

  it("updates and resolves policy by slug", async () => {
    await updateTenantPolicy("tenant-acme", {
      tenantSlug: "acme",
      session: {
        maxSessionMinutes: 120,
        idleTimeoutMinutes: 20,
        rememberMeAllowed: false,
      },
      password: {
        minLength: 12,
        requireUppercase: true,
        requireNumber: true,
        requireSpecialChar: true,
      },
      ipAllowlist: {
        enabled: true,
        entries: [" 203.0.113.10 ", "10.0.0.0/24", ""],
      },
    });

    const found = await getTenantPolicyBySlug("ACME");
    expect(found?.tenantSlug).toBe("acme");
    expect(found?.ipAllowlist.entries).toEqual(["203.0.113.10", "10.0.0.0/24"]);
  });

  it("matches allowlist entries by exact IP and CIDR", async () => {
    const policy = await updateTenantPolicy("tenant-network", {
      tenantSlug: "network",
      session: {
        maxSessionMinutes: 300,
        idleTimeoutMinutes: 45,
        rememberMeAllowed: true,
      },
      password: {
        minLength: 10,
        requireUppercase: true,
        requireNumber: true,
        requireSpecialChar: false,
      },
      ipAllowlist: {
        enabled: true,
        entries: ["198.51.100.20", "10.10.0.0/16"],
      },
    });

    expect(isIpAllowedByPolicy(policy, "198.51.100.20")).toBe(true);
    expect(isIpAllowedByPolicy(policy, "10.10.25.5")).toBe(true);
    expect(isIpAllowedByPolicy(policy, "192.168.1.2")).toBe(false);
  });

  it("allows all IPs when allowlist is disabled", async () => {
    const policy = await getTenantPolicy("tenant-open");
    expect(isIpAllowedByPolicy(policy, "192.168.1.2")).toBe(true);
    expect(isIpAllowedByPolicy(policy, null)).toBe(true);
  });

  it("validates password against policy requirements", async () => {
    const policy = await updateTenantPolicy("tenant-password", {
      tenantSlug: "tenant-password",
      session: {
        maxSessionMinutes: 480,
        idleTimeoutMinutes: 60,
        rememberMeAllowed: true,
      },
      password: {
        minLength: 12,
        requireUppercase: true,
        requireNumber: true,
        requireSpecialChar: true,
      },
      ipAllowlist: {
        enabled: false,
        entries: [],
      },
    });

    const bad = validatePasswordAgainstPolicy("weakpass12", policy);
    expect(bad.pass).toBe(false);
    expect(bad.checks.uppercase).toBe(false);

    const good = validatePasswordAgainstPolicy("StrongPass12!", policy);
    expect(good.pass).toBe(true);
  });
});
