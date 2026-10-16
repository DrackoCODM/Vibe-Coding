# Architecture

This document describes the structure of Project Gratis. Implemented parts are described as-is; planned parts are marked as such.

## Overview

Project Gratis is a pnpm workspace monorepo. The implemented application, **Draft**, is a browser word processor built on TipTap v3 (ProseMirror) with React 18 and Tailwind CSS. Desktop packaging via Tauri is planned but not implemented. Grid and Deck are planned applications that do not exist yet.

## Workspace Layout

```
apps/draft/        GratisDraft — implemented
packages/shared/   constants & helpers — implemented
packages/ui/       shared UI primitives — implemented (small)
packages/file-core/ file format logic — implemented
docs/              project documentation
assets/            reserved for icons/branding (empty)
scripts/           reserved for tooling (empty)
tests/             reserved for cross-package tests (empty)
```

## Draft Application (`apps/draft/`)

- `src/App.tsx` — root state (theme, page setup, doc settings, find bar, panels, dialogs), keyboard shortcuts, menu definitions (File/Edit/Insert/Format/View/Help), derived-data effects (ToC, cross-refs, bibliography auto-refresh), word-count tracking.
- `src/components/` — UI: `MenuBar` (dropdown menus with separators), `Toolbar` (two-tier formatting controls), `PageSetupBar` (size/margins/zoom/orientation/columns/watermark), `Ruler`, `EditorPage` (paginated page canvas with watermarks, headers/footers, footnote strips), `FindBar`, `StatusBar` (zoom slider + doc state), `ThemeToggle`.
- `src/components/dialogs + panels` — `CharacterDialog`, `HeaderFooterDialog`, `FootnotesDialog`, `CommentsDialog`, `CrossRefDialog`, `CitationDialog`, `AboutDialog`; `LeftSidebar` (Outline/Styles), `RightSidebar` (Comments/References).
- `src/editor/` — TipTap setup: `extensions.ts` (canonical extension list), `doc.ts` (doc-node attrs: orientation/columns/watermark/headers/footnotes/comments via `DocAttrStep`), `pageBreak.ts`, `footnotes.ts`, `comments.ts`, `captions.ts`, `bookmarks.ts` (bookmarks + cross-refs), `citations.ts` (citations + bibliography), `toc.ts`, `styles.ts` (presets), `tables.ts`, `images.ts`, `stats.ts` (word/character counting).
- `src/page/` — pagination math (`pagination.ts`, break-aware `computePageLayout`), margin presets (`margins.ts`).
- `src/files/` — file I/O: `io.ts` (pickers, downloads), `importContent.ts` (format detection → editor content), `useFileHandlers.ts` (save/open/export state hook, auto-save; .docx export passes header/footer/orientation/footnotes).
- `src/find/` — `findReplace.ts`: match finding over ProseMirror text nodes, navigation, replace.

Key technologies: TipTap v3 with StarterKit (custom `GratisDoc` doc-attrs), TextStyleKit, tables, image (with resize), custom find/replace (no third-party search extension), CSS counters for footnote/figure/table/citation numbering. File formats handled by `@gratis/file-core` using marked/turndown (Markdown), mammoth (docx→HTML), docx (blocks→docx incl. headers, footers, footnotes, orientation).

## Shared Packages

- `packages/shared/` — app names, `.gdraft` extension/MIME type, page sizes (A4/Letter in mm), `mmToPx`, `clamp`.
- `packages/ui/` — `ToolbarButton` (with `aria-pressed` active state), `ToolbarSeparator`. Styling via the app's Tailwind layer (`.gratis-toolbar-button`).
- `packages/file-core/` — format-agnostic file logic, no TipTap/React dependency:
  - `types.ts` / `gdraft.ts` — `.gdraft` document model (versioned JSON) with parse/serialize.
  - `markdown.ts` / `text.ts` — Markdown and plain-text conversions.
  - `docx.ts` — docx import (mammoth) and export (docx package) via intermediate `ExportBlock[]`.
  - `pm.ts` — ProseMirror JSON → `ExportBlock[]` converter.
  - `file-detect.ts` — extension-based import format detection.

## Testing

Vitest per workspace (jsdom for UI packages). Tests cover pure logic (pagination, find/replace math, file conversions) and component/hook behavior (Toolbar state, File System Access save flow with a mocked `showSaveFilePicker`, download exports with mocked `URL.createObjectURL`). Print output and real browser file pickers still need manual QA.

## Planned (Not Implemented)

- `apps/grid/`, `apps/deck/` — future applications.
- Tauri desktop packaging for Windows.
- Cross-package integration tests in `tests/`.
- Track changes, mail merge, endnotes, spellcheck; higher-fidelity .docx round-trip; .docx export for comments/columns/watermarks/ToC/bibliography.
