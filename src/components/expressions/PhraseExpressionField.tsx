import { useRef, useState } from 'react';

interface Props {
  phrase: string;
  expression: string;
  onPhraseChange: (v: string) => void;
  onExpressionChange: (v: string) => void;
  phraseRows?: number;
  autoFocus?: boolean;
}

/**
 * Phrase textarea + expression display with mouse/keyboard selection UX.
 * The user selects text in the phrase textarea and clicks "Set as expression"
 * instead of typing the expression manually.
 */
export default function PhraseExpressionField({
  phrase,
  expression,
  onPhraseChange,
  onExpressionChange,
  phraseRows = 3,
  autoFocus = false,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSetBtn, setShowSetBtn] = useState(false);

  // Show/hide the "set as expression" button based on whether text is selected
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
    onExpressionChange('');
    setShowSetBtn(false);
  };

  return (
    <div className="space-y-2">
      {/* Phrase textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Phrase
          <span className="ml-1 font-normal text-gray-400">(full sentence)</span>
        </label>
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
          className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
        />
      </div>

      {/* Expression display + action */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Expression
          <span className="ml-1 font-normal text-gray-400">(select in phrase above)</span>
        </label>

        <div className={`relative flex items-center min-h-[2.25rem] px-3 py-2 rounded-md border text-sm transition-colors ${
          expression
            ? 'border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/20'
            : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50'
        }`}>
          {/* "Set as expression" button — floats above, appears on selection */}
          {showSetBtn && (
            <button
              type="button"
              onMouseDown={(e) => {
                // Prevent textarea from losing selection before we read it
                e.preventDefault();
              }}
              onClick={applySelection}
              className="absolute -top-9 left-0 flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-md shadow-md transition-colors whitespace-nowrap z-10"
            >
              Set selection as expression
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {expression ? (
            <>
              <mark className="font-semibold bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 rounded px-1 not-italic flex-1 break-all">
                {expression}
              </mark>
              <button
                type="button"
                onClick={clearExpression}
                className="ml-2 shrink-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                title="Clear expression"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          ) : (
            <span className="text-gray-400 dark:text-gray-500 italic select-none">
              …select the part you want to remember
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
