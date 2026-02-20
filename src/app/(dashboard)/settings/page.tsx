import Link from "next/link";
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Key,
  Mail,
  Building2,
  SlidersHorizontal,
  ChevronRight,
} from "lucide-react";

import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { getServerI18n } from "@/i18n/server";

export default async function SettingsPage() {
  const { t } = await getServerI18n();

  const notificationItems = [
    {
      key: "email",
      icon: Mail,
    },
    {
      key: "deals",
      icon: Building2,
    },
    {
      key: "assignments",
      icon: User,
    },
  ];

  return (
    <div className="max-w-4xl p-6 pt-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("dashboard.settings.title", "Settings")}
        </h1>
        <p className="mt-1 text-gray-600">
          {t(
            "dashboard.settings.subtitle",
            "Manage your account and preferences"
          )}
        </p>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <User className="h-5 w-5 text-[#0891b2]" />
            <h2 className="text-lg font-semibold text-gray-900">
              {t("dashboard.settings.profile.sectionTitle", "Profile")}
            </h2>
          </div>
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0891b2] text-xl font-semibold text-white">
              A
            </div>
            <div>
              <p className="font-medium text-gray-900">Admin User</p>
              <p className="text-sm text-gray-500">admin@f-core.com</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t("dashboard.settings.profile.firstName", "First Name")}
              </label>
              <input
                type="text"
                defaultValue="Admin"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#0891b2] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t("dashboard.settings.profile.lastName", "Last Name")}
              </label>
              <input
                type="text"
                defaultValue="User"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#0891b2] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t("dashboard.settings.profile.email", "Email")}
              </label>
              <input
                type="email"
                defaultValue="admin@f-core.com"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#0891b2] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t("dashboard.settings.profile.phone", "Phone")}
              </label>
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#0891b2] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <Bell className="h-5 w-5 text-[#0891b2]" />
            <h2 className="text-lg font-semibold text-gray-900">
              {t("dashboard.settings.notifications.sectionTitle", "Notifications")}
            </h2>
          </div>
          <div className="space-y-4">
            {notificationItems.map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between border-b border-gray-100 py-3 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {t(
                        `dashboard.settings.notifications.${item.key}.label`,
                        "Notification"
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t(
                        `dashboard.settings.notifications.${item.key}.desc`,
                        ""
                      )}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" defaultChecked className="peer sr-only" />
                  <div className="after:start-[2px] peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#0891b2] peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-[#0891b2]/30" />
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <Shield className="h-5 w-5 text-[#0891b2]" />
            <h2 className="text-lg font-semibold text-gray-900">
              {t("dashboard.settings.security.sectionTitle", "Security")}
            </h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t("dashboard.settings.security.password.label", "Password")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t(
                      "dashboard.settings.security.password.desc",
                      "Last changed 30 days ago"
                    )}
                  </p>
                </div>
              </div>
              <button className="rounded-lg border border-[#0891b2] px-4 py-2 text-sm text-[#0891b2] transition-colors hover:bg-[#0891b2]/5">
                {t("dashboard.settings.security.password.action", "Change")}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t(
                      "dashboard.settings.security.twoFactor.label",
                      "Two-factor authentication"
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t(
                      "dashboard.settings.security.twoFactor.desc",
                      "Add an extra layer of security"
                    )}
                  </p>
                </div>
              </div>
              <button className="rounded-lg border border-[#0891b2] px-4 py-2 text-sm text-[#0891b2] transition-colors hover:bg-[#0891b2]/5">
                {t("dashboard.settings.security.twoFactor.action", "Enable")}
              </button>
            </div>
            <Link
              href="/settings/sso"
              className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-3 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t(
                      "dashboard.settings.security.sso.title",
                      "Single Sign-On (SAML/OIDC)"
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t(
                      "dashboard.settings.security.sso.desc",
                      "Configure IdP connection and enforce SSO-only login"
                    )}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
            <Link
              href="/settings/policies"
              className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-3 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <SlidersHorizontal className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t(
                      "dashboard.settings.security.policies.title",
                      "Tenant Security Policies"
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t(
                      "dashboard.settings.security.policies.desc",
                      "Session timeout, password rules, and IP allowlist"
                    )}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <Palette className="h-5 w-5 text-[#0891b2]" />
            <h2 className="text-lg font-semibold text-gray-900">
              {t("dashboard.settings.preferences.sectionTitle", "Preferences")}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <LanguageSwitcher className="h-full" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t("dashboard.settings.preferences.timezone", "Timezone")}
              </label>
              <select className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#0891b2] focus:outline-none">
                <option>UTC-5 (Eastern Time)</option>
                <option>UTC+7 (Ho Chi Minh City)</option>
                <option>UTC+1 (Berlin)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t("dashboard.settings.preferences.dateFormat", "Date format")}
              </label>
              <select className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#0891b2] focus:outline-none">
                <option>MM/DD/YYYY</option>
                <option>DD/MM/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t("dashboard.settings.preferences.currency", "Currency")}
              </label>
              <select className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-[#0891b2] focus:outline-none">
                <option>USD ($)</option>
                <option>VND (₫)</option>
                <option>EUR (€)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <SlidersHorizontal className="h-5 w-5 text-[#0891b2]" />
            <h2 className="text-lg font-semibold text-gray-900">
              {t("dashboard.settings.dataManagement.sectionTitle", "Data Management")}
            </h2>
          </div>
          <div className="space-y-1">
            <Link
              href="/settings/properties"
              className="group flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-gray-50"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t(
                    "dashboard.settings.dataManagement.properties.title",
                    "Properties"
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {t(
                    "dashboard.settings.dataManagement.properties.desc",
                    "Manage custom fields for contacts, companies, and deals"
                  )}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400 transition-colors group-hover:text-[#0891b2]" />
            </Link>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="rounded-lg bg-[#0891b2] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0e7490]">
            {t("dashboard.settings.saveChanges", "Save changes")}
          </button>
        </div>
      </div>
    </div>
  );
}
