import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/play/")({
  beforeLoad: () => {
    throw redirect({
      to: "/play/$category",
      params: { category: "mix" },
    });
  },
  component: () => null,
});
