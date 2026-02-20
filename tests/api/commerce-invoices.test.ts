import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockParams, createMockRequest, getResponseBody } from "../helpers/mock-request";
import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth-helpers";
import { GET as listInvoicesApi, POST as createInvoiceApi } from "@/app/api/commerce/invoices/route";
import { PATCH as patchInvoiceApi } from "@/app/api/commerce/invoices/[id]/route";
import { resetInvoiceStoreForTests } from "@/lib/invoice-store";

const mockPrisma = vi.mocked(prisma);
const mockGetTenantId = vi.mocked(getTenantId);
const TENANT_ID = "tenant-test-id";

beforeEach(() => {
  vi.clearAllMocks();
});

beforeEach(async () => {
  await resetInvoiceStoreForTests();
  mockGetTenantId.mockResolvedValue(TENANT_ID);
});

describe("commerce invoices API", () => {
  it("creates and lists invoices", async () => {
    const created = await createInvoiceApi(
      createMockRequest("/api/commerce/invoices", {
        method: "POST",
        body: {
          customerName: "ACME",
          amount: 1200,
          currency: "USD",
        },
      })
    );

    expect(created.status).toBe(201);

    const list = await listInvoicesApi(createMockRequest("/api/commerce/invoices"));
    const body = await getResponseBody(list);

    expect(list.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.summary.total).toBe(1);
  });

  it("applies valid status transition", async () => {
    const created = await createInvoiceApi(
      createMockRequest("/api/commerce/invoices", {
        method: "POST",
        body: {
          customerName: "ACME",
          amount: 1200,
          currency: "USD",
        },
      })
    );
    const createdBody = await getResponseBody(created);

    const patch = await patchInvoiceApi(
      createMockRequest(`/api/commerce/invoices/${createdBody.invoice.id}`, {
        method: "PATCH",
        body: { status: "sent" },
      }),
      createMockParams({ id: createdBody.invoice.id })
    );

    const patchBody = await getResponseBody(patch);
    expect(patch.status).toBe(200);
    expect(patchBody.invoice.status).toBe("sent");
  });

  it("returns 409 on invalid transition", async () => {
    const created = await createInvoiceApi(
      createMockRequest("/api/commerce/invoices", {
        method: "POST",
        body: {
          customerName: "ACME",
          amount: 1200,
          currency: "USD",
        },
      })
    );
    const createdBody = await getResponseBody(created);

    await patchInvoiceApi(
      createMockRequest(`/api/commerce/invoices/${createdBody.invoice.id}`, {
        method: "PATCH",
        body: { status: "sent" },
      }),
      createMockParams({ id: createdBody.invoice.id })
    );

    await patchInvoiceApi(
      createMockRequest(`/api/commerce/invoices/${createdBody.invoice.id}`, {
        method: "PATCH",
        body: { status: "paid" },
      }),
      createMockParams({ id: createdBody.invoice.id })
    );

    const invalid = await patchInvoiceApi(
      createMockRequest(`/api/commerce/invoices/${createdBody.invoice.id}`, {
        method: "PATCH",
        body: { status: "void" },
      }),
      createMockParams({ id: createdBody.invoice.id })
    );

    expect(invalid.status).toBe(409);
  });

  it("returns 401 when not authenticated", async () => {
    mockGetTenantId.mockRejectedValue(new Error("Unauthorized"));

    const response = await listInvoicesApi(createMockRequest("/api/commerce/invoices"));
    expect(response.status).toBe(401);
  });

  it("returns 404 when quote not found", async () => {
    mockPrisma.quote.findFirst.mockResolvedValue(null);

    const response = await createInvoiceApi(
      createMockRequest("/api/commerce/invoices", {
        method: "POST",
        body: {
          quoteId: "missing-quote",
          customerName: "ACME",
          amount: 1200,
          currency: "USD",
        },
      })
    );

    expect(response.status).toBe(404);
  });
});
