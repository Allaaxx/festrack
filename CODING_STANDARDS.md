# Festrack Coding Standards & Architectural Patterns

This document defines the architectural patterns, implementation standards, and code review heuristics for the Festrack codebase.

---

## 1. Architecture Overview & Vertical Slices

Festrack follows a **Feature-First (Vertical Slices)** architecture. Domain-specific features are organized as self-contained modules, while generic infrastructure and presentation primitives live in shared directories.

```
src/
├── api/             # Global cross-cutting API services & hooks (e.g. auth)
├── assets/          # Static brand assets and SVGs
├── components/
│   ├── auth/        # Modular authentication forms
│   ├── layout/      # App shell: sidebar, header, DashboardLayout, AuthSplitLayout
│   ├── shared/      # Cross-feature composite components (e.g. PasswordInput)
│   └── ui/          # shadcn/ui primitives (@base-ui/react)
├── constants/       # Global constants and enums
├── contexts/        # Global React contexts (AuthContext, ShopContext, etc.)
├── features/        # Feature modules (Vertical Slices)
│   ├── events/      # Event domain: api, components, forms, helpers, public index.js
│   └── finances/    # Finances & Transactions domain: api, components, forms, public index.js
├── forms/           # Global forms (e.g. auth schemas/hooks)
├── helpers/         # Pure global utility functions (currency, dates, formatters)
├── hooks/           # General-purpose custom React hooks
├── lib/             # Shared singletons (axios instances, cn utility, authClient)
└── pages/           # Route-level page components (minimal logic, assembling features)
```

### Feature Module Structure (`src/features/<feature>/`)

Each vertical slice encapsulates its domain logic:

```
src/features/<feature>/
├── api/             # Domain TanStack Query hooks & Axios services
├── components/      # Domain UI components (tables, dialogs, cards, charts)
├── forms/           # Domain Zod schemas & form hooks
├── helpers/         # Domain-specific pure helpers & formatters (optional)
└── index.js         # Public API: explicit barrel export
```

### The Feature Boundary Rule

> [!IMPORTANT]
> **Boundary Rule:** Never import deep paths from another feature (e.g. `import ... from '@/features/events/components/event-combobox'`).
> Always import through the public index: `import { EventCombobox } from '@/features/events'`.
> Internal helpers or components not exported in `index.js` are private to that feature.

---

## 2. Core Code Patterns

### 2.1 API Service Pattern

- Located in `src/api/services/<domain>.js` or `src/features/<feature>/api/services.js`.
- Services are plain JavaScript objects containing `async` methods.
- Methods call `protectedApi` (or `publicApi` for unauthenticated endpoints) from `@/lib/axios` and return `response.data`.
- Always document input parameters and response structure with JSDoc.

```javascript
import { protectedApi } from '@/lib/axios';

/**
 * Service for managing event resources.
 */
const EventService = {
  /**
   * Retrieves all events for the current user/shop.
   * @param {{ shopId?: string }} [params]
   * @returns {Promise<Array<import('../types').Event>>}
   */
  getAll: async (params = {}) => {
    const response = await protectedApi.get('/events', { params });
    return response.data;
  },

  /**
   * Creates a new event.
   * @param {{ name: string, date: string, budget?: number, shopId: string }} input
   * @returns {Promise<import('../types').Event>}
   */
  create: async (input) => {
    const response = await protectedApi.post('/events', input);
    return response.data;
  },

  /**
   * Updates an existing event.
   * @param {string} id
   * @param {Partial<{ name: string, date: string, budget?: number }>} input
   * @returns {Promise<import('../types').Event>}
   */
  update: async (id, input) => {
    const response = await protectedApi.put(`/events/${id}`, input);
    return response.data;
  },

  /**
   * Deletes an event by ID.
   * @param {string} id
   * @returns {Promise<void>}
   */
  delete: async (id) => {
    const response = await protectedApi.delete(`/events/${id}`);
    return response.data;
  },
};

export default EventService;
```

---

### 2.2 TanStack Query Hook Pattern

- Located in `src/api/hooks/<domain>.js` or `src/features/<feature>/api/hooks.js`.
- Always export a query key factory function `get<Resource>QueryKey(...)` to ensure consistent cache invalidation.
- Read global state (e.g. `useAuthContext()`, `useShopContext()`) inside hooks when query parameters depend on active session/shop.
- Mutations invalidate relevant queries in `onSuccess`.

