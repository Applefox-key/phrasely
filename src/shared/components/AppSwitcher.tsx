import { useState, useRef, useEffect } from "react";

const apps = [
  {
    name: "FlashMinds",
    url: "https://flashcards.learnypie.com",
    icon: "🃏",
    current: false,
  },
  {
    name: "Phrasely",
    url: null,
    icon: "💬",
    current: true,
  },
  {
    name: "Tracker",
    url: "https://tracker.learnypie.com",
    icon: "📋",
    current: false,
  },
  {
    name: "learnypie.com",
    url: null,
    icon: "🌐",
    current: false,
    comingSoon: true,
  },
];

export default function AppSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-md hover:bg-gray-100 hover:dark:bg-slate-700 text-gray-500 dark:text-gray-400"
        title="Switch app">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 p-3 z-50">
          <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 px-1">
            learnypie.com
          </p>
          <div className="grid grid-cols-2 gap-2">
            {apps.map((app) => (
              <AppCard key={app.name} app={app} onSelect={() => setOpen(false)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface AppCardProps {
  app: (typeof apps)[number];
  onSelect: () => void;
}

function AppCard({ app, onSelect }: AppCardProps) {
  const base = "flex flex-col items-center gap-1 p-3 rounded-lg text-center transition-colors";

  if (app.comingSoon) {
    return (
      <div
        className={`${base} border-2 border-dashed border-gray-200 dark:border-slate-600 text-gray-400 dark:text-gray-500 cursor-not-allowed`}>
        <span className="text-2xl">{app.icon}</span>
        <span className="text-xs font-medium">{app.name}</span>
        <span className="text-xs text-gray-400">coming soon</span>
      </div>
    );
  }

  if (app.current) {
    return (
      <div className={`${base} bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700`}>
        <span className="text-2xl">{app.icon}</span>
        <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">{app.name}</span>
        <span className="text-xs bg-teal-100 dark:bg-teal-800 text-teal-800 dark:text-teal-200 rounded-full px-2 py-0.5">
          current
        </span>
      </div>
    );
  }

  return (
    <a
      href={app.url!}
      className={`${base} border border-gray-200 dark:border-slate-600 hover:bg-gray-50 hover:dark:bg-slate-700 text-gray-700 dark:text-gray-300`}
      onClick={onSelect}>
      <span className="text-2xl">{app.icon}</span>
      <span className="text-xs font-medium">{app.name}</span>
    </a>
  );
}
