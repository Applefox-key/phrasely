export const ALL_SPEECH_LANGS = [
  { code: "ru-RU", label: "RU", name: "Russian" },
  { code: "en-US", label: "EN", name: "English" },
  { code: "uk-UA", label: "UK", name: "Ukrainian" },
  { code: "pl-PL", label: "PL", name: "Polish" },
  { code: "de-DE", label: "DE", name: "German" },
  { code: "fr-FR", label: "FR", name: "French" },
  { code: "es-ES", label: "ES", name: "Spanish" },
  { code: "zh-CN", label: "ZH", name: "Chinese" },
  { code: "ja-JP", label: "JA", name: "Japanese" },
  { code: "",       label: "AU", name: "Auto (browser)" },
] as const;

export type LangCode = (typeof ALL_SPEECH_LANGS)[number]["code"];

export const DEFAULT_SPEECH_LANGS: LangCode[] = ["en-US", ""];
