import React from "react";
import { LayoutGrid, List } from "lucide-react";

export default function ViewToggle({ view, onChange, label = "Listing view" }) {
  return (
    <div className="view-toggle" role="group" aria-label={label}>
      {[
        ["grid", LayoutGrid, "Grid view"],
        ["list", List, "List view"],
      ].map(([value, Icon, name]) => (
        <button
          key={value}
          type="button"
          aria-label={name}
          title={name}
          aria-pressed={view === value}
          onClick={() => onChange(value)}
        >
          <Icon size={18} aria-hidden="true" />
        </button>
      ))}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {view === "list" ? "List view selected" : "Grid view selected"}
      </span>
    </div>
  );
}
