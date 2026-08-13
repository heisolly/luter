import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, KeyRound, Loader2 } from "lucide-react";

export const Route = createFileRoute("/(external)/")({
  component: PasscodeGate,
});

function PasscodeGate() {
  const [passcode, setPasscode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    // If already authenticated, redirect immediately
    if (sessionStorage.getItem("admin_authenticated") === "true") {
      navigate({ to: "/dashboard/default" });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (passcode === "242424") {
      setLoading(true);
      try {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: "admin@luter.app",
          password: "luteradmin242424",
        });

        if (authError) {
          console.error("Supabase sign-in error:", authError.message);
          setError("Invalid database credentials or connection error.");
        } else {
          sessionStorage.setItem("admin_authenticated", "true");
          navigate({ to: "/dashboard/default" });
        }
      } catch (err: any) {
        console.error("Auth exception:", err);
        setError("An unexpected connection error occurred.");
      } finally {
        setLoading(false);
      }
    } else {
      setError("Incorrect passcode. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 font-sans">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-slate-100 shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Admin Access</CardTitle>
          <CardDescription className="text-slate-400">
            Enter master passcode to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="••••••"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                disabled={loading}
                className="border-slate-800 bg-slate-950 text-center text-lg tracking-widest text-slate-100 placeholder-slate-600 focus-visible:ring-indigo-500"
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !passcode}
              className="w-full bg-indigo-600 font-semibold text-white hover:bg-indigo-500 focus-visible:ring-indigo-500"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting to Supabase...
                </>
              ) : (
                "Access Dashboard"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
