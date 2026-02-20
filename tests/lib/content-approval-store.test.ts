import { beforeEach, describe, expect, it } from "vitest";
import {
  createApprovalRequest,
  decideApprovalRequest,
  getApprovalEligibility,
  listApprovalPolicies,
  resetContentApprovalStoreForTests,
  upsertApprovalPolicy,
} from "@/lib/content-approval-store";

const TENANT_ID = "tenant-test-id";

describe("content approval store", () => {
  beforeEach(async () => {
    await resetContentApprovalStoreForTests();
  });

  it("returns disabled default policies for spaces", async () => {
    const policies = await listApprovalPolicies(TENANT_ID);
    expect(policies).toHaveLength(2);
    expect(policies.every((policy) => policy.enabled === false)).toBe(true);
  });

  it("requires approval when policy is enabled", async () => {
    await upsertApprovalPolicy(TENANT_ID, {
      space: "blog_post",
      enabled: true,
      requiredApprovals: 1,
    });

    const blocked = await getApprovalEligibility(TENANT_ID, "blog_post", "post-1", new Date().toISOString());
    expect(blocked.canPublish).toBe(false);

    const pending = await createApprovalRequest(TENANT_ID, {
      space: "blog_post",
      assetId: "post-1",
      assetTitle: "Post 1",
      assetUpdatedAt: new Date().toISOString(),
      requestedBy: "author-1",
    });

    const approved = await decideApprovalRequest(TENANT_ID, pending.id, "reviewer-1", {
      decision: "approved",
    });

    expect(approved.status).toBe("approved");

    const allowed = await getApprovalEligibility(TENANT_ID, "blog_post", "post-1", new Date().toISOString());
    expect(allowed.canPublish).toBe(true);
  });

  it("blocks self-approval", async () => {
    const request = await createApprovalRequest(TENANT_ID, {
      space: "blog_post",
      assetId: "post-2",
      assetTitle: "Post 2",
      assetUpdatedAt: new Date().toISOString(),
      requestedBy: "user-1",
    });

    await expect(
      decideApprovalRequest(TENANT_ID, request.id, "user-1", {
        decision: "approved",
      })
    ).rejects.toThrow("Requester cannot approve their own content");
  });
});
