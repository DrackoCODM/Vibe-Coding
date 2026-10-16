import { Sun, Moon } from 'lucide-react';

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
      title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="gratis-focus-ring inline-flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors duration-fast hover:bg-ink/5 hover:text-ink"
    >
      {dark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
