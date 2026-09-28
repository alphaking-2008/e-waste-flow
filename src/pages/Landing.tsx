import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ClipboardList,
  Cpu,
  HardDrive,
  PackageCheck,
  Recycle,
  Smartphone,
  Truck,
  Users,
} from "lucide-react";
import { Link } from "react-router";

const PROCESS_STEPS = [
  {
    icon: ClipboardList,
    title: "1 · Register the item",
    body: "A student signs in and submits the e-waste details — category, quantity, condition and weight — generating an E-Waste ID and a Pending collection request.",
  },
  {
    icon: Truck,
    title: "2 · Collection",
    body: "The admin approves the request and schedules pickup. Once picked up, the status moves to Collected and the weight is logged.",
  },
  {
    icon: Recycle,
    title: "3 · Recycling",
    body: "Recycled items are recorded with a method and recovered weight, closing the loop from Reporting to Recovery.",
  },
];

const TABLE_CARDS = [
  {
    name: "Users",
    pk: "User_ID (PK)",
    rows: [
      { col: "Name · Email · Mobile", fk: "" },
      { col: "Address · Password", fk: "" },
    ],
    rel: "1 : N with E_Waste",
  },
  {
    name: "E_Waste",
    pk: "EWaste_ID (PK)",
    rows: [
      { col: "User_ID", fk: "FK → Users" },
      { col: "Category_ID", fk: "FK → Categories" },
    ],
    rel: "1 : 1 with Collection & Recycling",
  },
  {
    name: "Categories",
    pk: "Category_ID (PK)",
    rows: [{ col: "Category_Name", fk: "" }],
    rel: "1 : N with E_Waste",
  },
  {
    name: "Collection",
    pk: "Collection_ID (PK)",
    rows: [
      { col: "EWaste_ID", fk: "FK → E_Waste" },
      { col: "Collection_Date · Status", fk: "" },
    ],
    rel: "Tracks pickup status",
  },
  {
    name: "Recycling",
    pk: "Recycling_ID (PK)",
    rows: [
      { col: "EWaste_ID", fk: "FK → E_Waste" },
      { col: "Method · Recycled_Weight", fk: "" },
    ],
    rel: "Created after collection",
  },
];

