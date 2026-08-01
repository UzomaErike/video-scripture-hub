import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, Home, ShoppingBag } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { categories, productsByCategory, amazonLink } from "@/lib/affiliate-products";
import { categoryImages } from "@/lib/shop-images";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Bible Study Resources & Christian Gifts — VideoBible" },
      {
        name: "description",
        content:
          "Hand-picked study Bibles, Christian books, devotionals, family resources and faith gifts to go deeper with Scripture.",
      },
      { property: "og:title", content: "Bible Study Resources & Christian Gifts — VideoBible" },
      {
        property: "og:description",
        content:
          "Study Bibles, commentaries, devotionals, children's Bibles and faith gifts recommended by VideoBible.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-8 flex-1">
        <nav className="text-sm text-muted-foreground mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-1 hover:text-primary transition">
            <Home className="h-3.5 w-3.5" /> Home
          </Link>
          <span className="mx-2">›</span>
          <span className="text-foreground">Resources</span>
        </nav>

        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-primary mb-2">
            <ShoppingBag className="h-5 w-5" />
            <span className="text-sm uppercase tracking-wide">Recommended resources</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl">Bible Study Resources</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Tools we recommend for going deeper in Scripture — study Bibles,
            commentaries, devotionals, family resources and encouraging gifts.
          </p>
        </header>

        <div className="space-y-12">
          {categories.map((cat) => (
            <section key={cat.id} aria-labelledby={`cat-${cat.id}`}>
              <h2 id={`cat-${cat.id}`} className="font-display text-2xl">
                {cat.label}
              </h2>
              <p className="text-sm text-muted-foreground mt-1 mb-4">{cat.description}</p>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {productsByCategory(cat.id).map((p) => (
                  <li key={p.id}>
                    <a
                      href={amazonLink(p.keywords)}
                      target="_blank"
                      rel="nofollow sponsored noopener noreferrer"
                      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card/60 transition hover:border-primary/60 hover:bg-accent/40"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                        <img
                          src={categoryImages[cat.id]}
                          alt={`${cat.label} — ${p.title}`}
                          width={1024}
                          height={640}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/10 to-transparent" />
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <span className="font-medium leading-snug group-hover:text-primary transition">
                          {p.title}
                        </span>
                        <span className="mt-1 text-sm text-muted-foreground flex-1">{p.blurb}</span>
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary">
                          View on Amazon <ExternalLink className="h-3 w-3" />
                        </span>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>

            </section>
          ))}
        </div>

        <p className="mt-12 text-xs text-muted-foreground text-center max-w-2xl mx-auto">
          As an Amazon Associate, VideoBible earns from qualifying purchases. Prices
          and availability are set by Amazon and may change. Buying through these
          links supports the ministry at no extra cost to you.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
