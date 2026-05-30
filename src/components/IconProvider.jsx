import React from 'react';
import { IconContext } from "@phosphor-icons/react";

/**
 * Global Icon Provider to maintain Phosphor icons consistency.
 * Standardizes on 'duotone' weight as used in the dashboard sidebar.
 */
export function IconProvider({ children }) {
  return (
    <IconContext.Provider
      value={{
        color: "currentColor", // Inherits text color (e.g. text-primary)
        size: 20,              // Default sidebar icon size
        weight: "duotone",     // Matches the premium dashboard look
      }}
    >
      {children}
    </IconContext.Provider>
  );
}