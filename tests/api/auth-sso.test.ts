import { beforeEach, describe, expect, it } from "vitest";
import { createMockRequest, getResponseBody } from "../helpers/mock-request";
import { GET as discoverSso } from "@/app/api/auth/sso/discovery/route";
import { GET as startSso } from "@/app/api/auth/sso/start/route";
import { resetSsoConfigStoreForTests, updateSsoConfig } from "@/lib/sso-config-store";

beforeEach(async () => {
  await resetSsoConfigStoreForTests();
});

describe("auth sso APIs", () => {
  it("discovers SSO by email domain", async () => {
    await updateSsoConfig("tenant-discovery", {
      tenantSlug: "acme",
      enabled: true,
      ssoOnly: true,
      provider: "saml",
      idpDisplayName: "Acme Okta",
      connectionId: "saml-acme",
      entryPointUrl: "https://acme.example.com/saml",
      domains: ["acme.com"],
    });

    const response = await discoverSso(createMockRequest("/api/auth/sso/discovery?email=user@acme.com"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data.tenantSlug).toBe("acme");
    expect(body.data.ssoOnly).toBe(true);
  });

  it("returns null discovery when no SSO domain match", async () => {
    const response = await discoverSso(createMockRequest("/api/auth/sso/discovery?email=user@unknown.com"));
    const body = await getResponseBody(response);

    expect(response.status).toBe(200);
    expect(body.data).toBe(null);
  });

  it("starts SSO and redirects to callback", async () => {
    await updateSsoConfig("tenant-start", {
      tenantSlug: "beta",
      enabled: true,
      ssoOnly: false,
      provider: "oidc",
      idpDisplayName: "Beta IDP",
      connectionId: "oidc-beta",
      entryPointUrl: "https://beta.example.com/oidc",
      domains: ["beta.com"],
    });

    const response = await startSso(
      createMockRequest("/api/auth/sso/start?tenantSlug=beta&next=%2Fdashboard")
    );
    const location = response.headers.get("location") || "";

    expect(response.status).toBe(307);
    expect(location).toContain("/auth/callback?code=demo-sso-oidc");
  });

  it("returns 404 for unknown workspace", async () => {
    const response = await startSso(createMockRequest("/api/auth/sso/start?tenantSlug=missing"));
    expect(response.status).toBe(404);
  });
});
