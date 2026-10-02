# CaseMatch Master Prompt

Build a Next.js App Router workspace with Tailwind CSS, shadcn/ui and Framer Motion.
Use one full-client LocalStorage store for profiles, competitions, teams, roles,
applications, rosters, saved items and persistent local sessions.
Hydrate storage before rendering data-dependent pages. Seed only on first use;
never overwrite existing or corrupt saves. Validate loaded data and every mutation.
Persist successful changes before updating UI; synchronize tabs and preserve stable IDs.
Migrate earlier saved journals without deleting them.
Login takes one second, persists an email-selected local identity, and navigates
into the workspace. Do not collect passwords or claim verified authentication.
Create Team returns to Teams; Apply updates persistent application state;
captain acceptance updates the roster atomically in the same snapshot.
Keep Vietnamese UI, responsive navigation, visible focus and reduced-motion support.
No alternative data modes, external database clients or server mutations.
Run lint, TypeScript, domain/persistence tests and production build.
