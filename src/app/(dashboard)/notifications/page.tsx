import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Mail,
  Users,
  CircleDollarSign,
  Ticket,
  ExternalLink,
} from "lucide-react";
import { getNotifications, getUnreadCount } from "@/app/actions/notifications";
import {
  MarkAllReadButton,
  MarkReadButton,
} from "@/components/crm/NotificationActions";

export const dynamic = "force-dynamic";

// =============================================================================
// TYPE-TO-ICON MAPPING
// =============================================================================

const typeIconMap: Record<string, React.ElementType> = {
  contact: Users,
  deal: CircleDollarSign,
  ticket: Ticket,
  email: Mail,
};

function getIconForType(type: string): React.ElementType {
  return typeIconMap[type] || Bell;
}

// =============================================================================
// TIME AGO HELPER
// =============================================================================

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// =============================================================================
// NOTIFICATIONS PAGE
// =============================================================================

export default async function NotificationsPage() {
  const [notifications, unreadCount] = await Promise.all([
    getNotifications(),
    getUnreadCount(),
  ]);

  return (
    <div className="p-6 pt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <span className="flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-[#0891b2] text-white text-xs font-semibold">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && <MarkAllReadButton />}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm text-center py-16">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-1">No notifications</p>
          <p className="text-sm text-gray-400">
            You're all caught up! New notifications will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = getIconForType(notification.type);
            const isUnread = !notification.isRead;

            return (
              <div
                key={notification.id}
                className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-colors ${
                  isUnread
                    ? "border-l-4 border-l-[#0891b2] border-t-gray-200 border-r-gray-200 border-b-gray-200"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-start gap-4 p-4">
                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isUnread
                        ? "bg-[#0891b2]/10"
                        : "bg-gray-100"
                    }`}
                  >
                    <Icon
                      className={`w-4.5 h-4.5 ${
                        isUnread ? "text-[#0891b2]" : "text-gray-400"
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p
                          className={`text-sm truncate ${
                            isUnread
                              ? "font-semibold text-gray-900"
                              : "font-medium text-gray-700"
                          }`}
                        >
                          {notification.title}
                        </p>
                        {notification.message && (
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {timeAgo(notification.createdAt)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {isUnread && <MarkReadButton id={notification.id} />}
                        {notification.link && (
                          <Link
                            href={notification.link}
                            className="p-1.5 rounded-md text-gray-400 hover:text-[#0891b2] hover:bg-gray-50 transition-colors"
                            title="View details"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        {!isUnread && (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
