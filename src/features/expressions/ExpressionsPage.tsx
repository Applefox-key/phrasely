import { useState, useMemo, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expressionsApi } from "./expressionsApi";
import { labelsApi } from "./labelsApi";
import { usersApi } from "../auth/usersApi";
import { Expression } from "./Expression";
import type { ExpressionData, Label } from "../../shared/types";
import ExpressionRow from "./components/ExpressionRow";
import EditModal from "./components/EditModal";
import InfoModal from "./components/InfoModal";
import AddFromTextModal from "./components/AddFromTextModal";
import AddSingleModal from "./components/AddSingleModal";
import { useAuthStore } from "../auth/authStore";
import { useDemoStore } from "../demo/demoStore";
import { useDemoExpressions, useDemoLabels } from "../demo/useDemoExpressions";
import ConfirmDialog from "../../shared/components/ConfirmDialog";
import { useConfirm } from "../../shared/hooks/useConfirm";

type Panel = "manage" | "labels" | "settings" | null;

export default function ExpressionsPage() {
  const navigate = useNavigate();
  const { confirm, dialogProps } = useConfirm();
  const qc = useQueryClient();
  const isDemo = useAuthStore((s) => s.isDemo);
  const demoStore = useDemoStore();

  // ── real server state (disabled in demo) ──────────────────────
  const { data: rawExpressionsReal = [], isLoading: loadingReal } = useQuery({
    queryKey: ["expressions"],
    queryFn: () => expressionsApi.getAll(),
    enabled: !isDemo,
  });

  const { data: labelsReal = [] } = useQuery({
    queryKey: ["labels"],
    queryFn: labelsApi.getAll,
    enabled: !isDemo,
  });

  // ── demo state ────────────────────────────────────────────────
  const { data: rawExpressionsDemo, isLoading: loadingDemo } = useDemoExpressions();
  const { data: labelsDemo } = useDemoLabels();

  // ── merge ────────────────────────────────────────────────────
  const rawExpressions = isDemo ? rawExpressionsDemo : rawExpressionsReal;
  const labels: Label[] = isDemo ? labelsDemo : labelsReal;
  const isLoading = isDemo ? loadingDemo : loadingReal;

  // ── real mutations (no-ops in demo) ───────────────────────────
  const updateMutation = useMutation({
    mutationFn: (data: ReturnType<Expression["getUpdatedFields"]>) => expressionsApi.update(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expressions"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => expressionsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expressions"] }),
  });

  const createMutation = useMutation({
    mutationFn: (list: Partial<ExpressionData>[]) => expressionsApi.create(list),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expressions"] }),
  });

  const batchDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => expressionsApi.deleteSome(ids),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["expressions"] }),
  });

  // ── local UI state ────────────────────────────────────────────
  const [activePanel, setActivePanel] = useState<Panel>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [groupByLabel, setGroupByLabel] = useState(false);
  const [filterLabel, setFilterLabel] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStage, setFilterStage] = useState("");
  const [filterInQueue, setFilterInQueue] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [editTarget, setEditTarget] = useState<Expression | null>(null);
  const [infoTarget, setInfoTarget] = useState<Expression | null>(null);
  const [showAddSingle, setShowAddSingle] = useState(false);
  const [showAddText, setShowAddText] = useState(false);
  const [showAddFile, setShowAddFile] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [batchAction, setBatchAction] = useState<"delete" | "label" | "status" | "queue" | "download">("delete");
  const [batchLabel, setBatchLabel] = useState<number | null>(null);
  const [batchStatus, setBatchStatus] = useState("active");
  const [batchQueueAction, setBatchQueueAction] = useState<"add" | "remove">("add");

  // ── label management ──────────────────────────────────────────
  const [newLabelName, setNewLabelName] = useState("");
  const createLabelMutation = useMutation({
    mutationFn: (name: string) => labelsApi.create(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["labels"] }),
  });
  const deleteLabelMutation = useMutation({
    mutationFn: (id: number) => labelsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["labels"] }),
  });

  // ── demo mutation helpers ─────────────────────────────────────
  const demoCreateLabel = (name: string) => demoStore.addLabel(name);
  const demoDeleteLabel = (id: number) => demoStore.deleteLabel(id);

  // ── filtered list ─────────────────────────────────────────────
  const expressions = useMemo(() => {
    return rawExpressions
      .map((e) => new Expression(e))
      .filter((e) => {
        if (filterLabel && String(e.labelid) !== filterLabel) return false;
        if (filterStatus && e.status !== filterStatus) return false;
        if (filterStage !== "" && String(e.stage) !== filterStage) return false;
        if (filterInQueue && !e.inQueue) return false;
        if (filterText) {
          const q = filterText.toLowerCase();
          if (!e.phrase.toLowerCase().includes(q) && !e.expression.toLowerCase().includes(q)) return false;
        }
        return true;
      });
  }, [rawExpressions, filterLabel, filterStatus, filterStage, filterInQueue, filterText]);

  const grouped = useMemo(() => {
    if (!groupByLabel) return null;
    const map = new Map<string, Expression[]>();
    for (const e of expressions) {
      const key = e.label ?? "Unlabeled";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [expressions, groupByLabel]);

  // ── handlers ──────────────────────────────────────────────────
  const handleEdit = (exp: Expression, data: Partial<ExpressionData> & { id: number }) => {
    const changes = exp.getUpdatedFields(data as ExpressionData);
    if (Object.keys(changes).length > 1) {
      if (isDemo) demoStore.updateExpression(changes);
      else updateMutation.mutate(changes);
    }
    setEditTarget(null);
  };

  const handleLabelChange = (exp: Expression, labelid: number | null) => {
    if (isDemo) demoStore.updateExpression({ id: exp.id, labelid });
    else updateMutation.mutate({ id: exp.id, labelid });
  };

  const handleDelete = async (id: number) => {
    const ok = await confirm({
      title: "Delete expression?",
      message: "This action cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    if (isDemo) demoStore.deleteExpression(id);
    else deleteMutation.mutate(id);
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const executeBatchAction = async () => {
    const ids = Array.from(selected);
    if (batchAction === "delete") {
      const ok = await confirm({
        title: `Delete ${selected.size} expression${selected.size > 1 ? "s" : ""}?`,
        message: "This action cannot be undone.",
        confirmLabel: "Delete all",
        danger: true,
      });
      if (!ok) return;
      if (isDemo) {
        demoStore.deleteSomeExpressions(ids);
        setSelectMode(false);
        setSelected(new Set());
      } else {
        batchDeleteMutation.mutate(ids, {
          onSuccess: () => {
            setSelectMode(false);
            setSelected(new Set());
          },
        });
      }
    } else if (batchAction === "label") {
      if (isDemo) {
        ids.forEach((id) => demoStore.updateExpression({ id, labelid: batchLabel }));
        setSelectMode(false);
        setSelected(new Set());
      } else {
        expressionsApi.updateOneField(ids, "labelid", batchLabel).then(() => {
          qc.invalidateQueries({ queryKey: ["expressions"] });
          setSelectMode(false);
          setSelected(new Set());
        });
      }
    } else if (batchAction === "status") {
      if (isDemo) {
        ids.forEach((id) => demoStore.updateExpression({ id, status: batchStatus }));
        setSelectMode(false);
        setSelected(new Set());
      } else {
        expressionsApi.updateOneField(ids, "status", batchStatus).then(() => {
          qc.invalidateQueries({ queryKey: ["expressions"] });
          setSelectMode(false);
          setSelected(new Set());
        });
      }
    } else if (batchAction === "queue") {
      const inQueue = batchQueueAction === "add";
      if (isDemo) {
        ids.forEach((id) => demoStore.updateExpression({ id, inQueue }));
        setSelectMode(false);
        setSelected(new Set());
      } else {
        expressionsApi.updateOneField(ids, "inQueue", inQueue).then(() => {
          qc.invalidateQueries({ queryKey: ["expressions"] });
          setSelectMode(false);
          setSelected(new Set());
        });
      }
    } else if (batchAction === "download") {
      const selectedExpressions = rawExpressions.filter((e) => selected.has(e.id));
      const lines = selectedExpressions.map((e) => `${e.expression}; ${e.phrase}`).join("\n");
      const blob = new Blob([lines], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "phrasely-export.txt";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const exportTxt = () => {
    const lines = rawExpressions.map((e) => `${e.expression}; ${e.phrase}`).join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "phrasely-export.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddFromText = (items: { expression: string; phrase: string }[], labelid: number | null) => {
    if (isDemo) {
      items.forEach((item) => demoStore.addExpression({ ...item, labelid }));
    } else {
      createMutation.mutate(items.map((i) => ({ ...i, labelid })));
    }
  };

  const handleAddSingle = (data: {
    expression: string;
    phrase: string;
    note: string | null;
    labelid: number | null;
  }) => {
    if (isDemo) {
      demoStore.addExpression(data);
    } else {
      createMutation.mutate([data]);
    }
  };

  const togglePanel = (p: Panel) => setActivePanel((prev) => (prev === p ? null : p));

  // ── render ────────────────────────────────────────────────────
  const renderRows = (list: Expression[]) =>
    list.map((exp) => (
      <ExpressionRow
        key={exp.id}
        expression={exp}
        labels={labels}
        selected={selected.has(exp.id)}
        selectMode={selectMode}
        onToggleSelect={() => toggleSelect(exp.id)}
        onClick={() => setEditTarget(exp)}
        onInfoClick={() => setInfoTarget(exp)}
        onDelete={() => handleDelete(exp.id)}
        onLabelChange={(lid) => handleLabelChange(exp, lid)}
      />
    ));

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <aside className="w-12 shrink-0 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col items-center py-3 gap-2">
        <SidebarBtn title="Manage" active={activePanel === "manage"} onClick={() => togglePanel("manage")}>
          ⋯
        </SidebarBtn>
        <SidebarBtn title="Add expression" onClick={() => setShowAddSingle(true)}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            className="w-5 h-5">
            <path d="M12 6v12M6 12h12" />
          </svg>
        </SidebarBtn>
        <SidebarBtn title="Labels" active={activePanel === "labels"} onClick={() => togglePanel("labels")}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            className="w-5 h-5">
            <path d="M20 12l-8 8-8-8V4h8l8 8z" />
            <circle cx="9" cy="9" r="1.5" />
          </svg>
        </SidebarBtn>
        <SidebarBtn title="Settings" active={activePanel === "settings"} onClick={() => togglePanel("settings")}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
            className="w-5 h-5">
            <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543-.89 3.31.876 2.42 2.42a1.724 1.724 0 0 0 1.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 0 0-1.066 2.573c.89 1.543-.876 3.31-2.42 2.42a1.724 1.724 0 0 0-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 0 0-2.573-1.066c-1.543.89-3.31-.876-2.42-2.42a1.724 1.724 0 0 0-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 0 0 1.066-2.573c-.89-1.543.876-3.31 2.42-2.42.996.575 2.245.09 2.572-1.065z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </SidebarBtn>
        <div className="flex-1" />
        <SidebarBtn title="Go to training" onClick={() => navigate("/training")}>
          ←
        </SidebarBtn>
      </aside>

      {/* Panel */}
      {activePanel && (
        <div className="w-56 shrink-0 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 p-3 overflow-y-auto">
          {activePanel === "manage" && (
            <ManagePanel
              onAddSingle={() => setShowAddSingle(true)}
              onAddText={() => {
                setShowAddText(true);
                setActivePanel(null);
              }}
              onAddFile={() => {
                setShowAddFile(true);
                setActivePanel(null);
              }}
              onDeleteMode={() => {
                setSelectMode(true);
                setBatchAction("delete");
                setActivePanel(null);
              }}
              onExport={exportTxt}
            />
          )}
          {activePanel === "labels" && (
            <LabelsPanel
              labels={labels}
              newName={newLabelName}
              setNewName={setNewLabelName}
              onCreate={(name) => {
                if (isDemo) demoCreateLabel(name);
                else createLabelMutation.mutate(name);
                setNewLabelName("");
              }}
              onDelete={(id) => {
                if (isDemo) demoDeleteLabel(id);
                else deleteLabelMutation.mutate(id);
              }}
            />
          )}
          {activePanel === "settings" && <SettingsPanel />}
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Filter bar */}
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-3 py-2">
          {/* Row 1 — always visible */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectMode((v) => !v);
                setSelected(new Set());
              }}
              className={`text-xs px-2.5 py-1.5 rounded-md border transition-colors shrink-0 ${
                selectMode
                  ? "bg-teal-50 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-400"
                  : "border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 hover:dark:bg-slate-700"
              }`}>
              Select
            </button>

            <button
              onClick={() => setGroupByLabel((v) => !v)}
              className={`text-xs px-2.5 py-1.5 rounded-md border transition-colors shrink-0 ${
                groupByLabel
                  ? "bg-teal-50 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-400"
                  : "border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 hover:dark:bg-slate-700"
              }`}>
              {groupByLabel ? "Flat" : "Group"}
            </button>

            <input
              type="search"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Search…"
              className="flex-1 min-w-0 text-sm border border-gray-200 dark:border-slate-600 rounded-md px-3 py-1.5 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />

            <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{expressions.length}</span>

            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className={`shrink-0 p-1.5 rounded-md border transition-colors ${
                filtersOpen || filterLabel || filterStatus || filterStage || filterInQueue
                  ? "border-teal-300 dark:border-teal-700 text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30"
                  : "border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 hover:dark:bg-slate-700"
              }`}
              title="Filters">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M3 4h18l-7 8v6l-4 2v-8L3 4z" />
              </svg>
            </button>
          </div>

          {/* Row 2 — collapsible filters */}
          {filtersOpen && (
            <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-slate-700">
              <select
                value={filterLabel}
                onChange={(e) => setFilterLabel(e.target.value)}
                className="text-xs border border-gray-200 dark:border-slate-600 rounded-md px-2 py-1.5 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300">
                <option value="">All labels</option>
                {labels.map((l: Label) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs border border-gray-200 dark:border-slate-600 rounded-md px-2 py-1.5 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300">
                <option value="">All statuses</option>
                {["new", "active", "paused", "completed"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="text-xs border border-gray-200 dark:border-slate-600 rounded-md px-2 py-1.5 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300">
                <option value="">All stages</option>
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i} value={i}>
                    Stage {i}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterInQueue}
                  onChange={(e) => setFilterInQueue(e.target.checked)}
                  className="rounded border-gray-300"
                />
                In queue
              </label>
            </div>
          )}
        </div>

        {/* Batch action bar */}
        {selectMode && (
          <div className="bg-teal-50 dark:bg-teal-900/20 border-b border-teal-200 dark:border-teal-800 px-4 py-2 flex flex-wrap gap-3 items-center">
            <span className="text-sm font-medium text-teal-700 dark:text-teal-400">{selected.size} selected</span>
            <select
              value={batchAction}
              onChange={(e) => setBatchAction(e.target.value as typeof batchAction)}
              className="text-xs border border-teal-300 dark:border-teal-700 rounded px-2 py-1 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300">
              <option value="delete">Delete</option>
              <option value="label">Assign label</option>
              <option value="status">Set status</option>
              <option value="queue">Queue manage</option>
              <option value="download">Download</option>
            </select>
            {batchAction === "queue" && (
              <select
                value={batchQueueAction}
                onChange={(e) => setBatchQueueAction(e.target.value as "add" | "remove")}
                className="text-xs border border-teal-300 dark:border-teal-700 rounded px-2 py-1 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300">
                <option value="add">Add to queue</option>
                <option value="remove">Remove from queue</option>
              </select>
            )}
            {batchAction === "label" && (
              <select
                value={batchLabel ?? ""}
                onChange={(e) => setBatchLabel(e.target.value ? Number(e.target.value) : null)}
                className="text-xs border border-teal-300 dark:border-teal-700 rounded px-2 py-1 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300">
                <option value="">No label</option>
                {labels.map((l: Label) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            )}
            {batchAction === "status" && (
              <select
                value={batchStatus}
                onChange={(e) => setBatchStatus(e.target.value)}
                className="text-xs border border-teal-300 dark:border-teal-700 rounded px-2 py-1 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300">
                {["new", "active", "paused", "completed"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={executeBatchAction}
              disabled={selected.size === 0}
              className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs px-4 py-1.5 rounded-md transition-colors">
              Execute
            </button>
            <button
              onClick={() => {
                setSelectMode(false);
                setSelected(new Set());
              }}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:dark:text-gray-200">
              Cancel
            </button>
            <button
              onClick={() => setSelected(new Set(expressions.map((e) => e.id)))}
              className="text-xs text-teal-600 dark:text-teal-400 hover:underline">
              Select all
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-gray-500 dark:text-gray-400 hover:underline">
              Unselect all
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : expressions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-gray-500 gap-3">
              <span className="text-3xl">💬</span>
              <p>No expressions found</p>
              <button
                onClick={() => setShowAddSingle(true)}
                className="text-sm text-teal-600 dark:text-teal-400 hover:underline">
                Add your first expression
              </button>
            </div>
          ) : groupByLabel && grouped ? (
            Array.from(grouped.entries()).map(([label, items]) => (
              <div key={label}>
                <div className="sticky top-0 bg-gray-50 dark:bg-slate-900 px-4 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-slate-700">
                  {label} ({items.length})
                </div>
                {renderRows(items)}
              </div>
            ))
          ) : (
            renderRows(expressions)
          )}
        </div>
      </div>

      {/* Modals */}
      {editTarget && (
        <EditModal
          expression={editTarget}
          labels={labels}
          onSave={(data) => handleEdit(editTarget, data)}
          onClose={() => setEditTarget(null)}
        />
      )}
      {infoTarget && <InfoModal expression={infoTarget} onClose={() => setInfoTarget(null)} />}
      {showAddSingle && (
        <AddSingleModal labels={labels} onSave={handleAddSingle} onClose={() => setShowAddSingle(false)} />
      )}
      {showAddText && (
        <AddFromTextModal
          labels={labels}
          onSave={handleAddFromText}
          onClose={() => setShowAddText(false)}
          mode="text"
        />
      )}
      {showAddFile && (
        <AddFromTextModal
          labels={labels}
          onSave={handleAddFromText}
          onClose={() => setShowAddFile(false)}
          mode="file"
        />
      )}
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SidebarBtn({
  children,
  title,
  active,
  onClick,
}: {
  children: React.ReactNode;
  title?: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`w-8 h-8 rounded-md flex items-center justify-center text-base transition-colors ${
        active
          ? "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400"
          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 hover:dark:bg-slate-700"
      }`}>
      {children}
    </button>
  );
}

function ManagePanel({
  onAddSingle,
  onAddText,
  onAddFile,
  onDeleteMode,
  onExport,
}: {
  onAddSingle: () => void;
  onAddText: () => void;
  onAddFile: () => void;
  onDeleteMode: () => void;
  onExport: () => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Manage</p>
      <div className="space-y-1">
        {[
          { label: "+ Add one", onClick: onAddSingle },
          { label: "+ Add from list", onClick: onAddText },
          { label: "+ Add from file", onClick: onAddFile },
          { label: "✕ Delete mode", onClick: onDeleteMode },
          { label: "↓ Download", onClick: onExport },
        ].map((item) => (
          <button
            key={item.label}
            onClick={item.onClick}
            className="w-full text-left text-sm text-gray-700 dark:text-gray-300 hover:text-teal-600 hover:dark:text-teal-400 py-1 px-2 rounded hover:bg-gray-50 hover:dark:bg-slate-700 transition-colors">
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function LabelsPanel({
  labels,
  newName,
  setNewName,
  onCreate,
  onDelete,
}: {
  labels: Label[];
  newName: string;
  setNewName: (v: string) => void;
  onCreate: (name: string) => void;
  onDelete: (id: number) => void;
}) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newName.trim()) onCreate(newName.trim());
  };

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Labels</p>
      <form onSubmit={handleSubmit} className="flex gap-1 mb-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New label"
          className="flex-1 text-xs px-2 py-1.5 border border-gray-200 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-teal-500"
        />
        <button
          type="submit"
          className="text-xs bg-teal-600 hover:bg-teal-700 text-white px-2 py-1.5 rounded transition-colors">
          +
        </button>
      </form>
      <div className="space-y-1">
        {labels.map((l) => (
          <div key={l.id} className="flex items-center justify-between group">
            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{l.name}</span>
            <button
              onClick={() => onDelete(l.id)}
              className="text-gray-300 dark:text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all text-xs ml-1">
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPanel() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("phrasely_theme") === "dark";
  });
  const [showCounter, setShowCounter] = useState(() => {
    try {
      const s = localStorage.getItem("phrasely_options");
      if (s) return JSON.parse(s).showCountBtns !== false;
    } catch {}
    return true;
  });
  const [queueLimit, setQueueLimit] = useState(() => {
    try {
      const user = useAuthStore.getState().user;
      if (!user?.settings) return 0;
      const s = typeof user.settings === "string" ? JSON.parse(user.settings) : user.settings;
      return s.dailyQueueLimit ?? 0;
    } catch {
      return 0;
    }
  });
  const [queueSaving, setQueueSaving] = useState(false);
  const [queueSaved, setQueueSaved] = useState(false);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("phrasely_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("phrasely_theme", "light");
    }
  };

  const toggleCounter = () => {
    const next = !showCounter;
    setShowCounter(next);
    import("../../shared/utils/settings").then(({ setSettings }) => setSettings("showCountBtns", next));
  };

  const saveQueueLimit = async () => {
    setQueueSaving(true);
    try {
      const updated = await usersApi.updateSettings({ dailyQueueLimit: queueLimit });
      useAuthStore.getState().setUser(updated);
      setQueueSaved(true);
      setTimeout(() => setQueueSaved(false), 2000);
    } catch (_) {
      // ignore
    } finally {
      setQueueSaving(false);
    }
  };

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Settings</p>
      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={darkMode} onChange={toggleDark} className="rounded border-gray-300" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Dark mode</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={showCounter} onChange={toggleCounter} className="rounded border-gray-300" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Show read counter</span>
        </label>
      </div>
      <div className="pt-2 border-t border-gray-100 dark:border-slate-700 mt-3">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 mt-1">
          Learning
        </p>
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1.5">
            Daily queue limit
            <span className="ml-1 text-gray-400 font-normal">(auto-activate per day)</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              value={queueLimit}
              onChange={(e) => setQueueLimit(Number(e.target.value))}
              className="w-16 text-sm px-2 py-1.5 border border-gray-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={saveQueueLimit}
              disabled={queueSaving}
              className="text-xs bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-md transition-colors">
              {queueSaved ? "✓" : queueSaving ? "…" : "Save"}
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">0 = disabled</p>
        </div>
      </div>
    </div>
  );
}
