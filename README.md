# UK Traffic – TomTom (React + Vite)

A complete UK traffic web app using TomTom APIs.

## Run locally

```bash
npm install
npm run dev
```

Open the printed URL, then paste your **TomTom API key** in the left panel or append `?key=YOUR_KEY` to the URL.

## Build

```bash
npm run build
npm run preview
```

## Features
- Leaflet raster map + TomTom basemap
- Traffic Flow raster tiles (multiple styles)
- Raster Incident tiles
- Live Incident Details (bbox) with popups
- Click-to-probe Flow Segment Data near a point
- Vector Flow + Vector Incidents (MapLibre)
- Traffic Stats (Route Analysis) scaffold with async job & chart
- Dark mode, auto-refresh, URL key support

## Security
Do **not** commit API keys. Use a proxy or environment variables for production.

---

## Deploy to GitHub Pages (project site)

1. Create a repo on GitHub (e.g. `uk-traffic-viewer`), initialize it, and push this project to the **main** branch.
2. In the repo settings → **Pages**, set the source to **GitHub Actions**.
3. (Optional) Set a repository variable **VITE_BASE** to `/<repo-name>/` (e.g. `/uk-traffic-viewer/`).
4. Push to `main` — the workflow `.github/workflows/deploy.yml` will build and deploy to Pages automatically.
5. Your app will be available at `https://<username>.github.io/<repo-name>/`.

### Alternative: Vercel/Netlify
- **Vercel**: Import the repo, framework = Vite, build = `vite build`, output = `dist/`.
- **Netlify**: Build command `npm run build`, publish directory `dist`. Set **Base directory** blank and leave `VITE_BASE` unset.
