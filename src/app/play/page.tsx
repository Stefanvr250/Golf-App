import { Suspense } from "react";
import PlayPageClient from "./PlayPageClient";

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="container py-6">Loading…</div>}>
      <PlayPageClient />
    </Suspense>
  );
}
