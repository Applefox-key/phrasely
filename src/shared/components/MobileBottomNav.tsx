import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../features/auth/authStore";
import { useMobileNavStore, type BatchAction } from "../mobileNavStore";
import PillSelect from "./PillSelect";

const OTHER_APPS = [
  { name: "FlashMinds", url: "https://flashcards.learnypie.com", icon: "🃏" },
  { name: "Tracker", url: "https://tracker.learnypie.com", icon: "📋" },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuthStore();
  const { expressionsActions, selectBar } = useMobileNavStore();
  const [moreOpen, setMoreOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    try {
      return localStorage.getItem("phrasely_theme") === "dark";
    } catch {
      return false;
    }
  });

  if (!isAuthenticated) return null;

  const isExpressions = location.pathname === "/expressions";
  const isTraining = location.pathname === "/training";
  const hasExpressionsActions = isExpressions && expressionsActions !== null;

  if (isTraining) return null;

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("phrasely_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("phrasely_theme", "light");
    }
  };

  const closeMore = () => setMoreOpen(false);

  return (
    <>
      {/* ── Select mode action bar — replaces nav on mobile ──── */}
      {selectBar ? (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-800 border-t border-teal-200 dark:border-teal-800 shadow-[0_-2px_12px_rgba(0,0,0,0.07)]">
          {/* Sub-select row (label / status / queue) */}
          {(selectBar.batchAction === "label" ||
            selectBar.batchAction === "status" ||
            selectBar.batchAction === "queue") && (
            <div className="px-3 pt-2.5">
              {selectBar.batchAction === "label" && (
                <PillSelect
                  value={selectBar.batchLabel?.toString() ?? ""}
                  onChange={(v) => selectBar.onChangeBatchLabel(v ? Number(v) : null)}
                  options={selectBar.labels.map((l) => ({ value: l.id.toString(), label: l.name }))}
                  placeholder="No label"
                  colorScheme="amber"
                  size="md"
                  upward
                />
              )}
              {selectBar.batchAction === "status" && (
                <PillSelect
                  value={selectBar.batchStatus}
                  onChange={selectBar.onChangeBatchStatus}
                  options={["new", "active", "paused", "completed"].map((s) => ({ value: s, label: s }))}
                  placeholder="Status"
                  colorScheme="violet"
                  size="md"
                  upward
                />
              )}
              {selectBar.batchAction === "queue" && (
                <PillSelect
                  value={selectBar.batchQueueAction}
                  onChange={(v) => selectBar.onChangeBatchQueueAction(v as "add" | "remove")}
                  options={[
                    { value: "add", label: "Add to queue" },
                    { value: "remove", label: "Remove from queue" },
                  ]}
                  placeholder="Queue action"
                  colorScheme="blue"
                  size="md"
                  upward
                />
              )}
            </div>
          )}
          {/* Main action row */}
          <div className="flex items-center justify-between sm:justify-start gap-2 px-3 h-16">
            <PillSelect
              value={selectBar.batchAction}
              onChange={(v) => selectBar.onChangeBatchAction(v as BatchAction)}
              options={[
                { value: "delete", label: "Delete" },
                { value: "label", label: "Assign label" },
                { value: "status", label: "Set status" },
                { value: "queue", label: "Queue manage" },
                { value: "download", label: "Download" },
              ]}
              placeholder="Select action…"
              colorScheme="teal"
              size="md"
              upward
            />
            <button
              onClick={selectBar.onExecute}
              disabled={selectBar.selectedCount === 0 || !selectBar.batchAction}
              className="bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-sm font-semibold px-5 h-10 rounded-lg transition-colors shrink-0">
              Execute
            </button>
          </div>
        </div>
      ) : (
        /* ── Bottom navigation bar ─────────────────────────────── */
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 flex h-16">
          {/* Training */}
          <Link
            to="/training"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
              isTraining ? "text-teal-600 dark:text-teal-400" : "text-gray-500 dark:text-gray-400"
            }`}>
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth={isTraining ? 2.5 : 1.75}
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            Training
          </Link>

          {/* Home */}
          <Link
            to="/expressions"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
              isExpressions ? "text-teal-600 dark:text-teal-400" : "text-gray-500 dark:text-gray-400"
            }`}>
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth={isExpressions ? 2.5 : 1.75}
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Home
          </Link>

          {/* More */}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
              moreOpen ? "text-teal-600 dark:text-teal-400" : "text-gray-500 dark:text-gray-400"
            }`}>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <circle cx="5" cy="12" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="19" cy="12" r="1.5" />
            </svg>
            More
          </button>
        </nav>
      )}

      {/* ── More drawer ────────────────────────────────────────── */}
      {moreOpen && !selectBar && (
        <>
          {/* Overlay */}
          <div className="sm:hidden fixed inset-0 bg-black/40 z-40" onClick={closeMore} />

          {/* Sheet */}
          <div className="sm:hidden fixed bottom-16 left-0 right-0 z-50 bg-white dark:bg-slate-800 rounded-t-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
            {/* Drag handle */}
            <div className="sticky top-0 bg-white dark:bg-slate-800 pt-3 pb-1 flex justify-center rounded-t-2xl">
              <div className="w-10 h-1 bg-gray-300 dark:bg-slate-600 rounded-full" />
            </div>

            {/* ── Dark mode toggle ── */}
            <div className="flex items-center justify-between px-5 py-3.5">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Dark mode</span>
              <button
                onClick={toggleDark}
                aria-label="Toggle dark mode"
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                  dark ? "bg-teal-600" : "bg-gray-300 dark:bg-slate-600"
                }`}>
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    dark ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* ── Settings (only on Expressions page) ── */}
            {hasExpressionsActions && (
              <button
                onClick={() => {
                  expressionsActions!.onOpenSettings();
                  closeMore();
                }}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-slate-700/60 transition-colors">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Settings</span>
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-400">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            )}

            {/* ── Manage expressions (only on Expressions page) ── */}
            {hasExpressionsActions && (
              <>
                <div className="mx-4 border-t border-gray-100 dark:border-slate-700 my-1" />
                <div className="px-5 py-2">
                  <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
                    Manage expressions
                  </p>
                  {[
                    {
                      label: "+ Add one",
                      action: () => {
                        expressionsActions!.onAddSingle();
                        closeMore();
                      },
                    },
                    {
                      label: "+ Add from list",
                      action: () => {
                        expressionsActions!.onAddText();
                        closeMore();
                      },
                    },
                    {
                      label: "+ Add from file",
                      action: () => {
                        expressionsActions!.onAddFile();
                        closeMore();
                      },
                    },
                    {
                      label: "✕ Delete mode",
                      action: () => {
                        expressionsActions!.onDeleteMode();
                        closeMore();
                      },
                    },
                    {
                      label: "↓ Download",
                      action: () => {
                        expressionsActions!.onExport();
                        closeMore();
                      },
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={item.action}
                      className="w-full text-left text-sm text-gray-700 dark:text-gray-300 py-2.5 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* ── Navigation links ── */}
            <div className="mx-4 border-t border-gray-100 dark:border-slate-700 my-1" />
            <div className="px-5 py-2">
              {(["Home", "Training"] as const).map((label) => (
                <Link
                  key={label}
                  to={label === "Home" ? "/expressions" : `/${label.toLowerCase()}`}
                  onClick={closeMore}
                  className="flex items-center py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                  {label}
                </Link>
              ))}

              {/* Labels — only on Expressions page */}
              {hasExpressionsActions && (
                <button
                  onClick={() => {
                    expressionsActions!.onOpenLabels();
                    closeMore();
                  }}
                  className="w-full flex items-center justify-between py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                  <span>Labels</span>
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-400">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              )}

              <Link
                to="/profile"
                onClick={closeMore}
                className="flex items-center py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                Profile
              </Link>
              <Link
                to="/about"
                onClick={closeMore}
                className="flex items-center py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                About
              </Link>
            </div>

            {/* ── Other apps ── */}
            <div className="mx-4 border-t border-gray-100 dark:border-slate-700 my-1" />
            <div className="px-5 py-3">
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">
                Other apps
              </p>
              <div className="flex gap-3">
                {OTHER_APPS.map((app) => (
                  <a
                    key={app.name}
                    href={app.url}
                    className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 transition-colors">
                    <span className="text-2xl">{app.icon}</span>
                    <span className="text-xs font-medium">{app.name}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* ── Logout ── */}
            <div className="mx-4 border-t border-gray-100 dark:border-slate-700 my-1" />
            <div className="px-5 pt-1 pb-8">
              <button
                onClick={() => {
                  logout();
                  closeMore();
                }}
                className="w-full text-left text-sm text-red-500 dark:text-red-400 py-3 hover:text-red-600 dark:hover:text-red-300 transition-colors font-medium">
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
