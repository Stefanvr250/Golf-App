import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Flag } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <Flag className="h-10 w-10 text-primary" />
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Coming soon</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This page isn&apos;t available yet. We&apos;re building GolfApp one
          feature at a time.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Back to dashboard</Link>
      </Button>
    </div>
  );
}
