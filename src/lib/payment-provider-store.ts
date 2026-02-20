import { z } from "zod";
import prisma from "@/lib/prisma";

export const paymentProviderIdSchema = z.enum(["stripe", "paypal", "manual"]);
export const paymentModeSchema = z.enum(["test", "live"]);

export const paymentCredentialsSchema = z
  .object({
    publicKey: z.string().max(300).optional().nullable(),
    secretKey: z.string().max(300).optional().nullable(),
    merchantId: z.string().max(300).optional().nullable(),
  })
  .default({});

export const updatePaymentProviderSchema = z.object({
  provider: paymentProviderIdSchema,
  enabled: z.boolean(),
  mode: paymentModeSchema,
  credentials: paymentCredentialsSchema,
});

export const verifyPaymentProviderSchema = z.object({
  provider: paymentProviderIdSchema.optional(),
});

export type PaymentProviderId = z.infer<typeof paymentProviderIdSchema>;

export type PaymentProviderConfig = {
  provider: PaymentProviderId;
  enabled: boolean;
  mode: z.infer<typeof paymentModeSchema>;
  credentials: {
    publicKey?: string | null;
    secretKey?: string | null;
    merchantId?: string | null;
  };
  version: number;
  rotatedAt: string | null;
  lastVerificationStatus: "succeeded" | "failed" | null;
  lastVerificationError: string | null;
  lastVerifiedAt: string | null;
  updatedAt: string;
};

export type PaymentProviderState = {
  activeProvider: PaymentProviderId;
  providers: Record<PaymentProviderId, PaymentProviderConfig>;
};

export type PaymentProviderVerificationResult = {
  provider: PaymentProviderId;
  status: "succeeded" | "failed" | "skipped";
  error: string | null;
  latencyMs: number | null;
};

function nowIso() {
  return new Date().toISOString();
}

function createConfig(provider: PaymentProviderId): PaymentProviderConfig {
  return {
    provider,
    enabled: provider === "manual",
    mode: "test",
    credentials: {},
    version: 1,
    rotatedAt: null,
    lastVerificationStatus: null,
    lastVerificationError: null,
    lastVerifiedAt: null,
    updatedAt: nowIso(),
  };
}

export const DEFAULT_PAYMENT_PROVIDER_STATE: PaymentProviderState = {
  activeProvider: "manual",
  providers: {
    stripe: createConfig("stripe"),
    paypal: createConfig("paypal"),
    manual: createConfig("manual"),
  },
};

function cloneState(state: PaymentProviderState): PaymentProviderState {
  return {
    activeProvider: state.activeProvider,
    providers: {
      stripe: { ...state.providers.stripe, credentials: { ...state.providers.stripe.credentials } },
      paypal: { ...state.providers.paypal, credentials: { ...state.providers.paypal.credentials } },
      manual: { ...state.providers.manual, credentials: { ...state.providers.manual.credentials } },
    },
  };
}

function credentialsChanged(
  before: PaymentProviderConfig["credentials"],
  after: PaymentProviderConfig["credentials"]
) {
  return (
    (before.publicKey || null) !== (after.publicKey || null) ||
    (before.secretKey || null) !== (after.secretKey || null) ||
    (before.merchantId || null) !== (after.merchantId || null)
  );
}

function normalizeCredentials(input: Record<string, unknown> | null | undefined) {
  const credentials = input && typeof input === "object" ? input : {};
  return {
    publicKey: typeof credentials.publicKey === "string" ? credentials.publicKey : null,
    secretKey: typeof credentials.secretKey === "string" ? credentials.secretKey : null,
    merchantId: typeof credentials.merchantId === "string" ? credentials.merchantId : null,
  };
}

function normalizeProviderConfig(record: {
  provider: string;
  enabled: boolean;
  mode: string;
  credentials: unknown;
  version: number;
  rotatedAt: Date | null;
  lastVerificationStatus: string | null;
  lastVerificationError: string | null;
  lastVerifiedAt: Date | null;
  updatedAt: Date;
}): PaymentProviderConfig {
  return {
    provider: paymentProviderIdSchema.parse(record.provider),
    enabled: record.enabled,
    mode: paymentModeSchema.parse(record.mode),
    credentials: normalizeCredentials(record.credentials as Record<string, unknown>),
    version: record.version,
    rotatedAt: record.rotatedAt ? record.rotatedAt.toISOString() : null,
    lastVerificationStatus:
      record.lastVerificationStatus === "succeeded"
        ? "succeeded"
        : record.lastVerificationStatus === "failed"
          ? "failed"
          : null,
    lastVerificationError: record.lastVerificationError,
    lastVerifiedAt: record.lastVerifiedAt ? record.lastVerifiedAt.toISOString() : null,
    updatedAt: record.updatedAt.toISOString(),
  };
}

