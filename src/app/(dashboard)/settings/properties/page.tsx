import Link from "next/link";
import { ArrowLeft, Users, Building2, Handshake, Plus, Lock, Pencil, Trash2 } from "lucide-react";
import { getPropertyDefinitions } from "@/app/actions/properties";
import PropertyActions from "./PropertyActions";

export const dynamic = "force-dynamic";

const objectTypeConfig = {
  contact: { label: "Contacts", icon: Users, color: "bg-blue-50 text-blue-600" },
  company: { label: "Companies", icon: Building2, color: "bg-purple-50 text-purple-600" },
  deal: { label: "Deals", icon: Handshake, color: "bg-green-50 text-green-600" },
} as const;

const fieldTypeLabels: Record<string, string> = {
  text: "Text",
  number: "Number",
  date: "Date",
  datetime: "Date & Time",
  select: "Dropdown",
  multiselect: "Multi-select",
  checkbox: "Checkbox",
  email: "Email",
  phone: "Phone",
  url: "URL",
};

export default async function PropertiesSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = (tab as keyof typeof objectTypeConfig) || "contact";
  const allProperties = await getPropertyDefinitions(activeTab);

  // Group by groupName
  const groups: Record<string, typeof allProperties> = {};
  for (const prop of allProperties) {
    const group = prop.groupName || "Other";
    if (!groups[group]) groups[group] = [];
    groups[group].push(prop);
  }

  const systemCount = allProperties.filter((p) => p.isSystem).length;
  const customCount = allProperties.filter((p) => !p.isSystem).length;

  return (
    <div className="p-6 pt-8">
      <Link
        href="/settings"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#0891b2] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Settings
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600 mt-1">
            Manage custom fields for your CRM objects
          </p>
        </div>
        <PropertyActions activeTab={activeTab} />
      </div>

      {/* Object Type Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {(Object.keys(objectTypeConfig) as Array<keyof typeof objectTypeConfig>).map((type) => {
          const config = objectTypeConfig[type];
          const Icon = config.icon;
          return (
            <Link
              key={type}
              href={`/settings/properties?tab=${type}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === type
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {config.label}
            </Link>
          );
        })}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
        <span>{allProperties.length} total properties</span>
        <span className="text-gray-300">|</span>
        <span>{systemCount} system</span>
        <span className="text-gray-300">|</span>
        <span>{customCount} custom</span>
      </div>

      {/* Property Groups */}
      <div className="space-y-6">
        {Object.entries(groups).map(([groupName, properties]) => (
          <div key={groupName} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700">{groupName}</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label</th>
                  <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Internal Name</th>
                  <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                  <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="w-20 px-6 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {properties.map((prop) => (
                  <tr key={prop.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <span className="text-sm font-medium text-gray-900">{prop.label}</span>
                      {prop.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{prop.description}</p>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      <code className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{prop.name}</code>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-600">
                      {fieldTypeLabels[prop.fieldType] || prop.fieldType}
                    </td>
                    <td className="px-6 py-3">
                      {prop.isRequired ? (
                        <span className="text-xs font-medium text-amber-600">Required</span>
                      ) : (
                        <span className="text-xs text-gray-400">Optional</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {prop.isSystem ? (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <Lock className="w-3 h-3" />
                          System
                        </span>
                      ) : (
                        <span className="text-xs text-[#0891b2] font-medium">Custom</span>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {!prop.isSystem && (
                        <PropertyActions propertyId={prop.id} propertyName={prop.label} mode="row" activeTab={activeTab} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {allProperties.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">No properties defined for this object type</p>
          </div>
        )}
      </div>
    </div>
  );
}
