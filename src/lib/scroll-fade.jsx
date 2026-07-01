"use client";;
import { useEffect, useState } from "react";
import { useSurface } from "@/lib/surface-context";

const NO_EDGES = {
  top: false,
  bottom: false,
  left: false,
  right: false,
};

export function useScrollEdges(
  ref,
  {
    enabled = true,
    axis = "vertical"
  } = {}
) {
  const [edges, setEdges] = useState(NO_EDGES);

  useEffect(() => {
    if (!enabled) {
      setEdges(NO_EDGES);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const update = () => {
      const next = { ...NO_EDGES };
      if (axis !== "horizontal") {
        const { scrollTop, scrollHeight, clientHeight } = el;
        const overflowing = scrollHeight - clientHeight > 1;
        next.top = overflowing && scrollTop > 1;
        next.bottom = overflowing && scrollTop + clientHeight < scrollHeight - 1;
      }
      if (axis !== "vertical") {
        const { scrollLeft, scrollWidth, clientWidth } = el;
        const overflowing = scrollWidth - clientWidth > 1;
        next.left = overflowing && scrollLeft > 1;
        next.right = overflowing && scrollLeft + clientWidth < scrollWidth - 1;
      }
      // Bail out on no-op updates so observer churn doesn't re-render.
      setEdges((prev) =>
        prev.top === next.top &&
        prev.bottom === next.bottom &&
        prev.left === next.left &&
        prev.right === next.right
          ? prev
          : next);
    };

    update();
    // Recompute once layout settles after enter animations.
    const raf = requestAnimationFrame(update);
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    // Async content (items loading in, streamed text) changes scrollHeight
    // without resizing the container itself. Coalesce to one update per
    // frame: update() reads layout, and doing that synchronously after
    // every mutation forces a reflow per insertion in streaming content.
    let moRaf = 0;
    const scheduleUpdate = () => {
      if (moRaf) return;
      moRaf = requestAnimationFrame(() => {
        moRaf = 0;
        update();
      });
    };
    const mo = new MutationObserver(scheduleUpdate);
    mo.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      cancelAnimationFrame(raf);
      if (moRaf) cancelAnimationFrame(moRaf);
      el.removeEventListener("scroll", update);
      ro.disconnect();
      mo.disconnect();
    };
  }, [ref, enabled, axis]);

  return edges;
}

// ---------------------------------------------------------------------------
// ScrollEdgeCue
// ---------------------------------------------------------------------------

const CHEVRON_PATHS = {
  top: "M6 15l6-6 6 6",
  bottom: "M6 9l6 6 6-6",
  left: "M15 6l-6 6 6 6",
  right: "M9 6l6 6-6 6",
};

// Band size presets along the scroll axis. The chevron stays 16px in both.
const CUE_SIZES = {
  tight: 32,
  comfortable: 60
};

export function ScrollEdgeCue({
  edge,
  visible,
  mode = "sticky",
  surfaceLevel,
  size = "comfortable",
  inset = 4,
  chevron = true
}) {
  const contextLevel = useSurface();
  // Clamp to the ladder (1–8), mirroring SurfaceProvider — an out-of-range
  // override would interpolate an invalid var and silently kill the gradient.
  const level = Math.max(1, Math.min(8, surfaceLevel ?? contextLevel));
  const surface = `var(--surface-${level})`;
  const vertical = edge === "top" || edge === "bottom";
  const sizePx = CUE_SIZES[size];
  // Gradient direction where 100% == the hard outer edge.
  const dir = `to ${edge}`;

  const band = (
    <div
      style={
        {
          position: "absolute",
          opacity: visible ? 1 : 0,

          // Exit slightly faster than enter, per the animation guidelines.
          transition: `opacity ${visible ? 160 : 120}ms ease`,

          ...(mode === "sticky"
            ? vertical
              ? { left: -inset, right: -inset, [edge]: -inset, height: sizePx }
              : { top: -inset, bottom: -inset, [edge]: -inset, width: sizePx }
            : vertical
              ? { left: 0, right: 0, [edge]: 0, height: sizePx }
              : { top: 0, bottom: 0, [edge]: 0, width: sizePx })
        }
      }>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(${dir}, transparent 0%, color-mix(in srgb, ${surface} 75%, transparent) 65%, ${surface} 100%)`,
        }} />
      {chevron && (
        <svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground"
          style={
            {
              position: "absolute",

              ...(vertical
                ? { left: "50%", transform: "translateX(-50%)" }
                : { top: "50%", transform: "translateY(-50%)" }),

              [edge]: 8
            }
          }>
          <path d={CHEVRON_PATHS[edge]} />
        </svg>
      )}
    </div>
  );

  if (mode === "absolute") {
    return <div aria-hidden>{band}</div>;
  }

  // Sticky: a zero-size sticky anchor so the cue adds no layout extent.
  return (
    <div
      aria-hidden
      style={
        {
          position: "sticky",
          [edge]: 0,
          ...(vertical ? { height: 0 } : { width: 0 }),
          zIndex: 30,
          pointerEvents: "none"
        }
      }>
      {band}
    </div>
  );
}
