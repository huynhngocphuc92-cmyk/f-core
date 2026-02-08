"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import {
  LayoutGrid,
  Search,
  Plus,
  ChevronDown,
  Layers,
} from "lucide-react";
import StageColumn from "./StageColumn";
import DealCard from "./DealCard";
import DealForm from "./DealForm";

// Types
interface DealData {
  id: string;
  name: string;
  amount: string | number | null;
  currency: string;
  closeDate: string | null;
  priority: string | null;
  owner: { id: string; name: string | null; email: string } | null;
  companies: Array<{
    company: { id: string; name: string; domain: string | null };
    isPrimary: boolean;
  }>;
  contacts: Array<{
    contact: { id: string; firstName: string | null; lastName: string | null; email: string | null };
  }>;
  stage: { id: string; name: string; isClosed: boolean; isWon: boolean };
}

interface StageData {
  id: string;
  name: string;
  orderIndex: number;
  probability: number;
  color: string | null;
  isClosed: boolean;
  isWon: boolean;
  deals: DealData[];
  totalAmount: number;
  count: number;
}

interface PipelineOption {
  id: string;
  name: string;
  isDefault: boolean;
  stages: Array<{
    id: string;
    name: string;
    orderIndex: number;
    probability: number;
    color: string | null;
    isClosed: boolean;
    isWon: boolean;
  }>;
}

