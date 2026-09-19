import { HeaderSkeleton, ListSkeleton } from "@/components/skeletons/PageSkeleton";

export default function Loading() {
  return (
    <>
      <HeaderSkeleton chips search />
      <div className="p-4 md:p-8">
        <ListSkeleton />
      </div>
    </>
  );
}
