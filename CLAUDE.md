# POS System — Claude Code Instructions

## Project
Electron + React + TypeScript monorepo POS system.
Stack: pnpm workspaces, Turborepo, Drizzle ORM, SQLite, Zustand, Zod, Tailwind.

## Architecture rules (never break these)
- UI → IPC only. Never import from packages/core or packages/database directly.
- IPC handlers → Controllers only. One handler per channel.
- Controllers → Services only. No direct DB calls.
- Services → Repositories only. Stateless, pure business logic.
- Repositories → only layer that touches Drizzle/SQLite.
- Shared → types, constants, utils only. Imported by any package.

## Code rules
- TypeScript strict mode. No `any` ever.
- All async code uses async/await, never callbacks.
- Errors use Result<T, E> pattern from packages/shared/utils/result.ts.
- Every public method has a JSDoc comment.
- No magic numbers — constants go in packages/shared/src/constants.
- One class/component per file. Single responsibility always.
- Interfaces prefixed with I (IProduct, IOrder).
- Enums: PascalCase with SCREAMING_SNAKE values.
- React components: PascalCase.tsx
- Services/Controllers/Repos: PascalCase.ts
- Hooks: camelCase, prefixed with `use`.

## Before writing any code
1. State which layer you are working in.
2. State which package the file belongs to.
3. If unsure about architecture placement, ask before implementing.

## Testing
- Unit test every Service and Repository.
- Use in-memory SQLite for repository tests.
- Test files live next to the file they test (*.test.ts).