export interface ThemeToggleProps {
  dark: boolean;
  onToggle: () => void;
}

export function ThemeToggle({ dark, onToggle }: ThemeToggleProps) {
  return (
    <button
      type="button"
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={dark}
      onClick={onToggle}
      className="rounded px-2 py-0.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      {dark ? 'Light' : 'Dark'}
    </button>
  );
}
