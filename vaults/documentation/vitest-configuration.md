# Vitest Configuration

Defined in `app/vitest.config.ts`:

- **Environment:** `happy-dom` (fast DOM simulation)
- **Globals:** `true` (no need to import `describe`/`it`/`expect` in test files)
- **Coverage:** v8 provider, reporters: text/json/html, scoped to `composables/`, `stores/`, `server/api/`
- **Aliases:** `~` and `@` both resolve to `app/`
- **Plugin:** `@vitejs/plugin-vue` for SFC support

Run commands:
```bash
cd app
npx vitest run                    # all tests once
npx vitest run tests/unit/utils   # single directory
npx vitest run --coverage         # with v8 coverage report
npx vitest                        # watch mode
```

## See also

- [[test-directory-structure]]
- [[mock-patterns]]
- [[test-selector-guidance]] — preferred selector strategies for Playwright tests
