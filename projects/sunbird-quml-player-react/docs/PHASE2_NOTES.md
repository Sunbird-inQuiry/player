# Phase 2 — Implementation Notes

Tooling/implementation notes for Phase 2 (State Management & Context).
These are **not** architecture decisions and intentionally live outside the main
implementation specification, which stays focused on architecture.

---

## Note: Vitest does not use `@vitejs/plugin-react`

### What we did
`vitest.config.ts` intentionally **omits** `@vitejs/plugin-react` and instead lets
Vitest transform JSX via its built-in esbuild:

```ts
// vitest.config.ts
export default defineConfig({
  esbuild: { jsx: 'automatic' },
  test: { globals: true, environment: 'jsdom', setupFiles: ['./src/test-setup.ts'] },
});
```

The application's real `vite.config.ts` **still uses** `@vitejs/plugin-react`, so
dev-server React Fast Refresh / HMR is unaffected. This change is **test-config
only**.

### Why this is required (pinned-version cause)
With the currently **pinned** versions —
`@vitejs/plugin-react@4.0.0`, `vite@^4.4.0`, `vitest@0.34.0` — running the React
plugin inside the Vitest pipeline throws:

```
Error: @vitejs/plugin-react can't detect preamble. Something is wrong.
```

Cause: the plugin injects a React Fast Refresh **preamble** that is normally added
to the dev server's HTML and defines
`window.__vite_plugin_react_preamble_installed__`. Each transformed `.tsx`
component module then guards on that global and throws if it is missing. Under
Vitest there is no dev server / HTML to inject the preamble, so the guard throws
the instant a JSX module is imported (which is why a whole test *file* fails even
though its assertions are fine).

This only began failing in Phase 2 because Phase 2 is the first code that imports
JSX-bearing modules and uses `@testing-library/react` (`render` / `renderHook`).
In `@vitejs/plugin-react@4.0.0` the logic that should skip Fast Refresh injection
under a non-dev-server (test) context does not reliably do so — hence the pin is
what keeps us on the buggy path. Fast Refresh has no value under test, so dropping
the plugin in the test config is the correct, lowest-risk fix and keeps every
pinned dependency exactly as the spec requires.

### TODO — re-evaluate when upgrading
- [ ] **When the project upgrades to newer Vite / `@vitejs/plugin-react`
      versions, re-evaluate the standard Vitest configuration.** Recent
      `@vitejs/plugin-react` releases detect the test/non-serve context and skip
      the Fast Refresh preamble, which should allow restoring the conventional
      `plugins: [react()]` form in `vitest.config.ts` and removing the
      `esbuild: { jsx: 'automatic' }` workaround. Verify the full test suite still
      passes after any such change before adopting it.

> Until that upgrade happens, **keep `vitest.config.ts` as-is.**
