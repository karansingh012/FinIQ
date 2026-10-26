# FinIQ frontend

React 18, Vite, JSX, Tailwind, React Router, Axios, React Hook Form, Recharts and Lucide. See the root README for the integrated setup.

`npm ci`, `npm run dev`, `npm test`, `npm run build`.

The development proxy targets Java on port 8080; set server-side `API_PROXY_TARGET` to change it. Browser requests use `/api/v1`, or `VITE_API_URL` when configured. Never place secrets in VITE variables. Production Nginx proxies the same path internally.

`lib/api.js` owns HTTP handling; `lib/context.jsx` owns session and language state; `lib/translations.js` holds Hindi translations. Public pages, learner routes and admin routes are separate modules. Protected routes improve navigation but backend role checks are the authority. All charts consume persisted API data. Source text remains original-language educational content.
