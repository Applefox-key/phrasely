import { Expression } from "../Expression";
import type { Label } from "../../../shared/types";
import { addSpanToExpInPrase } from "../texts";
import PillSelect from "../../../shared/components/PillSelect";
import StageProgressBar from "./StageProgressBar";

interface Props {
  expression: Expression;
  labels: Label[];
  selected?: boolean;
  selectMode?: boolean;
  onToggleSelect?: () => void;
  onClick: () => void;
  onInfoClick: () => void;
  onDelete: () => void;
  onLabelChange: (labelid: number | null) => void;
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300",
  active: "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400",
  paused: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  completed: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
};

export default function ExpressionCard({
  expression,
  labels,
  selected,
  selectMode,
  onToggleSelect,
  onClick,
  onInfoClick,
  onDelete,
  onLabelChange,
}: Props) {
  const stage = expression.stage;
  const skips = expression.exceededSkipsDays;

  return (
    <div
      className={`relative rounded-xl border flex flex-col gap-2 p-3 transition-colors group cursor-pointer ${
        selected
          ? "border-teal-400 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-600"
          : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-teal-300 dark:hover:border-teal-700"
      }`}
      onClick={selectMode ? onToggleSelect : onClick}>
      {/* Top row: label + icons */}
      <div className="flex items-center gap-1.5">
        {selectMode && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className="rounded border-gray-300 accent-teal-600 dark:accent-teal-400 shrink-0"
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <div className="flex-1 " onClick={(e) => e.stopPropagation()}>
          <PillSelect
            value={expression.labelid != null ? String(expression.labelid) : ""}
            onChange={(v) => onLabelChange(v ? Number(v) : null)}
            options={labels.map((l) => ({ value: String(l.id), label: l.name }))}
            placeholder="No label"
            colorScheme="teal"
            maxWidth="max-w-[230px] min-w-[90%]"
          />
        </div>

        <div className="flex items-center gap-1 ml-auto shrink-0">
          {expression.inQueue && (
            <span title="In queue" className="text-teal-500 dark:text-teal-400 text-xs">
              ▶
            </span>
          )}
          {skips > 0 && (
            <span
              title={`${skips} day${skips !== 1 ? "s" : ""} overdue`}
              className={skips > 2 ? "text-red-500" : "text-amber-500"}>
              ⚠
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-gray-300 dark:text-slate-600 hover:text-red-500 hover:dark:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            title="Delete">
            ✕
          </button>
        </div>
      </div>

      {/* Phrase text — max 3 lines */}
      <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-3 leading-snug flex-1">
        {addSpanToExpInPrase({ expression: expression.expression, phrase: expression.phrase, note: expression.note }, undefined, true)}
      </p>

      {/* Bottom row: progress + status */}
      <div className="flex items-center justify-between">
        <StageProgressBar
          stage={stage}
          skips={skips}
          onClick={(e) => {
            e.stopPropagation();
            onInfoClick();
          }}
        />

        <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${STATUS_COLORS[expression.status] ?? ""}`}>
          {expression.status}
        </span>
      </div>
    </div>
  );
}
