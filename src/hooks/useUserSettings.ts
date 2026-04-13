import { useAuthStore } from "../store/authStore";
import { usersApi } from "../api/users";
import { DEFAULT_SPEECH_LANGS, type LangCode } from "../lib/speechLangs";

function parseSettings(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "object") return raw as Record<string, unknown>;
  const str = String(raw).trim();
  try { return JSON.parse(str) as Record<string, unknown>; } catch { /* */ }
  try { return JSON.parse(`{${str}}`) as Record<string, unknown>; } catch { /* */ }
  return {};
}

export function useUserSettings() {
  const { user, setUser } = useAuthStore();
  const settings = parseSettings(user?.settings);

  const speechLangs: LangCode[] =
    Array.isArray(settings.speechLangs) && (settings.speechLangs as LangCode[]).length > 0
      ? (settings.speechLangs as LangCode[])
      : DEFAULT_SPEECH_LANGS;

  async function saveSpeechLangs(langs: LangCode[]): Promise<void> {
    if (!user) return;
    // Optimistic update so components reflect the change immediately
    setUser({ ...user, settings: JSON.stringify({ ...settings, speechLangs: langs }) });
    const updated = await usersApi.updateSettings({ speechLangs: langs });
    if (updated?.id) setUser(updated);
  }

  return { settings, speechLangs, saveSpeechLangs };
}
