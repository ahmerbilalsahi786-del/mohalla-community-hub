---
name: Express 5 params typing
description: req.params values in @types/express v5 need explicit string cast.
---

With `@types/express ^5.0.6`, `req.params` dictionary values are typed as `string | string[]` (or similar union), not plain `string`.

**Rule:** Always cast params when passing to functions expecting string:
```typescript
const id = parseInt(req.params.id as string, 10);
const slug = req.params.slug as string;
```

**Why:** Without the cast, TypeScript raises TS2345 "Argument of type 'string | string[]' is not assignable to parameter of type 'string'".

**How to apply:** Every `req.params.*` usage in api-server route handlers.
