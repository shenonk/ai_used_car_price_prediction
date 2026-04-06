const THEME_STORAGE_KEY = "carpriceai_theme";
const DEFAULT_THEME = "dark";

export function getStoredTheme() {
  if (typeof window === "undefined") return DEFAULT_THEME;

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === "light" || storedTheme === "dark" ? storedTheme : DEFAULT_THEME;
}

export function applyTheme(theme) {
  if (typeof document === "undefined") return;

  const resolvedTheme = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.colorScheme = resolvedTheme;
}

export function saveTheme(theme) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }

  applyTheme(theme);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("carpriceai-theme-change", { detail: theme }));
  }
}

export { DEFAULT_THEME, THEME_STORAGE_KEY };
