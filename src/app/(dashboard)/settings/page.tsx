import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Key,
  Mail,
  Building2,
} from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-6 pt-8 max-w-4xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-[#0891b2]" />
            <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
          </div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-[#0891b2] flex items-center justify-center text-white font-semibold text-xl">
              A
            </div>
            <div>
              <p className="font-medium text-gray-900">Admin User</p>
              <p className="text-sm text-gray-500">admin@f-core.com</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                defaultValue="Admin"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                defaultValue="User"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                defaultValue="admin@f-core.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
              />
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-5 h-5 text-[#0891b2]" />
            <h2 className="text-lg font-semibold text-gray-900">
              Notifications
            </h2>
          </div>
          <div className="space-y-4">
            {[
              {
                label: "Email notifications",
                desc: "Receive email alerts for important updates",
                icon: Mail,
              },
              {
                label: "Deal updates",
                desc: "Get notified when deals change stages",
                icon: Building2,
              },
              {
                label: "New contact assignments",
                desc: "Alerts when contacts are assigned to you",
                icon: User,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-[#0891b2]/30 rounded-full peer peer-checked:bg-[#0891b2] after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-[#0891b2]" />
            <h2 className="text-lg font-semibold text-gray-900">Security</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Key className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Password</p>
                  <p className="text-xs text-gray-500">
                    Last changed 30 days ago
                  </p>
                </div>
              </div>
              <button className="px-4 py-2 text-sm text-[#0891b2] border border-[#0891b2] rounded-lg hover:bg-[#0891b2]/5 transition-colors">
                Change
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Two-factor authentication
                  </p>
                  <p className="text-xs text-gray-500">
                    Add an extra layer of security
                  </p>
                </div>
              </div>
              <button className="px-4 py-2 text-sm text-[#0891b2] border border-[#0891b2] rounded-lg hover:bg-[#0891b2]/5 transition-colors">
                Enable
              </button>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="w-5 h-5 text-[#0891b2]" />
            <h2 className="text-lg font-semibold text-gray-900">
              Preferences
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] bg-white">
                <option>English (US)</option>
                <option>Vietnamese</option>
                <option>Japanese</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] bg-white">
                <option>UTC-5 (Eastern Time)</option>
                <option>UTC+7 (Ho Chi Minh City)</option>
                <option>UTC+9 (Tokyo)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date format
              </label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] bg-white">
                <option>MM/DD/YYYY</option>
                <option>DD/MM/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] bg-white">
                <option>USD ($)</option>
                <option>VND (₫)</option>
                <option>EUR (€)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="px-6 py-2.5 bg-[#0891b2] text-white rounded-lg hover:bg-[#0e7490] transition-colors text-sm font-medium">
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
