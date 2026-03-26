const STORAGE_KEY = 'phrasely_options';

export const getSettings = <T>(name: string, defaultVal: T | null = null): T | null => {
  try {
    const currentSetStr = localStorage.getItem(STORAGE_KEY);
    const currentSet: Record<string, unknown> = currentSetStr ? JSON.parse(currentSetStr) : {};
    if (Object.prototype.hasOwnProperty.call(currentSet, name)) {
      return currentSet[name] as T;
    }
    return defaultVal;
  } catch {
    return defaultVal;
  }
};

export const setSettings = (name: string, set: unknown = '') => {
  try {
    const currentSetStr = localStorage.getItem(STORAGE_KEY);
    const currentSet: Record<string, unknown> = currentSetStr ? JSON.parse(currentSetStr) : {};
    currentSet[name] = set;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSet));
  } catch {
    // ignore
  }
};
