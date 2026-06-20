"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { changeRequestSchema } from "@/lib/validations/profile";

export default function CourseEditRequestPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const { toast } = useToast();
  const [saving, setSaving] = React.useState(false);
  const [description, setDescription] = React.useState("");
  const [field, setField] = React.useState("holes");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = changeRequestSchema.safeParse({
      courseId,
      description,
      changes: { affected_field: field },
    });

    if (!parsed.success) {
      toast({
        variant: "destructive",
        title: "Validation error",
        description: parsed.error.issues[0]?.message,
      });
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("course_change_requests").insert({
      course_id: courseId,
      user_id: user.id,
      description: parsed.data.description,
      changes: parsed.data.changes,
      status: "pending",
    });

    if (error) {
      toast({ variant: "destructive", title: "Failed to submit", description: error.message });
      setSaving(false);
      return;
    }

    toast({ title: "Change request submitted", description: "An admin will review it." });
    router.push(`/courses/${courseId}`);
  }

  return (
    <div className="container max-w-lg space-y-6 py-6">
      <div className="flex items-center gap-2">
        <Link href={`/courses/${courseId}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Request Edit</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Describe the change</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="field">What needs changing?</Label>
              <select
                id="field"
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="h-9 w-full rounded border bg-background px-3 text-sm"
              >
                <option value="holes">Hole data (par, handicap index)</option>
                <option value="yardages">Yardages / tee sets</option>
                <option value="name">Course name</option>
                <option value="location">GPS location</option>
                <option value="address">Address / city</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                minLength={5}
                maxLength={1000}
                rows={4}
                placeholder="E.g. Hole 7 is par 5, not par 4. The white tees yardage is 485."
                className="w-full rounded border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Submitting…" : "Submit Change Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
