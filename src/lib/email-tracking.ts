import { nanoid } from "nanoid";
import prisma from "@/lib/prisma";

// 1x1 transparent GIF (43 bytes)
export const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export function generateTrackingId(): string {
  return nanoid();
}

export function generateMessageId(): string {
  return `<${nanoid()}@fcore.app>`;
}

export function generateLinkId(): string {
  return nanoid(10);
}

// Inject tracking pixel into HTML body
export function injectTrackingPixel(
  htmlBody: string,
  trackingId: string,
  baseUrl: string
): string {
  const pixelUrl = `${baseUrl}/api/tracking/open/${trackingId}`;
  const pixelHtml = `<img src="${pixelUrl}" width="1" height="1" style="display:none;visibility:hidden;width:1px;height:1px;opacity:0;" alt="" />`;

  if (htmlBody.includes("</body>")) {
    return htmlBody.replace("</body>", `${pixelHtml}</body>`);
  }
  return htmlBody + pixelHtml;
}

// Rewrite links for click tracking
export function rewriteLinksForTracking(
  htmlBody: string,
  trackingId: string,
  baseUrl: string
): string {
  return htmlBody.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (_match, originalUrl) => {
      const encodedUrl = encodeURIComponent(originalUrl);
      const lid = generateLinkId();
      const clickUrl = `${baseUrl}/api/tracking/click/${trackingId}?url=${encodedUrl}&lid=${lid}`;
      return `href="${clickUrl}"`;
    }
  );
}

// Known bot user agents for filtering machine opens
const BOT_PATTERNS = [
  /bot/i,
  /crawl/i,
  /spider/i,
  /preview/i,
  /fetch/i,
  /scan/i,
  /check/i,
  /monitor/i,
  /proxy/i,
  /barracuda/i,
  /mimecast/i,
  /proofpoint/i,
  /messagelabs/i,
];

export function isBotUserAgent(userAgent: string): boolean {
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

// Check for Apple Mail Privacy Protection
export function isAppleMPP(userAgent: string): boolean {
  return /apple\s*mail/i.test(userAgent) && /cfnetwork/i.test(userAgent);
}

// Validate URL to prevent open redirect attacks
export function isValidRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    if (
      ["localhost", "127.0.0.1", "0.0.0.0"].includes(parsed.hostname)
    )
      return false;
    if (
      parsed.hostname.endsWith(".internal") ||
      parsed.hostname.endsWith(".local")
    )
      return false;
    return true;
  } catch {
    return false;
  }
}

// Log email event with deduplication
export async function logEmailEvent(event: {
  trackingId: string;
  eventType: string;
  linkUrl?: string;
  linkId?: string;
  ip?: string | null;
  userAgent?: string;
  timestamp: Date;
}) {
  const email = await prisma.email.findUnique({
    where: { trackingId: event.trackingId },
  });
  if (!email) return;

  // Deduplication: Check for recent identical open event
  if (event.eventType === "OPENED" || event.eventType === "OPENED_MACHINE") {
    const recentOpen = await prisma.emailEvent.findFirst({
      where: {
        emailId: email.id,
        eventType: { in: ["OPENED", "OPENED_MACHINE"] },
        ipAddress: event.ip || undefined,
        createdAt: { gte: new Date(Date.now() - 60_000) },
      },
    });
    if (recentOpen) return;
  }

  // Insert event
  await prisma.emailEvent.create({
    data: {
      emailId: email.id,
      eventType: event.eventType,
      linkUrl: event.linkUrl,
      linkId: event.linkId,
      ipAddress: event.ip,
      userAgent: event.userAgent,
    },
  });

  // Update denormalized counters
  if (
    event.eventType === "OPENED" ||
    event.eventType === "OPENED_INFERRED"
  ) {
    await prisma.email.update({
      where: { id: email.id },
      data: {
        openCount: { increment: 1 },
        lastOpenedAt: new Date(),
        ...(!email.firstOpenedAt && { firstOpenedAt: new Date() }),
      },
    });
  } else if (event.eventType === "CLICKED") {
    await prisma.email.update({
      where: { id: email.id },
      data: {
        clickCount: { increment: 1 },
        ...(!email.firstClickedAt && { firstClickedAt: new Date() }),
      },
    });
  }
}
