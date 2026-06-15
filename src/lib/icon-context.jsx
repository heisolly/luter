"use client";;
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";

import { iconMap, iconLibraryOrder } from "@/lib/icon-map";

export { iconLibraryOrder, iconLibraryLabels } from "@/lib/icon-map";

const IconContext = createContext(null);

/**
 * Returns the current icon library and setter.
 * Throws if used outside IconProvider.
 */
function useIconLibrary() {
  const ctx = useContext(IconContext);
  if (!ctx) throw new Error("useIconLibrary must be used within an IconProvider");
  return ctx;
}

/**
 * Returns a single icon component for the given name.
 * Falls back to Lucide if no provider is present.
 */
function useIcon(name) {
  const ctx = useContext(IconContext);
  if (!ctx) return iconMap.lucide[name];
  return iconMap[ctx.iconLibrary][name];
}

/**
 * Returns the full icon map for the current library.
 * Falls back to Lucide if no provider is present.
 */
function useIcons() {
  const ctx = useContext(IconContext);
  const lib = ctx?.iconLibrary ?? "lucide";
  return useMemo(() => iconMap[lib], [lib]);
}

function IconProvider({
  children,
  defaultLibrary = "lucide"
}) {
  const [iconLibrary, setIconLibraryState] = useState(defaultLibrary);

  const setIconLibrary = useCallback((next) => {
    setIconLibraryState(next);
  }, []);

  // Global keyboard shortcut: I to cycle icon library
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== "i" && e.key !== "I") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target)?.isContentEditable) return;
      e.preventDefault();
      setIconLibraryState((prev) => {
        const idx = iconLibraryOrder.indexOf(prev);
        return iconLibraryOrder[(idx + 1) % iconLibraryOrder.length];
      });
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <IconContext.Provider value={{ iconLibrary, setIconLibrary }}>
      {children}
    </IconContext.Provider>
  );
}

export { IconProvider, useIcon, useIcons, useIconLibrary };
