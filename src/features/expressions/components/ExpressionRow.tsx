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

const STATUS_DOT_COLORS: Record<string, string> = {
  new: "bg-gray-400 dark:bg-gray-500",
  active: "bg-teal-500 dark:bg-teal-400",
  paused: "bg-amber-400 dark:bg-amber-400",
  completed: "bg-green-500 dark:bg-green-400",
};

// const STATUS_COLORS: Record<string, string> = {
//   new: "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300",
//   active: "bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400",
//   paused: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
//   completed: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
// };
const STATUS_COLORS: Record<string, string> = {
  // Нейтральный светлый
  new: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",

  // Яркий динамичный синий вместо teal
  active:
    "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50",

  // Неяркий, "затушенный" вариант для паузы
  paused: "bg-zinc-100/80 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 opacity-75",

  // Стандартный статус успешного завершения
  completed: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400",
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
      className={`relative border-l  border-l-teal-400 border-b-stone-600 rounded-bl-xl sm:border-b-none flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 px-3 py-2.5 border-b border-gray-100 dark:border-slate-700 hover:bg-gray-300 dark:border-l-teal-500  text-gray-200 transition-colors hover:dark:bg-slate-700 group cursor-pointer ${
        // className={`border-l border-l-teal-500 flex items-center gap-3 px-3 py-2.5 border-b border-gray-100 dark:border-slate-700 hover:bg-gray-300 dark:border-l-teal-500  text-gray-200 transition-colors hover:dark:bg-slate-700 group cursor-pointer ${
        selected ? "bg-teal-100 dark:bg-teal-900/50" : ""
      }`}
      onClick={selectMode ? onToggleSelect : onClick}>
      {/* Checkbox (select mode) */}
      {selectMode && (
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className=" rounded border-gray-300 accent-teal-600 dark:accent-teal-400 w-5 h-5 sm:-auto sm:h-auto"
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Phrase */}
      <div className="flex justify-between items-start sm:flex-1 min-w-0">
        <p className="text-sm text-gray-800 dark:text-gray-200 sm:truncate">
          {addSpanToExpInPrase(
            { expression: expression.expression, phrase: expression.phrase, note: expression.note },
            undefined,
            true,
          )}
        </p>{" "}
        {/* Delete Mobile*/}
        {!selectMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="block sm:hidden text-gray-700 dark:text-slate-600 hover:text-red-500 hover:dark:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
            title="Delete">
            ✕
          </button>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        {/* Note Mobile*/}
        {expression.note ? (
          <p className="block sm:hidden text-sm italic text-stone-500 dark:text-gray-200 sm:truncate">
            {expression.note}
          </p>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2">
          {/* inQueue icon */}
          {expression.inQueue && (
            <span title="In queue" className="text-teal-500 dark:text-teal-400 text-xs">
              ▶
            </span>
          )}
          {/* Status —  badge on desktop */}
          <span
            className={`hidden sm:inline text-xs rounded-full px-2 py-0.5 font-medium ${STATUS_COLORS[expression.status] ?? ""}`}>
            {expression.status}
          </span>

          {/* Progress bar — click to open InfoModal */}
          <StageProgressBar
            stage={stage}
            skips={skips}
            onClick={(e) => {
              e.stopPropagation();
              onInfoClick();
            }}
          />
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
          {/* Delete Desktop*/}
          {!selectMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="hidden sm:block text-gray-700 dark:text-slate-600 hover:text-red-500 hover:dark:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
              title="Delete">
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
