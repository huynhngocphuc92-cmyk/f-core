import KanbanBoard from "@/components/deals/KanbanBoard";

export default function DealsPage() {
  return (
    <div className="h-[calc(100vh-theme(spacing.16))]">
      <KanbanBoard />
    </div>
  );
}
