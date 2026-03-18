# Test Selector Guidance

Prefer `data-testid` attributes for Playwright selectors. The app does not currently have widespread `data-testid` usage — add them as needed when writing spec files.

Fallback priority:

1. `getByRole()` for buttons, links, headings
2. `getByLabel()` for form inputs
3. `getByText()` for visible text content
4. `.locator('css-selector')` as last resort
