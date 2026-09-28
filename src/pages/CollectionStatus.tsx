import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { JoinedRequest } from "@/convex/eWaste";
import { CalendarClock, Recycle, Search, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";

const STATUSES = [
  "All",
  "Pending",
  "Approved",
  "Collected",
  "Recycled",
  "Rejected",
] as const;

const STATUS_STYLES: Record<string, string> = {
  Pending: "border-amber-600/30 bg-amber-100 text-amber-800",
  Approved: "border-sky-600/30 bg-sky-100 text-sky-800",
  Collected: "border-primary/25 bg-secondary text-secondary-foreground",
  Recycled: "border-emerald-600/30 bg-emerald-100 text-emerald-800",
  Rejected: "border-rose-600/30 bg-rose-100 text-rose-800",
};

const STATUS_ICONS: Record<string, any> = {
  Collected: Truck,
  Recycled: Recycle,
};

export default function CollectionStatus() {
  const { user } = useAuth();
  const requests = useQuery(api.eWaste.myRequests);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  const filtered = useMemo(() => {
    let rows = requests ?? [];
    if (statusFilter !== "All") {
      rows = rows.filter((r) => r.status === statusFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.code.toLowerCase().includes(q) ||
          r.itemName.toLowerCase().includes(q) ||
          r.categoryName.toLowerCase().includes(q),
      );
    }
    return rows;
  }, [requests, search, statusFilter]);

  const counts = useMemo(() => {
    const rows = requests ?? [];
    return {
      total: rows.length,
      active: rows.filter(
        (r) => r.status === "Pending" || r.status === "Approved",
      ).length,
      recycled: rows.filter((r) => r.status === "Recycled").length,
    };
  }, [requests]);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="studio-label">VIEW · SELECT with JOINs</p>
            <h1 className="mt-3 text-3xl">Collection Status</h1>
          </div>
          <Button asChild>
            <Link to="/register-ewaste">Register more e-waste</Link>
          </Button>
        </div>
        <p className="mt-2 max-w-2xl text-[15px] text-muted-foreground">
          Every request you submitted, joined with its category, collection and
          recycling records. Signed in as{" "}
          <span className="text-foreground">{user?.name ?? user?.email}</span>.
        </p>

        {/* Personal summary */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total requests", value: counts.total },
            { label: "Active requests", value: counts.active },
            { label: "Items recycled", value: counts.recycled },
          ].map((s) => (
            <div key={s.label} className="studio-frame p-5">
              <span className="studio-label">{s.label}</span>
              <p className="mt-2 text-3xl font-medium">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search + filter bar */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, item or category…"
              className="h-11 pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11 w-full sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  Status: {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Requests table */}
        <div className="studio-frame mt-4 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/60 hover:bg-secondary/60">
                <TableHead className="px-4">Request ID</TableHead>
                <TableHead className="px-4">Item</TableHead>
                <TableHead className="px-4">Category</TableHead>
                <TableHead className="px-4 text-center">Qty</TableHead>
                <TableHead className="px-4">Requested</TableHead>
                <TableHead className="px-4">Collection</TableHead>
                <TableHead className="px-4">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((row) => (
                <RequestRow key={row.id} row={row} />
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    {requests === undefined
                      ? "Loading your requests…"
                      : "No requests match your search or filter."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppShell>
  );
}

function RequestRow({ row }: { row: JoinedRequest }) {
  const StatusIcon = STATUS_ICONS[row.status];
  return (
    <TableRow>
      <TableCell className="px-4">
        <code className="text-xs font-medium">{row.code}</code>
      </TableCell>
      <TableCell className="px-4">
        <p className="text-sm">{row.itemName}</p>
        <p className="text-xs text-muted-foreground">
          {row.condition} · {row.weightKg} kg
        </p>
      </TableCell>
      <TableCell className="px-4 text-sm">{row.categoryName}</TableCell>
      <TableCell className="px-4 text-center text-sm">{row.quantity}</TableCell>
      <TableCell className="px-4 text-sm text-muted-foreground">
        {row.requestDate}
      </TableCell>
      <TableCell className="px-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarClock className="size-3.5" />
          {row.collectionDate}
        </div>
      </TableCell>
      <TableCell className="px-4">
        <Badge
          variant="outline"
          className={STATUS_STYLES[row.status] ?? "border-border"}
        >
          {StatusIcon && <StatusIcon className="size-3" />}
          {row.status}
        </Badge>
        {row.recycling && (
          <p className="mt-1 text-xs text-muted-foreground">
            {row.recycling.method} · {row.recycling.weightKg} kg recovered
          </p>
        )}
      </TableCell>
    </TableRow>
  );
}
