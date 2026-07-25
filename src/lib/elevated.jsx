"use client";;
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { useSurface, SurfaceProvider } from "@/lib/surface-context";
import { surfaceClasses } from "@/lib/surface-classes";

const Elevated = forwardRef(({ offset, shadowLevel, className, children, ...props }, ref) => {
  const substrate = useSurface();
  const level = Math.min(substrate + offset, 8);
  return (
    <SurfaceProvider value={level}>
      <div
        ref={ref}
        className={cn(
          "bg-white dark:bg-[#111827] shadow-xl border border-gray-100 dark:border-gray-800 rounded-[16px]", 
          className
        )}
        {...props}>
        {children}
      </div>
    </SurfaceProvider>
  );
});
Elevated.displayName = "Elevated";

export { Elevated };
