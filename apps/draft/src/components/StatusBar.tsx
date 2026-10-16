export interface StatusBarProps {
  wordCount: number;
  charCount?: number;
  currentPage: number;
  pageCount: number;
  zoomPercent?: number;
  /** Show a slider instead of the read-only zoom label. */
  onZoomChange?: (percent: number) => void;
  /** Document save state shown near the word count. */
  docState?: string;
}

export function StatusBar({
  wordCount,
  charCount,
  currentPage,
  pageCount,
  zoomPercent,
  onZoomChange,
  docState,
}: StatusBarProps) {
  return (
    <footer
      aria-label="Status bar"
      className="flex items-center justify-between border-t border-line bg-raised px-3 py-1 text-2xs text-faint"
    >
      <div className="flex items-center gap-3" data-testid="status-feedback" />
      <div className="flex items-center gap-3">
        {docState && (
          <span data-testid="doc-state" className="tabular-nums">
            {docState}
          </span>
        )}
        {zoomPercent !== undefined && onZoomChange && (
          <input
            aria-label="Zoom slider"
            data-testid="zoom-slider"
            type="range"
            min={50}
            max={200}
            step={10}
            value={zoomPercent}
            className="w-24 accent-[rgb(var(--accent))]"
            onChange={(e) => onZoomChange(Number(e.target.value))}
          />
        )}
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
