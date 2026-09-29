# Conflicting API fixture

Toy HTTP-style users API where **docs disagree with code**:

| Layer | Contract |
|-------|----------|
| `openapi.yaml` | `GET /users/{id}` → `{ id, email }` |
| `src/users.ts` | returns `{ id, name }` (no `email`) |
| `README.md` | still claims email is returned |

Useful for documentation / API_SPEC mismatch demos and future semantic ML.