```javascript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useShopContext } from '@/contexts/shop';

import EventService from './services';

export const getEventsQueryKey = ({ shopId } = {}) => ['events', { shopId }];
export const getEventDetailQueryKey = (id) => ['events', 'detail', id];

/**
 * Hook to fetch events for the active shop.
 */
export const useGetEvents = () => {
  const { currentShop } = useShopContext();
  const shopId = currentShop?.id;

  return useQuery({
    queryKey: getEventsQueryKey({ shopId }),
    queryFn: () => EventService.getAll({ shopId }),
    enabled: Boolean(shopId),
  });
};

/**
 * Hook to create a new event and invalidate events queries.
 */
export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  const { currentShop } = useShopContext();

  return useMutation({
    mutationFn: (input) => EventService.create({ ...input, shopId: currentShop?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getEventsQueryKey({ shopId: currentShop?.id }),
      });
    },
  });
};
```

---

### 2.3 Form Pattern

Festrack uses a 3-part form pattern:

1. **Schema** (`forms/schemas/<domain>.js`): Defined with Zod, exported as `<action><Domain>FormSchema`.
2. **Form Hook** (`forms/hooks/<domain>.js`): Sets up `useForm` with `zodResolver`, connects mutation, handles submission, and accepts optional `{ onSuccess, onError }` callbacks.
3. **Component**: Connects fields using `react-hook-form` `<Controller>` and Base UI Field primitives (`<Field>`, `<FieldLabel>`, `<FieldError>`, `<FieldGroup>`).

#### 1. Schema
```javascript
import { z } from 'zod';

export const createEventFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  date: z.string().min(1, 'Data é obrigatória'),
  budget: z.number().nonnegative('Orçamento deve ser positivo').optional(),
});
```

#### 2. Form Hook
```javascript
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { useCreateEvent } from '../api/hooks';
import { createEventFormSchema } from '../schemas/event';

export const useCreateEventForm = ({ onSuccess, onError } = {}) => {
  const form = useForm({
    resolver: zodResolver(createEventFormSchema),
    defaultValues: {
      name: '',
      date: '',
      budget: undefined,
    },
  });

  const createEventMutation = useCreateEvent();

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await createEventMutation.mutateAsync(values);
      form.reset();
      onSuccess?.(result);
    } catch (error) {
      onError?.(error);
    }
  });

  return {
    form,
    onSubmit,
    isSubmitting: createEventMutation.isPending,
  };
};
```

#### 3. Component
```jsx
import { Controller } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

export default function CreateEventForm({ form, onSubmit, isSubmitting }) {
  return (
    <form onSubmit={onSubmit}>
      <FieldGroup>
        <Controller
          name="name"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="event-name">Nome do Evento</FieldLabel>
              <Input
                {...field}
                id="event-name"
                placeholder="Ex: Aniversário"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Criar Evento'}
        </Button>
      </FieldGroup>
    </form>
  );
}
```

---

### 2.4 React Context Pattern

- Located in `src/contexts/<domain>.jsx`.
- Always export three artifacts:
  1. `<Name>Context` (React context object)
  2. `use<Name>Context` (custom consumer hook)
  3. `<Name>ContextProvider` (provider component)
- Provide sensible defaults in `createContext(...)` so consumer calls outside of tests or boundary trees do not fail abruptly.

```jsx
import { createContext, useContext, useMemo, useState } from 'react';

export const FilterContext = createContext({
  filter: 'all',
  setFilter: () => {},
});

export const useFilterContext = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilterContext must be used within a FilterContextProvider');
  }
  return context;
};

export const FilterContextProvider = ({ children }) => {
  const [filter, setFilter] = useState('all');

  const value = useMemo(
    () => ({
      filter,
      setFilter,
    }),
    [filter]
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
};
```

---

### 2.5 Layout & Route Protection Rules