function validateProviderCredentials(input: {
  provider: PaymentProviderId;
  enabled: boolean;
  mode: z.infer<typeof paymentModeSchema>;
  credentials: { publicKey?: string | null; secretKey?: string | null; merchantId?: string | null };
}) {
  if (!input.enabled || input.provider === "manual") {
    return null;
  }

  if (input.provider === "stripe") {
    if (!input.credentials.publicKey || !input.credentials.secretKey) {
      return "Stripe requires publicKey and secretKey when enabled";
    }

    if (!input.credentials.publicKey.startsWith("pk_") || !input.credentials.secretKey.startsWith("sk_")) {
      return "Stripe keys must start with pk_ and sk_";
    }

    if (
      input.mode === "live" &&
      (!input.credentials.publicKey.includes("live") || !input.credentials.secretKey.includes("live"))
    ) {
      return "Stripe live mode requires live credentials";
    }

    return null;
  }

  if (!input.credentials.merchantId || !input.credentials.secretKey) {
    return "PayPal requires merchantId and secretKey when enabled";
  }

  return null;
}

async function verifyProviderConnection(input: {
  provider: PaymentProviderId;
  mode: z.infer<typeof paymentModeSchema>;
  credentials: { publicKey?: string | null; secretKey?: string | null; merchantId?: string | null };
}) {
  const validationError = validateProviderCredentials({
    provider: input.provider,
    enabled: true,
    mode: input.mode,
    credentials: input.credentials,
  });

  if (validationError) {
    return {
      ok: false,
      error: validationError,
      latencyMs: null,
    };
  }

  const endpoint = process.env.PAYMENT_PROVIDER_VERIFY_ENDPOINT;
  if (!endpoint) {
    return {
      ok: true,
      error: null,
      latencyMs: null,
    };
  }

  const startedAt = Date.now();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      provider: input.provider,
      mode: input.mode,
      credentials: input.credentials,
    }),
  });

  const latencyMs = Date.now() - startedAt;
  if (!response.ok) {
    const text = await response.text();
    return {
      ok: false,
      error: `verification endpoint error (${response.status}): ${text || "no response body"}`,
      latencyMs,
    };
  }

  const parsed = z
    .object({
      ok: z.boolean(),
      error: z.string().optional(),
    })
    .safeParse(await response.json());

  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid verification response payload",
      latencyMs,
    };
  }

  return {
    ok: parsed.data.ok,
    error: parsed.data.ok ? null : parsed.data.error || "verification failed",
    latencyMs,
  };
}

async function ensurePaymentProviders(tenantId: string) {
  const existing = await prisma.commercePaymentProviderConfig.findMany({
    where: { tenantId },
  });

  const existingProviders = new Set(
    existing.map((item) => paymentProviderIdSchema.parse(item.provider))
  );

  const missing = (["stripe", "paypal", "manual"] as const).filter(
    (provider) => !existingProviders.has(provider)
  );

  if (missing.length > 0) {
    await prisma.commercePaymentProviderConfig.createMany({
      data: missing.map((provider) => ({
        tenantId,
        provider,
        enabled: provider === "manual",
        mode: "test",
        credentials: {},
        version: 1,
      })),
    });
  }

  return prisma.commercePaymentProviderConfig.findMany({
    where: { tenantId },
  });
}

export async function getPaymentProviderState(tenantId: string): Promise<PaymentProviderState> {
  const rows = await ensurePaymentProviders(tenantId);

  const state: PaymentProviderState = cloneState(DEFAULT_PAYMENT_PROVIDER_STATE);
  state.providers = {
    stripe: createConfig("stripe"),
    paypal: createConfig("paypal"),
    manual: createConfig("manual"),
  };

  for (const row of rows) {
    const config = normalizeProviderConfig(row);
    state.providers[config.provider] = config;
  }

  const active = (["stripe", "paypal", "manual"] as const).find(
    (provider) => state.providers[provider].enabled
  );
  state.activeProvider = active || "manual";

  return cloneState(state);
}

