# Manual artifacts fixture

Small **orders service** with real source files. Virtual artifacts (POLICY,
REQUIREMENT, notes with no path) are meant to be added via:

```bash
adce init -y && adce scan
adce artifact add --type POLICY --name "PII retention" --stub
adce artifact add --type REQUIREMENT --name "Orders must be idempotent" --stub
```

Use this when showing that ADCE tracks human-authored context that is not a file.
