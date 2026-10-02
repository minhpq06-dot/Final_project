# CaseMatch

Next.js workspace with full-client LocalStorage persistence.

## Run

```powershell
npm ci
npm run dev
```

No database, environment variables, or remote authentication service required.

## Persistence

`casematch-state-v1` stores one validated JSON snapshot: profiles, competitions,
teams, roles, applications, rosters, saved items, account identities and session.
Defaults initialize only when no saved snapshot or compatible earlier save exists.
Existing journals migrate once, keeping generated IDs and preserving earlier saves.
Corrupt data is not overwritten. Storage errors stop the mutation and show an error;
the UI reports success only after the snapshot is written.
Tabs synchronize via storage events; Web Locks serialize updates where supported.

Login waits one second, selects the account by normalized email, creates a profile
for a new address, and persists the session before navigating. Sign out removes
the session, not account data. Existing local identities use `linh@example.com`,
`anh@example.com`, `ha@example.com`, and `huy@example.com`.

**Security:** Local email identity is not verified authentication. Anyone with
browser access can select an account or edit its stored data. Passwords and tokens
are not collected or stored. Do not use this design for sensitive data or shared
production accounts; those require server-side authentication and authorization.

LocalStorage belongs to an origin (protocol, host, port) and browser profile.
Changing port/domain/device uses a different store. Clearing site data removes it;
private browsing may remove it after the last private window closes.
Seed competitions are practice case briefs, not verified public listings.

## Checks

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

## Deploy

Deploy as a standard Next.js project. No environment configuration required:

```powershell
npx vercel login
npx vercel --prod
```

Each visitor's data stays in their browser; deployment does not create a shared DB.
