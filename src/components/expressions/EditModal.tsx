import { useState, FormEvent } from "react";
import { Expression } from "../../classes/Expression";
import type { ExpressionData, Label } from "../../types";
import PhraseExpressionField from "./PhraseExpressionField";
import { VoiceInputButton } from "../VoiceInputButton";
interface Props {
  expression: Expression;
  labels: Label[];
  onSave: (data: Partial<ExpressionData> & { id: number }) => void;
  onClose: () => void;
}

function getAllowedStatuses(original: string): string[] {
  if (original === "active") return ["active", "paused"];
  if (original === "paused") return ["paused", "active"];
  if (original === "new") return ["new", "active"];
  return [original]; // 'completed' — no manual change
}

export default function EditModal({ expression, labels, onSave, onClose }: Props) {
  const [phrase, setPhrase] = useState(expression.phrase);
  const [exp, setExp] = useState(expression.expression);
  const [note, setNote] = useState(expression.note ?? "");
  const [status, setStatus] = useState(expression.status);
  const allowedStatuses = getAllowedStatuses(expression.status);
  const [inQueue, setInQueue] = useState(expression.inQueue);
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Edit expression</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:dark:text-gray-200 text-xl leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <PhraseExpressionField
            phrase={phrase}
            expression={exp}
            onPhraseChange={setPhrase}
            onExpressionChange={setExp}
            phraseAction={<VoiceInputButton onResult={setPhrase} />}
          />
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Note (tooltip)</label>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={allowedStatuses.length === 1}
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-60 disabled:cursor-not-allowed">
                {allowedStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Label</label>
              <select
                value={labelid ?? ""}
                onChange={(e) => setLabelid(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">No label</option>
                {labels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label
            className={`flex items-center gap-2 text-sm cursor-pointer ${status === "active" ? "text-gray-400 dark:text-gray-500" : "text-gray-700 dark:text-gray-300"}`}>
            <input
              type="checkbox"
              checked={inQueue}
              disabled={status === "active"}
              onChange={(e) => setInQueue(e.target.checked)}
              className="rounded border-gray-300 disabled:cursor-not-allowed"
            />
            In queue (auto-activate)
          </label>

          {/* Compact study plan */}
          {expression.studyPlan.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Study plan
              </p>
              <div className="flex gap-1 flex-wrap">
                {expression.studyPlan.map((row, i) => {
                  const isDone = row.includes("✔");
                  const isMissed = row.includes("☹");
                  const isToday = row.includes(":Today");
                  void (isDone ? "✔" : isMissed ? "✗" : "○");
                  return (
                    <span
                      key={i}
                      title={row.split(":").slice(1).join(":")}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 ${
                        isToday
                          ? "border-teal-500 bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-400"
                          : isDone
                            ? "border-teal-400 bg-teal-50 dark:bg-teal-900/20 text-teal-600"
                            : isMissed
                              ? "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-500"
                              : "border-gray-300 dark:border-slate-600 text-gray-400"
                      }`}>
                      {i + 1}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
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
        </form>
      </div>
    </div>
  );
}
