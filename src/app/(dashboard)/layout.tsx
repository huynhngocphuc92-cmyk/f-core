import AppSidebar from "@/components/dashboard/AppSidebar";
import AppHeader from "@/components/dashboard/AppHeader";
import CommandPaletteClient from "@/components/dashboard/CommandPaletteClient";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppSidebar />
      <main className="ml-64 min-h-screen transition-all duration-300 [content-visibility:auto]">
        <AppHeader />
        {children}
      </main>
      <CommandPaletteClient />
    </div>
  );
}
