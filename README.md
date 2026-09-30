# CaseMatch

Premium team matching workspace for case competitions.

## Run locally

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Default mode is `demo`: fictional data, no external credentials, and local UI flows. Set `NEXT_PUBLIC_DATA_MODE=supabase` only after applying `supabase/migrations/0001_casematch.sql` and filling `.env.local` with Supabase URL and publishable key.

## Checks

```powershell
npm run lint
npm run typecheck
npm test
npm run build
```

## Supabase

1. Create Supabase project.
2. Run migration in SQL Editor.
3. Enable email/password Auth.
4. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
5. Set Supabase Auth Site URL to deployed URL and add `/auth/callback` redirect.
6. Switch `NEXT_PUBLIC_DATA_MODE=supabase`.

Never add service-role key to browser or `.env.local` committed to Git.

## Vercel

```powershell
npx vercel login
npx vercel --yes
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production
npx vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
npx vercel env add NEXT_PUBLIC_DATA_MODE production
npx vercel --prod
```

Deploy URL comes from Vercel command output. Verify Auth redirect and one complete apply/accept flow after deployment.
