import { useState, useMemo, FormEvent, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expressionsApi } from "./expressionsApi";
import { labelsApi } from "./labelsApi";
import { usersApi } from "../auth/usersApi";
import { Expression } from "./Expression";
import type { ExpressionData, Label } from "../../shared/types";
import ExpressionRow from "./components/ExpressionRow";
import ExpressionCard from "./components/ExpressionCard";
import EditModal from "./components/EditModal";
import AddFromTextModal from "./components/AddFromTextModal";
import AddSingleModal from "./components/AddSingleModal";
import { useAuthStore } from "../auth/authStore";
import { useDemoStore } from "../demo/demoStore";
import { useDemoExpressions, useDemoLabels } from "../demo/useDemoExpressions";
import ConfirmDialog from "../../shared/components/ConfirmDialog";
import PillSelect from "../../shared/components/PillSelect";
import { useConfirm } from "../../shared/hooks/useConfirm";
import { useMobileNavStore } from "../../shared/mobileNavStore";
import { IoGridOutline } from "react-icons/io5";
import { CiGrid2H } from "react-icons/ci";
import { PiTreeViewBold } from "react-icons/pi";
import { VscListTree } from "react-icons/vsc";
import { LuCopyCheck } from "react-icons/lu";

type Panel = "manage" | null;

