"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

async function getTenantId(): Promise<string> {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error("No tenant found");
  return tenant.id;
}

async function getDefaultUserId(): Promise<string> {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error("No user found");
  return user.id;
}

// ============================================
// CAMPAIGNS CRUD
// ============================================

export async function getCampaigns(filters?: {
  search?: string;
  status?: string;
}) {
  const tenantId = await getTenantId();
  return prisma.emailCampaign.findMany({
    where: {
      tenantId,
      deletedAt: null,
      ...(filters?.status && filters.status !== "all"
        ? { status: filters.status }
        : {}),
      ...(filters?.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" as const } },
              { subject: { contains: filters.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getCampaign(id: string) {
  const tenantId = await getTenantId();
  return prisma.emailCampaign.findFirst({
    where: { id, tenantId, deletedAt: null },
    include: {
      owner: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function createCampaign(formData: FormData): Promise<void> {
  const tenantId = await getTenantId();
  const userId = await getDefaultUserId();

  const name = formData.get("name") as string;
  const subject = formData.get("subject") as string;
  const body = formData.get("body") as string;
  const previewText = (formData.get("previewText") as string) || undefined;

  if (!name || !subject || !body) {
    throw new Error("Name, subject, and body are required");
  }

  const campaign = await prisma.emailCampaign.create({
    data: {
      tenantId,
      name,
      subject,
      body,
      previewText,
      ownerId: userId,
    },
  });

  redirect(`/email-marketing/campaigns/${campaign.id}`);
}

export async function updateCampaign(id: string, formData: FormData) {
  const tenantId = await getTenantId();

  const name = formData.get("name") as string;
  const subject = formData.get("subject") as string;
  const body = formData.get("body") as string;
  const previewText = (formData.get("previewText") as string) || undefined;

  await prisma.emailCampaign.updateMany({
    where: { id, tenantId, status: "draft" },
    data: { name, subject, body, previewText },
  });

  revalidatePath(`/email-marketing/campaigns/${id}`);
  return { success: true };
}

export async function deleteCampaign(id: string) {
  const tenantId = await getTenantId();
  await prisma.emailCampaign.updateMany({
    where: { id, tenantId },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/email-marketing");
}

export async function sendCampaign(id: string) {
  const tenantId = await getTenantId();

  // Get all contacts with emails for this tenant
  const contacts = await prisma.contact.findMany({
    where: { tenantId, deletedAt: null, email: { not: null } },
    select: { email: true },
  });

  const recipientCount = contacts.length;

  // Simulate sending
  const delivered = Math.floor(recipientCount * 0.95);
  const opened = Math.floor(delivered * 0.35);
  const clicked = Math.floor(opened * 0.15);
  const bounced = recipientCount - delivered;

  await prisma.emailCampaign.updateMany({
    where: { id, tenantId, status: "draft" },
    data: {
      status: "sent",
      sentAt: new Date(),
      recipientCount,
      sentCount: recipientCount,
      deliveredCount: delivered,
      openedCount: opened,
      clickedCount: clicked,
      bouncedCount: bounced,
    },
  });

  revalidatePath(`/email-marketing/campaigns/${id}`);
  revalidatePath("/email-marketing");
  return { success: true, recipientCount };
}

export async function getCampaignStats() {
  const tenantId = await getTenantId();

  const campaigns = await prisma.emailCampaign.findMany({
    where: { tenantId, deletedAt: null },
    select: {
      status: true,
      recipientCount: true,
      openedCount: true,
      clickedCount: true,
    },
  });

  const total = campaigns.length;
  const drafts = campaigns.filter((c) => c.status === "draft").length;
  const sent = campaigns.filter((c) => c.status === "sent").length;
  const totalRecipients = campaigns.reduce(
    (sum, c) => sum + c.recipientCount,
    0
  );
  const totalOpened = campaigns.reduce((sum, c) => sum + c.openedCount, 0);
  const totalClicked = campaigns.reduce((sum, c) => sum + c.clickedCount, 0);

  const avgOpenRate =
    totalRecipients > 0
      ? Math.round((totalOpened / totalRecipients) * 100)
      : 0;
  const avgClickRate =
    totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 100) : 0;

  return { total, drafts, sent, avgOpenRate, avgClickRate };
}
