# Parser conflict fixture

Deliberate, realistic-looking mismatches for ADCE detectors:

1. **STRUCTURAL** — `math.test.ts` imports `subtract`, but `math.ts` only exports `add`
2. **SCHEMA** — `config/user.json` missing required `role` from `schemas/user.schema.json`
3. **CONFIGURATION** — `package.json` engines.node `>=22` vs `.nvmrc` `18`
