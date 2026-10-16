import type { Editor } from '@tiptap/react';
import { EditorContent } from '@tiptap/react';
import { mmToPx, PAGE_SIZES } from '@gratis/shared';
import { useEffect, useState } from 'react';
import type { Margins } from '../page/margins';
import { computePageCount, pageForOffset } from '../page/pagination';

export interface EditorPageProps {
  editor: Editor | null;
  pageSize: keyof typeof PAGE_SIZES;
  margins: Margins;
  zoomPercent: number;
  onPageChange?: (current: number, total: number) => void;
}

export function EditorPage({
  editor,
  pageSize,
  margins,
  zoomPercent,
  onPageChange,
}: EditorPageProps) {
  const page = PAGE_SIZES[pageSize];
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

  const [contentHeightPx, setContentHeightPx] = useState(0);
  const pageCount = computePageCount(contentHeightPx, usableHeightPx);

  useEffect(() => {
    const content = editor?.view.dom;
    if (!content) return;
    const measure = () => setContentHeightPx(content.scrollHeight);
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
        onPageChange(pageForOffset(y, usableHeightPx, pageCount), pageCount);
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
  }, [editor, onPageChange, usableHeightPx, pageCount]);

  const sheetHeightPx = Math.max(pageHeightPx, pageCount * pageHeightPx);
  const breakLines = Array.from(
    { length: Math.max(0, pageCount - 1) },
    (_, i) => (i + 1) * usableHeightPx,
  );

  return (
    <div
      className="relative mx-auto"
      style={{ width: pageWidthPx * zoom, height: sheetHeightPx * zoom }}
    >
      <div
        aria-label="Page canvas"
        data-page-size={pageSize}
        data-page-count={pageCount}
        className="relative origin-top bg-white shadow-lg dark:bg-gray-100"
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
        <div className="relative" data-testid="page-content" style={{ width: usableWidthPx }}>
          <EditorContent editor={editor} />
          {breakLines.map((y) => (
            <div
              key={y}
              aria-hidden="true"
              data-testid="page-break"
              className="pointer-events-none absolute left-0 right-0 border-t-2 border-dashed border-blue-300"
              style={{ top: y }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
