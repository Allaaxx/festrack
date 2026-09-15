# Festrack — Agent Rules

## Project Overview

Festrack is a personal finance tracker built with React 19 and Vite.
The UI language is **Portuguese (BR)**. Always generate UI text, labels,
and user-facing strings in Portuguese (BR).

---

## Tech Stack

| Category | Library / Tool | Version |
|---|---|---|
| Framework | React | 19 |
| Build | Vite | 8 |
| Language | JavaScript (JSX) | — no TypeScript |
| Styling | Tailwind CSS | v4 |
| UI Primitives | shadcn/ui (`base-nova` style, `neutral` base, cssVariables) | — |
| Icons | lucide-react | — |
| Server State | TanStack Query | v5 |
| HTTP Client | Axios (configured instance at `@/lib/axios`) | — |
| Forms | react-hook-form + Zod v4 + `@hookform/resolvers` | — |
| Routing | React Router | v8 |
| Charts | Recharts | v3 |
| Tables | TanStack Table | v9 |
| Date utilities | date-fns + react-day-picker | v4 / v10 |
| Number formatting | react-number-format | v5 |
| Linting | ESLint 10 + `eslint-plugin-simple-import-sort` + `eslint-config-prettier` | — |
| Formatting | Prettier (`singleQuote`, `semi`, `tabWidth: 2`, `prettier-plugin-tailwindcss`) | — |
| Git Hooks | Husky + lint-staged + git-commit-msg-linter | — |

---

## Directory Structure

```
src/
├── api/
│   ├── hooks/       # TanStack Query hooks (useQuery / useMutation wrappers)
│   └── services/    # Plain service objects with Axios calls
├── components/
│   ├── ui/          # shadcn/ui base components — adapt only when necessary
│   └── *.jsx        # Feature / composite components
├── contexts/        # React contexts (createContext + Provider + custom hook)
├── constants/       # App-wide string/value constants
├── forms/
│   ├── hooks/       # useForm wrappers that wire schema + mutation
│   └── schemas/     # Zod schemas for form validation
├── helpers/         # Pure utility functions (no side effects)
├── hooks/           # General-purpose custom React hooks
├── lib/             # Shared singletons: Axios instance, cn() utility
├── pages/           # Route-level page components
└── assets/          # Static assets (images, SVGs via vite-plugin-svgr)
```

---

## Architectural Patterns

### 1. API Layer

**Service** (`src/api/services/<domain>.js`)
- Plain object with `async` methods.
- Each method calls `protectedApi` (the configured Axios instance from `@/lib/axios`) and returns `response.data`.
- Include JSDoc comments on every method documenting the expected `input` shape.

```js
// Example pattern
const FooService = {
  /** @param {{ name: string }} input */
  create: async (input) => {
    const response = await protectedApi.post('/foo', { name: input.name });
    return response.data;
  },
};

export default FooService;
```

**Hook** (`src/api/hooks/<domain>.js`)
- Wraps TanStack Query `useQuery` / `useMutation`.
- Export a `get*QueryKey({ userId, ...params })` function for cache key management.
- Mutations invalidate related queries in `onSuccess`.
- Hooks that need the current user read from `useAuthContext()`.

```js
// Example pattern
export const getFooQueryKey = ({ userId }) => ['getFoo', userId];

export const useGetFoo = () => {
  const { user } = useAuthContext();
  return useQuery({
    queryKey: getFooQueryKey({ userId: user.id }),
    queryFn: () => FooService.getAll(),
  });
};
```

---

### 2. Form Pattern

1. **Schema** (`src/forms/schemas/<domain>.js`): Zod schema, exported as `<action><Domain>FormSchema`.
2. **Form Hook** (`src/forms/hooks/<domain>.js`): `useForm` wired with `zodResolver` + the appropriate mutation.
   - Accepts `{ onSuccess, onError }` callbacks.
   - Returns `{ form, onSubmit }`.
3. **Component**: Uses `<Controller>` render prop. Field wrappers come from `@/components/ui/field`:
   `<Field>`, `<FieldLabel>`, `<FieldError>`, `<FieldGroup>`.

```jsx
// Example pattern
<Controller
  name="fieldName"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor="fieldName">Rótulo</FieldLabel>
      <Input {...field} id="fieldName" aria-invalid={fieldState.invalid} />
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

---

### 3. Context Pattern

- Always export three things: `FooContext`, `useFooContext`, `FooContextProvider`.
- Initialize `createContext` with sensible defaults so consumers never receive `undefined`.

```jsx
export const FooContext = createContext({ value: null });
export const useFooContext = () => useContext(FooContext);
export const FooContextProvider = ({ children }) => { /* ... */ };
```

---

## Component Conventions

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
|---|---|
| `@/` | `src/` |

Example: `import { cn } from '@/lib/utils'`
