"use server";

import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

async function getTenantId(): Promise<string> {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error("No tenant found");
  return tenant.id;
}

// ============================================
// CREATE CONTACT
// ============================================

export async function createContact(formData: FormData) {
  const tenantId = await getTenantId();

  const email = formData.get("email") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;

  if (!email && !firstName) {
    return { error: "Email or first name is required" };
  }

  const contact = await prisma.contact.create({
    data: {
      tenantId,
      email: email || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      phone: (formData.get("phone") as string) || undefined,
      jobTitle: (formData.get("jobTitle") as string) || undefined,
      lifecycleStage: (formData.get("lifecycleStage") as string) || "subscriber",
      leadStatus: (formData.get("leadStatus") as string) || undefined,
      city: (formData.get("city") as string) || undefined,
      state: (formData.get("state") as string) || undefined,
      country: (formData.get("country") as string) || undefined,
    },
  });

  redirect(`/contacts/${contact.id}`);
}

// ============================================
// CREATE COMPANY
// ============================================

export async function createCompany(formData: FormData) {
  const tenantId = await getTenantId();

  const name = formData.get("name") as string;
  if (!name) {
    return { error: "Company name is required" };
  }

  const company = await prisma.company.create({
    data: {
      tenantId,
      name,
      domain: (formData.get("domain") as string) || undefined,
      industry: (formData.get("industry") as string) || undefined,
      type: (formData.get("type") as string) || undefined,
      size: (formData.get("size") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      website: (formData.get("website") as string) || undefined,
      city: (formData.get("city") as string) || undefined,
      state: (formData.get("state") as string) || undefined,
      country: (formData.get("country") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
    },
  });

  redirect(`/companies/${company.id}`);
}

// ============================================
// CREATE DEAL
// ============================================

export async function createDeal(formData: FormData) {
  const tenantId = await getTenantId();

  const name = formData.get("name") as string;
  const pipelineId = formData.get("pipelineId") as string;
  const stageId = formData.get("stageId") as string;

  if (!name || !pipelineId || !stageId) {
    return { error: "Name, pipeline, and stage are required" };
  }

  const amountStr = formData.get("amount") as string;

  const deal = await prisma.deal.create({
    data: {
      tenantId,
      name,
      pipelineId,
      stageId,
      amount: amountStr ? parseFloat(amountStr) : undefined,
      currency: (formData.get("currency") as string) || "USD",
      closeDate: formData.get("closeDate")
        ? new Date(formData.get("closeDate") as string)
        : undefined,
      priority: (formData.get("priority") as string) || undefined,
      dealType: (formData.get("dealType") as string) || undefined,
      description: (formData.get("description") as string) || undefined,
    },
  });

  redirect(`/deals/${deal.id}`);
}
