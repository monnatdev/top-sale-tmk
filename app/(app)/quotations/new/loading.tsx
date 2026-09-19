import { CardSkeleton, HeaderSkeleton } from "@/components/skeletons/PageSkeleton";

export default function Loading() {
  return (
    <>
      <HeaderSkeleton />
      <div className="flex flex-col gap-3 p-4 md:grid md:grid-cols-[1fr_340px] md:items-start md:gap-5 md:p-8">
        <div className="flex flex-col gap-3 md:gap-5">
          <CardSkeleton rows={3} />
          <CardSkeleton rows={4} />
          <CardSkeleton rows={2} />
        </div>
        <CardSkeleton rows={5} />
      </div>
    </>
  );
}
