# @workspace/db

Database package for the monorepo using Drizzle ORM with PostgreSQL.

## Setup

1. Copy `.env.example` to `.env` and configure your database connection:

   ```bash
   cp .env.example .env
   ```

2. Set the `DATABASE_URL` environment variable:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/dbname
   ```

## Usage

```typescript
import { db } from "@workspace/db";
import { users } from "@workspace/db/schema";

// Query example
const allUsers = await db.select().from(users);
```

## Scripts

- `pnpm db:generate` - Generate migration files
- `pnpm db:migrate` - Run migrations
- `pnpm db:push` - Push schema changes to database (dev only)
- `pnpm db:studio` - Open Drizzle Studio (database GUI)

## Schema

Define your database schemas in `src/schema/` directory and export them from `src/schema/index.ts`.
