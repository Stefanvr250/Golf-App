import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ChangeRequestList } from "./ChangeRequestList";

export default async function ChangeRequestsPage() {
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

  // Fetch pending change requests
  const { data: requests } = await supabase
    .from("course_change_requests")
    .select("*, requester:profiles!course_change_requests_user_id_fkey(display_name), course:courses(name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const formatted = (requests ?? []).map((r: any) => {
    const requester = Array.isArray(r.requester) ? r.requester[0] : r.requester;
    const course = Array.isArray(r.course) ? r.course[0] : r.course;
    return {
      id: r.id,
      requesterName: requester?.display_name ?? "Unknown",
      courseName: course?.name ?? "Unknown",
      courseId: r.course_id,
      description: r.description,
      proposedChanges: r.proposed_changes,
      createdAt: r.created_at,
    };
  });

  return (
    <div className="container max-w-3xl space-y-6 py-6">
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Change Requests</h1>
      </div>

      {formatted.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No pending change requests.
        </p>
      ) : (
        <ChangeRequestList requests={formatted} />
      )}
    </div>
  );
}
