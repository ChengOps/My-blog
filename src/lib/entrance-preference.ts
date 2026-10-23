export const ENTRANCE_STORAGE_KEY = "hush-entry-until";
export const ENTRANCE_REMEMBER_MS = 7 * 24 * 60 * 60 * 1000;

export function rememberEntrance() {
  try {
    localStorage.setItem(ENTRANCE_STORAGE_KEY, String(Date.now() + ENTRANCE_REMEMBER_MS));
  } catch { /* Fall back to this tab when persistent storage is unavailable. */ }
  try {
    sessionStorage.setItem("hush-entry", "entered");
  } catch { /* Entering remains available without browser storage. */ }
}
