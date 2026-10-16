import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { FONT_FAMILIES } from './Toolbar';

export interface CharacterDialogProps {
  editor: Editor | null;
  open: boolean;
  onClose: () => void;
}

type Toggle = 'on' | 'off' | 'keep';

interface Draft {
  fontFamily: string;
  fontSize: string;
  color: string;
  bold: Toggle;
  italic: Toggle;
  underline: Toggle;
  strike: Toggle;
}

function currentDraft(editor: Editor | null, open: boolean): Draft {
  if (!open || !editor) {
    return {
      fontFamily: '',
      fontSize: '',
      color: '',
      bold: 'keep',
      italic: 'keep',
      underline: 'keep',
      strike: 'keep',
    };
  }
  const attrs = editor.getAttributes('textStyle') as {
    fontFamily?: string;
    fontSize?: string;
    color?: string;
  };
  return {
    fontFamily: attrs.fontFamily ?? '',
    fontSize: (attrs.fontSize ?? '').replace('px', ''),
    color: attrs.color ?? '',
    bold: 'keep',
    italic: 'keep',
    underline: 'keep',
    strike: 'keep',
  };
}

/** Word-style character formatting dialog applied to the current selection. */
export function CharacterDialog({ editor, open, onClose }: CharacterDialogProps) {
  const [draft, setDraft] = useState<Draft>(() => currentDraft(editor, open));

  useEffect(() => {
    setDraft(currentDraft(editor, open));
  }, [editor, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const set = (patch: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...patch }));
  const toggleLabel = (value: Toggle) => (value === 'on' ? 'On' : value === 'off' ? 'Off' : 'Keep');

  const apply = () => {
    if (!editor) return;
    const chain = editor.chain().focus();
    if (draft.fontFamily) chain.setFontFamily(draft.fontFamily);
    if (draft.fontSize) chain.setFontSize(`${draft.fontSize}px`);
    if (draft.color) chain.setColor(draft.color);
    if (draft.bold === 'on') chain.setBold();
    else if (draft.bold === 'off') chain.unsetBold();
    if (draft.italic === 'on') chain.setItalic();
    else if (draft.italic === 'off') chain.unsetItalic();
    if (draft.underline === 'on') chain.setUnderline();
    else if (draft.underline === 'off') chain.unsetUnderline();
    if (draft.strike === 'on') chain.setStrike();
    else if (draft.strike === 'off') chain.unsetStrike();
    chain.run();
    onClose();
  };

  const toggleRow = (
    key: keyof Pick<Draft, 'bold' | 'italic' | 'underline' | 'strike'>,
    label: string,
  ) => (
    <label className="flex items-center justify-between gap-3 text-xs">
      <span className="text-muted">{label}</span>
      <button
        type="button"
        aria-pressed={draft[key] === 'on'}
        aria-label={`${label} toggle`}
        className={`rounded-md border px-2 py-1 text-xs ${
          draft[key] === 'on'
            ? 'border-accent bg-accent-subtle text-accent'
            : draft[key] === 'off'
              ? 'border-line text-faint'
              : 'border-line text-muted'
        }`}
        onClick={() => {
          const next: Toggle = draft[key] === 'keep' ? 'on' : draft[key] === 'on' ? 'off' : 'keep';
          set({ [key]: next } as Partial<Draft>);
        }}
      >
        {toggleLabel(draft[key])}
      </button>
    </label>
  );

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-6"
      data-testid="character-dialog"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-label="Character formatting"
        className="w-full max-w-sm rounded-xl border border-line bg-raised p-4 shadow-elev2"
      >
        <h2 className="text-sm font-semibold">Character formatting</h2>
        <div className="mt-3 space-y-3">
          <label className="block text-xs">
            <span className="text-muted">Font family</span>
            <select
              aria-label="Font family dialog"
              className="gratis-input mt-1 w-full"
              value={draft.fontFamily}
              onChange={(e) => set({ fontFamily: e.target.value })}
            >
              <option value="">(default)</option>
              {FONT_FAMILIES.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs">
            <span className="text-muted">Size (px)</span>
            <input
              aria-label="Font size dialog"
              type="number"
              min={6}
              max={200}
              className="gratis-input mt-1 w-full"
              value={draft.fontSize}
              onChange={(e) => set({ fontSize: e.target.value })}
            />
          </label>
          <label className="block text-xs">
            <span className="text-muted">Text color</span>
            <input
              aria-label="Text color dialog"
              type="color"
              className="gratis-color-input mt-1"
              value={draft.color || '#1f2328'}
              onChange={(e) => set({ color: e.target.value })}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            {toggleRow('bold', 'Bold')}
            {toggleRow('italic', 'Italic')}
            {toggleRow('underline', 'Underline')}
            {toggleRow('strike', 'Strikethrough')}
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md px-3 py-1.5 text-xs text-muted hover:bg-accent-subtle"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover"
            onClick={apply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
