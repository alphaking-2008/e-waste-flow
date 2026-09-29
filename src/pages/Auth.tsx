import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Recycle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAuthActions } from "@convex-dev/auth/react";

function resolveRedirectAfterAuth(
  returnTo: string | null,
  fallback = "/requests",
) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

export default function AuthPage() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { signIn } = useAuthActions();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = resolveRedirectAfterAuth(searchParams.get("returnTo"));

  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirect, { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate, redirect]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    const formData = new FormData(event.currentTarget);
    // Convex Auth's Password provider requires an explicit flow
    // ("signIn" | "signUp"); it is derived from the active tab.
    formData.set("flow", mode);
    try {
      await signIn("password", formData);
      navigate(redirect, { replace: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Authentication failed.";
      setError(
        message.includes("InvalidAccountId")
          ? "No account found with that email and password."
          : message.includes("less than 8")
            ? "Password must be at least 8 characters long."
            : message,
      );
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "signIn" ? "signUp" : "signIn");
    setError(null);
  };

  return (
    <div className="flex min-h-screen flex-col studio-page">
      <header className="border-b border-border/70 bg-card/85">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Recycle className="size-4.5" />
            </span>
            <span className="text-[17px] leading-tight">
              E-Waste
              <span className="block text-[11px] font-normal uppercase tracking-[0.14em] text-muted-foreground">
                Management System
              </span>
            </span>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center">
            <h1 className="text-3xl">
              {mode === "signIn" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {mode === "signIn"
                ? "Sign in to track your e-waste collection requests."
                : "Register to submit e-waste and follow it to recycling."}
            </p>
          </div>

          <div className="studio-frame mt-8 p-6 sm:p-8">
            <div className="mb-6 grid grid-cols-2 rounded-lg border border-border bg-secondary p-1">
              <button
                type="button"
                onClick={() => setMode("signIn")}
                className={
                  mode === "signIn"
                    ? "rounded-md bg-card px-3 py-1.5 text-sm shadow-sm"
                    : "rounded-md px-3 py-1.5 text-sm text-muted-foreground"
                }
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setMode("signUp")}
                className={
                  mode === "signUp"
                    ? "rounded-md bg-card px-3 py-1.5 text-sm shadow-sm"
                    : "rounded-md px-3 py-1.5 text-sm text-muted-foreground"
                }
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signUp" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" required placeholder="Aarav Sharma" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                />
              </div>
              {mode === "signUp" && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Mobile Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      required
                      placeholder="Hostel / street, city, PIN"
                    />
                  </div>
                </>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                />
                {mode === "signUp" && (
                  <p className="text-xs text-muted-foreground">
                    Minimum 8 characters.
                  </p>
                )}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading
                  ? "Please wait…"
                  : mode === "signIn"
                    ? "Login"
                    : "Create account"}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              {mode === "signIn"
                ? "New here? "
                : "Already have an account? "}
              <button
                type="button"
                onClick={switchMode}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {mode === "signIn" ? "Create an account" : "Sign in instead"}
              </button>
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Demo accounts: aarav@student.edu · rohan@student.edu — password{" "}
            <code className="rounded bg-secondary px-1 py-0.5">ewaste123</code>
          </p>
        </div>
      </main>
    </div>
  );
}
