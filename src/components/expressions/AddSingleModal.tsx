import { useState, FormEvent } from "react";
import type { Label } from "../../types";
import PhraseExpressionField from "./PhraseExpressionField";
import { VoiceInputButton } from "../VoiceInputButton";

interface Props {
  labels: Label[];
  onSave: (data: { expression: string; phrase: string; note: string | null; labelid: number | null }) => void;
  onClose: () => void;
}

export default function AddSingleModal({ labels, onSave, onClose }: Props) {
  const [phrase, setPhrase] = useState("");
  const [expression, setExpression] = useState("");
  const [note, setNote] = useState("");
  const [labelid, setLabelid] = useState<number | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!phrase.trim()) return;
    onSave({
      phrase: phrase.trim(),
      expression: expression.trim(),
      note: note.trim() || null,
      labelid,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Add expression</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:dark:text-gray-200 text-xl leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <PhraseExpressionField
            phrase={phrase}
            expression={expression}
            onPhraseChange={setPhrase}
            onExpressionChange={setExpression}
            autoFocus
            phraseAction={<VoiceInputButton onResult={setPhrase} />}
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Note <span className="text-gray-400 font-normal">(optional tooltip/translation)</span>
              </label>
              <VoiceInputButton onResult={setNote} />
            </div>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="to be exactly right"
              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
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

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md transition-colors">
              Add
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
