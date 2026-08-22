import { useRef, useState, type ReactNode } from "react";

interface Props {
  phrase: string;
  expression: string;
  onPhraseChange: (v: string) => void;
  onExpressionChange: (v: string) => void;
  phraseRows?: number;
  autoFocus?: boolean;
  /** Optional element rendered in the label row (e.g. VoiceInputButton). */
  phraseAction?: ReactNode;
}

export default function PhraseExpressionField({
  phrase,
  expression,
  onPhraseChange,
  onExpressionChange,
  phraseRows = 3,
  autoFocus = false,
  phraseAction,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSetBtn, setShowSetBtn] = useState(false);

  const handleSelectionChange = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    const el = textareaRef.current;
    if (!el) return;
    const hasSelection = el.selectionStart !== el.selectionEnd;
    if (hasSelection !== showSetBtn) setShowSetBtn(hasSelection);
  };

  const applySelection = () => {
    const el = textareaRef.current;
    if (!el) return;
    const selected = el.value.slice(el.selectionStart, el.selectionEnd).trim();
    if (selected) onExpressionChange(selected);
    setShowSetBtn(false);
  };

  const clearExpression = () => {
    onExpressionChange("");
    setShowSetBtn(false);
  };

  return (
    <div>
      {/* Label row */}
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phrase</label>
        {phraseAction}
      </div>

      {/* Unified box: textarea + selected expression strip */}
      <div className="border border-gray-200 dark:border-slate-600 rounded-md overflow-visible">
        {/* Phrase textarea */}
        <div className="relative">
          {showSetBtn && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={applySelection}
              className="absolute -top-9 left-0 flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-md shadow-md transition-colors whitespace-nowrap z-10">
              Set selection as expression
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          <textarea
            ref={textareaRef}
            value={phrase}
            rows={phraseRows}
            autoFocus={autoFocus}
            required
            placeholder="She really hit the nail on the head with that idea."
            onChange={(e) => onPhraseChange(e.target.value)}
            onClick={handleSelectionChange}
            onTouchEnd={handleSelectionChange}
            onKeyUp={handleSelectionChange}
            onInput={handleSelectionChange}
            className="w-full px-3 py-2 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-inset resize-none border-0 rounded-t-md"
          />
        </div>

        {/* Selected expression strip */}
        <div className="border-t border-gray-200 dark:border-slate-600 px-3 py-2 bg-gray-50 dark:bg-slate-700/50 rounded-b-md">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">
            Selected Expression
          </p>
          {expression ? (
            <div className="flex items-center gap-2">
              <mark className="font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded px-2 py-0.5 not-italic text-sm">
                {expression}
              </mark>
              <button
                type="button"
                onClick={clearExpression}
                className="shrink-0 text-gray-400 hover:text-red-500 hover:dark:text-red-400 transition-colors"
                title="Clear expression">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <span className="text-gray-400 dark:text-gray-500 italic text-sm select-none">
              …select a word or phrase above
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
