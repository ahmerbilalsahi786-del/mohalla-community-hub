---
name: Zod enum in api-server
description: How to use z.enum() correctly in the api-server (Zod v3 compat mode).
---

The api-server imports `zod` (main entrypoint) which is Zod v4 in v3-compat mode. The `RawCreateParams` type does NOT have an `error` field — use `message` instead, or omit the params.

**Rule:** Use inline array literals for z.enum, not `as const` arrays:
```typescript
// GOOD — mutable literal, no params needed:
z.enum(["a", "b", "c"])
// BAD — readonly tuple, causes type error:
const TYPES = ["a", "b"] as const;
z.enum(TYPES, { error: "message" })  // ❌ both problems
```

**Why:** `z.enum` requires `[string, ...string[]]` (mutable tuple). `as const` arrays are `readonly`. The `error` property doesn't exist in v3-compat RawCreateParams.

**How to apply:** Any z.enum() call in api-server routes or middleware.