export async function updatePaymentProvider(
  tenantId: string,
  payload: z.infer<typeof updatePaymentProviderSchema>
): Promise<PaymentProviderState> {
  const current = await getPaymentProviderState(tenantId);
  const config = current.providers[payload.provider];

  const nextCredentials = {
    publicKey: payload.credentials.publicKey ?? null,
    secretKey: payload.credentials.secretKey ?? config.credentials.secretKey ?? null,
    merchantId: payload.credentials.merchantId ?? null,
  };

  const validationError = validateProviderCredentials({
    provider: payload.provider,
    enabled: payload.enabled,
    mode: payload.mode,
    credentials: nextCredentials,
  });

  if (validationError) {
    throw new Error(validationError);
  }

  const rotated = credentialsChanged(config.credentials, nextCredentials);

  const target = await prisma.commercePaymentProviderConfig.findFirst({
    where: { tenantId, provider: payload.provider },
  });

  if (!target) {
    throw new Error("Payment provider config not found");
  }

  await prisma.commercePaymentProviderConfig.update({
    where: { id: target.id },
    data: {
      enabled: payload.enabled,
      mode: payload.mode,
      credentials: nextCredentials,
      version: rotated ? config.version + 1 : config.version,
      rotatedAt: rotated ? new Date() : config.rotatedAt ? new Date(config.rotatedAt) : null,
    },
  });

  if (payload.enabled) {
    const providers = await prisma.commercePaymentProviderConfig.findMany({
      where: { tenantId },
    });

    for (const provider of providers) {
      if (provider.provider === payload.provider) continue;
      await prisma.commercePaymentProviderConfig.update({
        where: { id: provider.id },
        data: { enabled: false },
      });
    }
  }

  return getPaymentProviderState(tenantId);
}

export async function verifyPaymentProviders(
  tenantId: string,
  payload: z.infer<typeof verifyPaymentProviderSchema>
) {
  const state = await getPaymentProviderState(tenantId);
  const providers = payload.provider
    ? [payload.provider]
    : (["stripe", "paypal", "manual"] as const);

  const results: PaymentProviderVerificationResult[] = [];

  for (const providerId of providers) {
    const config = state.providers[providerId];

    if (!config.enabled) {
      results.push({
        provider: providerId,
        status: "skipped",
        error: "Provider is disabled",
        latencyMs: null,
      });
      continue;
    }

    const verification = await verifyProviderConnection({
      provider: providerId,
      mode: config.mode,
      credentials: config.credentials,
    });

    await prisma.commercePaymentProviderConfig.updateMany({
      where: {
        tenantId,
        provider: providerId,
      },
      data: {
        lastVerificationStatus: verification.ok ? "succeeded" : "failed",
        lastVerificationError: verification.error,
        lastVerifiedAt: new Date(),
      },
    });

    results.push({
      provider: providerId,
      status: verification.ok ? "succeeded" : "failed",
      error: verification.error,
      latencyMs: verification.latencyMs,
    });
  }

  return {
    checked: results.filter((item) => item.status !== "skipped").length,
    succeeded: results.filter((item) => item.status === "succeeded").length,
    failed: results.filter((item) => item.status === "failed").length,
    results,
  };
}

function maskSecret(value?: string | null) {
  if (!value) return null;
  if (value.length <= 8) return "********";
  return `${value.slice(0, 4)}****${value.slice(-4)}`;
}

export async function getPaymentProviderStateForApi(tenantId: string) {
  const state = await getPaymentProviderState(tenantId);

  return {
    ...state,
    providers: {
      stripe: {
        ...state.providers.stripe,
        credentials: {
          publicKey: state.providers.stripe.credentials.publicKey || null,
          secretKey: maskSecret(state.providers.stripe.credentials.secretKey),
          merchantId: state.providers.stripe.credentials.merchantId || null,
        },
      },
      paypal: {
        ...state.providers.paypal,
        credentials: {
          publicKey: state.providers.paypal.credentials.publicKey || null,
          secretKey: maskSecret(state.providers.paypal.credentials.secretKey),
          merchantId: state.providers.paypal.credentials.merchantId || null,
        },
      },
      manual: {
        ...state.providers.manual,
        credentials: {
          publicKey: null,
          secretKey: null,
          merchantId: null,
        },
      },
    },
  };
}

export async function resetPaymentProviderStoreForTests() {
  if (process.env.NODE_ENV !== "test") return;
  await prisma.commercePaymentProviderConfig.deleteMany();
}
