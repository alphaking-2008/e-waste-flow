import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/AppShell";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Recycle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const CONDITIONS = ["Working", "Repairable", "Damaged", "Non-Functional"];

function todayPlus(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function Form() {
  const categories = useQuery(api.eWaste.listCategories);
  const stats = useQuery(api.eWaste.globalStats);
  const createRequest = useMutation(api.eWaste.createRequest);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categoryId, setCategoryId] = useState("");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [condition, setCondition] = useState("Working");
  const [weightKg, setWeightKg] = useState("");
  const [collectionAddress, setCollectionAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState(todayPlus(3));
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Prefill address from the signed-in user's profile
  useEffect(() => {
    if (user?.address && !collectionAddress) {
      setCollectionAddress(user.address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.address]);

  const nextIdPreview = `EW-${String((stats?.totalCollected ?? 0) + 1).padStart(4, "0")}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      toast.error("Please choose a category.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await createRequest({
        categoryId: categoryId as any,
        itemName,
        quantity: Number(quantity),
        condition,
        weightKg: Number(weightKg),
        collectionAddress,
        preferredDate,
        description,
      });
      toast.success(`Request ${result.code} submitted!`, {
        description: "Status: Pending — the admin will review it shortly.",
      });
      navigate("/requests");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed.");
      setSubmitting(false);
    }
  };

  const inputCls = "h-11";

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <p className="studio-label">INSERT · E_Waste + Collection tables</p>
        <h1 className="mt-3 text-3xl">Register E-Waste</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Submit a device for responsible collection. A new row is inserted into
          the <code className="text-[13px]">E_Waste</code> table with foreign
          keys to <code className="text-[13px]">Users</code> and{" "}
          <code className="text-[13px]">Categories</code>, plus a matching row
          in <code className="text-[13px]">Collection</code> with status
          Pending.
        </p>

        <form
          onSubmit={handleSubmit}
          className="studio-frame mt-8 space-y-5 p-6 sm:p-8"
        >
          {/* Read-only DB-derived row */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>E-Waste ID (auto-generated)</Label>
              <div className="flex h-11 items-center gap-2 rounded-lg border border-dashed border-input bg-secondary/60 px-3">
                <Sparkles className="size-4 text-primary" />
                <code className="text-sm">{nextIdPreview}</code>
              </div>
              <p className="text-xs text-muted-foreground">
                Primary key — generated on submit.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>User ID</Label>
              <div className="flex h-11 items-center gap-2 rounded-lg border border-dashed border-input bg-secondary/60 px-3">
                <code className="text-sm truncate">
                  {user?.userId ?? user?.email ?? "signed-in user"}
                </code>
              </div>
              <p className="text-xs text-muted-foreground">
                Foreign key → Users table.
              </p>
            </div>
          </div>

          <div className="h-px bg-border" />

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>E-Waste Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className={inputCls + " w-full"}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {(categories ?? []).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                FK → Categories.Category_ID.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="itemName">Item Name</Label>
              <Input
                id="itemName"
                className={inputCls}
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Laptop i5 6th Gen"
                required
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                className={inputCls}
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Condition</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger className={inputCls + " w-full"}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weightKg">Approx. Weight (kg)</Label>
              <Input
                id="weightKg"
                className={inputCls}
                type="number"
                step="0.01"
                min="0"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="2.5"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="collectionAddress">Collection Address</Label>
            <Input
              id="collectionAddress"
              className={inputCls}
              value={collectionAddress}
              onChange={(e) => setCollectionAddress(e.target.value)}
              placeholder="Hostel / street, city, PIN"
              required
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="preferredDate">Preferred Collection Date</Label>
              <Input
                id="preferredDate"
                className={inputCls}
                type="date"
                min={todayPlus(0)}
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                className="min-h-[44px]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Anything the collection team should know…"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              On submit: INSERT into E_Waste and Collection (single
              transaction).
            </p>
            <Button type="submit" size="lg" disabled={submitting}>
              <Recycle className="mr-1 size-4" />
              {submitting ? "Submitting…" : "Submit Request"}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

export default function RegisterEwaste() {
  return (
    <RequireAuth
      title="Sign in to register e-waste"
      description="Only signed-in users can submit collection requests."
    >
      <Form />
    </RequireAuth>
  );
}
