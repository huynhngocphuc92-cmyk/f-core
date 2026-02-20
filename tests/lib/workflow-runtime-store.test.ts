import { beforeEach, describe, expect, it } from "vitest";
import {
  createWorkflowVersion,
  listWorkflowDeadLetters,
  listWorkflowVersions,
  resetWorkflowRuntimeStoreForTests,
  retryWorkflowDeadLetter,
  runWorkflowWithRuntime,
  summarizeWorkflowRuntime,
} from "@/lib/workflow-runtime-store";

const TENANT_ID = "tenant-runtime";

describe("workflow runtime store", () => {
  beforeEach(async () => {
    await resetWorkflowRuntimeStoreForTests();
  });

  it("runs with retries and succeeds", async () => {
    const run = await runWorkflowWithRuntime(TENANT_ID, {
      workflowId: "wf-1",
      payload: { failUntilAttempt: 2 },
      maxRetries: 3,
    });

    expect(run.status).toBe("succeeded");
    expect(run.attempts).toHaveLength(3);
    expect(run.retriesUsed).toBe(2);
  });

  it("moves failed runs to dead-letter and supports retry", async () => {
    const first = await runWorkflowWithRuntime(TENANT_ID, {
      workflowId: "wf-2",
      payload: { forceFail: true },
      maxRetries: 1,
    });

    expect(first.status).toBe("dead_letter");

    const deadLetter = (await listWorkflowDeadLetters(TENANT_ID))[0];
    const retried = await retryWorkflowDeadLetter(TENANT_ID, deadLetter.id, {
      maxRetries: 2,
      dryRun: true,
    });

    expect(retried.rerun.status).toBe("succeeded");
    expect(retried.deadLetter.resolvedAt).not.toBeNull();
  });

  it("creates workflow versions and summary", async () => {
    const version = await createWorkflowVersion(TENANT_ID, {
      id: "wf-3",
      triggerType: "manual",
      triggerConfig: {},
      actions: [],
      status: "draft",
      isActive: false,
    });

    expect(version.version).toBe(1);
    expect(await listWorkflowVersions(TENANT_ID, "wf-3")).toHaveLength(1);

    await runWorkflowWithRuntime(TENANT_ID, {
      workflowId: "wf-3",
      payload: {},
      maxRetries: 0,
    });

    expect((await summarizeWorkflowRuntime(TENANT_ID)).totalRuns).toBe(1);
  });
});
