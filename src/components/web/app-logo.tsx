import { cn } from "@/lib/utils";

const AppLogo = ({ className }: { className?: string }) => {
  return (
    <span
      className={cn(
        "font-bold text-lg tracking-tight select-none inline-flex items-center text-foreground",
        className,
      )}
    >
      Links
    </span>
  );
};

export default AppLogo;
