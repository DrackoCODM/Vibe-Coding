import type { Editor } from '@tiptap/react';
import { EditorContent } from '@tiptap/react';
import { mmToPx, PAGE_SIZES } from '@gratis/shared';
import { useEffect, useMemo, useState } from 'react';
import type { PageOrientation } from '../editor/doc';
import type { Margins } from '../page/margins';
import { computePageLayout, pageForLayout } from '../page/pagination';

export interface EditorPageProps {
  editor: Editor | null;
  pageSize: keyof typeof PAGE_SIZES;
  margins: Margins;
  zoomPercent: number;
  orientation?: PageOrientation;
  columns?: 1 | 2 | 3;
  watermarkText?: string;
  onPageChange?: (current: number, total: number) => void;
}

export function EditorPage({
  editor,
  pageSize,
  margins,
  zoomPercent,
  orientation = 'portrait',
  columns = 1,
  watermarkText = '',
  onPageChange,
}: EditorPageProps) {
  const base = PAGE_SIZES[pageSize];
  const page =
    orientation === 'landscape'
      ? { widthMm: base.heightMm, heightMm: base.widthMm }
      : { widthMm: base.widthMm, heightMm: base.heightMm };
  const pageWidthPx = mmToPx(page.widthMm);
  const pageHeightPx = mmToPx(page.heightMm);
  const margin = {
    top: mmToPx(margins.topMm),
    right: mmToPx(margins.rightMm),
    bottom: mmToPx(margins.bottomMm),
    left: mmToPx(margins.leftMm),
  };
  const usableWidthPx = pageWidthPx - margin.left - margin.right;
  const usableHeightPx = pageHeightPx - margin.top - margin.bottom;
  const zoom = zoomPercent / 100;

  const [, setTick] = useState(0);
  const [contentHeightPx, setContentHeightPx] = useState(0);
  const [breakOffsets, setBreakOffsets] = useState<number[]>([]);
  const layout = useMemo(
    () => computePageLayout(contentHeightPx, usableHeightPx, breakOffsets),
    [contentHeightPx, usableHeightPx, breakOffsets],
  );
  const pageCount = layout.pageCount;

  useEffect(() => {
    if (!editor) return;
    const tick = () => setTick((t) => t + 1);
    editor.on('update', tick);
    return () => {
      editor.off('update', tick);
    };
  }, [editor]);

  useEffect(() => {
    const content = editor?.view.dom;
    if (!content) return;
    const measure = () => {
      setContentHeightPx(content.scrollHeight);
      const breaks = content.parentElement?.querySelectorAll('[data-page-break]');
      setBreakOffsets((prev) => {
        const next = breaks
          ? Array.from(breaks).map(
              (el) => (el as HTMLElement).offsetTop + (el as HTMLElement).offsetHeight,
            )
          : [];
        const stable =
          prev.length === next.length && prev.every((v, i) => Math.abs(v - next[i]) < 1);
        return stable ? prev : next;
      });
    };
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(content);
    const interval = window.setInterval(measure, 500);
    return () => {
      observer?.disconnect();
      window.clearInterval(interval);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor || !onPageChange) return;
    const report = () => {
      try {
        const coords = editor.view.coordsAtPos(editor.state.selection.from);
        const contentTop = editor.view.dom.getBoundingClientRect().top;
        const y = coords.top - contentTop;
        onPageChange(pageForLayout(y, layout.pageStartsPx), pageCount);
      } catch {
        onPageChange(1, pageCount);
      }
    };
    report();
    editor.on('selectionUpdate', report);
    editor.on('update', report);
    return () => {
      editor.off('selectionUpdate', report);
      editor.off('update', report);
    };
  }, [editor, onPageChange, usableHeightPx, pageCount, layout.pageStartsPx]);

  const sheetHeightPx = Math.max(pageHeightPx, pageCount * pageHeightPx);
  const breakLines = layout.naturalBoundariesPx;
  const watermarks = watermarkText
    ? Array.from(
        { length: pageCount },
        (_, i) => margin.top + layout.pageStartsPx[i] + 0.5 * usableHeightPx,
      )
    : [];

  return (
    <div
      className="relative mx-auto"
      style={{ width: pageWidthPx * zoom, height: sheetHeightPx * zoom }}
    >
      <div
        aria-label="Page canvas"
        data-page-size={pageSize}
        data-orientation={orientation}
        data-columns={columns}
        data-page-count={pageCount}
        className="page relative origin-top bg-white shadow-lg dark:bg-gray-100"
        style={{
          width: pageWidthPx,
          minHeight: sheetHeightPx,
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          marginTop: 0,
          paddingLeft: margin.left,
          paddingRight: margin.right,
          paddingTop: margin.top,
          paddingBottom: margin.bottom,
          marginLeft: (pageWidthPx * zoom - pageWidthPx) / 2 / zoom,
        }}
      >
        {watermarks.map((y, i) => (
          <div
            key={`watermark-${i}`}
            aria-hidden="true"
            data-testid="watermark"
            className="pointer-events-none absolute inset-x-0 flex select-none items-center justify-center"
            style={{ top: y - 48 }}
          >
            <span
              className="whitespace-nowrap text-6xl font-bold"
              style={{ transform: 'rotate(-30deg)', color: 'rgb(0 0 0 / 0.07)' }}
            >
              {watermarkText}
            </span>
          </div>
        ))}
        <div
          className="relative"
          data-testid="page-content"
          style={{
            width: usableWidthPx,
            columnCount: columns > 1 ? columns : undefined,
            columnGap: columns > 1 ? '1.5em' : undefined,
          }}
        >
          <EditorContent editor={editor} />
          {breakLines.map((y) => (
            <div
              key={y}
              aria-hidden="true"
              data-testid="page-break"
              className="page-break-marker pointer-events-none absolute left-0 right-0 border-t-2 border-dashed border-blue-300"
              style={{ top: y }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
