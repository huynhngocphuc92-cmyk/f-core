import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import prisma from './prisma';

export type UserRole = 'admin' | 'manager' | 'member';

export type Permission =
  | 'settings.read'
  | 'settings.manage'
  | 'crm.read'
  | 'crm.write'
  | 'reports.read'
  | 'reports.manage'
  | 'ai.use';

const ROLE_PERMISSIONS: Record<UserRole, Set<Permission>> = {
  admin: new Set<Permission>([
    'settings.read',
    'settings.manage',
    'crm.read',
    'crm.write',
    'reports.read',
    'reports.manage',
    'ai.use',
  ]),
  manager: new Set<Permission>([
    'settings.read',
    'crm.read',
    'crm.write',
    'reports.read',
    'reports.manage',
    'ai.use',
  ]),
  member: new Set<Permission>([
    'crm.read',
    'crm.write',
    'reports.read',
    'ai.use',
  ]),
};

/**
 * Create a Supabase server client for API routes
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

/**
 * Get authenticated user from Supabase
 * @throws Error if user is not authenticated
 */
export async function getCurrentUser(request?: NextRequest) {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Unauthorized');
  }
  
  return user;
}

/**
 * Get user data with tenant information from database
 * @throws Error if user is not found in database
 */
export async function getUserData(request?: NextRequest) {
  const user = await getCurrentUser(request);
  
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      tenantId: true,
      role: true,
    },
  });
  
  if (!userData) {
    throw new Error('User not found in database');
  }
  
  return userData;
}

/**
 * Get tenant ID for the authenticated user
 * @throws Error if user is not authenticated or has no tenant
 */
export async function getTenantId(request?: NextRequest): Promise<string> {
  const userData = await getUserData(request);
  
  if (!userData.tenantId) {
    throw new Error('User has no tenant');
  }
  
  return userData.tenantId;
}

/**
 * Check if user owns a resource (by comparing tenantId)
 * @param resourceTenantId - The tenantId of the resource
 * @param request - Optional request object
 * @returns true if user owns the resource
 * @throws Error if user doesn't own the resource
 */
export async function checkOwnership(
  resourceTenantId: string,
  request?: NextRequest
): Promise<boolean> {
  const userTenantId = await getTenantId(request);
  
  if (userTenantId !== resourceTenantId) {
    throw new Error('Forbidden: You do not have access to this resource');
  }
  
  return true;
}

/**
 * Check if user has a specific role
 * @param allowedRoles - Array of allowed roles
 * @param request - Optional request object
 * @returns true if user has the role
 * @throws Error if user doesn't have the required role
 */
export async function checkRole(
  allowedRoles: string[],
  request?: NextRequest
): Promise<boolean> {
  const userData = await getUserData(request);
  
  if (!userData.role || !allowedRoles.includes(userData.role)) {
    throw new Error('Forbidden: Insufficient permissions');
  }
  
  return true;
}

/**
 * Check if current user has a specific permission.
 * @throws Error if user doesn't have the required permission
 */
export async function checkPermission(
  permission: Permission,
  request?: NextRequest
): Promise<boolean> {
  const userData = await getUserData(request);
  const role = (userData.role || 'member') as UserRole;
  const permissions = ROLE_PERMISSIONS[role];

  if (!permissions || !permissions.has(permission)) {
    throw new Error(`Forbidden: Missing permission ${permission}`);
  }

  return true;
}
