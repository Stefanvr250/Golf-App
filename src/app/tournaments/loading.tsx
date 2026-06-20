import { Skeleton } from "@/components/ui/skeleton";

export default function TournamentsLoading() {
  return (
    <div className="container space-y-6 py-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-9 w-20" />
      </div>
      <Skeleton className="h-10 w-64" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
