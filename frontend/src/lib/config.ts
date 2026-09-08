/**
 * Runtime configuration derived from a single env var, {@link https://nextjs.org/docs/app/building-your-application/configuring/environment-variables | NEXT_PUBLIC_BACKEND_URL}.
 *
 * The browser calls the Spring Boot backend directly — there is no Next.js proxy — so this must be
 * an absolute origin the browser can reach, and the backend's `CORS_ALLOWED_ORIGINS` must list this
 * app's own origin.
 */
const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080").replace(/\/+$/, "");

/** REST API root — every path passed to `api()` in `lib/api.ts` is resolved against this. */
export const API_BASE_URL = `${BACKEND_URL}/api`;

/** STOMP-over-WebSocket endpoint for chat. `ws://` for an http backend, `wss://` for https. */
export const WS_URL = `${BACKEND_URL.replace(/^http/, "ws")}/ws`;
