import Link from "next/link";
import { Logo } from "@/components/logo";

const features = [
  {
    title: "Properties, organised",
    body: "Add every building, unit and rent amount in one place. Each property gets its own tenants, charges and payment history.",
    tone: "bg-card",
  },
  {
    title: "Invite by email",
    body: "Send a secure invite link. Tenants join the right property and unit in one tap.",
    tone: "bg-primary text-primary-foreground",
  },
  {
    title: "Or create their login",
    body: "No email? Set a username and password for a tenant yourself and hand it over.",
    tone: "bg-accent text-accent-foreground",
  },
  {
    title: "Track every payment",
    body: "See who has paid, who is partial and who is overdue, per property and per unit.",
    tone: "bg-card",
  },
  {
    title: "Instant receipts",
    body: "Every completed payment issues a numbered receipt, ready for you and your tenant to keep.",
    tone: "bg-card",
  },
];

const steps = [
  {
    n: "01",
    title: "Add your property",
    body: "Name it, set the currency, add units and rent.",
  },
  {
    n: "02",
    title: "Bring in tenants",
    body: "Invite by email or create a username and password.",
  },
  {
    n: "03",
    title: "Get paid, stay clear",
    body: "Record payments, watch balances and send receipts.",
  },
];

const pill =
  "inline-flex items-center justify-center rounded-full px-7 py-3.5 text-base font-semibold transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function Mockup() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="rounded-lg border border-border bg-card p-6 shadow-2xl shadow-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Sunset Heights</p>
            <p className="text-3xl font-black">$12,480</p>
            <p className="text-sm text-muted-foreground">collected this month</p>
          </div>
          <span className="rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-accent-foreground">
            92% paid
          </span>
        </div>

        <ul className="mt-6 space-y-3">
          {[
            ["Unit 4B", "Amara K.", "Paid", "bg-accent text-accent-foreground"],
            ["Unit 2A", "Daniel O.", "Partial", "bg-primary text-primary-foreground"],
            ["Unit 7C", "Lena M.", "Paid", "bg-accent text-accent-foreground"],
          ].map(([unit, name, status, tone]) => (
            <li
              key={unit}
              className="flex items-center justify-between rounded-full bg-background px-5 py-3"
            >
              <span>
                <span className="font-semibold">{unit}</span>
                <span className="ml-2 text-sm text-muted-foreground">{name}</span>
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone}`}>
                {status}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="absolute -bottom-8 -left-4 w-60 -rotate-3 rounded-md bg-primary p-5 text-primary-foreground shadow-xl sm:-left-10">
        <p className="text-xs font-bold uppercase tracking-widest">Receipt</p>
        <p className="mt-1 text-2xl font-black">RCT-000142</p>
        <p className="text-sm">Unit 4B &middot; $1,200.00</p>
        <p className="mt-3 inline-block rounded-full bg-black px-3 py-1 text-xs font-bold text-accent">
          Payment received
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div id="top" className="flex flex-1 flex-col">
      <header className="sticky top-0 z-50 px-4 pt-4 lg:px-12">
        <nav
          aria-label="Main"
          className="flex w-full items-center justify-between rounded-full border border-border bg-background/80 px-4 py-2.5 backdrop-blur sm:px-6"
        >
          <Logo />
          <div className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#invite" className="hover:text-foreground">Tenants</a>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-full px-5 py-2 text-sm font-semibold hover:text-link"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-accent px-5 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary"
            >
              Get started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="grid items-center gap-16 px-6 pb-24 pt-16 lg:grid-cols-2 lg:px-12 lg:pt-24">
          <div>
            <p className="inline-block rounded-full border border-border px-4 py-1.5 text-sm font-medium">
              <span className="mr-2 inline-block size-2 rounded-full bg-primary" />
              Built for landlords
            </p>
            <h1 className="mt-6 text-5xl font-black leading-[1.02] tracking-tight sm:text-7xl">
              Run every property.{" "}
              <span className="rounded-md bg-accent px-3 text-accent-foreground">
                Collect
              </span>{" "}
              every <span className="gradient-text">payment.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Create your properties, bring tenants in by email or with a login
              you set for them, track who has paid and hand out receipts without
              the spreadsheets.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/signup" className={`${pill} bg-primary text-primary-foreground`}>
                Start managing free
              </Link>
              <a href="#how" className={`${pill} border border-border`}>
                See how it works
              </a>
            </div>
          </div>
          <Mockup />
        </section>

        <section id="features" className="px-6 py-20 lg:px-12">
          <h2 className="max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
            Everything a landlord needs, nothing they don&apos;t.
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map((f, i) => (
              <article
                key={f.title}
                className={`rounded-md p-8 ${f.tone} ${i === 0 ? "md:col-span-2" : ""}`}
              >
                <h3 className="text-2xl font-black">{f.title}</h3>
                <p className="mt-3 opacity-80">{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how" className="px-6 py-20 lg:px-12">
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
            Up and running in three steps.
          </h2>
          <ol className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((s) => (
              <li
                key={s.n}
                className="rounded-md border border-border p-8"
              >
                <span className="grid size-14 place-items-center rounded-full bg-accent text-lg font-black text-accent-foreground">
                  {s.n}
                </span>
                <h3 className="mt-6 text-2xl font-black">{s.title}</h3>
                <p className="mt-2 text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="invite" className="px-6 py-20 lg:px-12">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-lg bg-primary p-10 text-primary-foreground">
              <p className="text-sm font-bold uppercase tracking-widest">Option one</p>
              <h3 className="mt-3 text-3xl font-black">Invite by email</h3>
              <p className="mt-3">
                Enter an email, pick the property and unit. Your tenant gets a
                secure link and sets their own password.
              </p>
              <div className="mt-8 rounded-full bg-black px-6 py-3 text-sm text-white">
                tenant@email.com
                <span className="ml-3 rounded-full bg-accent px-3 py-1 font-bold text-accent-foreground">
                  Send invite
                </span>
              </div>
            </div>
            <div className="rounded-lg bg-accent p-10 text-accent-foreground">
              <p className="text-sm font-bold uppercase tracking-widest">Option two</p>
              <h3 className="mt-3 text-3xl font-black">Create their login</h3>
              <p className="mt-3">
                Tenant without email? Choose a username and password and give
                them access to their own payments and receipts.
              </p>
              <div className="mt-8 space-y-2 text-sm">
                <div className="rounded-full bg-black px-6 py-3 text-white">
                  username: amara.k
                </div>
                <div className="rounded-full bg-black px-6 py-3 text-white">
                  password: &bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="get-started" className="px-6 py-20 lg:px-12">
          <div className="hero-glow rounded-lg px-8 py-16 text-center text-white sm:px-16">
            <h2 className="mx-auto max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
              Your properties deserve <span className="text-link">better</span>{" "}
              than a spreadsheet.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-400">
              Add your first property in minutes and start tracking rent today.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/signup" className={`${pill} bg-accent text-accent-foreground`}>
                Create landlord account
              </Link>
              <Link href="/login" className={`${pill} border border-zinc-700`}>
                Log in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex w-full flex-wrap items-center justify-between gap-4 px-6 py-10 text-sm text-muted-foreground lg:px-12">
        <Logo />
        <p>&copy; Proplord. All rights reserved.</p>
      </footer>
    </div>
  );
}
