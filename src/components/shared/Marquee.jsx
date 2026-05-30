import React from "react";
import { cn } from "../../lib/utils";

export function Marquee({
  className,
  reverse,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  ...props
}) {
  return (
    <div
      {...props}
      className={cn(
        "group flex overflow-hidden p-2 [--duration:40s] [--gap:1.5rem] [flex-direction:row]",
        vertical && "[flex-direction:column]",
        className
      )}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(calc(-100% - var(--gap))); }
        }
        @keyframes marquee-vertical {
          from { transform: translateY(0); }
          to { transform: translateY(calc(-100% - var(--gap))); }
        }
        .animate-marquee {
          animation: marquee var(--duration) linear infinite;
        }
        .animate-marquee-vertical {
          animation: marquee-vertical var(--duration) linear infinite;
        }
        .direction-reverse {
          animation-direction: reverse;
        }
      `}} />
      {Array(repeat)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex shrink-0 justify-around gap-[--gap] min-w-full flex-row",
              vertical ? "flex-col animate-marquee-vertical" : "animate-marquee",
              reverse && "direction-reverse",
              pauseOnHover && "group-hover:[animation-play-state:paused]"
            )}
          >
            {children}
          </div>
        ))}
    </div>
  );
}

export default Marquee;
