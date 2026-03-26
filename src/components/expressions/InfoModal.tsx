import { Expression } from '../../classes/Expression';
import { addSpanToExpInPrase } from '../../utils/texts';

interface Props {
  expression: Expression;
  onClose: () => void;
}

export default function InfoModal({ expression, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">Expression info</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">×</button>
        </div>

        <div className="p-4 space-y-6">
          {/* Phrase */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Phrase</p>
            <p className="text-gray-900 dark:text-gray-100 text-base leading-relaxed">
              {addSpanToExpInPrase({ expression: expression.expression, phrase: expression.phrase, note: expression.note })}
            </p>
          </div>

          {/* Study plan */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Study plan</p>
            <div className="space-y-1">
              {expression.studyPlan.map((row, i) => {
                const isDone = row.includes('✔');
                const isMissed = row.includes('☹');
                const isToday = row.includes(':Today');
                const parts = row.split(':');
                const icon = parts[0]?.trim();
                const rest = parts.slice(1).join(':').replace(':Today', '').trim();
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-2 text-sm px-2 py-1 rounded ${
                      isToday
                        ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-medium'
                        : isDone
                        ? 'text-teal-600 dark:text-teal-500'
                        : isMissed
                        ? 'text-red-500 dark:text-red-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    <span>{icon}</span>
                    <span>{rest}</span>
                    {isToday && <span className="ml-auto text-xs font-bold">TODAY</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* History */}
          {expression.userHistory.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">History</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {expression.userHistory.map((entry, i) => (
                  <p key={i} className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                    {entry}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>Status: <strong className="text-gray-700 dark:text-gray-300">{expression.status}</strong></span>
            <span>Stage: <strong className="text-gray-700 dark:text-gray-300">{expression.stage}</strong></span>
            {expression.inQueue && <span className="text-teal-600 dark:text-teal-400">In queue</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
