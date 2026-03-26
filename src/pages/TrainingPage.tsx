import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { expressionsApi } from "../api/expressions";
import { labelsApi } from "../api/labels";
import { Expression } from "../classes/Expression";
import type { Label } from "../types";
import { addSpanToExpInPrase } from "../utils/texts";
import { getSettings } from "../utils/settings";
import { useAuthStore } from "../store/authStore";
import { useDemoStore } from "../demo/demoStore";
import { useDemoUnread, useDemoLabels } from "../demo/useDemoExpressions";

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
  const [readCount, setReadCount] = useState(0);
  const [celebrated, setCelebrated] = useState(false);

  // TTS
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("Google US English");
  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    const loadVoices = () => {
      const v = synthRef.current.getVoices();
      setVoices(v);
      if (!selectedVoice && v.length) setSelectedVoice(v[0].name);
    };
    loadVoices();
    synthRef.current.onvoiceschanged = loadVoices;
  }, [selectedVoice]);

  useEffect(() => {
    if (!rawList) return;
    const filtered = labelFilter ? rawList.filter((e) => e.labelid === labelFilter) : rawList;
    setList(filtered.map((e) => new Expression(e)));
    setIndex(0);
    setFlipped(false);
  }, [rawList, labelFilter]);

  const current = list[index] ?? null;

  const updateMutation = useMutation({
    mutationFn: (data: import("../types").ExpressionUpdate) => expressionsApi.update(data),
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

  const speak = () => {
    if (!current) return;
    const utterance = new SpeechSynthesisUtterance(current.phrase);
    const voice = voices.find((v) => v.name === selectedVoice);
    if (voice) utterance.voice = voice;
    synthRef.current.cancel();
    synthRef.current.speak(utterance);
  };

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
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">LEFT TO READ:</span>
          <span className="font-bold text-teal-600 dark:text-teal-400 text-lg">{list.length}</span>
        </div>

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

        <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={showCountBtns}
            onChange={(e) => {
              setShowCountBtns(e.target.checked);
              import("../utils/settings").then(({ setSettings }) => setSettings("showCountBtns", e.target.checked));
            }}
            className="rounded border-gray-300"
          />
          Counter
        </label>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-6">
        {/* Card */}
        <div
          className="w-full max-w-2xl cursor-pointer"
          style={{ perspective: "1000px", height: "300px" }}
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
              className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm p-8 flex flex-col justify-center"
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-3 text-center">
                {index + 1} / {list.length}
              </p>
              <div className="text-xl text-gray-900 dark:text-gray-100 text-center leading-relaxed">
                {current &&
                  addSpanToExpInPrase(
                    { expression: current.expression, phrase: current.phrase, note: current.note },
                    undefined,
                    true,
                  )}
              </div>
              {/* {current?.note && (
                <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500 italic">
                  💡 hover the highlight for a hint
                </p>
              )} */}
              {/* {current?.label && (
                <span className="mt-4 self-center text-xs bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 rounded-full px-3 py-0.5">
                  {current.label}
                </span>
              )} */}
              {/* <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-4">Click to flip</p> */}
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm p-8 flex flex-col justify-center overflow-y-auto"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 text-center uppercase tracking-wide">
                Study Plan
              </p>
              <StudyPlanView plan={current?.studyPlan ?? []} />
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

        {/* TTS */}
        <div className="w-full max-w-2xl flex items-center gap-3">
          <button
            onClick={speak}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-9.536a5 5 0 000 7.072M5.343 5.343a9 9 0 0013.314 0M5.343 18.657a9 9 0 0113.314 0"
              />
            </svg>
            Speak
          </button>
          {voices.length > 0 && (
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="text-sm border border-gray-200 dark:border-slate-600 rounded-md px-2 py-1.5 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 flex-1 min-w-0">
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Draggable read counter */}
        {showCountBtns && hintCount > 0 && (
          <CountBtns total={hintCount} count={readCount} setCount={setReadCount} onComplete={markAsRead} />
        )}

        {/* Navigation buttons */}
        <div className="w-full max-w-2xl flex items-center justify-between gap-3">
          <button
            onClick={() => {
              setIndex((v) => v - 1);
              setFlipped(false);
              setReadCount(0);
            }}
            disabled={index === 0}
            className="px-6 py-2 border border-gray-200 dark:border-slate-600 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            ← PREV
          </button>

          <button
            onClick={markAsRead}
            disabled={updateMutation.isPending}
            className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-medium py-2 px-6 rounded-md transition-colors">
            HAS BEEN READ ✓
          </button>

          <button
            onClick={() => {
              setIndex((v) => v + 1);
              setFlipped(false);
              setReadCount(0);
            }}
            disabled={index >= list.length - 1}
            className="px-6 py-2 border border-gray-200 dark:border-slate-600 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            NEXT →
          </button>
        </div>
      </div>

      {/* Celebration overlay */}
      {celebrated && <CelebrationOverlay onClose={() => setCelebrated(false)} />}
    </div>
  );
}

function StudyPlanView({ plan }: { plan: string[] }) {
  return (
    <div className="space-y-1.5">
      {plan.map((row, i) => {
        const isDone = row.includes("✔");
        const isMissed = row.includes("☹");
        const isToday = row.includes(":Today");
        // Parse row: "🟢: Day 1:Mon Jan 01 2024 ✔:Today"
        const parts = row.split(":");
        const icon = parts[0]?.trim();
        const dayPart = parts[1]?.trim();
        const datePart = parts.slice(2, 5).join(":").replace("Today", "").trim();

        return (
          <div
            key={i}
            className={`flex items-center gap-3 px-3 py-1.5 rounded-md text-sm ${
              isToday
                ? "bg-teal-50 dark:bg-teal-900/30 font-semibold text-teal-700 dark:text-teal-400"
                : isDone
                  ? "text-teal-600 dark:text-teal-500"
                  : isMissed
                    ? "text-red-500 dark:text-red-400"
                    : "text-gray-500 dark:text-gray-400"
            }`}>
            <span>{icon}</span>
            <span className="flex-1">{dayPart}</span>
            <span className="text-xs">{datePart}</span>
            {isToday && <span className="text-xs font-bold">TODAY</span>}
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
