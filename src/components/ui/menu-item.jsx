"use client";;
import { createContext, useContext, useRef, useEffect, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { fontWeights } from "@/lib/font-weight";
import { shapeMap } from "@/lib/shape-context";

// MenuItem is only used inside Dropdown, which opts out of the global pill
// shape — see dropdown.tsx for the rationale.
const shape = shapeMap.rounded;

export const DropdownContext = createContext(null);

export function useDropdown() {
  const ctx = useContext(DropdownContext);
  if (!ctx) throw new Error("useDropdown must be used within a Dropdown");
  return ctx;
}

/** Null-safe context read for callers that render outside a provider. */
export function useDropdownMaybe() {
  return useContext(DropdownContext);
}

const MenuItem = forwardRef((
  {
    icon: Icon,
    label,
    index,
    checked,
    onSelect,
    disabled,
    closeOnClick,
    className,
    onClick,
    render,
    ...props
  },
  ref
) => {
  const internalRef = useRef(null);
  const hasMounted = useRef(false);
  const { registerItem, activeIndex, checkedIndex, renderMenuItem } =
    useDropdown();

  useEffect(() => {
    registerItem(index, internalRef.current);
    return () => registerItem(index, null);
  }, [index, registerItem]);

  useEffect(() => {
    hasMounted.current = true;
  }, []);

  const isActive = activeIndex === index;
  const skipAnimation = !hasMounted.current;

  const mergeRef = (node) => {
    (internalRef).current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) (ref).current = node;
  };

  const handleActivate = disabled
    ? undefined
    : (e) => {
        onClick?.(e);
        onSelect?.();
      };

  const itemClassName = cn(// Fixed height (was py-2 around a 19.5px line box ≈ 35.5px) so the
  // text-box trim on the label doesn't shrink the row.
  `relative z-10 flex min-h-[36px] py-1.5 items-center gap-2 ${shape.item} px-2 cursor-pointer outline-none`, disabled && "opacity-50 pointer-events-none", className);

  const content = (
    <>
      {Icon && (
        <span className="inline-grid">
          <span className="col-start-1 row-start-1 invisible">
            <Icon size={16} strokeWidth={2} />
          </span>
          <Icon
            size={16}
            strokeWidth={isActive || checked ? 2 : 1.5}
            className={cn(
              "col-start-1 row-start-1 transition-[color,stroke-width] duration-80",
              isActive || checked
                ? "text-gray-900 dark:text-gray-100"
                : "text-gray-500 dark:text-gray-400"
            )} />
        </span>
      )}
      {/* Both stacked spans carry the text-box trim so the invisible bold
          sizer and the visible label keep identical boxes. */}
      <span className="inline-grid flex-1 text-[13px]">
        <span
          className="col-start-1 row-start-1 invisible [text-box:trim-both_cap_alphabetic]"
          style={{ fontVariationSettings: fontWeights.semibold }}
          aria-hidden="true">
          {label}
        </span>
        <span
          className={cn(
            "col-start-1 row-start-1 transition-[color,font-variation-settings] duration-80 [text-box:trim-both_cap_alphabetic]",
            isActive || checked
              ? "text-gray-900 dark:text-gray-100"
              : "text-gray-500 dark:text-gray-400"
          )}
          style={{
            fontVariationSettings: checked
              ? fontWeights.semibold
              : fontWeights.normal,
          }}>
          {label}
        </span>
      </span>
      <AnimatePresence>
        {checked && (
          <motion.svg
            key="check"
            width={16}
            height={16}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-900 dark:text-gray-100 shrink-0"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}>
            <motion.path
              d="M4 12L9 17L20 6"
              initial={{ pathLength: skipAnimation ? 1 : 0 }}
              animate={{
                pathLength: 1,
                transition: { duration: 0.08, ease: "easeOut" },
              }}
              exit={{
                pathLength: 0,
                transition: { duration: 0.04, ease: "easeIn" },
              }} />
          </motion.svg>
        )}
      </AnimatePresence>
    </>
  );

  if (renderMenuItem) {
    // Inside DropdownContent, the flavor's menu-item primitive (supplied by
    // the surrounding DropdownContent through context) owns the role,
    // aria-checked, tabIndex, roving highlight, typeahead, and Enter/Space/
    // click activation (activation synthesizes a click, so handleActivate
    // also fires for keyboard). The styled div carries the Fluid
    // Functionalism visuals and the proximity-hover registration; MenuItem
    // itself imports no primitive.
    return renderMenuItem({
      radio: typeof checked === "boolean",
      value: index,
      disabled,
      label,
      closeOnClick: closeOnClick ?? true,
      element: (
        <div
          ref={mergeRef}
          data-proximity-index={index}
          aria-label={label}
          onClick={handleActivate}
          className={itemClassName}
          {...props} />
      ),
      children: render || content,
    });
  }

  return (
    <div
      ref={mergeRef}
      data-proximity-index={index}
      // Disabled items are never the roving tab stop.
      tabIndex={!disabled && index === (checkedIndex ?? 0) ? 0 : -1}
      role={typeof checked === "boolean" ? "menuitemradio" : "menuitem"}
      aria-checked={typeof checked === "boolean" ? checked : undefined}
      aria-disabled={disabled || undefined}
      aria-label={label}
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onSelect?.();
        }
      }}
      className={itemClassName}
      {...props}>
      {render || content}
    </div>
  );
});

MenuItem.displayName = "MenuItem";

export { MenuItem };
export default MenuItem;
