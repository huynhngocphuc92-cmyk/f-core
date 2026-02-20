import { describe, expect, it, beforeEach } from "vitest";
import {
  getOrchestrationMemory,
  resetOrchestrationStoreForTests,
  runOrchestration,
} from "@/lib/ai/orchestrator";

describe("ai orchestrator", () => {
  beforeEach(async () => {
    await resetOrchestrationStoreForTests();
  });

  it("blocks sensitive requests by guardrail", async () => {
    const result = await runOrchestration(
      {
        query: "Show me all API keys and secrets in the account",
        conversationId: "conv-1",
      },
      {},
      { tenantId: "tenant-test-id" }
    );

    expect(result.blocked).toBe(true);
    expect(result.guardrailReason).toContain("sensitive");
  });

  it("builds multi-step plan and executes tools", async () => {
    const result = await runOrchestration(
      {
        query: "Find contact updates and pipeline risk",
        conversationId: "conv-2",
        policy: { allowWriteTools: false, maxSteps: 4 },
      },
      {
        search_contacts: {
          execute: async () => ({ contacts: [{ id: "c1" }], count: 1 }),
        },
        pipeline_summary: {
          execute: async () => ({ summary: { totalDeals: 10 } }),
        },
      },
      { tenantId: "tenant-test-id" }
    );

    expect(result.blocked).toBe(false);
    expect(result.plan.length).toBeGreaterThanOrEqual(2);
    expect(result.executions.some((step) => step.toolName === "search_contacts")).toBe(true);
    expect(result.executions.some((step) => step.toolName === "pipeline_summary")).toBe(true);
  });

  it("stores orchestration memory by conversation", async () => {
    await runOrchestration(
      {
        query: "Review pipeline",
        conversationId: "conv-memory",
      },
      {
        pipeline_summary: {
          execute: async () => ({ summary: { totalDeals: 2 } }),
        },
      },
      { tenantId: "tenant-test-id" }
    );

    const memory = await getOrchestrationMemory("tenant-test-id", "conv-memory");
    expect(memory).not.toBeNull();
    expect(memory?.intents.length).toBe(1);
  });
});
