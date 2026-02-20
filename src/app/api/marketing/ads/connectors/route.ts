import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/auth-helpers";
import { handleApiError } from "@/lib/api-helpers";
import { logAuditEvent } from "@/lib/audit-helpers";
import {
  getAdsState,
  summarizeAdsCampaigns,
  updateAdsConnector,
  updateAdsConnectorSchema,
} from "@/lib/marketing-ads-store";

// GET /api/marketing/ads/connectors - List ad connectors and spend summary
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const state = await getAdsState(tenantId);

    return NextResponse.json({
      connectors: state.connectors,
      summary: summarizeAdsCampaigns(state.campaigns),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT /api/marketing/ads/connectors - Update ad connector configuration
export async function PUT(request: NextRequest) {
  try {
    const tenantId = await getTenantId(request);
    const body = await request.json();
    const payload = updateAdsConnectorSchema.parse(body);

    const connector = await updateAdsConnector(tenantId, payload);

    await logAuditEvent({
      request,
      action: "updated",
      entity: "ads_connector",
      entityId: payload.connectorId,
      entityName: connector.name,
      changes: {
        connected: connector.connected,
        accountId: connector.accountId,
        dailyBudget: connector.dailyBudget,
        syncWindowDays: connector.syncWindowDays,
      },
    });

    const state = await getAdsState(tenantId);

    return NextResponse.json({
      connectors: state.connectors,
      summary: summarizeAdsCampaigns(state.campaigns),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
