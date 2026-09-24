# Manabi routes

All current application routes use English paths. Vietnamese paths and the former Kage preview path are temporary compatibility redirects; they do not render duplicate pages.

| Route | Purpose | Access | Main navigation / behavior |
| --- | --- | --- | --- |
| `/` | Approved Manabi landing page using the adapted Kage experience | Public | Public entry point. Sign in goes to `/login?returnTo=%2Flearn`; learning and document actions route to their destination when signed in, or to login with that destination preserved. Library action always opens `/library`. |
| `/learn` | Existing learner practice and learning experience | Protected | Guests are sent to `/login?returnTo=%2Flearn`; after sign-in they return to `/learn`. |
| `/login` | Manabi account entry: hosted ChatGPT and direct Google OAuth | Public | Accepts `returnTo`; unsafe or external destinations fall back to `/learn`. An existing session shows a compact signed-in state with a continue action instead of a sign-in form. |
| `/documents` | Learner documents and AI-generated study drafts | Protected | Guests are sent to `/login?returnTo=%2Fdocuments`; after sign-in they return to `/documents`. |
| `/library` | Community library of approved lessons | Public | Approved entries link to `/lesson/[id]`. |
| `/lesson/[id]` | A published lesson | Public for approved public lessons | Only `PUBLIC`, user-confirmed, approved lessons are queried. Private, restricted, unapproved, and missing lesson IDs return not found and their content is never rendered here. Shared access uses `/share/[token]`. |
| `/share/[token]` | A lesson shared by token | Protected under the current recipient sign-in policy | Guests are sent to login with the complete share URL in `returnTo`; authenticated recipients continue to the existing share workflow. |
| `/sources` | Learning-content sources and attribution | Public | Linked from the learning experience and footer content. |
| `/admin` | Lesson moderation | Admin/moderator only | The page checks sign-in and the existing admin review API before rendering moderation content. Guests return through login; signed-in users without moderator access see a forbidden state. Server API authorization remains authoritative. |

## Redirects

Temporary route redirects map legacy paths to their English equivalents. The dynamic lesson redirect retains its lesson ID, and the legacy login route carries an existing `returnTo` value forward for sanitization by `/login`:

| Legacy route | Destination |
| --- | --- |
| `/kage-preview` | `/` |
| `/auth` | `/login` |
| `/tai-lieu` | `/documents` |
| `/thu-vien` | `/library` |
| `/bai/[id]` | `/lesson/[id]` |
| `/nguon-hoc-lieu` | `/sources` |
| `/quan-tri` | `/admin` |

## Authentication and account actions

Protected client routes use the existing `/api/me` identity flow and retain the requested pathname and query in `returnTo`. Examples: `/login?returnTo=/learn`, `/login?returnTo=/documents`, and `/login?returnTo=/lesson/123`. `/login` accepts only an internal path, rejects external or protocol-relative URLs and reserved auth paths, and defaults to `/learn`. The validated destination is passed to hosted ChatGPT sign-in or the direct Google OAuth flow.

The landing navigation and learner headers show **Đăng nhập** for guests. Once authenticated, they show the display name or email, an avatar when Google supplies one, and **Đăng xuất**. Logout revokes the application session in D1 and clears its cookie, then uses the hosted ChatGPT sign-out endpoint if that session remains. It redirects to `/`; `/learn`, `/documents`, `/share/[token]`, and `/admin` then require a fresh authenticated identity. Admin authorization is additionally checked through the existing protected moderation API; route UI gating does not replace API authorization.

### Google OAuth configuration

Google login uses the server-side authorization code flow with PKCE and a validated state cookie. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `APP_URL` in the Cloudflare Worker; store the client secret as a Cloudflare secret. For production, set `APP_URL=https://japaneses-learning.linhkata06.workers.dev` and register `https://japaneses-learning.linhkata06.workers.dev/api/auth/google/callback` as an authorized redirect URI for a Google OAuth web client. The callback validates the Google ID token, maps its stable `sub` to `account_identities`, and creates an HttpOnly application session stored by token hash in D1.

Google sign-in is available only when all three variables are set and migration `drizzle/0004_previous_lucky_pierre.sql` has created `auth_sessions` in D1. Otherwise, the Google control shows a neutral unavailable message; hosted ChatGPT sign-in remains available. Confirm a complete Google sign-in with real Google credentials after deployment; the local portable ChatGPT identity is only a development simulation.

Provider setup reference: [Google OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect).

## API routes

The existing learning and document `/api/...` endpoints continue to enforce authentication, ownership, and moderator access at the server boundary. Google OAuth uses `/api/auth/google/start` and `/api/auth/google/callback`; `/api/auth/logout` clears the application session.
