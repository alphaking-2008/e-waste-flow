import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Recycle } from "lucide-react";
import { Link, useNavigate } from "react-router";

const NAV_LINKS = [
  { to: "/register-ewaste", label: "Register E-Waste" },
  { to: "/requests", label: "Collection Status" },
];

/**
 * Studio-style page shell: thin framed header, serif wordmark, quiet footer.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col studio-page">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-card/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
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

          <nav className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isLoading ? null : isAuthenticated ? (
              <>
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  {user?.name ?? user?.email}
                </span>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  Sign out
                </Button>
              </>
            ) : (
              <Button asChild size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
        {/* Mobile nav */}
        <nav className="flex items-center justify-center gap-6 border-t border-border/60 py-2 md:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-xs uppercase tracking-wide text-muted-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/70 bg-card/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-center sm:flex-row sm:text-left">
          <p className="studio-serif-caption">
            E-Waste Management System — College Database Management System
            project.
          </p>
          <p className="studio-serif-caption">
            Tables: Users · E_Waste · Categories · Collection · Recycling
          </p>
        </div>
      </footer>
    </div>
  );
}
