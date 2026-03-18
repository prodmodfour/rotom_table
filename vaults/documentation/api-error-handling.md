# API Error Handling

All [[api-endpoint-layout|API endpoints]] use H3's `createError` for error responses:

```typescript
throw createError({ statusCode: 400 | 404 | 500, message: 'descriptive message' })
```

Errors are caught in try/catch blocks. Known H3 errors (those with a `statusCode` property) are re-thrown as-is. Unknown errors are wrapped in a 500.

## See also

- [[api-response-format]]
