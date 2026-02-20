import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import {
  createMockRequest,
  createMockParams,
  getResponseBody,
} from "./helpers/mock-request";

// API route handlers
import { GET as listPayments, POST as createPayment } from "@/app/api/commerce/payments/route";
import { GET as getPayment, PUT as updatePayment } from "@/app/api/commerce/payments/[id]/route";
import { POST as webhookHandler } from "@/app/api/commerce/stripe/webhook/route";

// Mock Stripe module
vi.mock("@/lib/stripe", () => ({
  getStripe: vi.fn().mockReturnValue(null),
  requireStripe: vi.fn().mockImplementation(() => {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY environment variable.");
  }),
  constructWebhookEvent: vi.fn(),
  findOrCreateCustomer: vi.fn(),
  createPaymentIntent: vi.fn(),
  createRefund: vi.fn(),
  amountToCents: (amount: number) => Math.round(amount * 100),
  centsToAmount: (cents: number) => cents / 100,
}));

// Mock webhook handler
vi.mock("@/lib/stripe-webhook-handler", () => ({
  handleStripeWebhookEvent: vi.fn().mockResolvedValue(undefined),
}));

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);

const TENANT_ID = "tenant-test-id";

beforeEach(() => {
  vi.clearAllMocks();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("Commerce Payments API", () => {
  describe("GET /api/commerce/payments", () => {
    it("returns empty list and summary when no payments exist", async () => {
      const response = await listPayments(createMockRequest("/api/commerce/payments"));
      const body = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(body.data).toEqual([]);
      expect(body.summary).toBeDefined();
      expect(body.summary.total).toBe(0);
      expect(body.summary.succeeded).toBe(0);
      expect(body.summary.collectedAmount).toBe(0);
    });

    it("returns 401 when not authenticated", async () => {
      mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

      const response = await listPayments(createMockRequest("/api/commerce/payments"));
      const body = await getResponseBody(response);

      expect(response.status).toBe(401);
      expect(body.error).toBe("Authentication required");
    });
  });

  describe("POST /api/commerce/payments", () => {
    it("creates a manual payment successfully", async () => {
      const response = await createPayment(
        createMockRequest("/api/commerce/payments", {
          method: "POST",
          body: {
            customerName: "ACME Corp",
            amount: 500,
            currency: "USD",
            method: "manual",
          },
        })
      );
      const body = await getResponseBody(response);

      expect(response.status).toBe(201);
      expect(body.payment).toBeDefined();
      expect(body.payment.customerName).toBe("ACME Corp");
      expect(body.payment.amount).toBe(500);
      expect(body.payment.status).toBe("pending");
      expect(body.payment.method).toBe("manual");
    });

    it("requires Stripe when using card method", async () => {
      const response = await createPayment(
        createMockRequest("/api/commerce/payments", {
          method: "POST",
          body: {
            customerName: "ACME Corp",
            amount: 500,
            currency: "USD",
            method: "card",
          },
        })
      );
      const body = await getResponseBody(response);

      expect(response.status).toBe(500);
      expect(body.error).toMatch(/Stripe/);
    });

    it("validates required fields", async () => {
      const response = await createPayment(
        createMockRequest("/api/commerce/payments", {
          method: "POST",
          body: { amount: 100 },
        })
      );
      const body = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(body.error).toBe("Validation failed");
    });
  });

  describe("GET /api/commerce/payments/:id", () => {
    it("returns a specific payment", async () => {
      // Create one first
      await createPayment(
        createMockRequest("/api/commerce/payments", {
          method: "POST",
          body: {
            customerName: "Test Corp",
            amount: 250,
            currency: "USD",
            method: "manual",
          },
        })
      );

      // List to get the ID
      const listResponse = await listPayments(createMockRequest("/api/commerce/payments"));
      const listBody = await getResponseBody(listResponse);
      const paymentId = listBody.data[0]?.id;
      expect(paymentId).toBeDefined();

      // Get by ID
      const response = await getPayment(
        createMockRequest(`/api/commerce/payments/${paymentId}`),
        createMockParams({ id: paymentId })
      );
      const body = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(body.payment.customerName).toBe("Test Corp");
    });

    it("returns 404 for non-existent payment", async () => {
      const response = await getPayment(
        createMockRequest("/api/commerce/payments/nonexistent"),
        createMockParams({ id: "nonexistent" })
      );
      const body = await getResponseBody(response);

      expect(response.status).toBe(404);
      expect(body.error).toMatch(/not found/i);
    });
  });

  describe("PUT /api/commerce/payments/:id - mark_paid", () => {
    it("marks a pending payment as paid", async () => {
      // Create a manual payment
      const createResponse = await createPayment(
        createMockRequest("/api/commerce/payments", {
          method: "POST",
          body: {
            customerName: "Mark Paid Corp",
            amount: 1000,
            currency: "USD",
            method: "manual",
          },
        })
      );
      const createBody = await getResponseBody(createResponse);
      const paymentId = createBody.payment.id;

      // Mark as paid
      const response = await updatePayment(
        createMockRequest(`/api/commerce/payments/${paymentId}`, {
          method: "PUT",
          body: { action: "mark_paid" },
        }),
        createMockParams({ id: paymentId })
      );
      const body = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(body.payment.status).toBe("succeeded");
      expect(body.payment.paidAt).toBeDefined();
    });

    it("rejects marking already-paid payment", async () => {
      const createResponse = await createPayment(
        createMockRequest("/api/commerce/payments", {
          method: "POST",
          body: {
            customerName: "Already Paid Corp",
            amount: 500,
            currency: "USD",
            method: "manual",
          },
        })
      );
      const createBody = await getResponseBody(createResponse);
      const paymentId = createBody.payment.id;

      // Mark as paid first time
      await updatePayment(
        createMockRequest(`/api/commerce/payments/${paymentId}`, {
          method: "PUT",
          body: { action: "mark_paid" },
        }),
        createMockParams({ id: paymentId })
      );

      // Mark as paid second time
      const response = await updatePayment(
        createMockRequest(`/api/commerce/payments/${paymentId}`, {
          method: "PUT",
          body: { action: "mark_paid" },
        }),
        createMockParams({ id: paymentId })
      );
      const body = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(body.error).toMatch(/already/i);
    });
  });

  describe("PUT /api/commerce/payments/:id - refund", () => {
    it("refunds a succeeded payment (manual, no Stripe)", async () => {
      // Create and mark paid
      const createResponse = await createPayment(
        createMockRequest("/api/commerce/payments", {
          method: "POST",
          body: {
            customerName: "Refund Corp",
            amount: 750,
            currency: "USD",
            method: "manual",
          },
        })
      );
      const createBody = await getResponseBody(createResponse);
      const paymentId = createBody.payment.id;

      await updatePayment(
        createMockRequest(`/api/commerce/payments/${paymentId}`, {
          method: "PUT",
          body: { action: "mark_paid" },
        }),
        createMockParams({ id: paymentId })
      );

      // Refund
      const response = await updatePayment(
        createMockRequest(`/api/commerce/payments/${paymentId}`, {
          method: "PUT",
          body: {
            action: "refund",
            refundReason: "requested_by_customer",
          },
        }),
        createMockParams({ id: paymentId })
      );
      const body = await getResponseBody(response);

      expect(response.status).toBe(200);
      expect(body.payment.status).toBe("refunded");
      expect(body.payment.refundedAmount).toBe(750);
      expect(body.payment.refundedAt).toBeDefined();
    });

    it("rejects refunding a pending payment", async () => {
      const createResponse = await createPayment(
        createMockRequest("/api/commerce/payments", {
          method: "POST",
          body: {
            customerName: "No Refund Corp",
            amount: 300,
            currency: "USD",
            method: "manual",
          },
        })
      );
      const createBody = await getResponseBody(createResponse);
      const paymentId = createBody.payment.id;

      const response = await updatePayment(
        createMockRequest(`/api/commerce/payments/${paymentId}`, {
          method: "PUT",
          body: { action: "refund" },
        }),
        createMockParams({ id: paymentId })
      );
      const body = await getResponseBody(response);

      expect(response.status).toBe(400);
      expect(body.error).toMatch(/succeeded/i);
    });
  });

  describe("Payment summary aggregation", () => {
    it("correctly summarizes payments across statuses", async () => {
      // Clear existing payments from previous tests
      await mockPrisma.commercePayment.deleteMany({});

      // Create multiple payments
      for (const name of ["A", "B", "C"]) {
        await createPayment(
          createMockRequest("/api/commerce/payments", {
            method: "POST",
            body: {
              customerName: `Company ${name}`,
              amount: 1000,
              currency: "USD",
              method: "manual",
            },
          })
        );
      }

      // List to get IDs
      const listResponse = await listPayments(createMockRequest("/api/commerce/payments"));
      const listBody = await getResponseBody(listResponse);
      const ids = listBody.data.map((p: { id: string }) => p.id);

      // Mark first as paid
      await updatePayment(
        createMockRequest(`/api/commerce/payments/${ids[0]}`, {
          method: "PUT",
          body: { action: "mark_paid" },
        }),
        createMockParams({ id: ids[0] })
      );

      // Check summary
      const finalResponse = await listPayments(createMockRequest("/api/commerce/payments"));
      const finalBody = await getResponseBody(finalResponse);

      expect(finalBody.summary.total).toBe(3);
      expect(finalBody.summary.succeeded).toBe(1);
      expect(finalBody.summary.pending).toBe(2);
      expect(finalBody.summary.collectedAmount).toBe(1000);
    });
  });
});

describe("Stripe Webhook Endpoint", () => {
  it("returns 503 when Stripe is not configured", async () => {
    const response = await webhookHandler(
      createMockRequest("/api/commerce/stripe/webhook", {
        method: "POST",
        headers: { "stripe-signature": "sig_test" },
        body: { type: "payment_intent.succeeded" },
      })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(503);
    expect(body.error).toMatch(/not configured/i);
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    // Override getStripe to return a mock
    const { getStripe } = await import("@/lib/stripe");
    vi.mocked(getStripe).mockReturnValue({} as never);

    // Override webhook secret
    const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret";

    const response = await webhookHandler(
      createMockRequest("/api/commerce/stripe/webhook", {
        method: "POST",
        body: { type: "payment_intent.succeeded" },
      })
    );
    const body = await getResponseBody(response);

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/stripe-signature/i);

    // Restore
    process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
    vi.mocked(getStripe).mockReturnValue(null);
  });
});

describe("Stripe helpers", () => {
  it("amountToCents converts correctly", async () => {
    const { amountToCents } = await import("@/lib/stripe");
    expect(amountToCents(10.5)).toBe(1050);
    expect(amountToCents(0)).toBe(0);
    expect(amountToCents(99.99)).toBe(9999);
  });

  it("centsToAmount converts correctly", async () => {
    const { centsToAmount } = await import("@/lib/stripe");
    expect(centsToAmount(1050)).toBe(10.5);
    expect(centsToAmount(0)).toBe(0);
  });
});
