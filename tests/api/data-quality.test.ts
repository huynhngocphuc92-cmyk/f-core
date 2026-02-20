import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getCurrentUser, getTenantId } from "@/lib/auth-helpers";
import { GET as listRulesApi, PUT as upsertRuleApi } from "@/app/api/data/quality/rules/route";
import { GET as listCandidatesApi } from "@/app/api/data/quality/dedupe/candidates/route";
import { GET as listMergeApi, POST as runMergeApi } from "@/app/api/data/quality/merge/route";
import { resetDataQualityStoreForTests } from "@/lib/data-quality-store";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const mockGetCurrentUser = vi.mocked(getCurrentUser);
const TENANT_ID = "tenant-test-id";

beforeEach(async () => {
  vi.clearAllMocks();
  await resetDataQualityStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
  mockGetCurrentUser.mockResolvedValue({ id: "user-1" } as any);

  mockPrisma.contact.findMany.mockResolvedValue([] as any);
  mockPrisma.company.findMany.mockResolvedValue([] as any);
  mockPrisma.contact.findFirst.mockResolvedValue(null as any);
  mockPrisma.company.findFirst.mockResolvedValue(null as any);
  mockPrisma.contact.update.mockResolvedValue({} as any);
  mockPrisma.company.update.mockResolvedValue({} as any);
});

describe("data quality APIs", () => {
  it("upserts rules and returns candidates", async () => {
    const updatedRule = await upsertRuleApi(
      createMockRequest("/api/data/quality/rules", {
        method: "PUT",
        body: {
          objectType: "contact",
          requireEmail: true,
          requirePhone: true,
          requireDomain: false,
          minNameLength: 3,
          autoMergeExactKey: false,
        },
      })
    );

    expect(updatedRule.status).toBe(200);

    mockPrisma.contact.findMany.mockResolvedValue([
      {
        id: "c1",
        firstName: "A",
        lastName: "One",
        email: "same@example.com",
        phone: "111-111-1111",
        updatedAt: new Date("2026-02-15T10:00:00.000Z"),
      },
      {
        id: "c2",
        firstName: "B",
        lastName: "Two",
        email: "same@example.com",
        phone: "111-111-1111",
        updatedAt: new Date("2026-02-15T11:00:00.000Z"),
      },
    ] as any);

    const candidates = await listCandidatesApi(
      createMockRequest("/api/data/quality/dedupe/candidates", {
        searchParams: { objectType: "contact" },
      })
    );
    const candidatesBody = await getResponseBody(candidates);

    expect(candidates.status).toBe(200);
    expect(candidatesBody.data.length).toBeGreaterThan(0);

    const rules = await listRulesApi(createMockRequest("/api/data/quality/rules"));
    const rulesBody = await getResponseBody(rules);
    expect(rules.status).toBe(200);
    expect(rulesBody.data).toHaveLength(2);
  });

  it("runs company merge workflow and writes audit", async () => {
    mockPrisma.company.findFirst
      .mockResolvedValueOnce({
        id: "co1",
        tenantId: TENANT_ID,
        name: "Primary Co",
        domain: "acme.com",
        phone: "123",
        website: null,
        industry: null,
        description: null,
        deletedAt: null,
      } as any)
      .mockResolvedValueOnce({
        id: "co2",
        tenantId: TENANT_ID,
        name: "Dup Co",
        domain: "acme.com",
        phone: "999",
        website: "https://acme.com",
        industry: "SaaS",
        description: "desc",
        deletedAt: null,
      } as any);

    const merged = await runMergeApi(
      createMockRequest("/api/data/quality/merge", {
        method: "POST",
        body: {
          objectType: "company",
          primaryId: "co1",
          duplicateId: "co2",
          mergeMode: "prefer_primary",
          dryRun: false,
        },
      })
    );

    expect(merged.status).toBe(200);
    expect(mockPrisma.company.update).toHaveBeenCalledTimes(2);

    const audit = await listMergeApi(createMockRequest("/api/data/quality/merge"));
    const auditBody = await getResponseBody(audit);
    expect(audit.status).toBe(200);
    expect(auditBody.data).toHaveLength(1);
  });

  it("returns 401 when unauthenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await listRulesApi(createMockRequest("/api/data/quality/rules"));
    expect(response.status).toBe(401);
  });
});