interface PipelineSummary {
  totalDeals: number;
  totalAmount: number;
  weightedAmount: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function KanbanBoard() {
  const [pipelines, setPipelines] = useState<PipelineOption[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const [stages, setStages] = useState<StageData[]>([]);
  const [summary, setSummary] = useState<PipelineSummary>({ totalDeals: 0, totalAmount: 0, weightedAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPipelineDropdown, setShowPipelineDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formStageId, setFormStageId] = useState<string | undefined>();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const dragTargetStageRef = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 5 } })
  );

  // Fetch pipelines
  const fetchPipelines = useCallback(async () => {
    try {
      const res = await fetch("/api/pipelines");
      if (!res.ok) throw new Error("Failed to fetch pipelines");
      const json = await res.json();
      setPipelines(json.data || []);
      // Auto-select default pipeline
      const defaultPipeline = json.data?.find((p: PipelineOption) => p.isDefault) || json.data?.[0];
      if (defaultPipeline && !selectedPipelineId) {
        setSelectedPipelineId(defaultPipeline.id);
      }
    } catch (err) {
      console.error("Error fetching pipelines:", err);
    }
  }, [selectedPipelineId]);

  // Fetch deals grouped by stage
  const fetchDeals = useCallback(async () => {
    if (!selectedPipelineId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        pipelineId: selectedPipelineId,
        grouped: "true",
        ...(searchQuery && { search: searchQuery }),
      });
      const res = await fetch(`/api/deals?${params}`);
      if (!res.ok) throw new Error("Failed to fetch deals");
      const json = await res.json();
      const data = json.data || {};
      setStages(data.stages || []);
      setSummary(data.summary || { totalDeals: 0, totalAmount: 0, weightedAmount: 0 });
    } catch (err) {
      setError("Failed to load deals. Please try again.");
      console.error("Error fetching deals:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedPipelineId, searchQuery]);

  useEffect(() => { fetchPipelines(); }, [fetchPipelines]);
  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Find deal across all stages
  const findDeal = (dealId: string): { deal: DealData; stageIndex: number; dealIndex: number } | null => {
    for (let si = 0; si < stages.length; si++) {
      const di = stages[si].deals.findIndex((d) => d.id === dealId);
      if (di !== -1) return { deal: stages[si].deals[di], stageIndex: si, dealIndex: di };
    }
    return null;
  };

  // DnD handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeResult = findDeal(activeId);
    if (!activeResult) return;

    // Check if over is a stage (column drop)
    const overStageIndex = stages.findIndex((s) => s.id === overId);
    const overDealResult = findDeal(overId);

    const sourceStageIndex = activeResult.stageIndex;
    let targetStageIndex: number;

    if (overStageIndex !== -1) {
      targetStageIndex = overStageIndex;
    } else if (overDealResult) {
      targetStageIndex = overDealResult.stageIndex;
    } else {
      return;
    }

    if (sourceStageIndex === targetStageIndex) return;

    // Track target stage for handleDragEnd
    dragTargetStageRef.current = stages[targetStageIndex].id;

    // Move deal between stages (optimistic)
    setStages((prev) => {
      const newStages = prev.map((s) => ({
        ...s,
        deals: [...s.deals],
      }));

      const [movedDeal] = newStages[sourceStageIndex].deals.splice(activeResult.dealIndex, 1);
      movedDeal.stage = {
        id: newStages[targetStageIndex].id,
        name: newStages[targetStageIndex].name,
        isClosed: newStages[targetStageIndex].isClosed,
        isWon: newStages[targetStageIndex].isWon,
      };

      if (overDealResult && overDealResult.stageIndex === targetStageIndex) {
        newStages[targetStageIndex].deals.splice(overDealResult.dealIndex, 0, movedDeal);
      } else {
        newStages[targetStageIndex].deals.push(movedDeal);
      }

      // Recalculate counts and amounts
      newStages[sourceStageIndex].count = newStages[sourceStageIndex].deals.length;
      newStages[sourceStageIndex].totalAmount = newStages[sourceStageIndex].deals.reduce(
        (sum, d) => sum + (d.amount ? Number(d.amount) : 0), 0
      );
      newStages[targetStageIndex].count = newStages[targetStageIndex].deals.length;
      newStages[targetStageIndex].totalAmount = newStages[targetStageIndex].deals.reduce(
        (sum, d) => sum + (d.amount ? Number(d.amount) : 0), 0
      );

      return newStages;
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);

    if (!over) {
      dragTargetStageRef.current = null;
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeResult = findDeal(activeId);
    if (!activeResult) {
      dragTargetStageRef.current = null;
      return;
    }

    // Same-column reorder
    const overDealResult = findDeal(overId);
    if (overDealResult && activeResult.stageIndex === overDealResult.stageIndex && activeResult.dealIndex !== overDealResult.dealIndex) {
      setStages((prev) => {
        const newStages = [...prev];
        const stageIdx = activeResult.stageIndex;
        newStages[stageIdx] = {
          ...newStages[stageIdx],
          deals: arrayMove(newStages[stageIdx].deals, activeResult.dealIndex, overDealResult.dealIndex),
        };
        return newStages;
      });
      dragTargetStageRef.current = null;
      return;
    }

    // Cross-column move - call API using tracked target stage
    const targetStageId = dragTargetStageRef.current;
    dragTargetStageRef.current = null;
    if (!targetStageId) return;

    const targetStage = stages.find((s) => s.id === targetStageId);

    try {
      const res = await fetch(`/api/deals/${activeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId: targetStageId }),
      });

      if (!res.ok) throw new Error("Failed to move deal");

      // Recalculate summary
      const totalDeals = stages.reduce((sum, s) => sum + s.deals.length, 0);
      const totalAmount = stages.reduce((sum, s) => sum + s.totalAmount, 0);
      const weightedAmount = stages.reduce((sum, s) => {
        return sum + s.deals.reduce((dSum, d) => {
          const amt = d.amount ? Number(d.amount) : 0;
          return dSum + (amt * s.probability) / 100;
        }, 0);
      }, 0);
      setSummary({ totalDeals, totalAmount, weightedAmount });

      setToast({ message: `Deal moved to ${targetStage?.name || "stage"}`, type: "success" });
    } catch {
      // Rollback on error
      fetchDeals();
      setToast({ message: "Failed to move deal. Please try again.", type: "error" });
    }
  };

  const handleAddDeal = (stageId: string) => {
    setFormStageId(stageId);
    setFormOpen(true);
  };

  const handleDealCreated = () => {
    setFormOpen(false);
    setFormStageId(undefined);
    fetchDeals();
    setToast({ message: "Deal created successfully", type: "success" });
  };

  const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId);
  const activeDeal = activeDragId ? findDeal(activeDragId)?.deal : null;

  // Loading skeleton
  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="h-7 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-7 w-40 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-9 w-28 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-5 w-80 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="flex-1 flex gap-3 p-4 overflow-x-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-[280px] min-w-[280px] flex flex-col">
              <div className="px-3 py-2.5 bg-gray-50 rounded-t-lg border-t-2 border-gray-200">
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="flex-1 p-2 space-y-2 bg-gray-50/50">
                {[1, 2].map((j) => (
                  <div key={j} className="p-3 bg-white rounded-lg border border-gray-200 space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
                    <div className="flex justify-between">
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
          <p className="text-sm text-red-700 mb-3">{error}</p>
          <button
            onClick={fetchDeals}
            className="text-sm font-medium text-red-700 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Pipeline Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        {/* Row 1: Title + Actions */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900">Deals</h1>

            {/* Pipeline Selector */}
            <div className="relative">
              <button
                onClick={() => setShowPipelineDropdown(!showPipelineDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
              >
                {selectedPipeline?.name || "Select Pipeline"}
                <ChevronDown className="w-4 h-4" />
              </button>
              {showPipelineDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowPipelineDropdown(false)} />
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                    {pipelines.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedPipelineId(p.id);
                          setShowPipelineDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                          p.id === selectedPipelineId ? "text-cyan-700 bg-cyan-50" : "text-gray-700"
                        }`}
                      >
                        {p.name}
                        {p.isDefault && (
                          <span className="ml-2 text-xs text-gray-400">(default)</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button className="px-2.5 py-1.5 bg-gray-100 text-gray-900">
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button className="px-2.5 py-1.5 text-gray-400 hover:text-gray-600" disabled title="Table view coming soon">
                <Layers className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            {showSearch ? (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => { if (!searchQuery) setShowSearch(false); }}
                  placeholder="Search deals..."
                  className="pl-8 pr-3 py-1.5 w-56 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            {/* Add Deal Button */}
            <button
              onClick={() => {
                setFormStageId(undefined);
                setFormOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0891b2] text-white rounded-md text-sm font-semibold hover:bg-[#0ea5e9] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add deal
            </button>
          </div>
        </div>

        {/* Row 2: Summary Bar */}
        <div className="text-sm text-gray-500">
          {summary.totalDeals} deal{summary.totalDeals !== 1 ? "s" : ""} · {formatCurrency(summary.totalAmount)} total · {formatCurrency(summary.weightedAmount)} weighted pipeline
        </div>
      </div>

      {/* Kanban Board */}
      {stages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <Layers className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Your pipeline is empty</h2>
          <p className="text-sm text-gray-500 max-w-md mb-6">
            Start by creating your first deal to track your sales opportunities.
          </p>
          <button
            onClick={() => {
              setFormStageId(undefined);
              setFormOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0891b2] text-white rounded-md text-sm font-semibold hover:bg-[#0ea5e9] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create your first deal
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-3 p-4 h-full min-w-min">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              {stages.map((stage) => (
                <StageColumn
                  key={stage.id}
                  stage={stage}
                  onDealClick={() => {}}
                  onAddDeal={handleAddDeal}
                />
              ))}
              <DragOverlay>
                {activeDeal ? (
                  <DealCard deal={activeDeal} isDragOverlay />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      )}

      {/* Deal Form */}
      <DealForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setFormStageId(undefined);
        }}
        onSuccess={handleDealCreated}
        pipelineId={selectedPipelineId}
        stageId={formStageId}
        stages={selectedPipeline?.stages || []}
      />

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
