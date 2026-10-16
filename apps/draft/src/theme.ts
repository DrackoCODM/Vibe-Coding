const THEME_STORAGE_KEY = 'gratisdraft.theme';

/** Resolve the initial theme: stored choice wins, otherwise dark-first unless the OS prefers light. */
export function readInitialDark(): boolean {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark') return true;
    if (stored === 'light') return false;
  } catch {
    // storage unavailable
  }
  const prefersLight =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: light)').matches;
  return !prefersLight;
}

/** Apply the theme class to <html> and persist the choice. */
export function applyTheme(dark: boolean): void {
  document.documentElement.classList.toggle('dark', dark);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, dark ? 'dark' : 'light');
  } catch {
    // storage unavailable
  }
}
