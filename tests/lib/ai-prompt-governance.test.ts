import { describe, expect, it } from "vitest";
import {
  createPromptVersion,
  getActivePromptVersion,
  listPromptVersions,
  resetPromptGovernanceStoreForTests,
  rollbackPromptVersion,
} from "@/lib/ai/prompt-governance";

describe("ai prompt governance", () => {
  it("creates prompt versions and marks active", async () => {
    await resetPromptGovernanceStoreForTests();
    const tenantId = "tenant-ai-prompt";

    const created = await createPromptVersion(tenantId, {
      agent: "chat",
      label: "v2",
      prompt: "Use more structured bullets and action-first responses.",
      activate: true,
    });

    const versions = await listPromptVersions(tenantId, "chat");
    expect(versions.length).toBeGreaterThan(1);
    expect(created.isActive).toBe(true);
    expect((await getActivePromptVersion(tenantId, "chat")).id).toBe(created.id);
  });

  it("rolls back to previous version", async () => {
    await resetPromptGovernanceStoreForTests();
    const tenantId = "tenant-ai-prompt-rollback";

    const older = await createPromptVersion(tenantId, {
      agent: "service",
      label: "ops-safe",
      prompt: "Always include an acknowledgement and next-step SLA.",
      activate: true,
    });
    const newer = await createPromptVersion(tenantId, {
      agent: "service",
      label: "ops-safe-v2",
      prompt: "Always include acknowledgement, next-step SLA, and escalation owner.",
      activate: true,
    });
    expect((await getActivePromptVersion(tenantId, "service")).id).toBe(newer.id);

    const active = await rollbackPromptVersion(tenantId, {
      agent: "service",
      versionId: older.id,
    });
    expect(active.id).toBe(older.id);
  });
});
