import { Expression } from "../Expression";
import type { Label } from "../../../shared/types";
import { addSpanToExpInPrase } from "../texts";
import PillSelect from "../../../shared/components/PillSelect";

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

const STATUS_DOT_COLORS: Record<string, string> = {
  new: "bg-gray-400 dark:bg-gray-500",
  active: "bg-teal-500 dark:bg-teal-400",
  paused: "bg-amber-400 dark:bg-amber-400",
  completed: "bg-green-500 dark:bg-green-400",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300",
  active: "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400",
  paused: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  completed: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
};

export default function ExpressionRow({
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
      className={`border-l border-l-teal-500 flex items-center gap-3 px-3 py-2.5 border-b border-gray-100 dark:border-slate-700 hover:bg-gray-300 dark:border-l-teal-500  text-gray-200 transition-colors hover:dark:bg-slate-700 group cursor-pointer ${
        selected ? "bg-teal-100 dark:bg-teal-900/50" : ""
      }`}
      onClick={selectMode ? onToggleSelect : onClick}>
      {/* Checkbox (select mode) */}
      {selectMode && (
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="rounded border-gray-300 accent-teal-600 dark:accent-teal-400"
          onClick={(e) => e.stopPropagation()}
        />
      )}
      {/* Phrase */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 dark:text-gray-200 truncate">
          {addSpanToExpInPrase({ expression: expression.expression, phrase: expression.phrase, note: expression.note }, undefined, true)}
        </p>
      </div>
      {/* inQueue icon */}
      {expression.inQueue && (
        <span title="In queue" className="text-teal-500 dark:text-teal-400 text-xs">
          ▶
        </span>
      )}
      {/* Warning icon */}
      {skips > 0 && (
        <span
          title={`${skips} day${skips !== 1 ? "s" : ""} overdue`}
          className={skips > 2 ? "text-red-500" : "text-amber-500"}>
          ⚠
        </span>
      )}{" "}
      {/* Status —  badge on desktop */}
      <span
        className={`hidden sm:inline text-xs rounded-full px-2 py-0.5 font-medium ${STATUS_COLORS[expression.status] ?? ""}`}>
        {expression.status}
      </span>
      {/* Progress bar — click to open InfoModal */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onInfoClick();
        }}
        className="flex items-center gap-0.5 shrink-0"
        title={`Stage ${stage}/9`}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-sm ${
              i < stage ? "bg-teal-500 dark:bg-teal-400" : "bg-gray-200 dark:bg-slate-600"
            }`}
          />
        ))}
      </button>
      {/* Status — dot on mobile*/}
      <span
        className={`sm:hidden w-2 h-2 rounded-full shrink-0 ${STATUS_DOT_COLORS[expression.status] ?? ""}`}
        title={expression.status}
      />
      {/* <span
        className={`hidden sm:inline text-xs rounded-full px-2 py-0.5 font-medium ${STATUS_COLORS[expression.status] ?? ""}`}>
        {expression.status}
      </span> */}
      {/* Label quick-assign */}
      <div className="hidden sm:block" onClick={(e) => e.stopPropagation()}>
        <PillSelect
          value={String(expression.labelid ?? "")}
          onChange={(v) => onLabelChange(v ? Number(v) : null)}
          placeholder="No label"
          colorScheme="violet"
          maxWidth="max-w-[90px] min-w-[90px]"
          options={labels.map((l) => ({ value: String(l.id), label: l.name }))}
        />
      </div>
      {/* Delete */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="text-gray-300 dark:text-slate-600 hover:text-red-500 hover:dark:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
        title="Delete">
        ✕
      </button>
    </div>
  );
}
