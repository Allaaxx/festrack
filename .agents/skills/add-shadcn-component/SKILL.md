---
name: add-shadcn-component
description: >-
  Use this skill whenever the user asks to add, create, or build a new UI component.
  It instructs the agent to first search the shadcn/ui library via context7 to check
  whether an existing shadcn component can be reused or adapted, before writing
  anything from scratch. Activate for any task involving new UI elements such as
  dialogs, forms, tables, pickers, badges, cards, selects, comboboxes, drawers,
  tooltips, or any other visual building block.
---

# Add a shadcn/ui Component

Before writing any new UI component from scratch, always check whether
shadcn/ui already provides a suitable base. This project already uses
shadcn/ui (`base-nova` style, `neutral` base, cssVariables enabled) so
any shadcn component will integrate seamlessly.

---

## Steps

### 1. Resolve the shadcn/ui library ID via context7

Call the `resolve-library-id` MCP tool with the query `"shadcn/ui"` to get
the context7-compatible library ID needed for documentation queries.

### 2. Search shadcn/ui docs for the desired component

Call the `query-docs` MCP tool using the resolved library ID with a topic
that matches what the user needs (e.g., `"combobox"`, `"data table"`,
`"date picker"`, `"alert dialog"`).

Read the returned documentation carefully to understand:
- The component's anatomy (which subcomponents it exports)
- The install command: `npx shadcn@latest add <component-name>`
- Required peer dependencies (if any beyond what's already installed)
- Props, variants, and usage patterns
- Accessibility considerations

### 3. Check if the component is already installed

Inspect `src/components/ui/` — if a matching file already exists, skip
the install step. The existing file is the base; modify or extend it
only if the user's use case requires a structural change.

### 4. Install the component (if not already present)

Run the shadcn CLI to scaffold the base component:

```bash
npx shadcn@latest add <component-name>
```

This writes the component file to `src/components/ui/<component-name>.jsx`
and installs any required peer packages.

Verify the file was created:

```bash
ls src/components/ui/<component-name>.jsx
```

### 5. Adapt the component to the user's goal

Create a feature-level wrapper at `src/components/<feature-name>.jsx` that:

- Imports the base shadcn component from `@/components/ui/<component>`.
- Applies project conventions:
  - Labels and user-facing text in **Portuguese (BR)**.
  - Use `cn()` from `@/lib/utils` for conditional / composed class merging.
  - Use `lucide-react` for all icons.
  - Apply Tailwind utility classes for layout and spacing.
- Wire up any necessary integrations:
  - **Form fields**: wrap with `<Controller>` + `<Field>`, `<FieldLabel>`, `<FieldError>` from `@/components/ui/field`.
  - **Data fetching**: use the appropriate TanStack Query hook from `src/api/hooks/`.
  - **Loading states**: use `<Loader2Icon className="animate-spin" />` from `lucide-react`.

### 6. Verify

```bash
# Check for lint errors
npm run lint

# Start the dev server and visually confirm the component
npm run dev
```

Confirm the component renders correctly and integrates without errors.

---

## Project Context Reminders

- **shadcn config**: `components.json` at project root (`style: base-nova`, `baseColor: neutral`, `cssVariables: true`, `iconLibrary: lucide`).
- **UI primitives location**: `src/components/ui/` — this is where shadcn drops installed components.
- **Feature components location**: `src/components/` — this is where you create the wrapper.
- **Path alias**: use `@/` instead of relative paths crossing multiple levels.
