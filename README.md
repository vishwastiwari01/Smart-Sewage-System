# 🌊 SmartFlow v3.0 — AI Powered Smart Sewage Monitoring System

> **B.Tech Final Year Engineering Project** · GHMC Hyderabad · React 18 + Tailwind CSS + MapLibre GL

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/vishwastiwari01/Smart-Sewage-System)

---

## 🚀 Quick Start (Fresh Install)

```bash
# 1. Clone
git clone https://github.com/vishwastiwari01/Smart-Sewage-System
cd Smart-Sewage-System

# 2. Install deps
npm install

# 3. Run
npm start
```

Open → http://localhost:3000

---

## 🔑 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin (GHMC Officer) | admin@ghmc.gov.in | admin123 |
| Field Crew | crew@ghmc.gov.in | crew123 |
| Citizen | citizen@hyderabad.in | citizen123 |

---

## 📄 Pages

| Route | Page |
|-------|------|
| `/` | Landing Page (public) |
| `/login` | Login with role selector |
| `/dashboard` | Live Hyderabad map + sensor nodes |
| `/incidents` | Create, assign, resolve incidents |
| `/ai` | AI overflow risk predictions |
| `/analytics` | Charts + zone performance |
| `/safety` | Gas monitoring + PPE checklist |
| `/twin` | Digital twin pipe flow simulation |
| `/sim` | ESP32 Wokwi simulation |
| `/messages` | Broadcast communication |
| `/architecture` | System design + API docs |

---

## 🚀 Deploy to Vercel

### Option A — Vercel CLI
```bash
npm install -g vercel
vercel --prod
```

### Option B — GitHub Integration
1. Push to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repo
4. Framework: **Create React App** (auto-detected)
5. Click Deploy ✅

The `vercel.json` file handles SPA routing so refreshing any route works.

---

## 🛠 Tech Stack

- **Frontend**: React 18, React Router v6, Tailwind CSS (CDN)
- **Maps**: MapLibre GL JS + CARTO free tiles (no API key)
- **Icons**: Material Symbols (Google)
- **Fonts**: Inter + JetBrains Mono
- **Simulation**: Custom React hooks (ESP32 sensor simulation)
- **Hosting**: Vercel

---

## 🔧 Developer Setup: Supabase + Wokwi Integration

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Copy `.env.example` to `.env.local` and add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Run the SQL schema from `supabase/migrations/20240401000000_smartflow_schema.sql` in the Supabase SQL Editor.
4. Set up the `citizen-reports` Storage bucket and ensure public read access.
5. Deploy the Edge function via Supabase CLI:
   ```bash
   supabase functions deploy trigger-alert --project-ref your-project-id
   ```
6. In Wokwi or ESP32 simulation, point the HTTP POST to your Supabase Edge Function URL.

---

*SmartFlow © 2026 · GHMC Intelligence Division · B.Tech Final Year Project*
