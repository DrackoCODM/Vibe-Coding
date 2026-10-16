# Roadmap

Development is planned in the following order. Nothing below is claimed as done unless explicitly checked.

## Phase 1 — Repository Foundation

- [x] Establish repository folder structure
- [x] Add foundational documentation (README, ARCHITECTURE, ROADMAP, CONTRIBUTING, .gitignore)

## Phase 2 — Draft

- [x] Scaffold Draft application (Vite 7, React 18, Tailwind, TipTap v3, Vitest)
- [x] Implement core Draft features:
  - [x] Rich text formatting, headings, lists, links, alignment
  - [x] Tables and images (insert, resize, align, cell shading)
  - [x] Page view (sizes, margins, zoom, page breaks, ruler)
  - [x] File save/open (.gdraft), import (md/html/txt/docx), export (docx/md/html/txt/pdf)
  - [x] Find & replace, word count, keyboard shortcuts, auto-save
  - [x] Dark/light theme, basic accessibility
- [x] Word-parity feature wave:
  - [x] Document-level settings (orientation landscape/portrait, 1–4 columns, watermark text)
  - [x] Manual page breaks (Ctrl/Cmd+Enter) with break-aware pagination
  - [x] Headers and footers (dialog + per-page rendering + .docx section headers/footers)
  - [x] Footnotes (inline references, notes panel, .docx footnotes)
  - [x] Comments (highlight marks, resolve/delete, .gdraft persistence)
  - [x] Table of contents (auto-generated block refreshed on every update)
  - [x] Style presets (Title, Subtitle, Normal, Quote, Code, lists) + character formatting dialog
  - [x] Captions (Figure/Table, auto-numbered), bookmarks and cross-references (auto-refreshed labels)
  - [x] Inline citations [n] with auto-formatted Bibliography block
  - [x] Menu reorganization (File/Edit/Insert/Format/View/Help) + two-tier toolbar
  - [x] Left panel (Outline/Styles) and right panel (Comments/References)
  - [x] Status bar: zoom slider (50–200%), Saved/Unsaved state
- Remaining (not done): spellcheck, higher-fidelity .docx round-trip, endnotes, mail merge, track changes (P4)

## Phase 3 — Grid

- [ ] Scaffold Grid application
- [ ] Implement core Grid features

## Phase 4 — Deck

- [ ] Scaffold Deck application
- [ ] Implement core Deck features

## Phase 5 — Browser / Windows Support

- [x] Ensure applications run in the browser (Draft runs via Vite; Grid/Deck not started)
- [ ] Package desktop builds for Windows (Tauri)

## Phase 6 — Testing

- [x] Establish automated test suite across packages and apps (Vitest unit/integration tests; manual UI QA still needed for print output and File System Access flows)

## Phase 7 — Optional AI Features (later)

- [ ] Explore optional AI-assisted features across the applications
