import {
  CalendarCheck,
  Plus,
  Search,
  Filter,
  Clock,
  AlertCircle,
  User,
  CircleDollarSign,
} from "lucide-react";
import Link from "next/link";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getTasks() {
  const tasks = await prisma.activity.findMany({
    where: {
      type: "task",
    },
    include: {
      owner: { select: { id: true, name: true } },
      contact: { select: { id: true, firstName: true, lastName: true } },
      deal: { select: { id: true, name: true } },
      company: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return tasks;
}

function isOverdue(dueDate: Date | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function formatDate(date: Date | null): string {
  if (!date) return "No due date";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getPriorityClasses(priority: string | null): string {
  switch (priority) {
    case "high":
      return "bg-red-50 text-red-600";
    case "medium":
      return "bg-yellow-50 text-yellow-600";
    case "low":
      return "bg-gray-50 text-gray-600";
    default:
      return "bg-gray-50 text-gray-600";
  }
}

export default async function TasksPage() {
  const tasks = await getTasks();

  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const overdueCount = tasks.filter(
    (t) => t.status !== "completed" && isOverdue(t.dueDate)
  ).length;

  return (
    <div className="p-6 pt-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <CalendarCheck className="w-7 h-7 text-[#0891b2]" />
            <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          </div>
          <p className="text-gray-600 mt-1 ml-10">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0ea5e9] transition-colors">
            <Plus className="w-4 h-4" />
            Create task
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
        <button className="px-4 py-2.5 text-sm font-medium text-[#0891b2] border-b-2 border-[#0891b2] -mb-px">
          All ({tasks.length})
        </button>
        <button className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent -mb-px">
          Pending ({pendingCount})
        </button>
        <button className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent -mb-px">
          Completed ({completedCount})
        </button>
        <button className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent -mb-px">
          Overdue ({overdueCount})
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0891b2]"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Task List */}
      {tasks.length > 0 ? (
        <div className="space-y-3">
          {tasks.map((task) => {
            const overdue =
              task.status !== "completed" && isOverdue(task.dueDate);
            const isCompleted = task.status === "completed";

            return (
              <div
                key={task.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <div className="pt-0.5">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isCompleted
                          ? "bg-[#0891b2] border-[#0891b2]"
                          : "border-gray-300"
                      }`}
                    >
                      {isCompleted && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3
                        className={`text-sm font-medium ${
                          isCompleted
                            ? "line-through text-gray-400"
                            : "text-gray-900"
                        }`}
                      >
                        {task.subject || "Untitled task"}
                      </h3>

                      {/* Priority Badge */}
                      {task.priority && (
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityClasses(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>
                      )}

                      {/* Overdue Badge */}
                      {overdue && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-50 text-red-600">
                          <AlertCircle className="w-3 h-3" />
                          Overdue
                        </span>
                      )}
                    </div>

                    {/* Meta Row */}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {/* Due Date */}
                      <span
                        className={`inline-flex items-center gap-1 ${
                          overdue ? "text-red-500" : ""
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(task.dueDate)}
                      </span>

                      {/* Assigned Contact */}
                      {task.contact && (
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {task.contact.firstName} {task.contact.lastName}
                        </span>
                      )}

                      {/* Related Deal */}
                      {task.deal && (
                        <span className="inline-flex items-center gap-1">
                          <CircleDollarSign className="w-3.5 h-3.5" />
                          {task.deal.name}
                        </span>
                      )}

                      {/* Owner */}
                      {task.owner && (
                        <span className="inline-flex items-center gap-1 ml-auto text-gray-400">
                          Assigned to {task.owner.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
          <CalendarCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No tasks yet
          </h3>
          <p className="text-gray-500 mb-6">
            Create your first task to start tracking your work.
          </p>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-lg hover:bg-[#0ea5e9] transition-colors">
            <Plus className="w-4 h-4" />
            Create task
          </button>
        </div>
      )}
    </div>
  );
}
