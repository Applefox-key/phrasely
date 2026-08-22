import { Fragment } from 'react';

interface ExpressionItem {
  expression: string;
  phrase: string;
  note?: string | null;
}

export const expressionsFromText = async (
  text: string,
  callbackForResult: (arr: Array<{ id: number; expression: string; phrase: string }>) => void,
  setPopupAdvise: (msg: string) => void,
  separator = ';'
) => {
  if (!text) {
    setPopupAdvise('please paste:  expression; phrase ');
    return;
  }
  try {
    const contArr = text.split(/\n/).filter((item) => item.trim());
    if (!contArr) {
      setPopupAdvise('failed to recognize expressions');
      return;
    }
    const expressionArr = contArr.map((row, i) => {
      const [p1, p2] = row.replace(/\s+/g, ' ').split(separator);
      if (!p1 || !p2) return { id: i, expression: p1 ?? '', phrase: p2 ?? '' };
      if (p1.length > p2.length) return { id: i, expression: p2.trim(), phrase: p1.trim() };
      else return { id: i, expression: p1.trim(), phrase: p2.trim() };
    });
    callbackForResult(expressionArr);
  } catch (error) {
    setPopupAdvise((error as Error).message);
  }
};

export const phrasessFromText = async (
  text: string,
  callbackForResult: (arr: Array<{ id: number; expression: string; phrase: string }>) => void,
  setPopupAdvise: (msg: string) => void
) => {
  if (!text) {
    setPopupAdvise('please paste: phrase ');
    return;
  }
  try {
    const contArr = text.split(/\n/).filter((item) => item.trim());
    if (!contArr) {
      setPopupAdvise('failed to recognize expressions');
      return;
    }
    const expressionArr = contArr.map((row, i) => ({
      id: i,
      expression: '',
      phrase: row,
    }));
    callbackForResult(expressionArr);
  } catch (error) {
    setPopupAdvise((error as Error).message);
  }
};

export const addSpanToExpInPrase = (
  item: ExpressionItem,
  spanClass?: string,
  showTooltip?: boolean
): React.ReactElement => {
  if (!item.expression) return <>{item.phrase}</>;

  const regexPatternExp = item.expression.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${regexPatternExp})`, 'gi');

  // case-insensitive test before splitting
  if (!regex.test(item.phrase)) return <>{item.phrase}</>;

  // split with capturing group — preserves original casing of the matched segment
  const parts = item.phrase.split(new RegExp(`(${regexPatternExp})`, 'gi'));
  const lc = item.expression.toLowerCase();

  return (
    <>
      {parts.map((part, i) => {
        if (part.toLowerCase() !== lc) {
          return <Fragment key={'ph' + i}>{part}</Fragment>;
        }
        const markEl = (
          <mark
            key={'ph' + i}
            className={spanClass || 'font-semibold bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300 rounded px-1 not-italic'}
            data-note={item.note ?? ''}
          >
            {part}
          </mark>
        );
        if (item.note) {
          return (
            <span key={'ph' + i} className="relative group/note inline" title={item.note}>
              {markEl}
              <sup className="text-teal-500 dark:text-teal-400 text-[10px] ml-0.5 not-italic font-normal select-none">●</sup>
              {showTooltip && (
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded bg-gray-800 dark:bg-slate-700 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover/note:opacity-100 z-20 shadow-md">
                  {item.note}
                </span>
              )}
            </span>
          );
        }
        return markEl;
      })}
    </>
  );
};
