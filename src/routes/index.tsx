import { createFileRoute } from "@tanstack/react-router";
import { Upsolver } from "@/components/upsolver/Upsolver";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Contest Upsolver" },
      { name: "description", content: "Find and upsolve every problem you missed during live contests." },
      { property: "og:title", content: "Contest Upsolver" },
      { property: "og:description", content: "Find and upsolve every problem you missed during live contests." },
    ],
  }),
  component: Index,
});

function Index() {
  return <Upsolver />;
}
