import { ToolbarButton, ToolbarSeparator } from '@gratis/ui';

export function Toolbar() {
  return (
    <div
      role="toolbar"
      aria-label="Formatting"
      className="flex items-center gap-1 border-b border-gray-300 bg-white px-3 py-1 dark:border-gray-700 dark:bg-gray-900"
    >
      {/* TODO(step-3): wire these to the TipTap editor instance */}
      <ToolbarButton aria-label="Bold" disabled>
        B
      </ToolbarButton>
      <ToolbarButton aria-label="Italic" disabled>
        I
      </ToolbarButton>
      <ToolbarButton aria-label="Underline" disabled>
        U
      </ToolbarButton>
      <ToolbarSeparator />
      <ToolbarButton aria-label="Undo" disabled>
        ↶
      </ToolbarButton>
      <ToolbarButton aria-label="Redo" disabled>
        ↷
      </ToolbarButton>
    </div>
  );
}
