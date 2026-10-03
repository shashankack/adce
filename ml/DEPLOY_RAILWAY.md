# Deploy ADCE ML on Railway

Same Docker image as Render (`ml/Dockerfile`). Free/trial credits apply — check [Railway pricing](https://railway.app/pricing) (may ask for a card for trials).

Uses **hashing** embedder by default (image sets `ADCE_EMBEDDER=hashing`). Run **MiniLM locally** for demos.

## 0. Push this repo to GitHub

Ensure `ml/Dockerfile` is on `main`.

## 1. GitHub OAuth App

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
2. Homepage: `https://github.com/shashankack/adce` (update later to Railway URL)
3. Redirect URI: `http://127.0.0.1`
4. **Enable Device Flow** → Register
5. Copy **Client ID** + generate **Client secret**

## 2. Create the Railway project

1. Sign in at [railway.app](https://railway.app) with GitHub
2. **New Project → Deploy from GitHub repo** → `shashankack/adce`
3. After the service appears:
   - **Settings → Root Directory:** `ml`
   - **Settings → Build:** Dockerfile path `Dockerfile` (Railway should detect `ml/Dockerfile` when root is `ml`)
4. **Settings → Networking → Generate Domain** (public HTTPS URL)
5. **Variables** tab — add:

| Key | Value |
|-----|--------|
| `ADCE_EMBEDDER` | `hashing` |
| `GITHUB_CLIENT_ID` | *(OAuth App)* |
| `GITHUB_CLIENT_SECRET` | *(OAuth App)* |
| `ADCE_JWT_SECRET` | long random string |
| `ADCE_ML_TOKEN` | optional admin secret |
| `PORT` | leave unset if Railway injects it (Dockerfile uses `${PORT:-8000}`) |

6. Redeploy if needed → copy the public URL  
   e.g. `https://adce-ml-production-xxxx.up.railway.app`

## 3. Smoke test

```powershell
curl https://YOUR-RAILWAY-URL/health
# expect: "status":"ok", "authRequired":true, "oauthConfigured":true
```

## 4. CLI

```powershell
$env:ADCE_ML_URL = "https://YOUR-RAILWAY-URL"
adce login
adce whoami
```

## 5. Optional: update OAuth homepage

Set the OAuth App homepage to your Railway URL.

## MiniLM

Keep MiniLM on your laptop for viva/demos. Railway free/trial RAM is usually too small for `sentence-transformers`.
