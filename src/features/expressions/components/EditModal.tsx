import { useState, FormEvent } from "react";
import { Expression } from "../Expression";
import type { ExpressionData, Label } from "../../../shared/types";
import PhraseExpressionField from "./PhraseExpressionField";
import { VoiceInputButton } from "../../../shared/components/VoiceInputButton";
import PillSelect from "../../../shared/components/PillSelect";
import { addSpanToExpInPrase } from "../texts";

type Tab = "edit" | "info";

interface Props {
  expression: Expression;
  labels: Label[];
  initialTab?: Tab;
  onSave: (data: Partial<ExpressionData> & { id: number }) => void;
  onClose: () => void;
}

function getAllowedStatuses(original: string): string[] {
  if (original === "active") return ["active", "paused"];
  if (original === "paused") return ["paused", "active"];
  if (original === "new") return ["new", "active"];
  return [original]; // 'completed' — no manual change
}

export default function EditModal({ expression, labels, initialTab, onSave, onClose }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab ?? "edit");
  const [phrase, setPhrase] = useState(expression.phrase);
  const [exp, setExp] = useState(expression.expression);
  const [note, setNote] = useState(expression.note ?? "");
  const [status, setStatus] = useState(expression.status);
  const allowedStatuses = getAllowedStatuses(expression.status);
  const [inQueue, setInQueue] = useState(expression.inQueue);
  const [showQueueHint, setShowQueueHint] = useState(false);
  const [labelid, setLabelid] = useState<number | null | undefined>(expression.labelid);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
      id: expression.id,
      phrase,
      expression: exp,
      note: note || null,
      status: status as ExpressionData["status"],
      inQueue,
      labelid,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-stone-300 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-700 shrink-0">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Expression Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:dark:text-gray-200 text-xl leading-none">
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-slate-700 shrink-0">
          {(["edit", "info"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                tab === t
                  ? "border-teal-600 text-teal-600 dark:text-teal-400 dark:border-teal-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}>
              {t === "edit" ? "Edit" : "Info"}
            </button>
          ))}
        </div>

        {/* Content area: height is always driven by the Edit form in normal flow */}
        <div className="relative overflow-hidden">
          {/* Edit form — always in layout (invisible hides visually but keeps height) */}
          <form onSubmit={handleSubmit} className={tab === "info" ? "invisible pointer-events-none" : ""}>
            <div className="p-4 space-y-4">
              <PhraseExpressionField
                phrase={phrase}
                expression={exp}
                onPhraseChange={setPhrase}
                onExpressionChange={setExp}
                phraseAction={<VoiceInputButton onResult={setPhrase} />}
              />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Note</label>
                  <VoiceInputButton onResult={setNote} />
                </div>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Optional hint/translation"
                />
              </div>
            </div>

            <div className="p-4 space-y-3 border-t border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">Status</label>
                <PillSelect
                  value={status}
                  onChange={setStatus}
                  options={allowedStatuses.map((s) => ({ value: s, label: s }))}
                  placeholder="Status"
                  colorScheme="violet"
                  size="md"
                  disabled={allowedStatuses.length === 1}
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0">Label</label>
                <PillSelect
                  value={labelid?.toString() ?? ""}
                  onChange={(v) => setLabelid(v ? Number(v) : null)}
                  options={labels.map((l) => ({ value: l.id.toString(), label: l.name }))}
                  placeholder="No label"
                  colorScheme="amber"
                  size="md"
                  upward
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <label
                    className={`flex items-center gap-2 text-sm cursor-pointer ${status === "active" ? "text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-300"}`}>
                    <input
                      type="checkbox"
                      checked={inQueue}
                      disabled={status === "active"}
                      onChange={(e) => setInQueue(e.target.checked)}
                      className="rounded border-gray-300 accent-teal-600 dark:accent-teal-400 disabled:cursor-not-allowed"
                    />
                    In queue (auto-activate)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowQueueHint((v) => !v)}
                    className="w-4 h-4 rounded-full border border-gray-400 dark:border-slate-500 text-gray-400 dark:text-slate-400 hover:border-teal-500 hover:text-teal-500 dark:hover:border-teal-400 dark:hover:text-teal-400 flex items-center justify-center text-[10px] font-bold leading-none transition-colors flex-shrink-0"
                    aria-label="What is In queue?">
                    ?
                  </button>
                </div>
                {showQueueHint && (
                  <p className="text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-700/60 rounded px-2 py-1.5 leading-snug">
                    Expressions in the queue are activated automatically every day — up to the number you set in app
                    settings. For example, if the limit is 2, each day 2 expressions from the queue will be moved to
                    active and added to your study plan.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
                  Save
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 hover:dark:bg-slate-700 font-medium py-2 px-4 rounded-md transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </form>

          {/* Info panel — absolute overlay, scrolls within the Edit form's space */}
          {tab === "info" && (
            <div className="absolute inset-0 overflow-hidden bg-white dark:bg-slate-800 flex flex-col p-4 gap-3">
              {/* Phrase */}
              <div className="shrink-0">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Phrase</p>
                <p className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed">
                  {addSpanToExpInPrase({
                    expression: expression.expression,
                    phrase: expression.phrase,
                    note: expression.note,
                  })}
                </p>
              </div>

              {/* Two columns: study plan | history */}
              <div className="flex gap-4 flex-1 min-h-0">
                {/* Left: study plan */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1 shrink-0">Study plan</p>
                  <div className="overflow-y-auto flex-1 space-y-0.5">
                    {expression.studyPlan.map((row, i) => {
                      const isDone = row.includes("✔");
                      const isMissed = row.includes("☹");
                      const isToday = row.includes(":Today");
                      const parts = row.split(":");
                      const icon = parts[0]?.trim();
                      const rest = parts.slice(1).join(":").replace(":Today", "").trim();
                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-1.5 text-xs px-1.5 py-0.5 rounded ${
                            isToday
                              ? "bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-medium"
                              : isDone
                                ? "text-teal-600 dark:text-teal-500"
                                : isMissed
                                  ? "text-red-500 dark:text-red-400"
                                  : "text-gray-500 dark:text-gray-400"
                          }`}>
                          <span>{icon}</span>
                          <span className="truncate">{rest}</span>
                          {isToday && <span className="ml-auto text-[10px] font-bold shrink-0">TODAY</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px bg-gray-100 dark:bg-slate-700 shrink-0" />

                {/* Right: history (scrollable) */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1 shrink-0">History</p>
                  {expression.userHistory.length > 0 ? (
                    <div className="overflow-y-auto flex-1 space-y-1">
                      {expression.userHistory.map((entry, i) => (
                        <p key={i} className="text-xs text-gray-500 dark:text-gray-400 font-mono leading-snug">
                          {entry}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-slate-500 italic">No history yet</p>
                  )}
                </div>
              </div>

              {/* Meta */}
              <div className="shrink-0 border-t border-gray-100 dark:border-slate-700 pt-3 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span>
                  Status: <strong className="text-gray-700 dark:text-gray-300">{expression.status}</strong>
                </span>
                <span>
                  Stage: <strong className="text-gray-700 dark:text-gray-300">{expression.stage}</strong>
                </span>
                {expression.inQueue && <span className="text-teal-600 dark:text-teal-400">In queue</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
