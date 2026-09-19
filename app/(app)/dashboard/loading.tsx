import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton, HeaderSkeleton } from "@/components/skeletons/PageSkeleton";

export default function Loading() {
  return (
    <>
      <HeaderSkeleton />
      <div className="flex flex-col gap-3 p-4 md:gap-5 md:p-8">
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-6 md:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-26 rounded-lg md:h-32" />
          ))}
        </div>
        <CardSkeleton rows={6} />
      </div>
    </>
  );
}
