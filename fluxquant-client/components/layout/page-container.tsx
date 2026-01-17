import { cn } from "@/lib/utils";

type MaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

interface PageContainerProps {
  children: React.ReactNode;
  /** 最大宽度限制 */
  maxWidth?: MaxWidth;
  /** 额外的 className */
  className?: string;
}

const maxWidthClasses: Record<MaxWidth, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "",
};

export function PageContainer({
  children,
  maxWidth = "full",
  className,
}: PageContainerProps) {
  return (
    <main
      className={cn(
        "container mx-auto px-4 py-6",
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </main>
  );
}
