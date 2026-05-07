import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expressionsApi } from "./expressionsApi";
import { labelsApi } from "./labelsApi";
import { Expression } from "./Expression";
import type { Label } from "../../shared/types";
import { addSpanToExpInPrase } from "./texts";
import { getSettings } from "../../shared/utils/settings";
import { useAuthStore } from "../auth/authStore";
import { useDemoStore } from "../demo/demoStore";
import { useDemoUnread, useDemoLabels } from "../demo/useDemoExpressions";
import { SpeakButton } from "../../shared/components/SpeakButton";

export default function TrainingPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const offset = new Date().getTimezoneOffset() * 60 * 1000 * -1;
  const isDemo = useAuthStore((s) => s.isDemo);
  const demoStore = useDemoStore();

  // ── real data (disabled in demo mode) ────────────────────────
  const { data: rawListReal, isLoading: loadingReal } = useQuery({
    queryKey: ["unread"],
    queryFn: () => expressionsApi.getUnread(offset),
    enabled: !isDemo,
  });

  const { data: labelsReal } = useQuery({
    queryKey: ["labels"],
    queryFn: labelsApi.getAll,
    enabled: !isDemo,
  });

  // ── demo data ────────────────────────────────────────────────
  const { data: rawListDemo, isLoading: loadingDemo } = useDemoUnread();
  const { data: labelsDemo } = useDemoLabels();

  // ── merge ────────────────────────────────────────────────────
  const rawList = isDemo ? rawListDemo : rawListReal;
  const labels = isDemo ? labelsDemo : labelsReal;
  const isLoading = isDemo ? loadingDemo : loadingReal;

  const [list, setList] = useState<Expression[]>([]);

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [labelFilter, setLabelFilter] = useState<number | null>(null);
  const [showCountBtns, setShowCountBtns] = useState(() => getSettings<boolean>("showCountBtns", true) ?? true);
  const [showSettings, setShowSettings] = useState(false);
  const [readCount, setReadCount] = useState(0);
  const [celebrated, setCelebrated] = useState(false);

  useEffect(() => {
    if (!rawList) return;
    const filtered = labelFilter ? rawList.filter((e) => e.labelid === labelFilter) : rawList;
    const exprs = filtered.map((e) => new Expression(e));
    setList(exprs);
    setIndex(0);
    setFlipped(false);
  }, [rawList, labelFilter]);

  const current = list[index] ?? null;

  const updateMutation = useMutation({
    mutationFn: (data: import("../../shared/types").ExpressionUpdate) => expressionsApi.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expressions"] });
    },
  });

  const markAsRead = useCallback(() => {
    if (!current) return;
    const updates = current.setForUpdate;
    const isFinished = updates.stage === 9;
    if (isFinished) setCelebrated(true);

    if (isDemo) {
      demoStore.updateExpression(updates);
    } else {
      updateMutation.mutate(updates);
    }

    setList((prev) => prev.filter((_, i) => i !== index));
    setIndex((prev) => Math.min(prev, list.length - 2));
    setFlipped(false);
    setReadCount(0);
  }, [current, index, list.length, isDemo, demoStore, updateMutation]);

  // hint read count from expression
  const hintCount = current?.hintForReading[2] ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-3.5rem)] gap-6 px-4">
        <div className="text-6xl">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">All done for today!</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center">
          You have read all your expressions for today. Come back tomorrow!
        </p>
        <button
          onClick={() => navigate("/expressions")}
          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-md transition-colors">
          Go to Expressions
        </button>
      </div>
    );
  }

  const hint = current?.hintForReading;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        {labels && labels.length > 0 && (
          <select
            value={labelFilter ?? ""}
            onChange={(e) => setLabelFilter(e.target.value ? Number(e.target.value) : null)}
            className="text-sm border border-gray-200 dark:border-slate-600 rounded-md px-2 py-1 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300">
            <option value="">All labels</option>
            {labels.map((l: Label) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            <span className="sm:hidden">LEFT:</span>
            <span className="hidden sm:inline">LEFT TO READ:</span>
          </span>
          <span className="font-bold text-teal-600 dark:text-teal-400 text-lg">{list.length}</span>
        </div>

        <div className="flex items-center gap-1">
          <SpeakButton text={current?.phrase ?? ""} />

          <button
            onClick={() => setShowSettings((v) => !v)}
            className={`sm:hidden p-1.5 rounded-md transition-colors ${showSettings ? "bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 hover:dark:text-gray-300"}`}
            title="Settings">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Settings panel — always visible on desktop, toggled on mobile */}
      <div
        className={`bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700 px-4 py-2 flex-wrap justify-between items-center gap-4 ${showSettings ? "flex" : "hidden sm:flex"}`}>
        <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showCountBtns}
            onChange={(e) => {
              setShowCountBtns(e.target.checked);
              import("../../shared/utils/settings").then(({ setSettings }) => setSettings("showCountBtns", e.target.checked));
            }}
            className="rounded border-gray-300"
          />
          Counter
        </label>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto px-4 py-3 sm:py-8 gap-3 sm:gap-6 pb-20 sm:pb-8">
        {/* Card */}
        <div
          className="w-full max-w-2xl cursor-pointer"
          style={{ perspective: "1000px", height: "clamp(180px, 40vh, 300px)" }}
          onClick={() => setFlipped((v) => !v)}>
          <div
            className="relative w-full h-full"
            style={{
              transformStyle: "preserve-3d",
              WebkitTransformStyle: "preserve-3d",
              transition: "transform 0.6s ease",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}>
            {/* Front */}
            <div
              className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm p-4 sm:p-8 flex flex-col justify-center"
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-3 text-center">
                {index + 1} / {list.length}
              </p>
              <div className="text-xl text-gray-900 dark:text-gray-100 text-center leading-relaxed select-none">
                {current &&
                  addSpanToExpInPrase(
                    { expression: current.expression, phrase: current.phrase, note: current.note },
                    undefined,
                    true,
                  )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFlipped(true);
                }}
                className="absolute bottom-3 right-3 text-gray-300 dark:text-slate-600 hover:text-gray-400 hover:dark:text-slate-500 transition-colors"
                title="Show study plan">
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round">
                  <path d="M1 4v6h6" />
                  <path d="M23 20v-6h-6" />
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
                </svg>
              </button>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm p-4 sm:p-8 flex flex-col justify-center overflow-y-auto"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 text-center uppercase tracking-wide">
                Study Plan
              </p>
              <StudyPlanView plan={current?.studyPlan ?? []} />
              {current?.label && (
                <div className="mt-4 flex justify-center">
                  <span className="text-xs bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 rounded-full px-3 py-0.5">
                    {current.label}
                  </span>
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFlipped(false);
                }}
                className="absolute bottom-3 right-3 text-gray-300 dark:text-slate-600 hover:text-gray-400 hover:dark:text-slate-500 transition-colors"
                title="Back to phrase">
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Hint bar */}
        {hint && (
          <div
            className={`w-full max-w-2xl flex items-center justify-between px-4 py-2 rounded-md text-sm ${
              hint[1]
                ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                : "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400"
            }`}>
            <span>{hint[0]}</span>
            {hintCount > 0 && (
              <div className="flex gap-1">
                {Array.from({ length: hintCount }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-3 h-3 rounded-full border-2 ${
                      i < readCount ? "bg-teal-500 border-teal-500" : "border-teal-400 dark:border-teal-600"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Draggable read counter */}
        {showCountBtns && hintCount > 0 && (
          <CountBtns total={hintCount} count={readCount} setCount={setReadCount} onComplete={markAsRead} />
        )}

        {/* Navigation buttons */}
        <div className="fixed bottom-0 left-0 right-0 z-30 sm:static sm:w-full sm:max-w-2xl bg-white dark:bg-slate-800 sm:bg-transparent border-t border-gray-200 dark:border-slate-700 sm:border-0 px-4 py-3 sm:p-0">
          <div className="w-full max-w-2xl mx-auto sm:max-w-none flex items-center justify-between gap-3">
            <button
              onClick={() => {
                setIndex((v) => v - 1);
                setFlipped(false);
                setReadCount(0);
              }}
              disabled={index === 0}
              className="flex px-6 py-3 sm:py-2 border border-gray-200 dark:border-slate-600 rounded-md text-base sm:text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 hover:dark:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M11 5L2 12l9 7v-4h11V9H11V5z"></path>
              </svg>
              <span className="hidden sm:inline"> PREV</span>
            </button>

            <button
              onClick={markAsRead}
              disabled={updateMutation.isPending}
              className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold py-2 px-0 text-base sm:text-sm rounded-md transition-colors">
              DONE ✓
            </button>

            <button
              onClick={() => {
                setIndex((v) => v + 1);
                setFlipped(false);
                setReadCount(0);
              }}
              disabled={index >= list.length - 1}
              className="flex px-6 py-3 sm:py-2 border border-gray-200 dark:border-slate-600 rounded-md text-base sm:text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 hover:dark:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <span className="hidden sm:inline">NEXT </span>{" "}
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="scale-x-[-1]">
                <path d="M11 5L2 12l9 7v-4h11V9H11V5z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Celebration overlay */}
      {celebrated && <CelebrationOverlay onClose={() => setCelebrated(false)} />}
    </div>
  );
}

function StudyPlanView({ plan }: { plan: string[] }) {
  return (
    <div className="flex sm:gap-1 overflow-x-auto pb-1 justify-center">
      {plan.map((row, i) => {
        const isDone = row.includes("✔");
        const isMissed = row.includes("☹");
        const isToday = row.includes(":Today");
        // Parse row: "🟢: Day 1:Mon Jan 01 2024 ✔:Today"
        const parts = row.split(":");
        const icon = parts[0]?.trim();
        const dayLabel = parts[1]?.trim() ?? "";
        const dateStr = (parts[2] ?? "").replace(/[✔☹]/g, "").trim();
        // dateStr is like "Mon Jan 01 2024"
        const dp = dateStr.split(" ");
        const weekday = dp[0] ?? "";
        const month = dp[1] ?? "";
        const day = dp[2] ? String(parseInt(dp[2], 10)) : "";

        return (
          <div
            key={i}
            className={`flex flex-col items-center gap-0.5 pr-2 sm:px-2 py-2 rounded-lg text-center text-xs transition-colors ${
              isToday
                ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-semibold"
                : isDone
                  ? "text-teal-600 dark:text-teal-500"
                  : isMissed
                    ? "text-red-500 dark:text-red-400"
                    : "text-gray-400 dark:text-gray-500"
            }`}>
            <span className="text-sm leading-none">{icon}</span>
            <span className="whitespace-normal sm:whitespace-nowrap">{dayLabel}</span>
            <span>{weekday}</span>
            <span>{month}</span>
            <span>{day}</span>
          </div>
        );
      })}
    </div>
  );
}

function CountBtns({
  total,
  count,
  setCount,
  onComplete,
}: {
  total: number;
  count: number;
  setCount: (n: number) => void;
  onComplete: () => void;
}) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPos({
      x: dragStart.current.px + e.clientX - dragStart.current.mx,
      y: dragStart.current.py + e.clientY - dragStart.current.my,
    });
  };

  const handleMouseUp = () => setDragging(false);

  const decrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = count + 1;
    setCount(next);
    if (next >= total) onComplete();
  };

  const remaining = total - count;

  return (
    <div
      className="fixed bottom-20 right-6 z-30 bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 px-5 py-4 cursor-move select-none"
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}>
      <div className="text-3xl font-bold text-teal-600 dark:text-teal-400 text-center">{remaining}</div>
      <button
        onMouseDown={(e) => e.stopPropagation()}
        onClick={decrement}
        disabled={remaining <= 0}
        className="mt-2 w-12 h-12 rounded-full bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-xl flex items-center justify-center mx-auto transition-colors">
        −
      </button>
    </div>
  );
}

function CelebrationOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-xl p-10 text-center shadow-xl max-w-sm mx-4"
        onClick={(e) => e.stopPropagation()}>
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Stage 9 complete!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          You have completed the full study cycle for this expression. Congratulations!
        </p>
        <button
          onClick={onClose}
          className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-md transition-colors">
          Continue
        </button>
      </div>
    </div>
  );
}
