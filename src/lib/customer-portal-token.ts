import { createHmac, timingSafeEqual } from "crypto";
import { ApiError } from "@/lib/api-helpers";

type PortalTokenPayload = {
  tenantId: string;
  contactId: string;
  email: string;
  exp: number;
};

function getPortalSecret() {
  return (
    process.env.CUSTOMER_PORTAL_SECRET ||
    process.env.SLA_ALERTS_CRON_SECRET ||
    process.env.CRON_SECRET ||
    "dev-customer-portal-secret"
  );
}

function base64urlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64urlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getPortalSecret()).update(value).digest("base64url");
}

export function issueCustomerPortalToken(input: {
  tenantId: string;
  contactId: string;
  email: string;
  expiresInMinutes?: number;
}) {
  const expiresInMinutes = input.expiresInMinutes ?? 24 * 60;
  const exp = Math.floor(Date.now() / 1000) + expiresInMinutes * 60;

  const payload: PortalTokenPayload = {
    tenantId: input.tenantId,
    contactId: input.contactId,
    email: input.email,
    exp,
  };

  const payloadJson = JSON.stringify(payload);
  const payloadEncoded = base64urlEncode(payloadJson);
  const signature = sign(payloadEncoded);

  return {
    token: `${payloadEncoded}.${signature}`,
    expiresAt: new Date(exp * 1000).toISOString(),
  };
}

export function verifyCustomerPortalToken(token: string): PortalTokenPayload {
  const [payloadEncoded, signature] = token.split(".");

  if (!payloadEncoded || !signature) {
    throw new ApiError(401, "Invalid portal token format");
  }

  const expectedSignature = sign(payloadEncoded);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    throw new ApiError(401, "Invalid portal token signature");
  }

  let payload: PortalTokenPayload;
  try {
    payload = JSON.parse(base64urlDecode(payloadEncoded));
  } catch {
    throw new ApiError(401, "Invalid portal token payload");
  }

  if (!payload.tenantId || !payload.contactId || !payload.email || !payload.exp) {
    throw new ApiError(401, "Invalid portal token payload");
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    throw new ApiError(401, "Portal token expired");
  }

  return payload;
}
