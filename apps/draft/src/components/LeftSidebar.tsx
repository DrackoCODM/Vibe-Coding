import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import type { Node as ProsemirrorNode } from '@tiptap/pm/model';
import { STYLE_PRESETS } from '../editor/styles';

export interface OutlineEntry {
  text: string;
  level: number;
  pos: number;
}

export function findHeadingsWithPos(doc: ProsemirrorNode): OutlineEntry[] {
  const out: OutlineEntry[] = [];
  doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      out.push({ text: node.textContent || '(empty)', level: Number(node.attrs.level), pos });
    }
  });
  return out;
}

export interface LeftSidebarProps {
  editor: Editor | null;
  tab: 'outline' | 'styles';
  onTabChange: (tab: 'outline' | 'styles') => void;
  onClose: () => void;
}

/** Left panel: document outline navigation or style presets. */
export function LeftSidebar({ editor, tab, onTabChange, onClose }: LeftSidebarProps) {
  const [outline, setOutline] = useState<OutlineEntry[]>([]);

  useEffect(() => {
    if (!editor) return;
    const refresh = () => setOutline(findHeadingsWithPos(editor.state.doc));
    refresh();
    editor.on('update', refresh);
    editor.on('selectionUpdate', refresh);
    return () => {
      editor.off('update', refresh);
      editor.off('selectionUpdate', refresh);
    };
  }, [editor]);

  return (
    <aside
      aria-label="Left sidebar"
      data-testid="left-sidebar"
      className="flex w-56 shrink-0 flex-col border-r border-line bg-raised"
    >
      <div className="flex border-b border-line" role="tablist" aria-label="Left panel tabs">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'outline'}
          className={`flex-1 py-2 text-xs font-medium ${
            tab === 'outline' ? 'bg-accent-subtle text-accent' : 'text-muted hover:text-ink'
          }`}
          onClick={() => onTabChange('outline')}
        >
          Outline
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'styles'}
          className={`flex-1 py-2 text-xs font-medium ${
            tab === 'styles' ? 'bg-accent-subtle text-accent' : 'text-muted hover:text-ink'
          }`}
          onClick={() => onTabChange('styles')}
        >
          Styles
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {tab === 'outline' ? (
          <div className="space-y-0.5">
            {outline.length === 0 && (
              <p className="px-1 py-2 text-2xs text-faint">
                No headings yet. Apply Heading styles to build the outline.
              </p>
            )}
            {outline.map((entry, index) => (
              <button
                key={`${entry.pos}-${index}`}
                type="button"
                data-testid={`outline-entry-${index}`}
                className="block w-full truncate rounded-md px-2 py-1 text-left text-xs text-muted hover:bg-accent-subtle hover:text-ink"
                style={{ paddingLeft: 8 + (Math.min(entry.level, 6) - 1) * 12 }}
                title={entry.text}
                disabled={!editor}
                onClick={() => {
                  if (!editor) return;
                  editor
                    .chain()
                    .focus()
                    .setTextSelection(entry.pos + 1)
                    .scrollIntoView()
                    .run();
                }}
              >
                {entry.text}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-0.5">
            {STYLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                data-testid={`preset-${preset.id}`}
                className="block w-full rounded-md px-2 py-1.5 text-left text-xs text-muted hover:bg-accent-subtle hover:text-ink"
                disabled={!editor}
                onClick={() => editor && preset.apply(editor)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="border-t border-line p-1.5">
        <button
          type="button"
          aria-label="Close left panel"
          className="w-full rounded-md px-2 py-1 text-2xs text-faint hover:bg-accent-subtle"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </aside>
  );
}
