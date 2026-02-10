"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { nanoid } from "nanoid";

async function getTenantId(): Promise<string> {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error("No tenant found");
  return tenant.id;
}

async function getDefaultOwnerId(): Promise<string> {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found");
  return user.id;
}

// =============================================
// EMAIL TEMPLATES
// =============================================

export async function getEmailTemplates() {
  const tenantId = await getTenantId();
  return prisma.emailTemplate.findMany({
    where: { tenantId, deletedAt: null },
    include: { owner: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getEmailTemplate(id: string) {
  return prisma.emailTemplate.findFirst({
    where: { id, deletedAt: null },
    include: { owner: { select: { name: true } } },
  });
}

export async function createEmailTemplate(formData: FormData) {
  const tenantId = await getTenantId();
  const ownerId = await getDefaultOwnerId();

  const name = (formData.get("name") as string)?.trim();
  const subject = (formData.get("subject") as string)?.trim();
  const body = (formData.get("body") as string)?.trim();
  const category = (formData.get("category") as string)?.trim() || null;

  if (!name || !subject || !body) {
    return { error: "Name, subject, and body are required" };
  }

  await prisma.emailTemplate.create({
    data: { tenantId, name, subject, body, category, ownerId },
  });

  revalidatePath("/emails/templates");
  return { success: true };
}

export async function updateEmailTemplate(id: string, formData: FormData) {
  const template = await prisma.emailTemplate.findUnique({ where: { id } });
  if (!template) return { error: "Template not found" };

  const name = (formData.get("name") as string)?.trim();
  const subject = (formData.get("subject") as string)?.trim();
  const body = (formData.get("body") as string)?.trim();
  const category = (formData.get("category") as string)?.trim() || null;

  if (!name || !subject || !body) {
    return { error: "Name, subject, and body are required" };
  }

  await prisma.emailTemplate.update({
    where: { id },
    data: { name, subject, body, category },
  });

  revalidatePath("/emails/templates");
  return { success: true };
}

export async function deleteEmailTemplate(id: string) {
  await prisma.emailTemplate.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/emails/templates");
  return { success: true };
}

// =============================================
// EMAIL SENDING (Simulated)
// =============================================

export async function sendEmail(formData: FormData) {
  const tenantId = await getTenantId();
  const ownerId = await getDefaultOwnerId();

  const to = (formData.get("to") as string)?.trim();
  const cc = (formData.get("cc") as string)?.trim() || null;
  const bcc = (formData.get("bcc") as string)?.trim() || null;
  const subject = (formData.get("subject") as string)?.trim();
  const body = (formData.get("body") as string)?.trim();
  const contactId = (formData.get("contactId") as string) || null;
  const companyId = (formData.get("companyId") as string) || null;
  const dealId = (formData.get("dealId") as string) || null;
  const templateId = (formData.get("templateId") as string) || null;

  if (!to || !subject || !body) {
    return { error: "To, subject, and body are required" };
  }

  const trackingId = nanoid();

  // Create email activity
  const activity = await prisma.activity.create({
    data: {
      tenantId,
      type: "email",
      subject,
      body,
      emailTo: to,
      emailCc: cc,
      emailBcc: bcc,
      emailStatus: "sent",
      contactId,
      companyId,
      dealId,
      ownerId,
      metadata: {
        trackingId,
        templateId,
        sentAt: new Date().toISOString(),
      },
    },
  });

  // Increment template usage if used
  if (templateId) {
    await prisma.emailTemplate.update({
      where: { id: templateId },
      data: { usageCount: { increment: 1 } },
    });
  }

  // Simulate delivery after creation
  await prisma.activity.update({
    where: { id: activity.id },
    data: { emailStatus: "delivered" },
  });

  revalidatePath("/emails");
  return { success: true, activityId: activity.id };
}

// =============================================
// EMAIL TRACKING
// =============================================

export async function getEmails(search?: string) {
  const tenantId = await getTenantId();

  return prisma.activity.findMany({
    where: {
      tenantId,
      type: "email",
      ...(search
        ? {
            OR: [
              { subject: { contains: search, mode: "insensitive" as const } },
              { emailTo: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true, email: true } },
      owner: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getEmailDetail(id: string) {
  return prisma.activity.findFirst({
    where: { id, type: "email" },
    include: {
      contact: { select: { id: true, firstName: true, lastName: true, email: true } },
      company: { select: { id: true, name: true } },
      deal: { select: { id: true, name: true } },
      owner: { select: { name: true, email: true } },
    },
  });
}

export async function updateEmailStatus(id: string, status: string) {
  await prisma.activity.update({
    where: { id },
    data: { emailStatus: status },
  });
  revalidatePath("/emails");
  return { success: true };
}
