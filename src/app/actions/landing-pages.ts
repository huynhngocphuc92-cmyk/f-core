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
// LANDING PAGE CRUD
// ============================================

export async function getLandingPages(filters?: {
  search?: string;
  status?: string;
}) {
  const tenantId = await getTenantId();
  return prisma.landingPage.findMany({
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
              { slug: { contains: filters.search, mode: "insensitive" as const } },
              { metaTitle: { contains: filters.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getLandingPageStats() {
  const tenantId = await getTenantId();

  const pages = await prisma.landingPage.findMany({
    where: { tenantId, deletedAt: null },
    select: { status: true, viewCount: true, conversionCount: true },
  });

  const total = pages.length;
  const published = pages.filter((p) => p.status === "published").length;
  const draft = pages.filter((p) => p.status === "draft").length;
  const totalViews = pages.reduce((s, p) => s + p.viewCount, 0);
  const totalConversions = pages.reduce((s, p) => s + p.conversionCount, 0);

  return { total, published, draft, totalViews, totalConversions };
}

export async function getLandingPage(id: string) {
  const tenantId = await getTenantId();
  return prisma.landingPage.findFirst({
    where: { id, tenantId, deletedAt: null },
  });
}

export async function createLandingPage(formData: FormData): Promise<void> {
  const tenantId = await getTenantId();
  const userId = await getDefaultUserId();

  const name = formData.get("name") as string;
  const slug = formData.get("slug") as string;

  if (!name) {
    throw new Error("Name is required");
  }

  const finalSlug =
    slug ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const page = await prisma.landingPage.create({
    data: {
      tenantId,
      name,
      slug: finalSlug,
      status: "draft",
      ownerId: userId,
    },
  });

  redirect(`/landing-pages/${page.id}`);
}

export async function updateLandingPage(
  id: string,
  data: {
    name?: string;
    slug?: string;
    status?: string;
    contentHtml?: string;
    contentJson?: unknown;
    templateId?: string;
    metaTitle?: string;
    metaDescription?: string;
    formId?: string;
  }
) {
  const tenantId = await getTenantId();

  await prisma.landingPage.updateMany({
    where: { id, tenantId },
    data: {
      ...data,
      contentJson: data.contentJson !== undefined
        ? (data.contentJson as object)
        : undefined,
      ...(data.status === "published" ? { publishedAt: new Date() } : {}),
    },
  });

  revalidatePath(`/landing-pages/${id}`);
  revalidatePath("/landing-pages");
  return { success: true };
}

export async function deleteLandingPage(id: string) {
  const tenantId = await getTenantId();
  await prisma.landingPage.updateMany({
    where: { id, tenantId },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/landing-pages");
}
