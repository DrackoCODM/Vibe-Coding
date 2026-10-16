export interface StatusBarProps {
  wordCount: number;
  charCount?: number;
  currentPage: number;
  pageCount: number;
  zoomPercent?: number;
}

export function StatusBar({
  wordCount,
  charCount,
  currentPage,
  pageCount,
  zoomPercent,
}: StatusBarProps) {
  return (
    <footer
      aria-label="Status bar"
      className="flex items-center justify-between border-t border-line bg-raised px-3 py-1 text-2xs text-faint"
    >
      <div className="flex items-center gap-3" data-testid="status-feedback" />
      <div className="flex items-center gap-3">
        {zoomPercent !== undefined && (
          <span data-testid="zoom-level" className="tabular-nums">
            {zoomPercent}%
          </span>
        )}
        <span data-testid="page-indicator" className="tabular-nums">
          Page {currentPage} of {pageCount}
        </span>
        <span className="h-3 w-px bg-line" aria-hidden="true" />
        <span data-testid="word-count" className="tabular-nums">
          {wordCount} words
        </span>
        {charCount !== undefined && (
          <span data-testid="char-count" className="tabular-nums">
            {charCount} characters
          </span>
        )}
      </div>
    </footer>
  );
}
