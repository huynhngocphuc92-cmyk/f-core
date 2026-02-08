import { NextRequest, NextResponse } from "next/server";
import { logEmailEvent, isValidRedirectUrl } from "@/lib/email-tracking";

// GET /api/tracking/click/[trackingId] - Click redirect endpoint (public, no auth)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingId: string }> }
) {
  const { trackingId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const destinationUrl = searchParams.get("url");
  const linkId = searchParams.get("lid");

  if (!destinationUrl) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const decodedUrl = decodeURIComponent(destinationUrl);

  // Validate URL to prevent open redirect attacks
  if (!isValidRedirectUrl(decodedUrl)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const ip = request.headers.get("x-forwarded-for") || null;
  const userAgent = request.headers.get("user-agent") || "";

  // Fire-and-forget: Log click event
  logEmailEvent({
    trackingId,
    eventType: "CLICKED",
    linkUrl: decodedUrl,
    linkId: linkId || undefined,
    ip,
    userAgent,
    timestamp: new Date(),
  }).catch(console.error);

  // Also create an OPENED_INFERRED event if no prior open recorded
  logEmailEvent({
    trackingId,
    eventType: "OPENED_INFERRED",
    ip,
    userAgent,
    timestamp: new Date(),
  }).catch(console.error);

  // 302 redirect to the original URL
  return NextResponse.redirect(decodedUrl, { status: 302 });
}
