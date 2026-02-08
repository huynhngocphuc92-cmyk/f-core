import { NextRequest } from "next/server";
import {
  TRANSPARENT_GIF,
  logEmailEvent,
  isBotUserAgent,
  isAppleMPP,
} from "@/lib/email-tracking";

// GET /api/tracking/open/[trackingId] - Tracking pixel endpoint (public, no auth)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await params;
  const ip = request.headers.get("x-forwarded-for") || null;
  const userAgent = request.headers.get("user-agent") || "";

  // Determine event type based on user agent
  let eventType = "OPENED";
  if (isBotUserAgent(userAgent)) {
    eventType = "OPENED_MACHINE";
  } else if (isAppleMPP(userAgent)) {
    eventType = "OPENED_MACHINE";
  }

  // Fire-and-forget: Log the open event asynchronously
  logEmailEvent({
    trackingId,
    eventType,
    ip,
    userAgent,
    timestamp: new Date(),
  }).catch(console.error);

  // Return the transparent GIF with anti-caching headers
  return new Response(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": TRANSPARENT_GIF.length.toString(),
      "Cache-Control":
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
