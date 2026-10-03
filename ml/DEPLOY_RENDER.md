# Deploy ADCE ML on Render (free tier)

Free Render = ~512 MB RAM → use **hashing** embedder (this Dockerfile).  
Run **MiniLM on your laptop** for demos.

## 0. Push this repo to GitHub

Make sure `ml/Dockerfile` is on `main` at `https://github.com/shashankack/adce`.

## 1. GitHub OAuth App

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
2. **Application name:** `ADCE ML`
3. **Homepage URL:** `https://github.com/shashankack/adce` (temporary; update after deploy)
4. **Authorization callback URL:** `http://127.0.0.1` (required by form; unused for device flow)
5. Create → **Enable Device Flow**
6. Copy **Client ID**; generate & copy **Client secret**

## 2. Create the Render service

1. Sign up at [render.com](https://render.com) with GitHub (no card needed for Free)
2. **New → Web Service**
3. Connect repo `shashankack/adce`
4. Settings:
   - **Root Directory:** `ml`
   - **Runtime:** Docker
   - **Instance type:** Free
   - **Health Check Path:** `/health`
5. **Environment** (Add Environment Variable):

| Key | Value |
|-----|--------|
| `ADCE_EMBEDDER` | `hashing` |
| `GITHUB_CLIENT_ID` | *(from OAuth App)* |
| `GITHUB_CLIENT_SECRET` | *(from OAuth App)* |
| `ADCE_JWT_SECRET` | long random string (e.g. password manager) |
| `ADCE_ML_TOKEN` | optional admin secret for you/CI |

6. Create Web Service → wait for deploy → copy URL  
   e.g. `https://adce-ml-xxxx.onrender.com`

## 3. Fix OAuth App homepage (optional)

Set Homepage URL to your Render URL.

## 4. Smoke test

```powershell
curl https://YOUR-SERVICE.onrender.com/health
# expect: "status":"ok", "authRequired":true, "oauthConfigured":true
```

First hit after ~15 min idle can take ~30–60s (free spin-up).

## 5. Friends / you on CLI

```powershell
$env:ADCE_ML_URL = "https://YOUR-SERVICE.onrender.com"
adce login
adce whoami
adce analyze --skip-cache   # uses hashing on Render
```

Admin override (optional):

```powershell
$env:ADCE_ML_TOKEN = "your-admin-secret"
```

## 6. MiniLM for viva / local proof

Keep using local ML with MiniLM — do **not** expect MiniLM on free Render:

```powershell
cd ml
.\.venv\Scripts\Activate.ps1
$env:ADCE_EMBEDDER = "minilm"   # or leave unset
$env:ADCE_ML_URL = "http://127.0.0.1:8000"
# set same GitHub + JWT secrets as local, or use ADCE_ML_TOKEN only
uvicorn adce_ml.server:app --host 127.0.0.1 --port 8000
```
