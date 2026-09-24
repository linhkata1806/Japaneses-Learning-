# Manabi routes

All current application routes use English paths. Vietnamese paths and the former Kage preview path are temporary compatibility redirects; they do not render duplicate pages.

| Route | Purpose | Access | Main navigation / behavior |
| --- | --- | --- | --- |
| `/` | Approved Manabi landing page using the adapted Kage experience | Public | Public entry point. Sign in goes to `/login?returnTo=%2Flearn`; learning and document actions route to their destination when signed in, or to login with that destination preserved. Library action always opens `/library`. |
| `/learn` | Existing learner practice and learning experience | Protected | Guests are sent to `/login?returnTo=%2Flearn`; after sign-in they return to `/learn`. |
| `/login` | Manabi account entry: hosted ChatGPT, Supabase Google OAuth, and configured Supabase email | Public | Accepts `returnTo`; unsafe or external destinations fall back to `/learn`. An existing session shows a compact signed-in state with a continue action instead of a sign-in form. |
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

Protected client routes use the existing `/api/me` identity flow and retain the requested pathname and query in `returnTo`. Examples: `/login?returnTo=/learn`, `/login?returnTo=/documents`, and `/login?returnTo=/lesson/123`. `/login` accepts only an internal path, rejects external or protocol-relative URLs and reserved auth paths, and defaults to `/learn`. The validated destination is passed to hosted ChatGPT sign-in, the Supabase OAuth callback, and email sign-in. The hosted callback or browser session then returns the learner to that route.

The landing navigation and learner headers show **Đăng nhập** for guests. Once authenticated, they show the display name or email, an avatar when Supabase supplies one, and **Đăng xuất**. Logout calls Supabase `signOut()` when a Supabase session exists, then uses the hosted ChatGPT sign-out endpoint if that session remains. It redirects to `/`; `/learn`, `/documents`, `/share/[token]`, and `/admin` then require a fresh authenticated identity. Admin authorization is additionally checked through the existing protected moderation API; route UI gating does not replace API authorization.

### Google OAuth configuration

Google login uses the existing Supabase client and `signInWithOAuth({ provider: "google" })`. Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` for the same Supabase project in the runtime. In Supabase Auth, enable the Google provider and supply a Google OAuth client ID and secret. In Google Cloud, register the Supabase project's Auth callback URL as an authorized redirect URI. Add each deployed app origin and local development origin to Google’s authorized origins. In Supabase Auth Redirect URLs, allow `https://<app-origin>/login?returnTo=*` and `http://localhost:5173/login?returnTo=*` for local development; the app appends a sanitized, percent-encoded `returnTo` value to this callback. Keep the production allow list limited to your actual app origin.

Without Supabase configuration, the Google control is disabled with an explanatory message and email auth stays unavailable; hosted ChatGPT sign-in remains the available provider. Supabase credentials alone do not enable Google: the provider and redirect settings above are also required. Email password, signup, and recovery retain their existing Supabase behavior when configured. Confirm Google sign-in against a configured provider in the hosted environment; the local portable ChatGPT identity is only a development simulation.

Provider setup references: [Supabase Google sign-in](https://supabase.com/docs/guides/auth/social-login/auth-google) and [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

## API routes

Existing `/api/...` endpoints and their behavior remain unchanged. They continue to enforce authentication, ownership, and moderator access at the server boundary.
