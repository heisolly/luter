import * as React from "react";
import { DollarSign, BookOpen, Users, Activity, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function MetricCards() {
  const [loading, setLoading] = React.useState(true);
  const [metrics, setMetrics] = React.useState({
    totalRevenue: 0,
    totalUsers: 0,
    activeUsers: 0,
    totalCourses: 0,
  });

  React.useEffect(() => {
    async function fetchMetrics() {
      try {
        // 1. Total Revenue
        const { data: revData } = await supabase
          .from("payment_transactions")
          .select("amount");
        const totalRevenue = revData ? revData.reduce((sum, tx) => sum + (tx.amount || 0), 0) : 0;

        // 2. Total Users
        const { count: usersCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        // 3. Active Users (updated in last 5 minutes)
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { count: activeCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gt("updated_at", fiveMinsAgo);

        // 4. Course Count
        const { count: courseCount } = await supabase
          .from("courses")
          .select("*", { count: "exact", head: true });

        setMetrics({
          totalRevenue: totalRevenue, // Format accordingly
          totalUsers: usersCount || 0,
          activeUsers: activeCount || 0,
          totalCourses: courseCount || 0,
        });
      } catch (err) {
        console.error("Failed to fetch dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs xl:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <DollarSign className="size-4" />
            </div>
          </CardTitle>
          <CardDescription>Total Revenue</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" /> Loading...
            </div>
          ) : (
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">
              {formatCurrency(metrics.totalRevenue)}
            </div>
          )}
          <p className="text-muted-foreground text-xs">Total payments processed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <Users className="size-4" />
            </div>
          </CardTitle>
          <CardDescription>Total Students</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" /> Loading...
            </div>
          ) : (
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">
              {metrics.totalUsers.toLocaleString()}
            </div>
          )}
          <p className="text-muted-foreground text-xs">Registered student profiles</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <Activity className="size-4" />
            </div>
          </CardTitle>
          <CardDescription>Active Now</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" /> Loading...
            </div>
          ) : (
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">
              {metrics.activeUsers.toLocaleString()}
            </div>
          )}
          <p className="text-muted-foreground text-xs">Active in the last 5 minutes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <BookOpen className="size-4" />
            </div>
          </CardTitle>
          <CardDescription>Total Courses</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" /> Loading...
            </div>
          ) : (
            <div className="font-medium text-3xl tabular-nums leading-none tracking-tight">
              {metrics.totalCourses.toLocaleString()}
            </div>
          )}
          <p className="text-muted-foreground text-xs">Available study courses</p>
        </CardContent>
      </Card>
    </div>
  );
}
