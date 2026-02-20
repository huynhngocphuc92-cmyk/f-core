import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  getAdsState,
  summarizeAdsCampaigns,
  syncAdsCampaigns,
  syncAdsCampaignsSchema,
} from "@/lib/marketing-ads-store";

// GET /api/marketing/ads/campaigns - List synced ad campaigns and spend metrics
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const state = await getAdsState(tenantId);

    return NextResponse.json({
      data: state.campaigns,
      summary: summarizeAdsCampaigns(state.campaigns),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/marketing/ads/campaigns - Sync ads campaigns from connected connectors
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const payload = syncAdsCampaignsSchema.parse(body);

    const result = await syncAdsCampaigns(tenantId, payload);
    const state = await getAdsState(tenantId);

    await logAuditEvent({
      request,
      action: "updated",
      entity: "ads_campaign_sync",
      entityId: result.syncedConnectors.join(",") || "none",
      entityName: "Ads Campaign Sync",
      changes: {
        syncedConnectors: result.syncedConnectors,
        imported: result.imported,
      },
    });

    return NextResponse.json({
      result,
      data: state.campaigns,
      summary: summarizeAdsCampaigns(state.campaigns),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
