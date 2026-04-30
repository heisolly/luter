import React from 'react';
import { cn } from "../../lib/utils";

function Typing({
  className,
  dots = 3,
  ...props
}) {
  return (
    <>
      <style>{`
        @keyframes loading-ui-typing {
          0%,
          100% {
            transform: translateY(0);
            opacity: 0.5;
          }

          50% {
            transform: translateY(-50%);
            opacity: 1;
          }
        }
      `}</style>
      <span
        role="status"
        className={cn("inline-flex items-center gap-1.5", className)}
        {...props}
      >
        {Array.from({ length: dots }, (_, index) => (
          <span
            key={index}
            aria-hidden="true"
            className="inline-block w-1.5 h-1.5 rounded-full bg-current"
            style={{
              animation: "loading-ui-typing 1s infinite",
              animationDelay: `${160 * index}ms`,
            }}
          />
        ))}
        <span className="sr-only">Loading</span>
      </span>
    </>
  );
}

export { Typing };
