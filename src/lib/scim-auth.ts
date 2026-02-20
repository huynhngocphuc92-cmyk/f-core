import { NextRequest } from "next/server";
import { ApiError } from "@/lib/api-helpers";

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization || !authorization.toLowerCase().startsWith("bearer ")) return null;
  return authorization.slice("Bearer ".length).trim();
}

export function getScimTenantFromRequest(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id")?.trim();
  if (!tenantId) {
    throw new ApiError(400, "Missing x-tenant-id header");
  }
  return tenantId;
}

export function assertScimAuthorized(request: NextRequest) {
  const expectedToken = process.env.SCIM_BEARER_TOKEN || "scim-demo-token";
  const providedToken = getBearerToken(request);
  if (!providedToken || providedToken !== expectedToken) {
    throw new ApiError(401, "SCIM token is invalid");
  }
}
