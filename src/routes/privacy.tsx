import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — VideoBible" },
      {
        name: "description",
        content:
          "How VideoBible collects, uses, and protects your information, including cookies, advertising, analytics and your privacy rights.",
      },
      { property: "og:title", content: "Privacy Policy — VideoBible" },
      {
        property: "og:description",
        content:
          "How VideoBible collects, uses, and protects your information, including cookies, advertising and your privacy rights.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-2xl font-semibold tracking-tight mb-3">{title}</h2>
      <div className="space-y-3 text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

function PrivacyPage() {
  const email = "videobible.watch@gmail.com";

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-12 flex-1">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight mt-6">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <p className="mt-6 text-muted-foreground leading-relaxed">
          This Privacy Policy explains how VideoBible (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;)
          collects, uses, and safeguards information when you visit{" "}
          <span className="text-foreground">videobible.watch</span> or use our mobile app
          (together, the &ldquo;Service&rdquo;). By using the Service you agree to this policy.
        </p>

        <Section title="Information We Collect">
          <p>
            <span className="text-foreground font-medium">Information you provide.</span> VideoBible does not
            require an account and we do not ask for your name, email address, or any other personal details
            to use the Service. If you choose to email us directly, we will see your email address and message
            only for as long as needed to reply.
          </p>
          <p>
            <span className="text-foreground font-medium">Usage and device information.</span> Like most
            websites, we and our service providers automatically receive information such as your IP address,
            browser type, device type, operating system, referring pages, pages viewed, and the date and time
            of your visit.
          </p>
          <p>
            <span className="text-foreground font-medium">Preferences stored on your device.</span> We store
            settings such as your chosen theme, Bible translation, and recently viewed chapters in your
            browser&rsquo;s local storage. We do not sell this information.
          </p>
          <p>We do not knowingly collect payment card details on this site.</p>
        </Section>

        <Section title="How We Use Information">
          <ul className="list-disc pl-5 space-y-2">
            <li>To deliver and display Bible chapters, summaries, verse meanings, hymns, and videos.</li>
            <li>To remember your preferences and improve site performance and reliability.</li>
            <li>To protect the Service against abuse, spam, and excessive automated requests.</li>
            <li>To display advertising and to understand which content is most useful.</li>
            <li>To respond to your messages and support requests.</li>
          </ul>
        </Section>

        <Section title="Cookies and Similar Technologies">
          <p>
            We and third parties use cookies, local storage, and similar technologies to operate the Service,
            remember preferences, measure traffic, and serve advertising. You can control or delete cookies in
            your browser settings; some features may not work correctly if cookies are disabled.
          </p>
        </Section>

        <Section title="Advertising (Google AdSense)">
          <p>
            We display advertisements through Google AdSense.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              Google AdSense uses cookies to serve ads based on your prior visits to this website or other
              websites.
            </li>
            <li>
              Google&rsquo;s use of advertising cookies enables it and its partners to serve ads to you based
              on your visit to our site and/or other sites on the Internet.
            </li>
            <li>
              You may opt out of personalised advertising by visiting{" "}
              <a
                href="https://www.google.com/settings/ads"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-primary hover:underline"
              >
                Google Ads Settings
              </a>
              . You can also opt out of some third-party cookies used for advertising at{" "}
              <a
                href="https://www.aboutads.info/choices/"
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-primary hover:underline"
              >
                aboutads.info/choices
              </a>
              .
            </li>
            <li>
              Google may collect and use data under its own privacy policy. We do not control Google&rsquo;s
              data practices.
            </li>
          </ul>
          <p>
            Users in the European Economic Area, the United Kingdom, and Switzerland are asked for consent
            where required before personalised ads or non-essential cookies are used.
          </p>
        </Section>

        <Section title="Amazon Associates Disclosure">
          <p>
            VideoBible is a participant in the Amazon Services LLC Associates Program, an affiliate
            advertising program. We earn commissions from qualifying purchases made through links on this
            site, at no extra cost to you. Clicking an affiliate link may set cookies controlled by Amazon.
          </p>
        </Section>

        <Section title="Embedded Content and Third-Party Services">
          <p>
            Videos and hymns are embedded from third-party platforms such as Rumble. Those providers may set
            cookies and collect usage data when their player loads. We also rely on hosting, database,
            authentication, and AI providers to operate features such as chapter summaries and verse meanings.
            These providers process data on our behalf.
          </p>
        </Section>

        <Section title="Legal Bases and Data Sharing">
          <p>
            Where required by law, we process personal data on the basis of your consent, our legitimate
            interest in operating and securing the Service, or to comply with legal obligations. We do not
            sell your personal information. We share data only with service providers, advertising partners,
            or when legally required.
          </p>
        </Section>

        <Section title="Data Retention and Security">
          <p>
            We keep information only as long as needed for the purposes described above or as required by law.
            We use reasonable technical and organisational safeguards, but no method of transmission or
            storage over the Internet is completely secure.
          </p>
        </Section>

        <Section title="Children's Privacy">
          <p>
            The Service is not directed to children under 13 (or the minimum age in your jurisdiction), and we
            do not knowingly collect personal information from them. If you believe a child has provided us
            information, contact us and we will delete it.
          </p>
        </Section>

        <Section title="Your Rights">
          <p>
            Depending on where you live, you may have the right to access, correct, delete, or restrict use of
            your personal information, to withdraw consent, or to object to certain processing. To make a
            request, email us at{" "}
            <a href={`mailto:${email}`} className="text-primary hover:underline">
              {email}
            </a>
            .
          </p>
        </Section>

        <Section title="International Transfers">
          <p>
            Our providers may process data in countries other than yours, including the United States. Where
            required, we rely on appropriate safeguards for such transfers.
          </p>
        </Section>

        <Section title="Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. Changes take effect once posted on this page
            with a revised &ldquo;Last updated&rdquo; date.
          </p>
        </Section>

        <Section title="Contact Us">
          <p>
            Questions about this policy or your data? Email{" "}
            <a href={`mailto:${email}`} className="text-primary hover:underline">
              {email}
            </a>
            .
          </p>
        </Section>

        <div className="mt-12">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
