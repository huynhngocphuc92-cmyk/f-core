import { describe, expect, it } from "vitest";
import {
  getSsoConfig,
  getSsoConfigByEmail,
  getSsoConfigByTenantSlug,
  resetSsoConfigStoreForTests,
  updateSsoConfig,
} from "@/lib/sso-config-store";

describe("sso config store", () => {
  it("returns default config and supports updates", async () => {
    await resetSsoConfigStoreForTests();
    const tenantId = "tenant-sso";

    const initial = await getSsoConfig(tenantId);
    expect(initial.provider).toBe("oidc");
    expect(initial.tenantSlug).toBe("f-core");

    const updated = await updateSsoConfig(tenantId, {
      tenantSlug: "acme",
      enabled: true,
      ssoOnly: true,
      provider: "saml",
      idpDisplayName: "Okta ACME",
      connectionId: "saml-acme",
      entryPointUrl: "https://acme.example.com/saml",
      domains: ["acme.com"],
    });

    expect(updated.provider).toBe("saml");
    expect(updated.ssoOnly).toBe(true);
    expect((await getSsoConfigByTenantSlug("acme"))?.connectionId).toBe("saml-acme");
  });

  it("discovers workspace by email domain", async () => {
    await resetSsoConfigStoreForTests();
    await updateSsoConfig("tenant-beta", {
      tenantSlug: "beta",
      enabled: true,
      ssoOnly: false,
      provider: "oidc",
      idpDisplayName: "Beta IDP",
      connectionId: "oidc-beta",
      entryPointUrl: "https://beta.example.com/oidc",
      domains: ["beta.com", "mail.beta.com"],
    });

    const found = await getSsoConfigByEmail("user@mail.beta.com");
    expect(found?.tenantSlug).toBe("beta");
  });
});
