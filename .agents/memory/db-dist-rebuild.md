---
name: DB dist rebuild
description: How to rebuild lib/db TypeScript dist after schema changes.
---

`lib/db` has `composite: true` tsconfig and emits to `dist/`. The package.json has NO build script — only `push` and `push-force`.

**Rule:** After any change to `lib/db/src/`, run:
```bash
npx tsc -p lib/db/tsconfig.json
```

**Why:** The api-server resolves `@workspace/db` from `lib/db/dist/` (per the exports field). Stale dist causes "has no exported member" TypeScript errors even though the source is correct.

**How to apply:** After adding new tables/types to lib/db/src/schema/ or any other lib/db source file.
