# Dev Server Commands

The development server runs on port 3001 by default (configurable via `TEST_PORT`).

- **Start**: `cd app && npm run dev`
- **Seed database**: `cd app && npx prisma db seed`
- **Reset database**: `cd app && npx prisma migrate reset` (destructive — drops all data)
