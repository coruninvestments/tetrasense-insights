# Signal Leaf — Security Notes

## Password Policy

- **Leaked Password Protection (HIBP Check):** Must be enabled manually (see below).
- Passwords are handled entirely by the authentication system; no plaintext is stored.

### Enabling Leaked Password Protection

This setting cannot be toggled programmatically. Enable it via the Lovable Cloud auth settings:

1. Open your project in Lovable.
2. Navigate to the **Cloud** view (desktop: icon bar above preview; mobile: `…` menu).
3. Go to **Users → Auth settings** (gear icon).
4. Open the **Email settings** section.
5. Find **Password HIBP Check** and toggle it **ON**.
6. Save.

This checks every new password against the Have I Been Pwned database and rejects compromised passwords.

## API Key Hygiene

| Key | Where it lives | Client-accessible? |
|---|---|---|
| `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key) | `.env`, bundled into client | ✅ Yes — safe, limited by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend secrets only | ❌ **Never** expose to client |

### Rotation

- Rotate keys via the Lovable Cloud settings panel or the underlying project dashboard.
- After rotation, update the corresponding secret and redeploy edge functions.

## Rules

1. **Never** store `service_role` key in client-side code, `.env` files shipped to the browser, or `VITE_*` variables.
2. All database writes to sensitive fields (`is_premium`, `products` table) must go through edge functions using `service_role`.
3. RLS is enabled on all tables. Verify policies after any schema change.
4. The `protect_premium_field` trigger prevents client-side `is_premium` manipulation at the DB level.

## Verification Checklist

- [x] Client uses only `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key)
- [x] `service_role` key exists only in backend secrets (edge functions)
- [x] No `service_role` references in `src/` directory
- [x] RLS enabled on all tables
- [x] `is_premium` protected by DB trigger + client guard
- [x] `products` writes routed through `create-draft-batch` edge function
- [ ] **Leaked Password Protection (HIBP)** — enable manually per steps above
