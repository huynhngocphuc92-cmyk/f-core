import { beforeEach, describe, expect, it } from "vitest";
import {
  createInvoice,
  listInvoices,
  resetInvoiceStoreForTests,
  updateInvoiceStatus,
} from "@/lib/invoice-store";

const TENANT_ID = "tenant-test-id";

describe("invoice store", () => {
  beforeEach(async () => {
    await resetInvoiceStoreForTests();
  });

  it("creates invoice in draft state", async () => {
    const invoice = await createInvoice(TENANT_ID, {
      customerName: "ACME",
      amount: 1000,
      currency: "USD",
    });

    expect(invoice.status).toBe("draft");
    expect(invoice.invoiceNumber).toContain("INV-");
    expect(await listInvoices(TENANT_ID)).toHaveLength(1);
  });

  it("supports draft -> sent -> paid transition", async () => {
    const invoice = await createInvoice(TENANT_ID, {
      customerName: "ACME",
      amount: 1000,
      currency: "USD",
    });

    const sent = await updateInvoiceStatus(TENANT_ID, invoice.id, "sent");
    const sentStatus = sent?.status;
    const sentIssuedAt = sent?.issuedAt;

    const paid = await updateInvoiceStatus(TENANT_ID, invoice.id, "paid");

    expect(sentStatus).toBe("sent");
    expect(sentIssuedAt).toBeTruthy();
    expect(paid?.status).toBe("paid");
    expect(paid?.paidAt).toBeTruthy();
  });

  it("blocks invalid transition from paid to void", async () => {
    const invoice = await createInvoice(TENANT_ID, {
      customerName: "ACME",
      amount: 1000,
      currency: "USD",
    });

    await updateInvoiceStatus(TENANT_ID, invoice.id, "sent");
    await updateInvoiceStatus(TENANT_ID, invoice.id, "paid");

    await expect(updateInvoiceStatus(TENANT_ID, invoice.id, "void")).rejects.toThrow();
  });
});
