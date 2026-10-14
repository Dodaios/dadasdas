# How the site is published

The site is a static build on **GitHub Pages**, built for
**<https://dodaios.ai>** (`site` in `astro.config.mjs`). The project was called
Personal Jarvis until October 2026 and the site lived at `personaljarvis.ai`;
see "Moving to dodaios.ai" at the end of this file.

There is nothing to run by hand. A push to `main` builds and publishes.

## The repository name is load-bearing

An organisation's Pages site is served at the root only from a repository named
`<org>.github.io` — for this organisation, `dodaios.github.io`. A repository
called `website` would be served from `/website/`, and every absolute path in
the build — which is all of them, since `astro.config.mjs` sets no `base` —
would 404. The name is not cosmetic.

It also decides where the blog lives. The blog is a project repository
(`Dodaios/blog`, built with `base: "/blog"`), and GitHub serves a project
repository under the organisation site's address only while a repository
named `<org>.github.io` holds that domain. Without it the blog answers only at
`dodaios.github.io/blog/`.

## The four workflows

| Workflow | When | What it does |
| --- | --- | --- |
| `deploy` | push to `main`, or after any of the three below | builds with `npm ci && npm run build`, publishes `dist/` |
| `stargazers` | every 6 hours | copies the public map feed into the static fallback |
| `social-counts` | daily | rewrites `src/data/social-counts.json` — the stat row |
| `lockfile` | by hand | resolves `package-lock.json` on Linux |

**Why `deploy` listens for the other three finishing.** They commit with the
workflow's built-in `GITHUB_TOKEN`, and a push made with that token raises no
`push` event — GitHub's guard against a workflow that triggers itself forever.
Without the `workflow_run` trigger a refreshed globe would sit in the
repository, committed and unpublished, which is the exact failure the schedule
exists to prevent.

## Two things that are not obvious

**The lockfile must be resolved on Linux.** npm resolves optional platform
packages for the machine it runs on, so a lockfile written on Windows is
missing the entries a Linux build needs — Tailwind's wasm32 fallback, sharp's
`@emnapi` runtime. `npm ci` then refuses the tree on the runner and no amount
of re-running `npm install` locally fixes it. Change a dependency, then run the
`lockfile` workflow once.

**Location collection runs in the app repository.** Its `Stargazer map`
workflow handles `watch: started`, an hourly reconciliation, and manual runs.
The built-in `GITHUB_TOKEN` can read that repository's stargazers and write its
own `stargazer-map` branch. No cross-repository personal token is required.
The workflow checks out a pinned website revision for its existing collector
and geocoder, then publishes only aggregate counts and places to
`data/stargazers.json` on that branch. Advancing the pinned revision is required
when changing the collector or gazetteer used by the live map.

The browser reads that public raw JSON on hydration and every 60–75 seconds
while the tab is visible. It retains the last verified snapshot on errors.
GitHub Actions queues and the raw-content cache can add several minutes;
the UI shows the location snapshot's UTC timestamp. The six-hourly website
workflow only copies the feed into the static/no-JavaScript fallback and fails
if the source is invalid or more than a day old.

**Activation order:** publish the app workflow to its default branch, run
`Stargazer map` once, and verify the public feed. Then publish the website
changes. Verify a successful automatic run on the next star and an hourly run
for profile edits/unstars. Tests of browser fixtures do not verify hosted
Actions permissions. The old missing `STARGAZERS_TOKEN` check caused all
scheduled refreshes to fail while the browser's star count kept increasing.

## The one piece of server code

`workers/token-broker/` is a Cloudflare Worker on `token.personaljarvis.ai`,
not part of the Pages build. It adds the Google and Slack client secrets to
the desktop app's token requests so the app never ships them, and it is the
https redirect target the Slack app registers. Every installed copy of the app
calls that host, so it keeps its old name: the rename to Dodaios does not move
it, and nothing in that folder changes with the site's domain.
A push does not deploy it; `wrangler deploy` from that folder does. Its
README covers the rules, the secret and the live check.

## Domain

GitHub Pages has **no custom domain** for this site: it answers at
`dodaios.github.io` over GitHub's own certificate, and so do the project
repositories under it (`/blog/`, `/marketplace/`, `/Dodaios/`). The app fetches
its marketplace index and its wheel index from those `dodaios.github.io`
addresses; with a custom domain set, GitHub answers them with a redirect to
`http://dodaios.ai/...`, and the app's https-only client refuses that hop.

`dodaios.ai` is served by the Cloudflare Worker `dodaios-site` (routes
`dodaios.ai/*` and `www.dodaios.ai/*`). It fetches the same path from
`https://dodaios.github.io`, passes the answer through, rewrites redirects that
name `dodaios.github.io` to `dodaios.ai`, and sends `www` to the apex. The DNS
records for the apex and `www` stay proxied, so the Worker runs.

Do not set a custom domain on the Pages site again and do not add a
`public/CNAME`: either brings the redirect back. A project repository caches
the redirect in its last deployment, so after changing the domain setting each
project site has to be deployed once more.

`personaljarvis.ai`, `www.` and `blog.` redirect path for path to `dodaios.ai`
(Worker `personaljarvis-redirect`). `token.personaljarvis.ai` and
`oauth.personaljarvis.ai` are not part of that redirect and must keep resolving
to their Worker. The published contact address in `src/lib/legal.ts` moves once
mail for the new domain is routed.