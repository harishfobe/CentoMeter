import React from "react";
export default function FinderChips({
  options,
  value,
  onChange,
  label,
  multiple = false,
  radio = false,
}) {
  return (
    <div
      className="finder-chip-options"
      role={radio ? "radiogroup" : "group"}
      aria-label={label}
    >
      {options.map((option, index) => {
        const [key, text] = Array.isArray(option) ? option : [option, option];
        const selected = multiple ? (value || []).includes(key) : value === key;
        return (
          <button
            type="button"
            className="chip"
            key={key}
            role={radio ? "radio" : undefined}
            aria-checked={radio ? selected : undefined}
            aria-pressed={radio ? undefined : selected}
            onKeyDown={(e) => {
              if (
                !radio ||
                ![
                  "ArrowRight",
                  "ArrowLeft",
                  "ArrowDown",
                  "ArrowUp",
                  "Home",
                  "End",
                ].includes(e.key)
              )
                return;
              e.preventDefault();
              const next =
                e.key === "Home"
                  ? 0
                  : e.key === "End"
                    ? options.length - 1
                    : (index +
                        (["ArrowRight", "ArrowDown"].includes(e.key) ? 1 : -1) +
                        options.length) %
                      options.length;
              const option = options[next];
              onChange(Array.isArray(option) ? option[0] : option);
              e.currentTarget.parentElement.children[next].focus({
                preventScroll: true,
              });
            }}
            onClick={() =>
              onChange(
                multiple
                  ? selected
                    ? value.filter((v) => v !== key)
                    : [...(value || []), key]
                  : key,
              )
            }
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}
