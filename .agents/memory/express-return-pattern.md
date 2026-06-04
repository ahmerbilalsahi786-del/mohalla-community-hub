---
name: Express route return pattern
description: The correct TypeScript-safe way to early-return from Express route handlers.
---

In Express 5 + TypeScript, `return res.json({...})` causes TS7030 "Not all code paths return a value" because it returns `Response` on some paths and `void` on others.

**Rule:** Never use `return res.status(N).json({...})`. Instead:
```typescript
void res.status(400).json({ error: "..." });
return;
```
Or the more compact form: `if (!x) { void res.status(400).json({ error: "..." }); return; }`

**Why:** TypeScript infers the route handler return type from all branches. Mixing `return Response` with implicit `void` triggers TS7030. Prefixing with `void` discards the return value so all paths return `void`.

**How to apply:** Every early-exit guard in a route handler.
