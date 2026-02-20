"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/i18n/I18nProvider";
import { Mail, Lock, User, Loader2 } from "lucide-react";

export default function SignupPage() {
  const { t } = useI18n();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("auth.errors.passwordsDoNotMatch", "Passwords do not match"));
      return;
    }

    if (password.length < 6) {
      setError(
        t("auth.errors.passwordMinLength", "Password must be at least {min} characters", {
          min: 6,
        })
      );
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError(t("auth.errors.unexpected", "An unexpected error occurred"));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              {t("auth.signup.checkEmailTitle", "Check your email")}
            </h1>
            <p className="text-gray-600 mb-6">
              {t(
                "auth.signup.checkEmailMessage",
                "We've sent a confirmation link to {email}. Click the link to activate your account.",
                { email }
              )}
            </p>
            <Link href="/login" className="text-[#0891b2] hover:text-[#0ea5e9] font-medium">
              {t("common.backToSignIn", "Back to sign in")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-semibold text-gray-900">{t("auth.signup.title", "Create your account")}</h1>
          <p className="text-gray-600 mt-1">{t("auth.signup.subtitle", "Start your 14-day free trial")}</p>
          <div className="mt-4 max-w-[220px] mx-auto">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSignup} className="space-y-5">
            {error && <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">{error}</div>}

            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder={t("auth.signup.namePlaceholder", "Full name")}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="pl-10"
                required
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="email"
                placeholder={t("auth.signup.emailPlaceholder", "Email address")}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="pl-10"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="password"
                placeholder={t("auth.signup.passwordPlaceholder", "Password")}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="pl-10"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="password"
                placeholder={t("auth.signup.confirmPasswordPlaceholder", "Confirm password")}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="pl-10"
                required
              />
            </div>

            <Button type="submit" className="w-full bg-[#0891b2] hover:bg-[#0ea5e9]" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("auth.signup.creatingAccount", "Creating account...")}
                </>
              ) : (
                t("auth.signup.createAccount", "Create account")
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            {t("auth.signup.alreadyHaveAccount", "Already have an account?")} {" "}
            <Link href="/login" className="text-[#0891b2] hover:text-[#0ea5e9] font-medium">
              {t("auth.signup.signIn", "Sign in")}
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">
          {t("auth.signup.termsPrefix", "By signing up, you agree to our")} {" "}
          <Link href="/terms" className="text-[#0891b2] hover:text-[#0ea5e9]">
            {t("auth.signup.termsOfService", "Terms of Service")}
          </Link>{" "}
          {t("common.and", "and")} {" "}
          <Link href="/privacy" className="text-[#0891b2] hover:text-[#0ea5e9]">
            {t("auth.signup.privacyPolicy", "Privacy Policy")}
          </Link>
        </p>
      </div>
    </div>
  );
}
