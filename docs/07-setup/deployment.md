# Deployment (Vercel)

**Production URL:** https://poolpay.forcemultiplierdata.com/

---

## Auto deploy

Push to `main` on GitHub → Vercel builds automatically.

```bash
git push origin main
```

---

## Build settings

| Setting | Value |
|---------|-------|
| Framework | Next.js |
| Build command | `pnpm build` or `npm run build` |
| Output | default (.next) |
| Node | 20.x |

---

## Post-deploy checklist

1. All env vars set on Vercel
2. Supabase redirect URLs include production domain
3. Run SQL migrations on **production** Supabase (same as dev if shared)
4. Test sign-in, wallet, deal search, lender desk

---

## Manual CLI (optional)

```bash
npx vercel --prod
```

Requires valid Vercel token linked to project.

---

## Git remote

```
https://github.com/AIForceMultiplierData/credit_cart.git
```

Branch: `main`
