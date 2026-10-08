<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Player progress (coins, XP, referral claims) lives in browser localStorage via src/lib/player.ts; no player accounts — keeps play instant without sign-up. Withdrawals are validated manually by admins, so client-side balances are acceptable.
- Admin access = Cloud email auth + `admin` row in user_roles (first signup auto-promoted by trigger); all admin writes are enforced by RLS `has_role`.
- Push notifications are delivered by polling the notifications table while the app is open (browser Notification API); no VAPID/service worker yet.
- Ad slots use the `AdSlot` component as the single place to paste AdSense/partner snippets.
