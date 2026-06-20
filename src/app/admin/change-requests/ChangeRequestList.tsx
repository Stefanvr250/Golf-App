"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Loader2 } from "lucide-react";

interface ChangeRequest {
  id: string;
  requesterName: string;
  courseName: string;
  courseId: string;
  description: string | null;
  proposedChanges: Record<string, any> | null;
  createdAt: string;
}

interface ChangeRequestListProps {
  requests: ChangeRequest[];
}

export function ChangeRequestList({ requests: initial }: ChangeRequestListProps) {
  const supabase = React.useMemo(() => createClient(), []);
  const { toast } = useToast();
  const [requests, setRequests] = React.useState(initial);
  const [processing, setProcessing] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState<Record<string, string>>({});

  async function handleApprove(req: ChangeRequest) {
    setProcessing(req.id);

    // Apply proposed changes to course
    if (req.proposedChanges) {
      const { error: updateErr } = await supabase
        .from("courses")
        .update(req.proposedChanges)
        .eq("id", req.courseId);

      if (updateErr) {
        toast({
          variant: "destructive",
          title: "Failed to apply changes",
          description: updateErr.message,
        });
        setProcessing(null);
        return;
      }
    }

    // Update request status
    const { error } = await supabase
      .from("course_change_requests")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", req.id);

    if (error) {
      toast({ variant: "destructive", title: "Failed", description: error.message });
    } else {
      toast({ title: "Change request approved" });
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
    }

    setProcessing(null);
  }

  async function handleReject(req: ChangeRequest) {
    setProcessing(req.id);

    const reason = rejectReason[req.id] ?? "";

    const { error } = await supabase
      .from("course_change_requests")
      .update({
        status: "rejected",
        rejection_reason: reason || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", req.id);

    if (error) {
      toast({ variant: "destructive", title: "Failed", description: error.message });
    } else {
      toast({ title: "Change request rejected" });
      setRequests((prev) => prev.filter((r) => r.id !== req.id));
    }

    setProcessing(null);
  }

  if (requests.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        All change requests have been processed.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <Card key={req.id}>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-sm font-medium">
                {req.courseName}
              </CardTitle>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {new Date(req.createdAt).toLocaleDateString("en-ZA")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Requested by {req.requesterName}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {req.description && (
              <p className="text-sm">{req.description}</p>
            )}

            {req.proposedChanges && (
              <div className="rounded-md bg-muted p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  Proposed Changes
                </p>
                <pre className="text-xs whitespace-pre-wrap break-words">
                  {JSON.stringify(req.proposedChanges, null, 2)}
                </pre>
              </div>
            )}

            <div className="space-y-2">
              <Input
                placeholder="Rejection reason (optional)"
                value={rejectReason[req.id] ?? ""}
                onChange={(e) =>
                  setRejectReason((prev) => ({
                    ...prev,
                    [req.id]: e.target.value,
                  }))
                }
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleApprove(req)}
                  disabled={processing === req.id}
                >
                  {processing === req.id ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="mr-1 h-3.5 w-3.5" />
                  )}
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleReject(req)}
                  disabled={processing === req.id}
                >
                  {processing === req.id ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <X className="mr-1 h-3.5 w-3.5" />
                  )}
                  Reject
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
