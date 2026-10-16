# Architecture

This document describes the **intended** architecture of Project Gratis. Nothing described here is implemented yet.

## Overview

Project Gratis is planned as a monorepo containing three applications and three shared packages, ultimately targeting desktop builds via Tauri (with a browser-capable web layer).

## Applications (`apps/`)

Each application is planned as an independent deployable, sharing code through the `packages/` workspace.

### Draft (`apps/draft/`)

Planned application focused on drafting/writing workflows.

### Grid (`apps/grid/`)

Planned application focused on grid-based organization and browsing of items.

### Deck (`apps/deck/`)

Planned application focused on deck/slide-style presentations of content.

## Shared Packages (`packages/`)

### shared (`packages/shared/`)

Planned home for utilities, types, and constants shared across all three applications.

### ui (`packages/ui/`)

Planned shared UI component library so Draft, Grid, and Deck can share a consistent look and feel.

### file-core (`packages/file-core/`)

Planned core file-handling logic (reading, writing, importing, exporting) shared by the applications.

## Other Directories

- `docs/` — project documentation.
- `assets/` — icons, fonts, and branding material.
- `scripts/` — planned build and developer tooling scripts.
- `tests/` — planned cross-package tests.

## Implementation Note

All of the above is aspirational. Implementation order is tracked in [ROADMAP.md](ROADMAP.md).
