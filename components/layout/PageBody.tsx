import { cn } from "@/lib/utils";

type PageBodyProps = {
  children: React.ReactNode;
  /** มี StickyActionBar → เผื่อที่ล่างเพิ่ม */
  withActionBar?: boolean;
  className?: string;
};

// พื้นที่เนื้อหาใต้ PageHeader — padding 16px มือถือ / 32px เดสก์ท็อป
export function PageBody({ children, withActionBar, className }: PageBodyProps) {
  return (
    <main
      className={cn(
        "flex flex-1 flex-col gap-3 p-4 md:gap-5 md:p-8",
        withActionBar && "pb-36 md:pb-8",
        className,
      )}
    >
      {children}
    </main>
  );
}
