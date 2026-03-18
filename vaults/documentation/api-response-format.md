# API Response Format

All [[api-endpoint-layout|API endpoints]] return a consistent shape:

```typescript
{ success: boolean, data?: T, error?: string }
```

This matches the `ApiResponse<T>` type defined in `types/api.ts`.

## See also

- [[api-error-handling]]
