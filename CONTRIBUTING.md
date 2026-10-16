# Contributing to Project Gratis

Thanks for your interest in contributing! Please read this before opening pull requests.

## Current State

The repository contains an implemented **Draft** application (`apps/draft/`) with shared packages (`packages/shared`, `packages/ui`, `packages/file-core`). Grid, Deck, and Tauri packaging are not started. See [docs/ROADMAP.md](docs/ROADMAP.md) for planned work.

## Guidelines

1. **Preserve existing structure.** Do not remove or rename top-level directories without discussion.
2. **No unsolicited scaffolding.** Do not add framework configuration, dependencies, or application code unless it is part of an agreed roadmap phase.
3. **Keep documentation honest.** If a feature is planned but not implemented, documentation must say so.
4. **Small, focused changes.** Prefer one concern per pull request.
5. **Match existing style** for Markdown documentation (clear headings, concise prose) and TypeScript (strict mode, no `any` unless justified, no dead placeholder code).

## Getting Started

Requirements: Node.js 20+, pnpm 9+.

```bash
pnpm install
pnpm dev        # run Draft locally
pnpm test       # all test suites
pnpm typecheck  # TypeScript across workspaces
pnpm lint       # ESLint across workspaces
pnpm format     # Prettier write
```

A change is ready when `pnpm typecheck`, `pnpm test`, and `pnpm lint` all pass.

## Dependencies

Only freely licensed dependencies (MIT/Apache/BSD/ISC etc.). No telemetry, no paid services, offline-capable by default.

## Reporting Issues

Open an issue with a clear description of the problem or proposal. Label it appropriately once issue labels exist.