export default function Landing() {
  const stats = useQuery(api.eWaste.globalStats);
  const { isAuthenticated } = useAuth();

  const statCards = [
    {
      label: "E-Waste Registered",
      value: stats?.totalCollected ?? "—",
      icon: HardDrive,
    },
    {
      label: "Items Recycled",
      value: stats?.itemsRecycled ?? "—",
      icon: Recycle,
    },
    {
      label: "Active Requests",
      value: stats?.activeRequests ?? "—",
      icon: ClipboardList,
    },
    {
      label: "Registered Users",
      value: stats?.registeredUsers ?? "—",
      icon: Users,
    },
  ];

  return (
    <AppShell>
      {/* ————— Hero ————— */}
      <section className="border-b border-border/60">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <div>
            <p className="studio-label">College DBMS Project · Version 1</p>
            <h1 className="mt-4 text-4xl leading-[1.08] sm:text-5xl md:text-[3.4rem]">
              Manage E-Waste.
              <br />
              <span className="text-primary">Protect the Future.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted-foreground">
              A database-driven system for the responsible collection and
              recycling of electronic waste. Students register their discarded
              devices, and every request is tracked from submission through
              collection to certified recycling.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-11 px-6">
                <Link to="/register-ewaste">
                  Register E-Waste
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 px-6">
                <Link to="/requests">View Collection Status</Link>
              </Button>
            </div>
            <p className="mt-5 text-[13px] text-muted-foreground">
              Version 1 scope: students sign in, submit e-waste requests and
              track their collection status.
            </p>
          </div>

          {/* Illustration: layered gallery-style cards */}
          <div className="hidden md:block">
            <div className="studio-frame relative overflow-hidden p-8">
              <div className="studio-label">Relational Schema</div>
              <div className="mt-6 space-y-3">
                {[
                  { t: "Users", s: "User_ID · Name · Email · Mobile · Address" },
                  { t: "E_Waste", s: "EWaste_ID · User_ID (FK) · Category_ID (FK)" },
                  { t: "Categories", s: "Category_ID · Category_Name" },
                  { t: "Collection", s: "Collection_ID · EWaste_ID (FK) · Status" },
                  { t: "Recycling", s: "Recycling_ID · EWaste_ID (FK) · Method" },
                ].map((row, i) => (
                  <div
                    key={row.t}
                    className="flex items-center justify-between rounded-lg border border-border/70 bg-background/60 px-4 py-3"
                    style={{ marginLeft: `${i * 10}px` }}
                  >
                    <div>
                      <p className="text-sm font-medium">{row.t}</p>
                      <p className="text-xs text-muted-foreground">{row.s}</p>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                      0{i + 1}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-accent/40 blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ————— Stats ————— */}
      <section className="border-b border-border/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl">By the numbers</h2>
            <span className="studio-label">Live from the database</span>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="studio-frame p-6 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <card.icon className="size-5 text-primary" />
                  <span className="studio-label">{card.label}</span>
                </div>
                <p className="mt-4 text-4xl font-medium tracking-tight">
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ————— Process ————— */}
      <section className="border-b border-border/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl">How the system works</h2>
            <span className="studio-label">Register → Collect → Recycle</span>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {PROCESS_STEPS.map((step) => (
              <div key={step.title} className="studio-frame flex flex-col p-6">
                <span className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <step.icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ————— ERD / schema section ————— */}
      <section className="border-b border-border/60">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl">Database design</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Five relational tables with primary keys (PK) and foreign keys
                (FK) enforcing the relationships — the classic
                <em> lookup–transaction–history</em> pattern.
              </p>
            </div>
            <span className="studio-label">Entity–Relationship View</span>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TABLE_CARDS.map((table) => (
              <div key={table.name} className="studio-frame overflow-hidden">
                <div className="flex items-center justify-between border-b border-border/70 bg-secondary/60 px-5 py-3">
                  <p className="text-sm font-medium">{table.name}</p>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {table.rel}
                  </span>
                </div>
                <div className="space-y-1.5 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <code className="text-xs">{table.pk}</code>
                    <span className="studio-label">PK</span>
                  </div>
                  {table.rows.map((row) => (
                    <div
                      key={row.col}
                      className="flex items-center justify-between"
                    >
                      <code className="text-xs text-muted-foreground">
                        {row.col}
                      </code>
                      {row.fk && (
                        <span className="font-mono text-[10px] uppercase tracking-wide text-primary/80">
                          {row.fk}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ————— Categories strip ————— */}
      <section>
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="text-2xl">What we accept</h2>
            <span className="studio-label">Categories lookup table</span>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: Smartphone, label: "Mobile Phones" },
              { icon: HardDrive, label: "Computers/Laptops" },
              { icon: Cpu, label: "TVs / Monitors" },
              { icon: Recycle, label: "Batteries" },
              { icon: PackageCheck, label: "Printers" },
              { icon: Cpu, label: "Cables" },
              { icon: HardDrive, label: "Other Electronics" },
            ].map((cat, i) => (
              <div
                key={cat.label}
                className="studio-frame flex flex-col items-center gap-3 p-6 text-center transition-shadow hover:shadow-md"
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <cat.icon className="size-5" />
                </span>
                <p className="text-sm">{cat.label}</p>
                <span className="font-mono text-[10px] text-muted-foreground/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>
          <div className="studio-frame mt-10 flex flex-col items-center justify-between gap-5 p-8 text-center md:flex-row md:text-left">
            <div>
              <h3 className="text-xl">Ready to recycle your electronics?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Create an account and submit your first collection request in
                under a minute.
              </p>
            </div>
            <Button asChild size="lg" className="h-11 shrink-0 px-6">
              <Link to={isAuthenticated ? "/register-ewaste" : "/auth"}>
                {isAuthenticated ? "Register E-Waste" : "Get Started"}
                <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