- **Authenticated Dashboard Routes:**
  - Must be rendered inside `<DashboardLayout>` (`src/components/layout/dashboard-layout.jsx`).
  - `<DashboardLayout>` automatically verifies session initialization, redirects to `/signin` if unauthenticated (`!user`), and renders `AppSidebar` + `Header`.
  - **No duplicate checks:** Individual pages (`Home`, `EventPage`, `FinancePage`) must **NOT** duplicate authentication redirects (`if (!user) return <Navigate to="/signin" />`).
- **Unauthenticated Auth Routes:**
  - Routes like `/signin` and `/signup` must use `<AuthSplitLayout>` (`src/components/layout/auth-split-layout.jsx`).
  - Provides a two-column responsive layout with brand logo and theme-adaptive decorative illustration.

---

## 3. UI Component Conventions

- **Base UI Primitives (`@base-ui/react`):**
  - **NEVER use `asChild`.** `asChild` does not exist in Base UI and causes runtime errors.
  - Always use the `render` prop for composition:
    ```jsx
    <SidebarMenuButton render={<Link to={to} />} isActive={isActive}>
      <span>Item</span>
    </SidebarMenuButton>
    ```
  - **shadcn blocks:** When adopting templates or blocks, always run `npx shadcn add <block> --dry-run` first to prevent overwriting Base UI primitives with Radix UI primitives.
- **File Naming:** All component files use `kebab-case.jsx`.
- **Exports:**
  - Default exports for pages and composite feature components.
  - Named exports for UI primitives (`@/components/ui/*`).
- **Icons:** Exclusively use `lucide-react`.
- **Loading states:** Standardize on `<Loader2Icon className="animate-spin" />`.
- **User Language:** Portuguese (BR) for all UI labels, button copy, placeholders, and error messages.

---

## 4. Code Review Heuristics & Fowler Smells Baseline

All code reviews evaluate changes across two distinct axes:
1. **Standards Axis:** Does the code conform to this project's documented architectural patterns, conventions, and guidelines?
2. **Spec Axis:** Does the implementation faithfully address the requirements without scope creep or missed constraints?

### Baseline Smells (Fowler's *Refactoring*)

The following heuristics guide reviews. Smells are judgment calls and diagnostic signals, not rigid dogmatic rules. A documented repo standard always overrides baseline smells.

| Code Smell | Diagnostic Symptoms | Recommended Remediation |
| :--- | :--- | :--- |
| **Mysterious Name** | Unclear, ambiguous, or abbreviation-laden variable, function, or component names. | Rename to reveal intention and domain semantics (e.g. `evt` → `event`, `calc()` → `calculateEventBalance()`). |
| **Duplicated Code** | Similar calculation, formatting, or JSX structure copy-pasted across multiple hunks. | Extract shared logic into feature `helpers/`, custom hooks, or reusable shared components. |
| **Feature Envy** | A component or helper method repeatedly navigates and processes another object's internal fields. | Move the helper function closer to the domain data it inspects (e.g. into `features/<domain>/helpers/`). |
| **Data Clumps** | The same set of parameters repeatedly passed together (e.g. `startDate`, `endDate`, `shopId`). | Group parameters into a cohesive filter object or options argument. |
| **Primitive Obsession** | Raw strings or numbers used where a domain concept or constrained enum is warranted. | Encapsulate domain rules with Zod schemas or constants. |
| **Repeated Switches** | Cascading `if/else` or `switch` statements dispatching on the same status or transaction type across multiple files. | Consolidate into a map/lookup table or polymorphic helper strategy. |
| **Shotgun Surgery** | A single logical modification requires touching many unrelated files across the repo. | Co-locate related concerns inside the appropriate vertical slice. |
| **Divergent Change** | One module is repeatedly modified for diverse, unrelated reasons. | Separate responsibilities into single-purpose components or distinct hooks (SRP). |
| **Speculative Generality** | Premature abstractions, unused configuration flags, or hypothetical extension hooks. | Remove speculative code; keep implementation focused on the current spec (YAGNI). |
| **Message Chains** | Deep property traversals (`user.shop.settings.billing.plan`). | Provide focused getters or destructure at boundaries. |
| **Middle Man** | A component or function that only forwards calls without adding value. | Inline or eliminate the redundant layer. |
| **Refused Bequest** | A component wraps another but disables, ignores, or works around most of its capabilities. | Prefer composition or tailor a specialized component. |
