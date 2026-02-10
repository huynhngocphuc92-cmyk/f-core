import {
  Webhook,
  Shield,
  Activity,
  Plus,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  User,
} from "lucide-react";
import {
  getWebhooks,
  getAuditLogs,
  getAuditLogStats,
  toggleWebhook,
  deleteWebhook,
  createWebhook,
} from "@/app/actions/webhooks";

export const dynamic = "force-dynamic";

const actionColorMap: Record<string, string> = {
  created: "bg-green-50 text-green-700",
  updated: "bg-blue-50 text-blue-700",
  deleted: "bg-red-50 text-red-700",
  viewed: "bg-gray-100 text-gray-600",
  exported: "bg-purple-50 text-purple-700",
  imported: "bg-indigo-50 text-indigo-700",
};

export default async function WebhooksPage() {
  const [webhooks, auditLogs, auditStats] = await Promise.all([
    getWebhooks(),
    getAuditLogs(),
    getAuditLogStats(),
  ]);

  return (
    <div className="p-6 pt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Webhooks & Audit Log
          </h1>
          <p className="text-gray-600 mt-1">
            Manage integrations and track system activity
          </p>
        </div>
      </div>

      {/* ============================== */}
      {/* WEBHOOKS SECTION */}
      {/* ============================== */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Webhook className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Webhooks</h2>
            <span className="ml-1 px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
              {webhooks.length}
            </span>
          </div>

          {/* Add Webhook Form (inline) */}
          <form
            action={createWebhook}
            className="flex items-center gap-2"
          >
            <input
              name="name"
              type="text"
              placeholder="Webhook name"
              required
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] w-36"
            />
            <input
              name="url"
              type="url"
              placeholder="https://..."
              required
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] w-52"
            />
            <input
              name="events"
              type="text"
              placeholder="contact.created,deal.updated"
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2] w-56"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0891b2] text-white rounded-lg hover:bg-[#0e7490] transition-colors text-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </form>
        </div>

        {webhooks.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-10">
            <Webhook className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-1">No webhooks configured</p>
            <p className="text-sm text-gray-400">
              Add a webhook to receive real-time event notifications
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    URL
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Events
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Success / Fail
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Last Triggered
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {webhooks.map((webhook) => {
                  const events = Array.isArray(webhook.events)
                    ? (webhook.events as string[])
                    : [];
                  return (
                    <tr
                      key={webhook.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <span className="text-sm font-medium text-gray-900">
                          {webhook.name}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-gray-600 font-mono truncate max-w-[200px] block">
                          {webhook.url}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <form
                          action={toggleWebhook.bind(
                            null,
                            webhook.id,
                            !webhook.isActive
                          )}
                        >
                          <button
                            type="submit"
                            className="flex items-center gap-1.5 cursor-pointer"
                            title={
                              webhook.isActive ? "Click to disable" : "Click to enable"
                            }
                          >
                            {webhook.isActive ? (
                              <>
                                <ToggleRight className="w-5 h-5 text-green-500" />
                                <span className="text-xs font-medium text-green-700">
                                  Active
                                </span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-5 h-5 text-gray-400" />
                                <span className="text-xs font-medium text-gray-500">
                                  Inactive
                                </span>
                              </>
                            )}
                          </button>
                        </form>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700">
                          {events.length} event{events.length !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {webhook.successCount}
                          </span>
                          <span className="flex items-center gap-1 text-red-500">
                            <XCircle className="w-3.5 h-3.5" />
                            {webhook.failureCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {webhook.lastTriggeredAt
                          ? new Date(
                              webhook.lastTriggeredAt
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Never"}
                      </td>
                      <td className="px-5 py-3">
                        <form action={deleteWebhook.bind(null, webhook.id)}>
                          <button
                            type="submit"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete webhook"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================== */}
      {/* AUDIT LOG SECTION */}
      {/* ============================== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">Audit Log</h2>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-gray-400" />
              <strong className="text-gray-900">{auditStats.total}</strong>{" "}
              total
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gray-400" />
              <strong className="text-gray-900">{auditStats.today}</strong>{" "}
              today
            </span>
            <span>
              <strong className="text-gray-900">{auditStats.thisWeek}</strong>{" "}
              this week
            </span>
          </div>
        </div>

        {auditLogs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-10">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-1">No audit log entries</p>
            <p className="text-sm text-gray-400">
              Activity will be logged as users interact with the system
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Action
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Entity
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                    Changes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLogs.map((log) => {
                  const actionColor =
                    actionColorMap[log.action] ||
                    "bg-gray-100 text-gray-600";
                  const hasChanges =
                    log.changes &&
                    typeof log.changes === "object" &&
                    Object.keys(log.changes as Record<string, unknown>).length > 0;
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full capitalize ${actionColor}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div>
                          <span className="text-sm font-medium text-gray-900 capitalize">
                            {log.entity}
                          </span>
                          {log.entityName && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {log.entityName}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {log.user ? (
                          <span className="flex items-center gap-1.5 text-sm text-gray-700">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            {log.user.name || log.user.email}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">System</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {new Date(log.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-3">
                        {hasChanges ? (
                          <span className="inline-flex px-2 py-0.5 text-[10px] font-mono font-medium rounded bg-gray-100 text-gray-600">
                            JSON
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
