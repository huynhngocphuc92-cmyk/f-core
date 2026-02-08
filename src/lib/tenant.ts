import prisma from './prisma';

let cachedTenantId: string | null = null;

export async function getDemoTenantId(): Promise<string> {
  if (cachedTenantId) return cachedTenantId;

  const tenant = await prisma.tenant.findFirst({
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });

  if (!tenant) throw new Error('No tenant found in database');
  cachedTenantId = tenant.id;
  return tenant.id;
}
