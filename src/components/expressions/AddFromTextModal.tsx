import { useState } from 'react';
import { expressionsFromText } from '../../utils/texts';
import type { Label } from '../../types';

interface ParsedItem {
  id: number;
  expression: string;
  phrase: string;
}

interface Props {
  labels: Label[];
  onSave: (items: Omit<ParsedItem, 'id'>[], labelid: number | null) => void;
  onClose: () => void;
  mode?: 'text' | 'file';
}

export default function AddFromTextModal({ labels, onSave, onClose, mode = 'text' }: Props) {
  const [rawText, setRawText] = useState('');
  const [parsed, setParsed] = useState<ParsedItem[]>([]);
  const [error, setError] = useState('');
  const [selectedLabel, setSelectedLabel] = useState<number | null>(null);
  const [step, setStep] = useState<'input' | 'preview'>('input');

  const handleParse = () => {
    expressionsFromText(
      rawText,
      (items) => { setParsed(items); setStep('preview'); },
      setError
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setRawText(text);
    };
    reader.readAsText(file);
  };

  const handleSave = () => {
    onSave(
      parsed.map(({ expression, phrase }) => ({ expression, phrase })),
      selectedLabel
    );
    onClose();
  };

  const updateItem = (id: number, field: 'expression' | 'phrase', value: string) => {
    setParsed((prev) => prev.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: number) => {
    setParsed((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            {mode === 'file' ? 'Add from file' : 'Add from text'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 'input' ? (
            <div className="space-y-4">
              {mode === 'file' ? (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Upload a .txt file. Each line: <code>expression; phrase</code>
                  </p>
                  <input
                    type="file"
                    accept=".txt"
                    onChange={handleFileChange}
                    className="text-sm text-gray-600 dark:text-gray-300"
                  />
                  {rawText && (
                    <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                      File loaded ({rawText.split('\n').filter(Boolean).length} lines)
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    One expression per line: <code>expression; phrase</code>
                  </p>
                  <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    rows={10}
                    placeholder="make up; She had to make up an excuse for being late"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign label</label>
                <select
                  value={selectedLabel ?? ''}
                  onChange={(e) => setSelectedLabel(e.target.value ? Number(e.target.value) : null)}
                  className="w-full max-w-xs px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 text-sm"
                >
                  <option value="">No label</option>
                  {labels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>

              <button
                onClick={handleParse}
                disabled={!rawText.trim()}
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white px-5 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Preview →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {parsed.length} expression{parsed.length !== 1 ? 's' : ''} parsed. Edit if needed.
              </p>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {parsed.map((item) => (
                  <div key={item.id} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <input
                        value={item.expression}
                        onChange={(e) => updateItem(item.id, 'expression', e.target.value)}
                        placeholder="expression"
                        className="px-2 py-1 border border-gray-200 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                      />
                      <input
                        value={item.phrase}
                        onChange={(e) => updateItem(item.id, 'phrase', e.target.value)}
                        placeholder="phrase"
                        className="px-2 py-1 border border-gray-200 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-500 mt-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {step === 'preview' && parsed.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex gap-3">
            <button
              onClick={() => setStep('input')}
              className="px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
            >
              Save {parsed.length} expression{parsed.length !== 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
