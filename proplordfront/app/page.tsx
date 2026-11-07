const features = [
  {
    title: "Properties, organised",
    body: "Add every building, unit and rent amount in one place. Each property gets its own tenants, charges and payment history.",
    tone: "bg-surface",
  },
  {
    title: "Invite by email",
    body: "Send a secure invite link. Tenants join the right property and unit in one tap.",
    tone: "bg-pink text-black",
  },
  {
    title: "Or create their login",
    body: "No email? Set a username and password for a tenant yourself and hand it over.",
    tone: "bg-volt text-black",
  },
  {
    title: "Track every payment",
    body: "See who has paid, who is partial and who is overdue, per property and per unit.",
    tone: "bg-surface",
  },
  {
    title: "Instant receipts",
    body: "Every completed payment issues a numbered receipt, ready for you and your tenant to keep.",
    tone: "bg-surface",
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
  "inline-flex items-center justify-center rounded-full px-7 py-3.5 text-base font-semibold transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink";

function Logo() {
  return (
    <a href="#top" className="flex items-center gap-2 text-xl font-black tracking-tight">
      <span className="grid size-9 place-items-center rounded-full bg-pink text-black">
        P
      </span>
      Proplord
    </a>
  );
}

function Mockup() {
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="rounded-[2.75rem] border border-border bg-surface p-6 shadow-2xl shadow-pink/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">Sunset Heights</p>
            <p className="text-3xl font-black">$12,480</p>
            <p className="text-sm text-muted">collected this month</p>
          </div>
          <span className="rounded-full bg-volt px-4 py-1.5 text-sm font-bold text-black">
            92% paid
          </span>
        </div>

        <ul className="mt-6 space-y-3">
          {[
            ["Unit 4B", "Amara K.", "Paid", "bg-volt text-black"],
            ["Unit 2A", "Daniel O.", "Partial", "bg-pink text-black"],
            ["Unit 7C", "Lena M.", "Paid", "bg-volt text-black"],
          ].map(([unit, name, status, tone]) => (
            <li
              key={unit}
              className="flex items-center justify-between rounded-full bg-background px-5 py-3"
            >
              <span>
                <span className="font-semibold">{unit}</span>
                <span className="ml-2 text-sm text-muted">{name}</span>
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${tone}`}>
                {status}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="absolute -bottom-8 -left-4 w-60 -rotate-3 rounded-[2rem] bg-pink p-5 text-black shadow-xl sm:-left-10">
        <p className="text-xs font-bold uppercase tracking-widest">Receipt</p>
        <p className="mt-1 text-2xl font-black">RCT-000142</p>
        <p className="text-sm">Unit 4B &middot; $1,200.00</p>
        <p className="mt-3 inline-block rounded-full bg-black px-3 py-1 text-xs font-bold text-volt">
          Payment received
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div id="top" className="flex flex-1 flex-col">
      <header className="sticky top-0 z-50 px-4 pt-4">
        <nav
          aria-label="Main"
          className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-border bg-background/80 px-4 py-2.5 backdrop-blur sm:px-6"
        >
          <Logo />
          <div className="hidden items-center gap-8 text-sm font-medium text-muted md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#invite" className="hover:text-foreground">Tenants</a>
          </div>
          <a
            href="#get-started"
            className="rounded-full bg-volt px-5 py-2 text-sm font-bold text-black transition hover:bg-pink"
          >
            Get started
          </a>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-16 px-6 pb-24 pt-16 lg:grid-cols-2 lg:pt-24">
          <div>
            <p className="inline-block rounded-full border border-border px-4 py-1.5 text-sm font-medium">
              <span className="mr-2 inline-block size-2 rounded-full bg-pink" />
              Built for landlords
            </p>
            <h1 className="mt-6 text-5xl font-black leading-[1.02] tracking-tight sm:text-7xl">
              Run every property.{" "}
              <span className="rounded-[2rem] bg-volt px-3 text-black">
                Collect
              </span>{" "}
              every <span className="text-pink">payment.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted">
              Create your properties, bring tenants in by email or with a login
              you set for them, track who has paid and hand out receipts without
              the spreadsheets.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="#get-started" className={`${pill} bg-pink text-black`}>
                Start managing free
              </a>
              <a href="#how" className={`${pill} border border-border`}>
                See how it works
              </a>
            </div>
          </div>
          <Mockup />
        </section>

        <section id="features" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
            Everything a landlord needs, nothing they don&apos;t.
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map((f, i) => (
              <article
                key={f.title}
                className={`rounded-[2.5rem] p-8 ${f.tone} ${i === 0 ? "md:col-span-2" : ""}`}
              >
                <h3 className="text-2xl font-black">{f.title}</h3>
                <p className="mt-3 opacity-80">{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
            Up and running in three steps.
          </h2>
          <ol className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((s) => (
              <li
                key={s.n}
                className="rounded-[2.5rem] border border-border p-8"
              >
                <span className="grid size-14 place-items-center rounded-full bg-volt text-lg font-black text-black">
                  {s.n}
                </span>
                <h3 className="mt-6 text-2xl font-black">{s.title}</h3>
                <p className="mt-2 text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="invite" className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[2.75rem] bg-pink p-10 text-black">
              <p className="text-sm font-bold uppercase tracking-widest">Option one</p>
              <h3 className="mt-3 text-3xl font-black">Invite by email</h3>
              <p className="mt-3">
                Enter an email, pick the property and unit. Your tenant gets a
                secure link and sets their own password.
              </p>
              <div className="mt-8 rounded-full bg-black px-6 py-3 text-sm text-white">
                tenant@email.com
                <span className="ml-3 rounded-full bg-volt px-3 py-1 font-bold text-black">
                  Send invite
                </span>
              </div>
            </div>
            <div className="rounded-[2.75rem] bg-volt p-10 text-black">
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

        <section id="get-started" className="mx-auto max-w-6xl px-6 py-20">
          <div className="rounded-[3rem] bg-black px-8 py-16 text-center text-white sm:px-16">
            <h2 className="mx-auto max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
              Your properties deserve <span className="text-pink">better</span>{" "}
              than a spreadsheet.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-400">
              Add your first property in minutes and start tracking rent today.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a href="#top" className={`${pill} bg-volt text-black`}>
                Create landlord account
              </a>
              <a href="#top" className={`${pill} border border-zinc-700`}>
                Log in
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-10 text-sm text-muted">
        <Logo />
        <p>&copy; Proplord. All rights reserved.</p>
      </footer>
    </div>
  );
}
