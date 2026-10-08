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
- Player progress is cached in localStorage (src/lib/player.ts) and synced to `profiles` when signed in; guests can play, withdrawals require an account. Balances are client-writable, so withdrawals stay manually validated.
- Admin access = Cloud email auth + `admin` row in user_roles (first signup auto-promoted by trigger); all admin writes are enforced by RLS `has_role`.
- Push notifications are delivered by polling the notifications table while the app is open (browser Notification API); no VAPID/service worker yet.
- Ad slots use the `AdSlot` component as the single place to paste AdSense/partner snippets.
- Uploaded media (stickers, question/page images) go to the private `media` bucket with long-lived signed URLs; public buckets are blocked on this workspace.
- Custom pages (page-1..5, conditions, faq) and site settings (WhatsApp links, AdSense, custom script) are upserted rows in `custom_pages` / `app_settings`, edited from Admin; HTML pages render in a sandboxed iframe.
