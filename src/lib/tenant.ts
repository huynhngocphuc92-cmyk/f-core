import prisma from "@/lib/prisma";

let cachedTenantId: string | null = null;

/**
 * Get the demo tenant ID.
 * In a real app, this would come from the authenticated session.
 * For demo mode, queries the first tenant and caches it.
 */
export async function getDemoTenantId(): Promise<string> {
  if (cachedTenantId) return cachedTenantId;

  const tenant = await prisma.tenant.findFirst({
    where: { domain: "demo.f-core.com" },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error("Demo tenant not found. Run `npx tsx prisma/seed.ts` first.");
  }

  cachedTenantId = tenant.id;
  return cachedTenantId;
}
