# AppTeka — demo site (Nuxt 3)

Minimal storefront that embeds the AppTeka support widget straight from the CDN
(`https://cdn.appteka.app/content/widget/appteka-widget.js`). It shows how any site
adds live AI support with **one script tag** — no build step for the widget itself.

## Run

```bash
npm install
NUXT_PUBLIC_API_BASE=http://localhost:8080 npm run dev   # point at your backend
```

Open http://localhost:3000. The chat bubble appears bottom-right.

- `NUXT_PUBLIC_API_BASE` — backend origin the widget talks to (REST + `/ws`).
  Defaults to `http://localhost:8080`. Must be reachable from the browser and
  listed in the backend's `CORS_ALLOWED_ORIGINS`.

## How it's wired

- `nuxt.config.ts` — injects the CDN `<script>` with `data-api-base` / `data-theme` /
  `data-lang` / `data-position`. The widget auto-inits from those attributes.
- `app.vue` — the demo storefront. The **Войти (демо)** button calls
  `AppTeka.identify({ name, phone, address })` to demo the anonymous → identified flow.
