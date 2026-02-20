import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/api-helpers";
import { verifyCustomerPortalToken } from "@/lib/customer-portal-token";

export type PortalContext = {
  tenantId: string;
  contactId: string;
  email: string;
};

function getTokenFromRequest(request: NextRequest): string {
  const queryToken = request.nextUrl.searchParams.get("token");
  if (queryToken) return queryToken;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  throw new ApiError(401, "Missing portal token");
}

export async function getPortalContextFromRequest(
  request: NextRequest
): Promise<PortalContext> {
  const token = getTokenFromRequest(request);
  const payload = verifyCustomerPortalToken(token);

  const contact = await prisma.contact.findFirst({
    where: {
      id: payload.contactId,
      tenantId: payload.tenantId,
      email: payload.email,
      deletedAt: null,
    },
    select: { id: true, tenantId: true, email: true },
  });

  if (!contact || !contact.email) {
    throw new ApiError(401, "Portal contact not found");
  }

  return {
    tenantId: contact.tenantId,
    contactId: contact.id,
    email: contact.email,
  };
}
