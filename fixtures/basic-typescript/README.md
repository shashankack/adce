# basic-typescript

Minimal TypeScript **library** used by ADCE automated tests.

## Layout

- `src/index.ts` — public API (`add`, `clamp`)
- `src/math.ts` — internal helpers
- `src/index.test.ts` — paired tests
- `docs/overview.md` — short design note

Not a real package to publish; keep files small so Vitest copies stay fast.
