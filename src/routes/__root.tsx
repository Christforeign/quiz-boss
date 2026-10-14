import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md text-center rounded-3xl border border-primary/30 bg-card p-6 shadow-glow">
        <span className="text-6xl">🎮</span>
        <h1 className="mt-3 text-4xl font-extrabold text-foreground">Partie introuvable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette page ou cette partie n'existe plus ou a expiré. Choisis une option ci-dessous pour
          reprendre ton jeu immédiatement !
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Link
            to="/play/$category"
            params={{ category: "mix" }}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-extrabold text-primary-foreground transition-transform active:scale-95 shadow-glow"
          >
            ⚡ Reprendre le Quiz (Mix Aléatoire)
          </Link>
          <Link
            to="/duel"
            className="inline-flex items-center justify-center rounded-xl bg-secondary px-4 py-2.5 text-sm font-extrabold text-secondary-foreground transition-transform active:scale-95"
          >
            ⚔️ Rejoindre le Mode Duel
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-background/50 px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            🏠 Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "monetag", content: "59029dc25ef25e3de878e23f259217d6" },
      { title: "QuizBoss — Quiz, statuts & récompenses" },
      {
        name: "description",
        content: "Joue au quiz, gagne des pièces et partage tes statuts WhatsApp.",
      },
      { property: "og:title", content: "QuizBoss — Quiz, statuts & récompenses" },
      {
        property: "og:description",
        content: "Joue au quiz, gagne des pièces et partage tes statuts WhatsApp.",
      },
      { name: "theme-color", content: "#141a2e" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;800&family=Manrope:wght@400;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Nettoyer l'ancien script Monetag All-in-One (quge5.com / zone 228397)
    document
      .querySelectorAll('script[src*="quge5.com"], script[data-zone="228397"]')
      .forEach((el) => el.remove());
  }, []);

  return (
    <html lang="fr" className="dark" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <AppShell>
        <Outlet />
      </AppShell>
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}
