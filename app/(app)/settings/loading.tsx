import { CardSkeleton, HeaderSkeleton } from "@/components/skeletons/PageSkeleton";

export default function Loading() {
  return (
    <>
      <HeaderSkeleton />
      <div className="flex flex-col gap-3 p-4 md:p-8">
        <CardSkeleton rows={1} />
      </div>
    </>
  );
}
