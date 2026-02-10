import AppSidebar from "@/components/dashboard/AppSidebar";
import { CommandPalette } from "@/components/crm/CommandPalette";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppSidebar />
      <main className="ml-64 min-h-screen transition-all duration-300">
        {children}
      </main>
      <CommandPalette />
    </div>
  );
}
