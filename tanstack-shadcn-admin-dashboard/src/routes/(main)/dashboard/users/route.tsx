import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { supabase } from "@/lib/supabase";
import { Users } from "./-components/users";
import type { UserRow } from "./-components/data";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/(main)/dashboard/users")({
  component: Page,
});

function Page() {
  const [usersList, setUsersList] = React.useState<UserRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchUsers() {
      try {
        const { data: profiles, error } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching profiles:", error.message);
          return;
        }

        if (profiles) {
          const mapped: UserRow[] = profiles.map((p) => {
            // Calculate lastActive minutes
            let lastActiveMins = 0;
            if (p.updated_at) {
              const diffMs = Date.now() - new Date(p.updated_at).getTime();
              lastActiveMins = Math.floor(diffMs / 1000 / 60);
              if (lastActiveMins < 0) lastActiveMins = 0;
            }

            // Format joinedDate
            let joinedDateStr = "Unknown";
            if (p.created_at) {
              const d = new Date(p.created_at);
              joinedDateStr = d.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }) + ", " + d.toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });
            }

            return {
              name: p.full_name || p.email?.split("@")[0] || "Unknown User",
              email: p.email || "No Email",
              role: p.role === "admin" ? "System Admin" : (p.is_admin ? "Administrator" : "Student"),
              status: p.onboarding_complete ? "Active" : "Pending invite",
              team: (p.university || "Luter Academy") as any,
              workspace: [p.university || "Luter"],
              joinedDate: joinedDateStr,
              lastActive: lastActiveMins,
            };
          });

          setUsersList(mapped);
        }
      } catch (err) {
        console.error("Failed to map users:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center bg-transparent">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="ml-2 font-medium text-slate-400">Loading student profiles...</span>
      </div>
    );
  }

  return <Users users={usersList} />;
}
