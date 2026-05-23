import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/christian-movies/$id")({
  component: () => <Outlet />,
});