export default function ExpressionsPage() {
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
  const [desktopTab, setDesktopTab] = useState<"expressions" | "labels">("expressions");
  const [groupByLabel, setGroupByLabel] = useState(false);
  const [filterLabel, setFilterLabel] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterStage, setFilterStage] = useState("");
  const [filterInQueue, setFilterInQueue] = useState(false);
  const filterText = useMobileNavStore((s) => s.filterText);
  const [editTarget, setEditTarget] = useState<Expression | null>(null);
  const [editInitialTab, setEditInitialTab] = useState<"edit" | "info">("edit");
  const [showAddSingle, setShowAddSingle] = useState(false);
  const [showAddText, setShowAddText] = useState(false);
  const [showAddFile, setShowAddFile] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [batchAction, setBatchAction] = useState<"" | "delete" | "label" | "status" | "queue" | "download">("");
  const [batchLabel, setBatchLabel] = useState<number | null>(null);
  const [batchStatus, setBatchStatus] = useState("active");
  const [batchQueueAction, setBatchQueueAction] = useState<"add" | "remove">("add");
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");

  // ── mobile-specific state ─────────────────────────────────────
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [showMobileLabels, setShowMobileLabels] = useState(false);

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

  // ── mobile nav store registration ─────────────────────────────
  const setExpressionsActions = useMobileNavStore((s) => s.setExpressionsActions);
  const clearExpressionsActions = useMobileNavStore((s) => s.clearExpressionsActions);
  const setSelectBar = useMobileNavStore((s) => s.setSelectBar);
  const rawExpressionsRef = useRef(rawExpressions);
  rawExpressionsRef.current = rawExpressions;
  const executeBatchActionRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const expressionsForSelectRef = useRef<import("./Expression").Expression[]>([]);

  const stableExport = useCallback(() => {
    const lines = rawExpressionsRef.current.map((e) => `${e.expression}; ${e.phrase}`).join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "phrasely-export.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    setExpressionsActions({
      onAddSingle: () => setShowAddSingle(true),
      onAddText: () => setShowAddText(true),
      onAddFile: () => setShowAddFile(true),
      onDeleteMode: () => {
        setSelectMode(true);
        setBatchAction("delete");
      },
      onExport: stableExport,
      onOpenLabels: () => setShowMobileLabels(true),
      onOpenSettings: () => setShowMobileSettings(true),
    });
    return () => {
      clearExpressionsActions();
      setSelectBar(null);
    };
  }, [stableExport, setExpressionsActions, clearExpressionsActions, setSelectBar]);

  useEffect(() => {
    if (!selectMode) {
      setSelectBar(null);
      return;
    }
    setSelectBar({
      selectedCount: selected.size,
      batchAction,
      batchLabel,
      batchStatus,
      batchQueueAction,
      labels,
      onCancel: () => {
        setSelectMode(false);
        setSelected(new Set());
      },
      onSelectAll: () => setSelected(new Set(expressionsForSelectRef.current.map((e) => e.id))),
      onUnselectAll: () => setSelected(new Set()),
      onExecute: () => executeBatchActionRef.current(),
      onChangeBatchAction: (a) => setBatchAction(a),
      onChangeBatchLabel: setBatchLabel,
      onChangeBatchStatus: setBatchStatus,
      onChangeBatchQueueAction: setBatchQueueAction,
    });
  }, [selectMode, selected.size, batchAction, batchLabel, batchStatus, batchQueueAction, labels, setSelectBar]);

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

  expressionsForSelectRef.current = expressions;

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
  executeBatchActionRef.current = executeBatchAction;

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
    viewMode === "cards" ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-3">
        {list.map((exp) => (
          <ExpressionCard
            key={exp.id}
            expression={exp}
            labels={labels}
            selected={selected.has(exp.id)}
            selectMode={selectMode}
            onToggleSelect={() => toggleSelect(exp.id)}
            onClick={() => {
              setEditInitialTab("edit");
              setEditTarget(exp);
            }}
            onInfoClick={() => {
              setEditInitialTab("info");
              setEditTarget(exp);
            }}
            onDelete={() => handleDelete(exp.id)}
            onLabelChange={(lid) => handleLabelChange(exp, lid)}
          />
        ))}
      </div>
    ) : (
      list.map((exp) => (
        <ExpressionRow
          key={exp.id}
          expression={exp}
          labels={labels}
          selected={selected.has(exp.id)}
          selectMode={selectMode}
          onToggleSelect={() => toggleSelect(exp.id)}
          onClick={() => {
            setEditInitialTab("edit");
            setEditTarget(exp);
          }}
          onInfoClick={() => {
            setEditInitialTab("info");
            setEditTarget(exp);
          }}
          onDelete={() => handleDelete(exp.id)}
          onLabelChange={(lid) => handleLabelChange(exp, lid)}
        />
      ))
    );

  return (
    <div className="flex max-w-7xl mx-auto sm:px-10">
      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop micro-navigation */}
        <div className="hidden sm:flex items-center bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-2 sticky top-14 z-30">
          <button
            onClick={() => setDesktopTab("expressions")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              desktopTab === "expressions"
                ? "border-teal-500 text-teal-600 dark:text-teal-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}>
            Expressions
            <span
              className={`text-xs font-normal ${desktopTab === "expressions" ? "text-teal-400 dark:text-teal-500" : "text-gray-400 dark:text-gray-500"}`}>
              {rawExpressions.length}
            </span>
          </button>
          <button
            onClick={() => setDesktopTab("labels")}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              desktopTab === "labels"
                ? "border-teal-500 text-teal-600 dark:text-teal-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3.5 h-3.5">
              <path d="M20 12l-8 8-8-8V4h8l8 8z" />
              <circle cx="9" cy="9" r="1.5" />
            </svg>
            Labels
          </button>
        </div>

        {/* Desktop Labels view */}
        {desktopTab === "labels" && (
          <div className="hidden sm:block flex-1 overflow-y-auto p-5">
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
          </div>
        )}

        {/* Expressions content — desktop: expressions tab only; mobile: always */}
        <div className={`${desktopTab === "labels" ? "sm:hidden" : ""} flex-1 flex flex-col min-w-0`}>
          {/* Filter bar + batch action bar — sticky below navbar (mobile) and below micro-nav (desktop) */}
          <div className="sticky top-14 sm:top-[6.3rem] z-20">
            <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-3 py-2">
              {/* Row 1 — always visible */}
              <div className="flex items-center gap-2">
                {/* Mobile select mode: compact cancel/count/all header */}
                {selectMode && (
                  <div className="sm:hidden flex items-center w-full">
                    <button
                      onClick={() => {
                        setSelectMode(false);
                        setSelected(new Set());
                      }}
                      className="text-sm text-gray-500 dark:text-gray-400 px-2.5 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                      Cancel
                    </button>
                    <span className="flex-1 text-center text-sm font-medium text-teal-700 dark:text-teal-400">
                      {selected.size} selected
                    </span>
                    <button
                      onClick={() => setSelected(new Set(expressionsForSelectRef.current.map((e) => e.id)))}
                      className="text-sm text-teal-600 dark:text-teal-400 px-2.5 py-1.5 rounded-md hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors">
                      All
                    </button>
                    <button
                      onClick={() => setSelected(new Set())}
                      className="text-sm text-teal-600 dark:text-teal-400 px-2.5 py-1.5 rounded-md hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors">
                      NONE
                    </button>
                  </div>
                )}
                {/* Normal filter bar: desktop always, mobile only when not in select mode */}
                <div className={`${selectMode ? "hidden sm:flex" : "flex"} items-center gap-2 w-full`}>
                  {/* Desktop left side: filters OR select mode batch controls */}
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    {selectMode ? (
                      <>
                        <span className="text-sm font-medium text-teal-700 dark:text-teal-400 shrink-0">
                          {selected.size} selected
                        </span>
                        <PillSelect
                          value={batchAction}
                          onChange={(v) => setBatchAction(v as typeof batchAction)}
                          options={[
                            { value: "delete", label: "Delete" },
                            { value: "label", label: "Assign label" },
                            { value: "status", label: "Set status" },
                            { value: "queue", label: "Queue manage" },
                            { value: "download", label: "Download" },
                          ]}
                          placeholder="Action"
                          colorScheme="teal"
                        />
                        {batchAction === "queue" && (
                          <PillSelect
                            value={batchQueueAction}
                            onChange={(v) => setBatchQueueAction(v as "add" | "remove")}
                            options={[
                              { value: "add", label: "Add to queue" },
                              { value: "remove", label: "Remove from queue" },
                            ]}
                            placeholder="Queue action"
                            colorScheme="blue"
                          />
                        )}
                        {batchAction === "label" && (
                          <PillSelect
                            value={batchLabel?.toString() ?? ""}
                            onChange={(v) => setBatchLabel(v ? Number(v) : null)}
                            options={labels.map((l: Label) => ({ value: l.id.toString(), label: l.name }))}
                            placeholder="No label"
                            colorScheme="amber"
                          />
                        )}
                        {batchAction === "status" && (
                          <PillSelect
                            value={batchStatus}
                            onChange={setBatchStatus}
                            options={["new", "active", "paused", "completed"].map((s) => ({ value: s, label: s }))}
                            placeholder="Status"
                            colorScheme="violet"
                          />
                        )}
                        <button
                          onClick={executeBatchAction}
                          disabled={selected.size === 0}
                          className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs px-4 py-1.5 rounded-md transition-colors">
                          Execute
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Split button: group | view mode */}
                        <div className="inline-flex shrink-0 border border-gray-200 dark:border-slate-600 rounded-md overflow-hidden">
                          <button
                            onClick={() => setGroupByLabel((v) => !v)}
                            title={groupByLabel ? "Flat list" : "Group by label"}
                            className={`p-1.5 border-r border-gray-200 dark:border-slate-600 transition-colors ${
                              groupByLabel
                                ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400"
                                : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 hover:dark:bg-slate-700"
                            }`}>
                            {groupByLabel ? (
                              <PiTreeViewBold className="w-4 h-4" />
                            ) : (
                              <VscListTree className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => setViewMode((v) => (v === "list" ? "cards" : "list"))}
                            title={viewMode === "list" ? "Card view" : "List view"}
                            className={`p-1.5 transition-colors ${
                              viewMode === "cards"
                                ? "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400"
                                : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 hover:dark:bg-slate-700"
                            }`}>
                            {viewMode === "list" ? (
                              <IoGridOutline className="w-4 h-4" />
                            ) : (
                              <CiGrid2H className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <PillSelect
                          value={filterLabel}
                          onChange={setFilterLabel}
                          placeholder="All labels"
                          colorScheme="violet"
                          options={labels.map((l: Label) => ({ value: String(l.id), label: l.name }))}
                        />
                        <PillSelect
                          value={filterStatus}
                          onChange={setFilterStatus}
                          placeholder="All statuses"
                          colorScheme="amber"
                          options={["new", "active", "paused", "completed"].map((s) => ({ value: s, label: s }))}
                        />
                        <PillSelect
                          value={filterStage}
                          onChange={setFilterStage}
                          placeholder="All stages"
                          colorScheme="blue"
                          options={Array.from({ length: 10 }, (_, i) => ({ value: String(i), label: `Stage ${i}` }))}
                        />
                        <button
                          onClick={() => setFilterInQueue((v) => !v)}
                          className={`text-xs rounded-full px-3 py-1 border transition-colors ${
                            filterInQueue
                              ? "bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-400"
                              : "bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400"
                          }`}>
                          In queue
                        </button>
                        {(filterLabel || filterStatus || filterStage || filterInQueue) && (
                          <button
                            onClick={() => {
                              setFilterLabel("");
                              setFilterStatus("");
                              setFilterStage("");
                              setFilterInQueue(false);
                            }}
                            className="text-xs rounded-full px-3 py-1 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                            Clear filters
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  <div className="hidden sm:block flex-1" />

                  {/* Mobile filter pills — horizontal scroll, single row */}
                  <div className="sm:hidden flex-1 flex items-center gap-2 overflow-x-auto">
                    <PillSelect
                      value={filterLabel}
                      onChange={setFilterLabel}
                      placeholder="Labels"
                      colorScheme="violet"
                      options={labels.map((l: Label) => ({ value: String(l.id), label: l.name }))}
                    />
                    <PillSelect
                      value={filterStatus}
                      onChange={setFilterStatus}
                      placeholder="Status"
                      colorScheme="amber"
                      options={["new", "active", "paused", "completed"].map((s) => ({ value: s, label: s }))}
                    />
                    <PillSelect
                      value={filterStage}
                      onChange={setFilterStage}
                      placeholder="Stage"
                      colorScheme="blue"
                      options={Array.from({ length: 10 }, (_, i) => ({ value: String(i), label: `Stage ${i}` }))}
                    />
                    <button
                      onClick={() => setFilterInQueue((v) => !v)}
                      className={`shrink-0 text-xs rounded-full px-3 py-1 border transition-colors ${
                        filterInQueue
                          ? "bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-400"
                          : "bg-gray-100 dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400"
                      }`}>
                      In queue
                    </button>
                    {(filterLabel || filterStatus || filterStage || filterInQueue) && (
                      <button
                        onClick={() => {
                          setFilterLabel("");
                          setFilterStatus("");
                          setFilterStage("");
                          setFilterInQueue(false);
                        }}
                        className="shrink-0 text-xs rounded-full px-3 py-1 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                        Clear
                      </button>
                    )}
                  </div>

                  <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{expressions.length}</span>

                  {/* Action group */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Select toggle — mobile always, desktop only when not in select mode */}
                    <button
                      onClick={() => {
                        setSelectMode((v) => {
                          if (!v) setBatchAction("");
                          return !v;
                        });
                        setSelected(new Set());
                      }}
                      className={`sm:hidden p-1.5 rounded-md border transition-colors ${
                        selectMode
                          ? "bg-teal-50 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-400"
                          : "border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 hover:dark:bg-slate-700"
                      }`}>
                      <LuCopyCheck className="w-4 h-4" />
                    </button>
                    {!selectMode && (
                      <button
                        onClick={() => {
                          setSelectMode(true);
                          setSelected(new Set());
                        }}
                        className="hidden sm:flex p-1.5 rounded-md border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 hover:dark:bg-slate-700 transition-colors">
                        <LuCopyCheck className="w-4 h-4" />
                      </button>
                    )}

                    {/* Desktop: Add + Manage — hidden in select mode */}
                    {!selectMode && (
                      <>
                        <button
                          title="Add expression"
                          onClick={() => setShowAddSingle(true)}
                          className="hidden sm:flex items-center justify-center p-1.5 rounded-md border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 hover:dark:bg-slate-700 transition-colors">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-4 h-4">
                            <path d="M12 6v12M6 12h12" />
                          </svg>
                        </button>
                        <div className="relative hidden sm:flex">
                          <button
                            title="Manage"
                            onClick={() => togglePanel("manage")}
                            className={`flex items-center justify-center p-1.5 rounded-md border transition-colors text-sm font-medium ${
                              activePanel === "manage"
                                ? "bg-teal-50 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-400"
                                : "border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 hover:dark:bg-slate-700"
                            }`}>
                            ⋯
                          </button>
                          {activePanel === "manage" && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActivePanel(null)} />
                              <div className="absolute right-0 top-full mt-1 z-20 w-52 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                                <ManagePanel
                                  onAddSingle={() => {
                                    setShowAddSingle(true);
                                    setActivePanel(null);
                                  }}
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
                                  onExport={() => {
                                    exportTxt();
                                    setActivePanel(null);
                                  }}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </>
                    )}

                    {/* Desktop: Cancel + Select all + Unselect all — only in select mode */}
                    {selectMode && (
                      <>
                        <button
                          onClick={() => setSelected(new Set(expressions.map((e) => e.id)))}
                          className="hidden sm:block text-xs text-teal-600 dark:text-teal-400 hover:underline px-1">
                          Select all
                        </button>
                        <button
                          onClick={() => setSelected(new Set())}
                          className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 hover:underline px-1">
                          Unselect all
                        </button>
                        <button
                          onClick={() => {
                            setSelectMode(false);
                            setSelected(new Set());
                          }}
                          className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:dark:text-gray-200 px-1">
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* /sticky header wrapper */}

          {/* List */}
          <div
            className={` sm:pb-0 ${selectMode && (batchAction === "label" || batchAction === "status" || batchAction === "queue") ? "pb-28" : "pb-16"}`}>
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
                  <div className="sticky top-0 bg-zinc-300 dark:bg-slate-900 px-4 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-slate-700">
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
      </div>

      {/* Modals */}
      {editTarget && (
        <EditModal
          expression={editTarget}
          labels={labels}
          initialTab={editInitialTab}
          onSave={(data) => handleEdit(editTarget, data)}
          onClose={() => setEditTarget(null)}
        />
      )}
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

      {/* ── Mobile FAB — Add expression ────────────────────────── */}
      {!selectMode && (
        <button
          onClick={() => setShowAddSingle(true)}
          className="sm:hidden fixed bottom-20 right-4 z-30 w-14 h-14 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6">
            <path d="M12 6v12M6 12h12" />
          </svg>
        </button>
      )}

      {/* ── Mobile Settings modal ─────────────────────────────── */}
      {showMobileSettings && (
        <div className="sm:hidden fixed inset-0 z-[60] bg-white dark:bg-slate-900 flex flex-col">
          <div className="flex items-center h-14 px-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
            <button
              onClick={() => setShowMobileSettings(false)}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h2 className="text-base font-semibold ml-4 text-gray-900 dark:text-gray-100">Settings</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <SettingsPanel />
          </div>
        </div>
      )}

      {/* ── Mobile Labels modal ───────────────────────────────── */}
      {showMobileLabels && (
        <div className="sm:hidden fixed inset-0 z-[60] bg-white dark:bg-slate-900 flex flex-col">
          <div className="flex items-center h-14 px-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
            <button
              onClick={() => setShowMobileLabels(false)}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h2 className="text-base font-semibold ml-4 text-gray-900 dark:text-gray-100">Labels</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
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
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

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
    <div className="py-1">
      {[
        {
          label: "Add one",
          onClick: onAddSingle,
          icon: (
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M12 6v12M6 12h12" />
            </svg>
          ),
        },
        {
          label: "Add from list",
          onClick: onAddText,
          icon: (
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          ),
        },
        {
          label: "Add from file",
          onClick: onAddFile,
          icon: (
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          ),
        },
        {
          label: "Download",
          onClick: onExport,
          icon: (
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          ),
        },
      ].map((item) => (
        <button
          key={item.label}
          onClick={item.onClick}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
          <span className="text-gray-400 dark:text-gray-500 shrink-0">{item.icon}</span>
          {item.label}
        </button>
      ))}
      <div className="my-1 mx-2 border-t border-gray-100 dark:border-slate-700" />
      <button
        onClick={onDeleteMode}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
        <span className="shrink-0">
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </span>
        Delete mode
      </button>
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
      {/* <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Labels</p> */}
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
      <div className="space-y-0.5">
        {labels.map((l) => (
          <div
            key={l.id}
            className="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
            <button
              onClick={() => onDelete(l.id)}
              className="shrink-0 w-4 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all p-0.5 rounded flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                width="13"
                height="13"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
            <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{l.name}</span>
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
      return s.phrases?.dailyQueueLimit ?? 0;
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
      const updated = await usersApi.updateSettings({ phrases: { dailyQueueLimit: queueLimit } });
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
          <input
            type="checkbox"
            checked={darkMode}
            onChange={toggleDark}
            className="rounded border-gray-300 accent-teal-600 dark:accent-teal-400"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Dark mode</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showCounter}
            onChange={toggleCounter}
            className="rounded border-gray-300 accent-teal-600 dark:accent-teal-400"
          />
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
