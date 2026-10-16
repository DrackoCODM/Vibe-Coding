export interface StatusBarProps {
  wordCount: number;
}

export function StatusBar({ wordCount }: StatusBarProps) {
  return (
    <footer
      aria-label="Status bar"
      className="flex items-center justify-end border-t border-gray-300 bg-white px-3 py-1 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
    >
      <span data-testid="word-count">{wordCount} words</span>
    </footer>
  );
}
