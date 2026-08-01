import { ExternalLink, ShoppingBag } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { amazonLink, picksForSeed } from "@/lib/affiliate-products";

/**
 * Contextual Amazon affiliate picks shown on chapter pages.
 */
export function AffiliatePicks({ seed, heading }: { seed: string; heading?: string }) {
  const picks = picksForSeed(seed, 3);

  return (
    <section aria-labelledby="affiliate-picks-heading" className="mt-10">
      <div className="rounded-xl border border-border bg-card/60 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <h2 id="affiliate-picks-heading" className="font-display text-xl">
              {heading ?? "Recommended for your study"}
            </h2>
          </div>
          <Link to="/shop" className="text-sm text-primary hover:underline">
            Browse all resources
          </Link>
        </div>

        <ul className="grid gap-3 sm:grid-cols-3">
          {picks.map((p) => (
            <li key={p.id}>
              <a
                href={amazonLink(p.keywords)}
                target="_blank"
                rel="nofollow sponsored noopener noreferrer"
                className="group flex h-full flex-col rounded-lg border border-border bg-background p-4 transition hover:border-primary/60 hover:bg-accent/40"
              >
                <span className="font-medium leading-snug group-hover:text-primary transition">
                  {p.title}
                </span>
                <span className="mt-1 text-sm text-muted-foreground flex-1">{p.blurb}</span>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                  View on Amazon <ExternalLink className="h-3 w-3" />
                </span>
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-xs text-muted-foreground">
          As an Amazon Associate, VideoBible earns from qualifying purchases. This
          supports the ministry at no extra cost to you.
        </p>
      </div>
    </section>
  );
}
