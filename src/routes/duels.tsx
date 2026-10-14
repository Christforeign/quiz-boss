import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/duels")({
  beforeLoad: () => {
    throw redirect({
      to: "/duel",
    });
  },
  component: () => null,
});
