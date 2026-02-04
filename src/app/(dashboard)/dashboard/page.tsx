import {
  Users,
  Building2,
  CircleDollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

// Mock data - will be replaced with real data from API
const stats = [
  {
    name: "Total Contacts",
    value: "12,847",
    change: "+12%",
    changeType: "increase",
    icon: Users,
  },
  {
    name: "Total Companies",
    value: "2,156",
    change: "+8%",
    changeType: "increase",
    icon: Building2,
  },
  {
    name: "Open Deals",
    value: "$2.4M",
    change: "+23%",
    changeType: "increase",
    icon: CircleDollarSign,
  },
  {
    name: "Won This Month",
    value: "$856K",
    change: "-5%",
    changeType: "decrease",
    icon: TrendingUp,
  },
];

const recentActivities = [
  {
    id: 1,
    type: "deal",
    title: "Deal moved to Qualified",
    description: "TechCorp Enterprise Deal",
    time: "2 minutes ago",
  },
  {
    id: 2,
    type: "contact",
    title: "New contact created",
    description: "John Doe from StartupIO",
    time: "15 minutes ago",
  },
  {
    id: 3,
    type: "email",
    title: "Email opened",
    description: "Proposal sent to Enterprise Solutions",
    time: "1 hour ago",
  },
  {
    id: 4,
    type: "meeting",
    title: "Meeting scheduled",
    description: "Demo with Creative Agency",
    time: "2 hours ago",
  },
  {
    id: 5,
    type: "deal",
    title: "Deal closed won",
    description: "Agency Marketing Suite - $15,000",
    time: "3 hours ago",
  },
];

const upcomingTasks = [
  {
    id: 1,
    title: "Follow up with TechCorp",
    dueDate: "Today",
    priority: "high",
  },
  {
    id: 2,
    title: "Send proposal to StartupIO",
    dueDate: "Tomorrow",
    priority: "medium",
  },
  {
    id: 3,
    title: "Schedule demo with new lead",
    dueDate: "Feb 6",
    priority: "low",
  },
];

export default function DashboardPage() {
  return (
    <div className="p-6 pt-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-[#0891b2]" />
              </div>
              <span
                className={`flex items-center gap-1 text-sm font-medium ${
                  stat.changeType === "increase"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {stat.changeType === "increase" ? (
                  <ArrowUpRight className="w-4 h-4" />
                ) : (
                  <ArrowDownRight className="w-4 h-4" />
                )}
                {stat.change}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.name}</div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-[#0891b2]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {activity.description}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {activity.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100">
            <a
              href="/activities"
              className="text-sm font-medium text-[#0891b2] hover:text-[#0ea5e9]"
            >
              View all activity →
            </a>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {upcomingTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-[#0891b2] focus:ring-[#0891b2]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{task.dueDate}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          task.priority === "high"
                            ? "bg-red-50 text-red-600"
                            : task.priority === "medium"
                            ? "bg-yellow-50 text-yellow-600"
                            : "bg-gray-50 text-gray-600"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-gray-100">
            <a
              href="/tasks"
              className="text-sm font-medium text-[#0891b2] hover:text-[#0ea5e9]"
            >
              View all tasks →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
