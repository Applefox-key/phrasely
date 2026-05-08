import { useState, FormEvent, useRef } from "react";
import { useAuthStore } from "../auth/authStore";
import { usersApi } from "../auth/usersApi";
import { useQueryClient } from "@tanstack/react-query";
import { useUserSettings } from "./useUserSettings";
import { ALL_SPEECH_LANGS, type LangCode } from "../../shared/lib/speechLangs";

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const qc = useQueryClient();
  const { speechLangs } = useUserSettings();

  const [name, setName] = useState(user?.name ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [localLangs, setLocalLangs] = useState<LangCode[]>(speechLangs);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = () => {
    const file = fileRef.current?.files?.[0];
    if (file) setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      if (fileRef.current?.files?.[0]) fd.append("avatar", fileRef.current.files[0]);
      const updatedUser = await usersApi.update(fd);
      setUser(updatedUser);

      const withSettings = await usersApi.updateSettings({ speechLangs: localLangs });
      if (withSettings?.id) setUser(withSettings);

      qc.invalidateQueries({ queryKey: ["currentUser"] });
      setMessage("Profile updated successfully.");
      setPreviewUrl(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const toggleLang = (code: LangCode) => {
    setLocalLangs((prev) => {
      const next = prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code];
      return next.length === 0 ? prev : next;
    });
  };

  const avatarSrc =
    previewUrl ||
    (user?.img ? `https://api.learnapp.pro/img/avatars?img=${user.img}&userid=${user.id}` : null);

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Profile</h1>

      <form onSubmit={handleSubmit}>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          {/* Avatar */}
          <div className="flex items-center gap-4 mb-6">
            <div
              className="relative group cursor-pointer w-16 h-16 shrink-0"
              onClick={() => fileRef.current?.click()}>
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={user?.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-slate-600"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-800 text-teal-700 dark:text-teal-300 flex items-center justify-center text-2xl font-bold select-none">
                  {user?.name?.[0]?.toUpperCase() ?? "U"}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileRef}
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">{user?.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>

          {message && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-sm text-green-700 dark:text-green-400">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email ?? ""}
                readOnly
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-500 dark:text-gray-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Speech languages */}
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">
            Speech &amp; voice languages
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
            Selected languages appear as chips in the Speak and Voice input buttons. At least one
            must remain active.
          </p>
          <div className="flex flex-wrap gap-2">
            {ALL_SPEECH_LANGS.map(({ code, label, name: langName }) => {
              const active = localLangs.includes(code);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleLang(code)}
                  title={langName}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    active
                      ? "bg-teal-600 border-teal-600 text-white"
                      : "border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:border-teal-400 hover:text-teal-600 dark:hover:text-teal-400"
                  }`}>
                  {label}
                  <span className="ml-1.5 text-xs font-normal opacity-70">{langName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Save */}
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-medium py-2 px-4 rounded-md transition-colors">
          {loading ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
