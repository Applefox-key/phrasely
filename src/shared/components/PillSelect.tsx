import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

type ColorScheme = "teal" | "violet" | "amber" | "blue";

interface Option {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder: string;
  colorScheme?: ColorScheme;
  maxWidth?: string;
  size?: "sm" | "md";
  disabled?: boolean;
  upward?: boolean;
}

const SCHEMES: Record<ColorScheme, { idle: string; selected: string; active: string }> = {
  teal: {
    idle: "bg-teal-100/50 dark:bg-teal-900/20 border-teal-100 dark:border-teal-800 text-teal-400 dark:text-teal-600",
    selected: "bg-teal-50 dark:bg-teal-900/40 border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-400",
    active: "text-teal-600 dark:text-teal-400",
  },
  violet: {
    idle: "bg-violet-100/50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-800 text-violet-400 dark:text-violet-600",
    selected:
      "bg-violet-50 dark:bg-violet-900/40 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-400",
    active: "text-violet-600 dark:text-violet-400",
  },
  amber: {
    idle: "bg-amber-100/50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800 text-amber-400 dark:text-amber-600",
    selected:
      "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400",
    active: "text-amber-600 dark:text-amber-400",
  },
  blue: {
    idle: "bg-blue-100/50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-400 dark:text-blue-600",
    selected: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400",
    active: "text-blue-600 dark:text-blue-400",
  },
};

export default function PillSelect({
  value,
  onChange,
  options,
  placeholder,
  colorScheme = "teal",
  maxWidth,
  size = "sm",
  disabled = false,
  upward = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (!btnRef.current?.contains(e.target as Node) && !dropRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const current = options.find((o) => o.value === value);
  const scheme = SCHEMES[colorScheme];
  const isMd = size === "md";

  const dropdown =
    open &&
    rect &&
    createPortal(
      <div
        ref={dropRef}
        style={{
          position: "fixed",
          top: upward ? rect.top - 4 : rect.bottom + 4,
          left: rect.left,
          transform: upward ? "translateY(-100%)" : "none",
          zIndex: 9999,
        }}
        className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg py-1 min-w-[130px]">
        <button
          type="button"
          onClick={() => {
            onChange("");
            setOpen(false);
          }}
          className={`w-full text-left ${isMd ? "text-sm px-4 py-2" : "text-xs px-3 py-1.5"} hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-400 dark:text-gray-500 transition-colors`}>
          {placeholder}
        </button>
        {options.map((o) => (
          <button
            type="button"
            key={o.value}
            onClick={() => {
              onChange(o.value);
              setOpen(false);
            }}
            className={`w-full text-left ${isMd ? "text-sm px-4 py-2" : "text-xs px-3 py-1.5"} hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
              value === o.value ? `font-medium ${scheme.active}` : "text-gray-700 dark:text-gray-300"
            }`}>
            {o.label}
          </button>
        ))}
      </div>,
      document.body,
    );

  return (
    <div className="relative shrink-0">
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (!open && btnRef.current) {
            setRect(btnRef.current.getBoundingClientRect());
          }
          setOpen((v) => !v);
        }}
        className={`${isMd ? "text-sm px-4 py-2" : "text-xs px-3 py-1"} rounded-full border transition-colors whitespace-nowrap truncate text-left disabled:opacity-50 disabled:cursor-not-allowed ${maxWidth ?? ""} ${
          value ? scheme.selected : scheme.idle
        }`}>
        {current?.label ?? placeholder}
      </button>
      {dropdown}
    </div>
  );
}
