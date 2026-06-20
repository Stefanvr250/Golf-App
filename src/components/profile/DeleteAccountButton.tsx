"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteAccountButton() {
  const supabase = React.useMemo(() => createClient(), []);
  const router = useRouter();
  const { toast } = useToast();
  const [confirmation, setConfirmation] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);

  async function handleDelete() {
    if (confirmation !== "DELETE") return;

    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to delete account");
      }

      await supabase.auth.signOut();
      toast({ title: "Account deleted" });
      router.push("/login");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            This action is permanent and cannot be undone. All your data including
            rounds, scores, friends, and predictions will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Type <span className="font-mono text-destructive">DELETE</span> to confirm:
          </p>
          <Input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="Type DELETE"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={confirmation !== "DELETE" || deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
