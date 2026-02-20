import { describe, expect, it } from "vitest";
import {
  issueCustomerPortalToken,
  verifyCustomerPortalToken,
} from "@/lib/customer-portal-token";

describe("customer portal token", () => {
  it("issues and verifies valid token", () => {
    const { token } = issueCustomerPortalToken({
      tenantId: "tenant-1",
      contactId: "contact-1",
      email: "contact@example.com",
      expiresInMinutes: 60,
    });

    const payload = verifyCustomerPortalToken(token);
    expect(payload.tenantId).toBe("tenant-1");
    expect(payload.contactId).toBe("contact-1");
    expect(payload.email).toBe("contact@example.com");
  });

  it("rejects malformed token", () => {
    expect(() => verifyCustomerPortalToken("bad-token")).toThrow("Invalid portal token format");
  });
});
