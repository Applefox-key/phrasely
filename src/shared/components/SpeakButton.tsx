import { useEffect, useRef, useState } from "react";
import { useUserSettings } from "../../features/profile/useUserSettings";
import { ALL_SPEECH_LANGS, type LangCode } from "../lib/speechLangs";

interface Props {
  text: string;
  className?: string;
  size?: "sm" | "md";
}

const supported = typeof window !== "undefined" && "speechSynthesis" in window;

/** Button that reads `text` aloud. Language chips are driven by the user's profile settings. */
export function SpeakButton({ text, className = "", size = "sm" }: Props) {
  const { speechLangs } = useUserSettings();
  const langs = ALL_SPEECH_LANGS.filter((l) => speechLangs.includes(l.code));

  const [speaking, setSpeaking] = useState(false);
  const [lang, setLang] = useState<LangCode>(speechLangs[0] ?? "");
  const utRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    setLang(speechLangs[0] ?? "");
  }, [speechLangs.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);

  if (!supported) return null;

  function handleSpeak(e: React.MouseEvent) {
    e.stopPropagation();
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    if (lang) u.lang = lang;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    utRef.current = u;
    synth.cancel();
    synth.speak(u);
    setSpeaking(true);
  }

  function handleLang(e: React.MouseEvent, code: LangCode) {
    e.stopPropagation();
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); }
    setLang(code);
  }

  const isMd = size === "md";

  return (
    <div className={`inline-flex items-center rounded-full border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 overflow-hidden ${className}`}>
      {langs.map(({ code, label }, i) => (
        <button
          key={label}
          type="button"
          onClick={(e) => handleLang(e, code)}
          title={code || "auto"}
          className={`${isMd ? "text-sm px-3 py-1.5" : "text-[10px] px-2 py-1"} transition-colors leading-none font-medium ${
            i > 0 ? "border-l border-gray-200 dark:border-slate-600" : ""
          } ${
            lang === code
              ? "text-teal-600 dark:text-teal-300"
              : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          }`}
        >
          {label}
        </button>
      ))}

      {langs.length > 0 && (
        <div className="w-px self-stretch bg-gray-200 dark:bg-slate-600" />
      )}

      <button
        type="button"
        onClick={handleSpeak}
        title={speaking ? "Stop" : "Read aloud"}
        className={`inline-flex items-center justify-center ${isMd ? "w-9 h-9" : "w-7 h-7"} transition-colors shrink-0 ${
          speaking
            ? "text-teal-600 dark:text-teal-300 bg-teal-50 dark:bg-teal-900/30"
            : "text-gray-400 hover:text-teal-500 dark:hover:text-teal-400 hover:bg-gray-50 dark:hover:bg-slate-600"
        }`}
      >
        {speaking ? (
          <svg width={isMd ? 16 : 12} height={isMd ? 16 : 12} viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="1.5" />
          </svg>
        ) : (
          <svg width={isMd ? 20 : 14} height={isMd ? 20 : 14} viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
          </svg>
        )}
      </button>
    </div>
  );
}
