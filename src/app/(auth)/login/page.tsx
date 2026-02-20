"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/i18n/I18nProvider";
import { Lock, Loader2, Mail, Shield } from "lucide-react";

type SsoDiscovery = {
  tenantSlug: string;
  provider: "oidc" | "saml";
  idpDisplayName: string;
  ssoOnly: boolean;
};

type PolicyDiscovery = {
  tenantSlug: string;
  session: {
    maxSessionMinutes: number;
    idleTimeoutMinutes: number;
    rememberMeAllowed: boolean;
  };
  password: {
    minLength: number;
    requireUppercase: boolean;
    requireNumber: boolean;
    requireSpecialChar: boolean;
  };
  ipAllowlistEnabled: boolean;
  ipAllowed: boolean;
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [workspace, setWorkspace] = useState(searchParams.get("workspace") || "f-core");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [ssoDiscovery, setSsoDiscovery] = useState<SsoDiscovery | null>(null);
  const [policyDiscovery, setPolicyDiscovery] = useState<PolicyDiscovery | null>(null);
  const [discovering, setDiscovering] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const authError = searchParams.get("error");

    if (authError === "auth_callback_error") {
      setError(t("auth.errors.authFailed", "Authentication failed. Please try again."));
      return;
    }

    if (authError === "sso_required") {
      setError(t("auth.errors.ssoRequired", "This workspace requires SSO sign-in."));
      return;
    }

    setError("");
  }, [searchParams, t]);

  async function discoverSso(emailCandidate: string) {
    if (!emailCandidate.includes("@")) {
      setSsoDiscovery(null);
      return;
    }

    setDiscovering(true);
    try {
      const response = await fetch(`/api/auth/sso/discovery?email=${encodeURIComponent(emailCandidate)}`);
      const body = await response.json();
      if (!response.ok) {
        setSsoDiscovery(null);
        return;
      }
      setSsoDiscovery(body.data || null);
    } catch {
      setSsoDiscovery(null);
    } finally {
      setDiscovering(false);
    }
  }

  async function discoverPolicy(workspaceCandidate: string) {
    if (!workspaceCandidate.trim()) {
      setPolicyDiscovery(null);
      return;
    }

    try {
      const response = await fetch(`/api/auth/policy/discovery?workspace=${encodeURIComponent(workspaceCandidate)}`);
      const body = await response.json();
      if (!response.ok) {
        setPolicyDiscovery(null);
        return;
      }
      setPolicyDiscovery(body.data || null);
    } catch {
      setPolicyDiscovery(null);
    }
  }

  function validatePasswordAgainstPolicy(passwordValue: string, policy: PolicyDiscovery) {
    if (passwordValue.length < policy.password.minLength) return false;
    if (policy.password.requireUppercase && !/[A-Z]/.test(passwordValue)) return false;
    if (policy.password.requireNumber && !/\d/.test(passwordValue)) return false;
    if (policy.password.requireSpecialChar && !/[^A-Za-z0-9]/.test(passwordValue)) return false;
    return true;
  }

  useEffect(() => {
    void discoverPolicy(workspace);
  }, []);

  const passwordPolicySuffix = useMemo(() => {
    if (!policyDiscovery) return "";

    const parts: string[] = [];
    if (policyDiscovery.password.requireUppercase) {
      parts.push(t("auth.login.passwordRuleUppercase", "uppercase"));
    }
    if (policyDiscovery.password.requireNumber) {
      parts.push(t("auth.login.passwordRuleNumber", "number"));
    }
    if (policyDiscovery.password.requireSpecialChar) {
      parts.push(t("auth.login.passwordRuleSpecial", "special char"));
    }

    return parts.length > 0 ? `, ${parts.join(", ")}` : "";
  }, [policyDiscovery, t]);

  const handleSsoStart = () => {
    if (policyDiscovery && !policyDiscovery.ipAllowed) {
      setError(
        t(
          "auth.errors.networkNotAllowlisted",
          "Your current network is not allowlisted for this workspace."
        )
      );
      return;
    }

    const tenantSlug = ssoDiscovery?.tenantSlug || workspace.trim().toLowerCase();
    if (!tenantSlug) {
      setError(t("auth.errors.workspaceRequired", "Workspace slug is required to start SSO."));
      return;
    }

    window.location.assign(
      `/api/auth/sso/start?tenantSlug=${encodeURIComponent(tenantSlug)}&next=${encodeURIComponent(redirect)}`
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (ssoDiscovery?.ssoOnly) {
      setError(
        t(
          "auth.errors.ssoOnlyWorkspace",
          "This workspace requires SSO via {idpDisplayName}.",
          {
            idpDisplayName: ssoDiscovery.idpDisplayName,
          }
        )
      );
      return;
    }

    if (policyDiscovery && !policyDiscovery.ipAllowed) {
      setError(
        t(
          "auth.errors.networkNotAllowlisted",
          "Your current network is not allowlisted for this workspace."
        )
      );
      return;
    }

    if (policyDiscovery && !validatePasswordAgainstPolicy(password, policyDiscovery)) {
      setError(
        t(
          "auth.errors.passwordPolicyMismatch",
          "Password input does not satisfy workspace password policy."
        )
      );
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch {
      setError(t("auth.errors.unexpected", "An unexpected error occurred"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#0891b2] flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">{t("common.appName", "F-CORE")}</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">{t("auth.login.title", "Welcome back")}</h1>
          <p className="text-gray-600 mt-1">{t("auth.login.subtitle", "Sign in to your account")}</p>
          <div className="mt-4 max-w-[220px] mx-auto">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>}

            <div>
              <Input
                type="text"
                placeholder={t("auth.login.workspacePlaceholder", "Workspace (e.g. f-core)")}
                value={workspace}
                onChange={(event) => setWorkspace(event.target.value)}
                onBlur={(event) => {
                  void discoverPolicy(event.target.value);
                }}
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="email"
                placeholder={t("auth.login.emailPlaceholder", "Email address")}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={(event) => {
                  void discoverSso(event.target.value);
                }}
                className="pl-10"
                required
              />
            </div>

            {discovering && (
              <p className="text-xs text-gray-500">
                {t("auth.login.ssoDetecting", "Detecting SSO configuration...")}
              </p>
            )}

            {ssoDiscovery && (
              <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-900">
                <p className="font-medium">
                  {t("auth.login.ssoAvailable", "SSO available: {idpDisplayName}", {
                    idpDisplayName: ssoDiscovery.idpDisplayName,
                  })}
                </p>
                <p className="text-xs mt-1">
                  {t("auth.login.providerInfo", "Provider: {provider} • Workspace: {tenantSlug}", {
                    provider: ssoDiscovery.provider.toUpperCase(),
                    tenantSlug: ssoDiscovery.tenantSlug,
                  })}
                </p>
                {ssoDiscovery.ssoOnly && (
                  <p className="text-xs mt-1 font-medium">
                    {t(
                      "auth.login.ssoPasswordDisabled",
                      "Password sign-in is disabled for this workspace."
                    )}
                  </p>
                )}
              </div>
            )}

            {policyDiscovery && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                <p className="font-medium text-gray-900">
                  {t("auth.login.policyActive", "Workspace policy active ({tenantSlug})", {
                    tenantSlug: policyDiscovery.tenantSlug,
                  })}
                </p>
                <p className="mt-1">
                  {t("auth.login.passwordRulePrefix", "Password: min {minLength} chars", {
                    minLength: policyDiscovery.password.minLength,
                  })}
                  {passwordPolicySuffix}
                </p>
                <p className="mt-1">
                  {t(
                    "auth.login.sessionRule",
                    "Session: max {maxSessionMinutes}m, idle {idleTimeoutMinutes}m",
                    {
                      maxSessionMinutes: policyDiscovery.session.maxSessionMinutes,
                      idleTimeoutMinutes: policyDiscovery.session.idleTimeoutMinutes,
                    }
                  )}
                </p>
                {policyDiscovery.ipAllowlistEnabled && !policyDiscovery.ipAllowed && (
                  <p className="mt-1 font-medium text-red-700">
                    {t(
                      "auth.login.networkBlocked",
                      "Current network is blocked by workspace IP allowlist."
                    )}
                  </p>
                )}
              </div>
            )}

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="password"
                placeholder={t("auth.login.passwordPlaceholder", "Password")}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="pl-10"
                disabled={
                  !!ssoDiscovery?.ssoOnly ||
                  Boolean(policyDiscovery?.ipAllowlistEnabled && !policyDiscovery.ipAllowed)
                }
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-[#0891b2] focus:ring-[#0891b2]"
                />
                <span className="text-gray-600">{t("common.rememberMe", "Remember me")}</span>
              </label>
              <Link href="/forgot-password" className="text-[#0891b2] hover:text-[#0ea5e9]">
                {t("auth.login.forgotPassword", "Forgot password?")}
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#0891b2] hover:bg-[#0ea5e9]"
              disabled={
                loading ||
                !!ssoDiscovery?.ssoOnly ||
                Boolean(policyDiscovery?.ipAllowlistEnabled && !policyDiscovery.ipAllowed)
              }
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("auth.login.signingIn", "Signing in...")}
                </>
              ) : (
                t("auth.login.signIn", "Sign in")
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleSsoStart}
              disabled={Boolean(policyDiscovery?.ipAllowlistEnabled && !policyDiscovery.ipAllowed)}
            >
              <Shield className="w-4 h-4" />
              {t("auth.login.continueWithSso", "Continue with SSO")}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            {t("auth.login.noAccount", "Don't have an account?")} {" "}
            <Link href="/signup" className="text-[#0891b2] hover:text-[#0ea5e9] font-medium">
              {t("auth.login.signUp", "Sign up")}
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">
          {t("auth.login.footerCopyright", "© 2024 F-CORE. All rights reserved.")}
        </p>
      </div>
    </div>
  );
}

function LoginFallback() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#0891b2] flex items-center justify-center">
              <span className="text-white font-bold text-lg">F</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">{t("common.appName", "F-CORE")}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#0891b2]" />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
