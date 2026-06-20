import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MapPin, Trophy, FileText, ClipboardList } from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/");
  }

  // Fetch stats
  const [
    { count: userCount },
    { count: courseCount },
    { count: roundCount },
    { count: changeRequestCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("rounds").select("*", { count: "exact", head: true }),
    supabase
      .from("course_change_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const stats = [
    {
      label: "Total Users",
      value: userCount ?? 0,
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Total Courses",
      value: courseCount ?? 0,
      icon: MapPin,
      color: "text-green-500",
    },
    {
      label: "Rounds Played",
      value: roundCount ?? 0,
      icon: Trophy,
      color: "text-amber-500",
    },
    {
      label: "Pending Changes",
      value: changeRequestCount ?? 0,
      icon: FileText,
      color: "text-red-500",
    },
  ];

  return (
    <div className="container max-w-4xl space-y-6 py-6">
      <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Actions</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Link href="/admin/change-requests">
            <Card className="cursor-pointer hover:border-primary/60">
              <CardContent className="flex items-center gap-3 p-4">
                <ClipboardList className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Review Change Requests</p>
                  <p className="text-xs text-muted-foreground">
                    {changeRequestCount ?? 0} pending
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
