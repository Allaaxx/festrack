# Festrack — Agent Rules

## Project Overview

Festrack is a personal finance tracker built with React 19 and Vite.
The UI language is **Portuguese (BR)**. Always generate UI text, labels, and user-facing strings in Portuguese (BR).

---

## Context Pointers

Consult these sources of truth when designing, implementing, or reviewing features:

- **Coding standards & patterns:** [`CODING_STANDARDS.md`](CODING_STANDARDS.md) — Architectural patterns, API services, TanStack Query hooks, form hooks, Context, and Fowler smells baseline.
- **Domain glossary:** [`GLOSSARY.md`](GLOSSARY.md) — Ubiquitous language, core entities, and financial terminology.
- **Architectural decisions:** [`docs/adr/`](docs/adr/) — ADR records documenting structural choices.
- **Backend API reference:** [`.agents/API.md`](.agents/API.md) and live sibling route implementations in `../festrack-api`.
- **Worktree setup:** Run `npm run setup:worktree` after creating a new git worktree to symlink `node_modules` from the main checkout.

---

## Directory Structure

Festrack follows a **Feature-First (Vertical Slices)** architecture. Domain-specific code lives within feature modules, while global and generic primitives live at the root.

```
src/
├── api/             # Global API services & hooks (e.g. cross-cutting auth)
├── assets/          # Static brand assets and SVGs
├── components/
│   ├── auth/        # Modular authentication forms
│   ├── layout/      # App shell: sidebar, header, DashboardLayout, AuthSplitLayout
│   ├── shared/      # Cross-feature reusable composite components (e.g. PasswordInput)
│   └── ui/          # shadcn/ui base primitives (@base-ui/react)
├── constants/       # App-wide constants and enums
├── contexts/        # Global React contexts (AuthContext, ShopContext)
├── features/        # Feature modules (Vertical Slices)
│   ├── events/      # Event domain: api, components, forms, helpers, public index.js
│   └── finances/    # Finances & Transactions domain: api, components, forms, public index.js
├── forms/           # Global forms (e.g. auth schemas/hooks)
├── helpers/         # Pure global utility functions (currency, dates, formatters)
├── hooks/           # General-purpose custom React hooks
├── lib/             # Shared singletons: Axios instance, cn() utility, authClient
└── pages/           # Route-level page components (minimal logic, assembling features)
```

### Feature Module Structure (`src/features/<feature>/`)

Each feature module is encapsulated:

```
src/features/<feature>/
├── api/             # Domain TanStack Query hooks & Axios services
├── components/      # Domain UI components (buttons, dialogs, tables, charts, cards)
├── forms/           # Domain Zod schemas & form hooks
├── helpers/         # Domain-specific helpers (optional)
└── index.js         # Public API: only what is exported here can be imported by other features/pages
```

**Boundary Rule:** Never import deep paths from another feature (e.g. `import ... from '@/features/events/components/event-combobox'`). Always import through the public index: `import { EventCombobox } from '@/features/events'`.

---

## Component Conventions

- **Base UI Primitives (CRITICAL):** This project uses shadcn with `@base-ui/react`, NOT Radix UI.
  - **NEVER use `asChild`.** It does not exist in Base UI and will cause runtime errors or broken markup.
  - Use the `render` prop for element composition: e.g. `<SidebarMenuButton render={<Link to={to} />} isActive={isActive}>` or `<DialogTrigger render={<Button>Abrir</Button>} />`.
  - **shadcn blocks / templates safety:** When adopting shadcn blocks or templates, NEVER run `npx shadcn add <block>` without `--dry-run`. Third-party blocks often pull in standard Radix primitives that can destructively overwrite our `@base-ui/react` primitives. Always inspect changes or adapt block structures manually.
- **File naming**: `kebab-case.jsx` for all components.
- **Export style**: `default export` for page and feature components; named exports for UI primitives.
- **Icons**: Always use `lucide-react` — it is the configured icon library for shadcn.
- **Class merging**: Use `cn()` from `@/lib/utils` (`clsx` + `tailwind-merge`) for any conditional or composed class strings.
- **shadcn first**: Before creating a new UI primitive, check if shadcn/ui already has one — use the `add-shadcn-component` skill.
- **No TypeScript**: Use plain `.js`/`.jsx`. Add JSDoc where types are non-obvious.
- **Async loading states**: Use `<Loader2Icon className="animate-spin" />` from lucide-react as the standard loading indicator.

---

## Coding Conventions

- **Indentation**: 2 spaces (Prettier enforced).
- **Quotes**: Single quotes (Prettier enforced).
- **Semicolons**: Always (Prettier enforced).
- **Import order**: Auto-sorted by `eslint-plugin-simple-import-sort`. Order: external packages → internal `@/` aliases → relative imports. Do not manually reorder — let the linter handle it.
- **Path aliases**: Always use the `@/` alias instead of relative imports that traverse more than one level up.
- **Tailwind class order**: Managed by `prettier-plugin-tailwindcss` — do not manually sort classes.
- **Language**: All user-facing strings must be in **Portuguese (BR)**.

---

## Commit Convention

Commits are linted by `git-commit-msg-linter`. Follow the Conventional Commits spec:

```
feat:      New feature
fix:       Bug fix
refactor:  Code refactor (no behavior change)
chore:     Tooling, deps, config
docs:      Documentation only
style:     Formatting, whitespace (no logic change)
test:      Adding or updating tests
```

---

## Key Path Alias

| Alias | Resolves to |
| ----- | ----------- |
| `@/`  | `src/`      |

Example: `import { cn } from '@/lib/utils'`

---

## Agent Skills & Workflows

### Issue Tracker

GitHub Issues via `gh` CLI. See [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md).

### Triage Labels

Canonical five-role triage labels (`needs-triage`, `needs-info`, etc.). See [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md).

### Domain Docs

Single-context (`GLOSSARY.md` and `docs/adr/` at repo root). See [`docs/agents/domain.md`](docs/agents/domain.md).
