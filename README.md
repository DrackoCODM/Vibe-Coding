# Project Gratis

**Status:** Draft MVP implemented (browser). Grid, Deck, and desktop packaging are not started.

## Purpose

Project Gratis is a suite of free, offline-first office applications. The first application, **GratisDraft**, is a free word processor built with TypeScript, React 18, Tailwind CSS, and [TipTap](https://tiptap.dev) (ProseMirror). Desktop packaging via Tauri is planned but not yet set up.

## Applications

- **Draft** (`apps/draft/`) — **implemented**: rich text word processor with page view, file save/open/import/export, find/replace, and auto-save. Runs in the browser today.
- **Grid** (`apps/grid/`) — not started.
- **Deck** (`apps/deck/`) — not started.

### What Draft can do

- Text formatting: headings (1–6), bold/italic/underline/strikethrough, font family/size, text and highlight color, alignment, line spacing, lists (bullet/numbered/task), blockquotes, links, subscript/superscript, undo/redo.
- Tables: insert, add/delete rows and columns, merge/split cells, cell shading.
- Images: insert from file (with paste/drop), resize, align left/center/right.
- Page view: A4/Letter sizes, margin presets (normal/moderate/narrow/wide), zoom levels, page-break indicators, live page count.
- Horizontal ruler reflecting page size, margins, and zoom.
- Files: native Save/Open via the File System Access API (with download/input fallback); import Markdown, HTML, plain text, and Word (.docx); export to .gdraft, .docx, Markdown, HTML, plain text, and PDF (via print).
- Find & replace (Ctrl+F / Ctrl+H) with match case and whole-word options.
- Word and character count, document auto-save (5 s idle) to the open file and local storage recovery.
- Dark/light theme, keyboard shortcuts (Ctrl+S/O/N/P/F/H), basic accessibility (labels, roles, focus rings).

### Known limitations

- .docx fidelity is basic (mammoth import; tables export as pipe-joined text lines).
- No headers/footers, footnotes, table of contents, or spellcheck yet.
- Browser-first; Tauri desktop builds not set up.

## Shared Packages

- **shared** (`packages/shared/`) — app names, page sizes, unit conversion, file-type constants.
- **ui** (`packages/ui/`) — shared UI primitives (ToolbarButton, ToolbarSeparator).
- **file-core** (`packages/file-core/`) — document serialization (.gdraft), Markdown/HTML/text conversion, .docx import/export, ProseMirror-to-blocks conversion.

## Getting Started

Requirements: Node.js 20+, [pnpm](https://pnpm.io) 9+.

```bash
pnpm install
pnpm dev        # start Draft at the Vite dev server URL
pnpm build      # build all packages and Draft
pnpm test       # run all test suites (Vitest)
pnpm typecheck  # TypeScript, all workspaces
pnpm lint       # ESLint, all workspaces
pnpm format     # Prettier write
```

## Documentation

See [docs/ROADMAP.md](docs/ROADMAP.md) for the development order and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the workspace is organized.
