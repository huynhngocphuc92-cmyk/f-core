import { beforeEach, describe, expect, it } from "vitest";
import {
  createMergeAudit,
  detectCompanyDuplicates,
  detectContactDuplicates,
  listMergeAudit,
  listQualityRules,
  resetDataQualityStoreForTests,
  upsertQualityRule,
} from "@/lib/data-quality-store";

const TENANT_ID = "tenant-test-id";

describe("data quality store", () => {
  beforeEach(async () => {
    await resetDataQualityStoreForTests();
  });

  it("detects contact duplicates by exact email", () => {
    const candidates = detectContactDuplicates([
      {
        id: "c1",
        firstName: "A",
        lastName: "One",
        email: "same@example.com",
        phone: "123",
        updatedAt: new Date("2026-02-15T10:00:00.000Z"),
      },
      {
        id: "c2",
        firstName: "B",
        lastName: "Two",
        email: "same@example.com",
        phone: "456",
        updatedAt: new Date("2026-02-15T11:00:00.000Z"),
      },
    ]);

    expect(candidates).toHaveLength(1);
    expect(candidates[0].objectType).toBe("contact");
    expect(candidates[0].records).toHaveLength(2);
  });

  it("detects company duplicates by domain", () => {
    const candidates = detectCompanyDuplicates([
      {
        id: "co1",
        name: "A Inc",
        domain: "acme.com",
        updatedAt: new Date("2026-02-15T10:00:00.000Z"),
      },
      {
        id: "co2",
        name: "Acme",
        domain: "acme.com",
        updatedAt: new Date("2026-02-15T12:00:00.000Z"),
      },
    ]);

    expect(candidates).toHaveLength(1);
    expect(candidates[0].reason).toContain("domain");
  });

  it("stores rule updates and merge audit trail", async () => {
    const updated = await upsertQualityRule(TENANT_ID, {
      objectType: "contact",
      requireEmail: true,
      requirePhone: true,
      requireDomain: false,
      minNameLength: 3,
      autoMergeExactKey: true,
    });

    expect(updated.requirePhone).toBe(true);

    const defaults = await listQualityRules(TENANT_ID);
    expect(defaults).toHaveLength(2);

    const audit = await createMergeAudit(TENANT_ID, {
      objectType: "contact",
      primaryId: "c1",
      duplicateId: "c2",
      mergedBy: "u1",
      dryRun: true,
      fieldsMerged: ["email"],
    });

    expect(audit.id).toBeTruthy();
    expect(await listMergeAudit(TENANT_ID)).toHaveLength(1);
  });
});
